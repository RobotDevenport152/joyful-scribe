import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { fetchWithRetry } from "../_shared/retry.ts";
import { captureException } from "../_shared/sentry.ts";

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

// Same Resend setup already proven out in bright-task/index.ts (contact/wholesale
// form emails) — pacificalpaca.com is verified there, so RESEND_FROM_EMAIL is a
// real project secret, not per-function config. Unlike bright-task, this never
// falls back to a hardcoded from-address: without RESEND_FROM_EMAIL the send is
// skipped entirely (see the RESEND_FROM_EMAIL check below).
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function sendEmail(apiKey: string, from: string, to: string, subject: string, html: string) {
  const response = await fetchWithRetry("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend API error (${response.status}): ${body}`);
  }
}

async function sendSms(accountSid: string, authToken: string, from: string, to: string, body: string) {
  const response = await fetchWithRetry(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ From: from, To: to, Body: body }),
  });
  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Twilio API error (${response.status}): ${errBody}`);
  }
}

function buildOrderConfirmationEmail(
  orderNumber: string,
  checkoutData: CheckoutSessionRow,
  certificates: { code: string }[],
): { subject: string; html: string } {
  const itemsHtml = checkoutData.items.map((item) =>
    `<li>${escapeHtml(item.name)}${item.variant ? ` (${escapeHtml(item.variant)})` : ""} × ${item.quantity} — ${checkoutData.currency} ${(item.price * item.quantity).toFixed(2)}</li>`
  ).join("");

  const certsHtml = certificates.length > 0
    ? `<h3>正品防伪码 / Authenticity Code(s)</h3>
       <ul>${certificates.map((c) =>
         `<li><code>${escapeHtml(c.code)}</code> — <a href="https://pacificalpaca.com/verify/${encodeURIComponent(c.code)}">验证真伪 / Verify →</a></li>`
       ).join("")}</ul>
       <p style="font-size:13px;color:#666;">请妥善保存以上防伪码。/ Please keep these codes safe.</p>`
    : "";

  const html = `
    <p>您好 ${escapeHtml(checkoutData.shipping_name)}，感谢您在太平洋羊驼购物！<br/>
    Hi ${escapeHtml(checkoutData.shipping_name)}, thank you for your order with Pacific Alpacas!</p>
    <p><strong>订单编号 / Order Number:</strong> ${escapeHtml(orderNumber)}</p>
    <ul>${itemsHtml}</ul>
    <p><strong>总计 / Total:</strong> ${checkoutData.currency} ${Number(checkoutData.total).toFixed(2)}</p>
    ${certsHtml}
    <p><a href="https://pacificalpaca.com/my-orders">查看订单详情 / View order details →</a></p>
  `;

  return { subject: `订单确认 Order Confirmed — ${orderNumber}`, html };
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

  // Everything below runs unguarded before this point in git history — an
  // unhandled error (bad DB constraint, unexpected shape) surfaced as a
  // bare 500 with no logging and no visibility into which order it was.
  // The order-creation logic isn't wrapped in a smaller try/catch because a
  // half-failed order (e.g. row inserted but the trigger errors) must not
  // be silently treated as success — better to log, report, and let
  // Stripe's own webhook retry mechanism (it retries non-2xx responses)
  // try again.
  try {

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
      let insertedCertificates: { code: string }[] = [];

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
            const { data: insertedCerts, error: certError } = await serviceClient
              .from("product_certificates")
              .insert(certificateRows)
              .select("code");
            if (certError) {
              console.error("webhook_certificate_generate_failed", {
                order_id: order.id,
                error: certError.message,
              });
            } else {
              insertedCertificates = insertedCerts ?? [];
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

      // Order confirmation email — same Resend setup as bright-task's contact-form
      // emails. Best-effort: a delivery failure must not block order fulfillment,
      // the customer already paid. RESEND_FROM_EMAIL gates this exactly like in
      // bright-task — without a verified sending domain, Resend's sandbox sender
      // can't deliver to an arbitrary customer address, so skip rather than fail.
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      const resendFromEmail = Deno.env.get("RESEND_FROM_EMAIL");
      if (resendApiKey && resendFromEmail && checkoutData.shipping_email && orderNumber) {
        try {
          const { subject, html } = buildOrderConfirmationEmail(orderNumber, checkoutData, insertedCertificates);
          await sendEmail(resendApiKey, resendFromEmail, checkoutData.shipping_email, subject, html);
          console.log("webhook_order_confirmation_email_sent", { order_id: order.id });
        } catch (e) {
          console.error("webhook_order_confirmation_email_failed", {
            order_id: order.id,
            message: e instanceof Error ? e.message : String(e),
          });
        }
      } else if (!resendFromEmail) {
        console.log("webhook_order_confirmation_email_skipped_no_verified_domain", { order_id: order.id });
      }

      // Order confirmation SMS via Twilio — same best-effort principle as the
      // email above: a failure here must not block order fulfillment. Gated
      // on all three Twilio secrets being set (unset in a fresh deployment
      // until the account exists) and the customer having given a phone
      // number, which is optional at checkout.
      const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
      const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
      const twilioFromNumber = Deno.env.get("TWILIO_FROM_NUMBER");
      if (twilioAccountSid && twilioAuthToken && twilioFromNumber && checkoutData.shipping_phone && orderNumber) {
        try {
          const smsBody = `您的太平洋羊驼订单 ${orderNumber} 已确认，感谢您的购买！/ Your Pacific Alpacas order ${orderNumber} is confirmed — thank you!`;
          await sendSms(twilioAccountSid, twilioAuthToken, twilioFromNumber, checkoutData.shipping_phone, smsBody);
          console.log("webhook_order_confirmation_sms_sent", { order_id: order.id });
        } catch (e) {
          console.error("webhook_order_confirmation_sms_failed", {
            order_id: order.id,
            message: e instanceof Error ? e.message : String(e),
          });
        }
      } else if (!twilioAccountSid || !twilioAuthToken || !twilioFromNumber) {
        console.log("webhook_order_confirmation_sms_skipped_not_configured", { order_id: order.id });
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

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("webhook_processing_error", { message, event_id: event.id, event_type: event.type });
    await captureException(error, { tags: { function: "stripe-webhook" }, extra: { event_id: event.id, event_type: event.type } });
    // Non-2xx so Stripe retries delivery rather than treating this as handled.
    return new Response(JSON.stringify({ error: "Webhook processing failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
