import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

interface CartItem {
  productId: string;
  name: string;
  quantity: number;
  variant?: string | null;
}

interface PricedItem extends CartItem {
  price: number;
  priceNZD: number;
}

interface SizeOptionObject {
  label?: string;
  price_nzd?: number | string;
}
type SizeOption = string | SizeOptionObject;

interface DbProduct {
  id: string;
  name_en: string;
  price_nzd: number | string;
  size_options: SizeOption[] | null;
}

interface CheckoutRequestBody {
  items: CartItem[];
  currency?: string;
  promoCode?: string | null;
  // WeChat Pay isn't offered by Stripe for a NZ-registered business, so it's
  // deliberately not a valid value here — the frontend disables that option
  // rather than sending it.
  paymentMethod?: "stripe" | "alipay";
  shippingInfo: {
    name: string;
    email: string;
    phone?: string;
    province?: string;
    city?: string;
    district?: string;
    address?: string;
  };
}

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
      Deno.env.get("SUPABASE_URL") ?? Deno.env.get("VITE_SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ?? "",
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

    const { items, currency, shippingInfo, promoCode, paymentMethod } = await req.json() as CheckoutRequestBody;

    if (!items?.length) {
      return new Response(JSON.stringify({ error: "No items" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!shippingInfo?.name || !shippingInfo?.email || !shippingInfo?.province || !shippingInfo?.city || !shippingInfo?.address) {
      return new Response(JSON.stringify({ error: "Missing shipping info" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (items.some((item) => !item.productId || !(Number(item.quantity) > 0))) {
      return new Response(JSON.stringify({ error: "Invalid item" }), {
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
      Deno.env.get("SUPABASE_URL") ?? Deno.env.get("VITE_SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("VITE_SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Prices are never trusted from the client — look up the authoritative
    // NZD price for every item (and, if a size/variant was selected, that
    // variant's own price — a carpet's largest size is ~12x its smallest,
    // so the base price alone isn't enough) from the products table.
    // Display-currency conversion also happens here with a fixed rate table
    // (mirrors the useExchangeRates fallback), never with a client-supplied rate.
    const productIds = [...new Set(items.map((item) => item.productId))];
    const { data: products, error: productsError } = await serviceClient
      .from("products")
      .select("id, name_en, price_nzd, size_options")
      .in("id", productIds)
      .eq("is_active", true) as { data: DbProduct[] | null; error: unknown };

    if (productsError || !products || products.length !== productIds.length) {
      return new Response(JSON.stringify({ error: "One or more items are invalid or unavailable" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const productsById = new Map(products.map((p) => [p.id, p]));
    const CURRENCY_RATES: Record<string, number> = { NZD: 1, CNY: 4.5, USD: 0.6 };
    const rate = CURRENCY_RATES[(currency || "NZD").toUpperCase()] ?? 1;

    // Resolve the authoritative NZD price for one item: base price_nzd, unless
    // a variant was selected and that exact size_options entry carries its own
    // price_nzd override. A variant that doesn't match any real size is rejected
    // outright rather than silently falling back to the base price.
    function resolveUnitPriceNZD(item: CartItem): number | null {
      const product = productsById.get(item.productId);
      if (!product) return null;
      if (!item.variant) return Number(product.price_nzd);

      const sizeOptions = Array.isArray(product.size_options) ? product.size_options : [];
      const match = sizeOptions.find((v) => (typeof v === "string" ? v : v?.label) === item.variant);
      if (!match) return null;
      if (typeof match === "object" && match.price_nzd != null) return Number(match.price_nzd);
      return Number(product.price_nzd);
    }

    if (items.some((item) => resolveUnitPriceNZD(item) === null)) {
      return new Response(JSON.stringify({ error: "One or more items have an invalid size/variant" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pricedItems: PricedItem[] = items.map((item) => {
      const unitPriceNZD = resolveUnitPriceNZD(item)!;
      const unitPriceCurrency = rate === 1 ? unitPriceNZD : Math.round(unitPriceNZD * rate);
      return { ...item, price: unitPriceCurrency, priceNZD: unitPriceNZD };
    });

    const subtotal = pricedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const subtotalNZD = pricedItems.reduce((sum, item) => sum + item.priceNZD * item.quantity, 0);
    const shippingCost = subtotalNZD >= 500 ? 0 : Math.round(25 * rate);
    const discountNZD = await previewPromoDiscount(serviceClient, promoCode, subtotalNZD);
    const discount = rate === 1 ? discountNZD : Math.round(discountNZD * rate * 100) / 100;
    const total = subtotal - discount + shippingCost;

    const orderNumber = `PA-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

    // Store cart + shipping data so the webhook can create the real order after payment.
    // No orders row is written until Stripe confirms payment.
    const { data: checkoutSession, error: sessionError } = await serviceClient
      .from("checkout_sessions")
      .insert({
        user_id: userData.user.id,
        order_number: orderNumber,
        items: pricedItems.map((item) => ({
          productId: item.productId,
          name: item.name,
          variant: item.variant || null,
          quantity: item.quantity,
          price: item.price,
        })),
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

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = pricedItems.map((item) => ({
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

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: paymentMethod === "alipay" ? ["alipay"] : ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${baseUrl}/order-success?number=${orderNumber}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout`,
      customer_email: userData.user.email,
      // Webhook reads checkout_session_id to fetch stored cart data. order_id is
      // included as a fallback for legacy Stripe sessions created before the
      // metadata field was standardized.
      metadata: {
        checkout_session_id: checkoutSession.id,
        order_id: checkoutSession.id,
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
