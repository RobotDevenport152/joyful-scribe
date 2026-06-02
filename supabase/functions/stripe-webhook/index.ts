import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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
    console.error("webhook_signature_invalid", { message: err.message });
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const serviceClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
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
      const checkoutSessionId = session.metadata?.checkout_session_id;
      const orderNumber      = session.metadata?.order_number;

      if (!checkoutSessionId || !orderNumber) {
        console.error("webhook_missing_metadata", { session_id: session.id });
        break;
      }

      // Fetch the stored cart + shipping data
      const { data: checkoutData, error: fetchError } = await serviceClient
        .from("checkout_sessions")
        .select("*")
        .eq("id", checkoutSessionId)
        .maybeSingle();

      if (fetchError || !checkoutData) {
        console.error("webhook_checkout_session_not_found", {
          checkout_session_id: checkoutSessionId,
          error: fetchError?.message,
        });
        break;
      }

      // Guard: don't create a second order if this session was already fulfilled
      if (checkoutData.status === "completed") {
        console.log("webhook_order_already_created", { checkout_session_id: checkoutSessionId });
        break;
      }

      const paymentIntentId = typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id ?? null;

      // Map items to the format expected by the decrement_stock DB trigger:
      // the trigger reads item->>'product_id' and item->>'qty'.
      const orderItemsSnapshot = (checkoutData.items as any[]).map((item: any) => ({
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
          customer_email:   checkoutData.shipping_email,
          customer_name:    checkoutData.shipping_name,
          shipping_name:    checkoutData.shipping_name,
          shipping_email:   checkoutData.shipping_email,
          shipping_phone:   checkoutData.shipping_phone || null,
          shipping_address: checkoutData.shipping_address,
          items:            orderItemsSnapshot,
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
      const orderItemRows = (checkoutData.items as any[]).map((item: any) => ({
        order_id:     order.id,
        product_id:   item.productId || null,
        product_name: item.name,
        variant:      item.variant || null,
        quantity:     item.quantity,
        unit_price:   item.price,
        total_price:  item.price * item.quantity,
      }));

      await serviceClient.from("order_items").insert(orderItemRows);

      // Mark session complete — second-layer idempotency guard
      await serviceClient
        .from("checkout_sessions")
        .update({ status: "completed" })
        .eq("id", checkoutSessionId);

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
