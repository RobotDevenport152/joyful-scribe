import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

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

  switch (event.type) {
    case "checkout.session.completed":
      // Order fulfillment is bug #2 — handled separately
      break;
    default:
      console.log("webhook_unhandled_event", { type: event.type });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
