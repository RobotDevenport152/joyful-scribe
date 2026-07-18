import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Shape of one entry in checkout_sessions.items — written by create-checkout's
// pricedItems.map() (see CheckoutRequestBody/PricedItem there), read back here
// once Stripe confirms payment.
interface StoredCheckoutItem {
  productId: string;
  name: string;
  variant: string | null;
  quantity: number;
  price: number;
}

interface ProductFiberBatch {
  id: string;
  fiber_batch_id: string | null;
}

interface CheckoutSessionRow {
  id: string;
  status: string;
  user_id: string;
  order_number: string;
  shipping_name: string;
  shipping_email: string;
  shipping_phone: string | null;
  shipping_address: unknown;
  subtotal: number;
  discount: number;
  shipping_cost: number;
  total: number;
  currency: string;
  promo_code: string | null;
  items: StoredCheckoutItem[];
}

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!webhookSecret) {
    console.error("stripe_webhook_secret_missing");
    return new Response("Webhook secret not configured", { status: 500 });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
  const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("webhook_signature_invalid", { message });
    return new Response(`Webhook Error: ${message}`, { status: 400 });
  }

  const serviceClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? Deno.env.get("VITE_SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("VITE_SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  // Idempotency: skip duplicate webhook deliveries from Stripe
  const { data: alreadyProcessed } = await serviceClient
    .from("processed_webhook_events")
    .select("id")
    .eq("id", event.id)
    .maybeSingle();

  if (alreadyProcessed) {
    console.log("webhook_duplicate_ignored", { event_id: event.id });
    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const checkoutSessionId = session.metadata?.checkout_session_id ?? session.metadata?.order_id;
      const orderNumber      = session.metadata?.order_number;

      if (!checkoutSessionId && !orderNumber) {
        console.error("webhook_missing_metadata", { session_id: session.id, metadata: session.metadata });
        break;
      }

      // Fetch the stored cart + shipping data. Use checkout_session_id when available,
      // otherwise fall back to order_number for older metadata formats.
      const checkoutQuery = checkoutSessionId
        ? serviceClient.from("checkout_sessions").select("*").eq("id", checkoutSessionId).maybeSingle()
        : serviceClient.from("checkout_sessions").select("*").eq("order_number", orderNumber).maybeSingle();

      const { data: rawCheckoutData, error: fetchError } = await checkoutQuery;
      const checkoutData = rawCheckoutData as CheckoutSessionRow | null;

      if (fetchError || !checkoutData) {
        console.error("webhook_checkout_session_not_found", {
          checkout_session_id: checkoutSessionId,
          order_number: orderNumber,
          error: fetchError?.message,
        });
        break;
      }

      const checkoutSessionRowId = checkoutData.id;

      // Guard: don't create a second order if this session was already fulfilled
      if (checkoutData.status === "completed") {
        console.log("webhook_order_already_created", { checkout_session_id: checkoutSessionRowId });
        break;
      }

      const paymentIntentId = typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id ?? null;

      // Map items to the format expected by the decrement_stock DB trigger:
      // the trigger reads item->>'product_id' and item->>'qty'.
      const orderItemsSnapshot = checkoutData.items.map((item) => ({
        product_id: item.productId || null,
        qty:        item.quantity,
        name:       item.name,
        price:      item.price,
        variant:    item.variant || null,
      }));

      // Insert with status='paid' so the on_order_paid trigger fires immediately,
      // decrementing stock in the same DB transaction.
      const { data: order, error: orderError } = await serviceClient
        .from("orders")
        .insert({
          order_number:     orderNumber,
          user_id:          checkoutData.user_id,
          shipping_name:    checkoutData.shipping_name,
          shipping_email:   checkoutData.shipping_email,
          shipping_phone:   checkoutData.shipping_phone || null,
          shipping_address: checkoutData.shipping_address,
          subtotal:         checkoutData.subtotal,
          discount:         checkoutData.discount,
          shipping_cost:    checkoutData.shipping_cost,
          total:            checkoutData.total,
          currency:         checkoutData.currency,
          payment_method:   "stripe",
          payment_intent_id: paymentIntentId,
          promo_code:       checkoutData.promo_code || null,
          status:           "paid",
        })
        .select("id")
        .single();

      if (orderError || !order) {
        console.error("webhook_order_create_failed", {
          checkout_session_id: checkoutSessionId,
          error: orderError?.message,
        });
        break;
      }

      // Populate order_items for admin order management views
      const orderItemRows = checkoutData.items.map((item) => ({
        order_id:     order.id,
        product_id:   item.productId || null,
        product_name: item.name,
        variant:      item.variant || null,
        quantity:     item.quantity,
        unit_price:   item.price,
        total_price:  item.price * item.quantity,
      }));

      await serviceClient.from("order_items").insert(orderItemRows);

      // One anti-counterfeit certificate per unit purchased, linked to this
      // order via order_id. Previously certificates only existed if an admin
      // manually pre-generated them via /admin/certificates (for physical
      // cards printed and shipped with stock, decoupled from any specific
      // online order) — this is the digital counterpart: every online
      // purchase gets its own real code a customer can look up on /verify,
      // surfaced to them in MyOrders.tsx. Best-effort: a failure here must
      // not block order fulfillment, the customer already paid (same
      // principle as the promo-code claim below).
      const certificateProductIds = [...new Set(
        checkoutData.items.map((item) => item.productId).filter((id): id is string => Boolean(id))
      )];

      if (certificateProductIds.length > 0) {
        const { data: productBatches, error: productBatchError } = await serviceClient
          .from("products")
          .select("id, fiber_batch_id")
          .in("id", certificateProductIds) as { data: ProductFiberBatch[] | null; error: { message: string } | null };

        if (productBatchError) {
          console.error("webhook_certificate_product_lookup_failed", {
            order_id: order.id,
            error: productBatchError.message,
          });
        } else {
          const fiberBatchByProduct = new Map(
            (productBatches ?? []).map((p) => [p.id, p.fiber_batch_id])
          );

          const certificateRows = checkoutData.items.flatMap((item) => {
            if (!item.productId) return [];
            const fiberBatchId = fiberBatchByProduct.get(item.productId) ?? null;
            return Array.from({ length: item.quantity }, () => ({
              product_id: item.productId,
              fiber_batch_id: fiberBatchId,
              order_id: order.id,
            }));
          });

          if (certificateRows.length > 0) {
            const { error: certError } = await serviceClient
              .from("product_certificates")
              .insert(certificateRows);
            if (certError) {
              console.error("webhook_certificate_generate_failed", {
                order_id: order.id,
                error: certError.message,
              });
            } else {
              console.log("webhook_certificates_created", {
                order_id: order.id,
                count: certificateRows.length,
              });
            }
          }
        }
      }

      // Atomically redeem the promo code now that payment is confirmed —
      // this is the only point in the whole flow that increments used_count,
      // and it does so via a FOR UPDATE row lock (see claim_promo_code
      // migration) so two concurrent successful payments for a
      // limited-usage code can't both succeed once only one use is left.
      // A failed claim here (code got exhausted between quote and payment,
      // or was deactivated mid-flight) must not block order fulfillment —
      // the customer already paid — so this is logged, not thrown.
      if (checkoutData.promo_code) {
        const { error: promoError } = await serviceClient.rpc("claim_promo_code", {
          _code: checkoutData.promo_code,
          _subtotal_nzd: checkoutData.subtotal,
        });
        if (promoError) {
          console.error("webhook_promo_claim_failed", {
            order_id: order.id,
            promo_code: checkoutData.promo_code,
            error: promoError.message,
          });
        }
      }

      // Mark session complete — second-layer idempotency guard
      await serviceClient
        .from("checkout_sessions")
        .update({ status: "completed" })
        .eq("id", checkoutSessionRowId);

      console.log("webhook_order_created", {
        order_id:     order.id,
        order_number: orderNumber,
        session_id:   session.id,
      });

      break;
    }

    case "checkout.session.expired": {
      // Customer abandoned Stripe checkout; mark session so we know not to fulfil it
      const session = event.data.object as Stripe.Checkout.Session;
      const checkoutSessionId = session.metadata?.checkout_session_id;
      if (checkoutSessionId) {
        await serviceClient
          .from("checkout_sessions")
          .update({ status: "abandoned" })
          .eq("id", checkoutSessionId)
          .eq("status", "pending_payment");
        console.log("webhook_session_abandoned", { checkout_session_id: checkoutSessionId });
      }
      break;
    }

    default:
      console.log("webhook_unhandled_event", { type: event.type });
  }

  await serviceClient.from("processed_webhook_events").insert({ id: event.id });

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
