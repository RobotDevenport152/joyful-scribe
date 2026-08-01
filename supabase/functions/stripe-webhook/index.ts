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

interface FulfillCheckoutSessionResult {
  order_id: string | null;
  order_number: string;
  already_fulfilled: boolean;
  certificate_codes: string[] | null;
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
    // Async payment methods (e.g. Alipay) fire checkout.session.completed
    // immediately with payment_status still "unpaid" — the actual result
    // arrives later via async_payment_succeeded/failed. Sync methods (card)
    // are already "paid" by the time checkout.session.completed fires, so
    // the guard below is a no-op for them. See Stripe's fulfillment docs:
    // https://docs.stripe.com/checkout/fulfillment
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object as Stripe.Checkout.Session;
      const checkoutSessionId = session.metadata?.checkout_session_id ?? session.metadata?.order_id;
      const orderNumber      = session.metadata?.order_number;

      if (!checkoutSessionId && !orderNumber) {
        console.error("webhook_missing_metadata", { session_id: session.id, metadata: session.metadata });
        break;
      }

      if (session.payment_status === "unpaid") {
        console.log("webhook_awaiting_async_payment", { session_id: session.id, checkout_session_id: checkoutSessionId });
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

      const paymentIntentId = typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id ?? null;

      // Everything that used to be a sequence of separate awaits here — insert
      // orders (status='paid'), insert order_items, generate one
      // product_certificates row per unit, mark checkout_sessions 'completed'
      // — now happens inside fulfill_checkout_session, a single Postgres
      // function call (see the migration of the same name). That makes it one
      // transaction: either all of it commits, or (DB hiccup, connection
      // drop, anything) none of it does and checkout_sessions stays
      // 'pending_payment' so Stripe's automatic retry of this event starts
      // clean. Previously a failure partway through (e.g. orders row written,
      // order_items insert then fails) left an unrecoverable half-built order:
      // the retry's orders insert would hit the order_number UNIQUE
      // constraint, get logged and skipped, and the event would still be
      // marked processed — no order_items, no certificates, no email/SMS,
      // ever. The FOR UPDATE lock the function takes on the checkout_sessions
      // row also means two concurrent deliveries of the same event (Stripe
      // does this, not just retries-after-failure) serialize instead of both
      // racing to create the order.
      //
      // A thrown/errored RPC call here is intentionally NOT caught locally —
      // it propagates to this function's outer try/catch, which returns a
      // non-2xx response so Stripe retries delivery. (The old per-step code
      // logged-and-broke on an insert error instead of throwing, which meant
      // a plain transient DB error on that one call was silently accepted as
      // "handled" and never retried — that gap is closed too.)
      const { data: fulfillResult, error: fulfillError } = await serviceClient
        .rpc("fulfill_checkout_session", {
          _checkout_session_id: checkoutSessionRowId,
          _payment_intent_id: paymentIntentId,
        })
        .single() as { data: FulfillCheckoutSessionResult | null; error: { message: string } | null };

      if (fulfillError) {
        throw new Error(`fulfill_checkout_session failed: ${fulfillError.message}`);
      }
      if (!fulfillResult?.order_id) {
        throw new Error(`fulfill_checkout_session returned no order for session ${checkoutSessionRowId}`);
      }

      if (fulfillResult.already_fulfilled) {
        console.log("webhook_order_already_created", {
          checkout_session_id: checkoutSessionRowId,
          order_id: fulfillResult.order_id,
        });
        break;
      }

      const orderId = fulfillResult.order_id;
      const insertedCertificates: { code: string }[] =
        (fulfillResult.certificate_codes ?? []).map((code) => ({ code }));

      // Atomically redeem the promo code now that payment is confirmed —
      // this is the only point in the whole flow that increments used_count,
      // and it does so via a FOR UPDATE row lock (see claim_promo_code
      // migration) so two concurrent successful payments for a
      // limited-usage code can't both succeed once only one use is left.
      // A failed claim here (code got exhausted between quote and payment,
      // or was deactivated mid-flight) must not block order fulfillment —
      // the customer already paid — so this is logged, not thrown. (Kept as
      // its own RPC call, separate from fulfill_checkout_session: usage-count
      // exhaustion is an expected, recoverable outcome, not a failure that
      // should roll back an already-paid order.)
      if (checkoutData.promo_code) {
        const { error: promoError } = await serviceClient.rpc("claim_promo_code", {
          _code: checkoutData.promo_code,
          _subtotal_nzd: checkoutData.subtotal,
        });
        if (promoError) {
          console.error("webhook_promo_claim_failed", {
            order_id: orderId,
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
          console.log("webhook_order_confirmation_email_sent", { order_id: orderId });
        } catch (e) {
          console.error("webhook_order_confirmation_email_failed", {
            order_id: orderId,
            message: e instanceof Error ? e.message : String(e),
          });
        }
      } else if (!resendFromEmail) {
        console.log("webhook_order_confirmation_email_skipped_no_verified_domain", { order_id: orderId });
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
          console.log("webhook_order_confirmation_sms_sent", { order_id: orderId });
        } catch (e) {
          console.error("webhook_order_confirmation_sms_failed", {
            order_id: orderId,
            message: e instanceof Error ? e.message : String(e),
          });
        }
      } else if (!twilioAccountSid || !twilioAuthToken || !twilioFromNumber) {
        console.log("webhook_order_confirmation_sms_skipped_not_configured", { order_id: orderId });
      }

      // checkout_sessions.status is already 'completed' at this point —
      // fulfill_checkout_session set it in the same transaction as the order.
      console.log("webhook_order_created", {
        order_id:     orderId,
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

    case "checkout.session.async_payment_failed": {
      // Async payment method (e.g. Alipay) resolved to a failure after
      // checkout.session.completed already fired with payment_status
      // "unpaid" — the guard above skipped fulfillment for it, so no order
      // exists yet. Record the failure as its own orders row: 'payment_failed'
      // has been a valid orders.status value since the enum fix in
      // 20260603120000_fix_role_and_status_enums.sql, whose own comment notes
      // OrderSuccess.tsx already had a UI branch for it that was unreachable
      // dead code because nothing ever wrote that status. This is what
      // finally makes that branch reachable, instead of the customer polling
      // until MAX_POLLS and seeing a misleading "still processing".
      const session = event.data.object as Stripe.Checkout.Session;
      const checkoutSessionId = session.metadata?.checkout_session_id ?? session.metadata?.order_id;
      const orderNumber      = session.metadata?.order_number;

      if (!checkoutSessionId && !orderNumber) {
        console.error("webhook_missing_metadata", { session_id: session.id, metadata: session.metadata });
        break;
      }

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

      // Guard mirrors the completed-handler's: don't act twice on the same session.
      if (checkoutData.status !== "pending_payment") {
        console.log("webhook_async_payment_failed_ignored", {
          checkout_session_id: checkoutData.id,
          status: checkoutData.status,
        });
        break;
      }

      const { error: orderError } = await serviceClient
        .from("orders")
        .insert({
          order_number:     checkoutData.order_number,
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
          promo_code:       checkoutData.promo_code || null,
          status:           "payment_failed",
        });

      if (orderError) {
        console.error("webhook_payment_failed_order_create_failed", {
          checkout_session_id: checkoutData.id,
          error: orderError.message,
        });
        break;
      }

      // Closest existing terminal checkout_sessions status — no fulfilled
      // order resulted, same as a customer walking away mid-checkout. The
      // payment_failed order row above is already the source of truth for
      // the customer-facing outcome, so a failure here is logged, not
      // thrown — same best-effort principle as the completed-handler's
      // own session-status update.
      const { error: sessionUpdateError } = await serviceClient
        .from("checkout_sessions")
        .update({ status: "abandoned" })
        .eq("id", checkoutData.id)
        .eq("status", "pending_payment");

      if (sessionUpdateError) {
        console.error("webhook_async_payment_failed_session_update_failed", {
          checkout_session_id: checkoutData.id,
          error: sessionUpdateError.message,
        });
      }

      console.log("webhook_async_payment_failed", {
        checkout_session_id: checkoutData.id,
        order_number: checkoutData.order_number,
      });
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
