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

  // Idempotency: ignore duplicate deliveries
  const serviceClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

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
      const orderId = session.metadata?.order_id;

      if (!orderId) {
        console.error("webhook_missing_order_id", { session_id: session.id });
        break;
      }

      const paymentIntentId = typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id ?? null;

      const { error } = await serviceClient
        .from("orders")
        .update({
          status: "paid",
          ...(paymentIntentId ? { payment_intent_id: paymentIntentId } : {}),
        })
        .eq("id", orderId)
        .eq("status", "pending"); // guard: only update if still pending

      if (error) {
        console.error("webhook_order_update_failed", { order_id: orderId, error: error.message });
      } else {
        console.log("webhook_order_fulfilled", { order_id: orderId, session_id: session.id });
      }
      break;
    }

    default:
      console.log("webhook_unhandled_event", { type: event.type });
  }

  // Record event as processed
  await serviceClient.from("processed_webhook_events").insert({ id: event.id });

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
