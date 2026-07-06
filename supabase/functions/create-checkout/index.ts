import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (origin === "https://pacificalpacas.com") return true;
  if (origin.startsWith("http://localhost")) return true;
  if (origin.endsWith(".lovable.app")) return true;
  if (origin.endsWith(".lovableproject.com")) return true;
  return false;
}

function getCorsHeaders(origin: string | null) {
  const allowed = isAllowedOrigin(origin) ? origin! : "https://pacificalpacas.com";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

// Read-only preview of the discount for pricing the Stripe session — the
// customer hasn't paid yet, so nothing gets consumed here. The actual
// atomic redemption (incrementing used_count) happens in stripe-webhook
// once payment is confirmed, via the claim_promo_code() DB function.
// Previously this was a hardcoded PROMO_CODES constant that didn't read
// promo_codes at all — codes created/edited in the admin panel had no
// effect on checkout, and vice versa.
async function previewPromoDiscount(
  serviceClient: ReturnType<typeof createClient>,
  code: string | null | undefined,
  subtotalNZD: number,
): Promise<number> {
  if (!code) return 0;
  const { data } = await serviceClient
    .from("promo_codes")
    .select("*")
    .eq("code", code.toUpperCase())
    .eq("is_active", true)
    .maybeSingle();

  if (!data) return 0;
  if (data.expires_at && new Date(data.expires_at) < new Date()) return 0;
  if (data.usage_limit && (data.used_count ?? 0) >= data.usage_limit) return 0;
  if (data.min_order_nzd && subtotalNZD < Number(data.min_order_nzd)) return 0;

  return data.discount_type === "percent"
    ? parseFloat((subtotalNZD * Number(data.discount_value) / 100).toFixed(2))
    : Number(data.discount_value);
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: userData, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { items, currency, shippingInfo, promoCode } = await req.json();

    if (!items?.length) {
      return new Response(JSON.stringify({ error: "No items" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!shippingInfo?.name || !shippingInfo?.email) {
      return new Response(JSON.stringify({ error: "Missing shipping info" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
    if (!stripeKey) {
      return new Response(JSON.stringify({ error: "Payment not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const subtotal = items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
    const shippingCost = subtotal >= 500 ? 0 : 25;
    const discount = await previewPromoDiscount(serviceClient, promoCode, subtotal);
    const total = subtotal - discount + shippingCost;

    const orderNumber = `PA-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

    // Store cart + shipping data so the webhook can create the real order after payment.
    // No orders row is written until Stripe confirms payment.
    const { data: checkoutSession, error: sessionError } = await serviceClient
      .from("checkout_sessions")
      .insert({
        user_id: userData.user.id,
        order_number: orderNumber,
        items,
        shipping_name: shippingInfo.name,
        shipping_email: shippingInfo.email,
        shipping_phone: shippingInfo.phone || null,
        shipping_address: {
          province: shippingInfo.province,
          city: shippingInfo.city,
          district: shippingInfo.district,
          address: shippingInfo.address,
        },
        currency: currency || "NZD",
        subtotal,
        discount,
        shipping_cost: shippingCost,
        total,
        promo_code: promoCode?.toUpperCase() || null,
      })
      .select()
      .single();

    if (sessionError || !checkoutSession) {
      console.error("checkout_session_create_failed", JSON.stringify(sessionError));
      return new Response(JSON.stringify({ error: "Failed to initialise checkout" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lineItems: any[] = items.map((item: any) => ({
      price_data: {
        currency: (currency || "nzd").toLowerCase(),
        product_data: { name: item.name, description: item.variant || undefined },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: (currency || "nzd").toLowerCase(),
          product_data: { name: "Shipping" },
          unit_amount: Math.round(shippingCost * 100),
        },
        quantity: 1,
      });
    }

    const baseUrl = isAllowedOrigin(origin) ? origin! : "https://pacificalpacas.com";

    const sessionParams: any = {
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${baseUrl}/order-success?number=${orderNumber}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout`,
      customer_email: userData.user.email,
      // Webhook reads checkout_session_id to fetch stored cart data
      metadata: {
        checkout_session_id: checkoutSession.id,
        order_number: orderNumber,
      },
    };

    if (discount > 0) {
      const coupon = await stripe.coupons.create({
        amount_off: Math.round(discount * 100),
        currency: (currency || "nzd").toLowerCase(),
        duration: "once",
      });
      sessionParams.discounts = [{ coupon: coupon.id }];
    }

    const stripeSession = await stripe.checkout.sessions.create(sessionParams, {
      idempotencyKey: `checkout-${checkoutSession.id}`,
    });

    // Back-fill the Stripe session ID for reference and debugging
    await serviceClient
      .from("checkout_sessions")
      .update({ stripe_session_id: stripeSession.id })
      .eq("id", checkoutSession.id);

    return new Response(JSON.stringify({ url: stripeSession.url, orderNumber }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("checkout_error", { message: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...getCorsHeaders(req.headers.get("origin")), "Content-Type": "application/json" },
    });
  }
});
