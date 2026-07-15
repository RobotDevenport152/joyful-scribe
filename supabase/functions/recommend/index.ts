import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (origin === "https://pacificalpaca.com") return true;
  if (origin.startsWith("http://localhost")) return true;
  if (origin.endsWith(".lovable.app")) return true;
  if (origin.endsWith(".lovableproject.com")) return true;
  return false;
}

function getCorsHeaders(origin: string | null) {
  const allowed = isAllowedOrigin(origin) ? origin! : "https://pacificalpaca.com";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
  };
}

const RECOMMEND_RATE_LIMIT = 10; // requests
const RECOMMEND_RATE_WINDOW_SECONDS = 60;

const SYSTEM_PROMPT = `You are a sleep consultant for Pacific Alpacas NZ luxury alpaca bedding. Given quiz answers and a product list, recommend ONE product from that list. Return only valid JSON: { "product_id": string, "reason_en": string, "reason_zh": string } — no markdown, no preamble. Keep each reason under 40 words. product_id MUST be one of the ids in the supplied product list.`;

function fallbackFor(products: { id: string }[]) {
  return {
    product_id: products?.[0]?.id ?? null,
    reason_en: "We recommend this product based on your answers. Contact support for details.",
    reason_zh: "根据您的回答，推荐此商品。如需详情请联系客服。",
  };
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const { data: allowed, error: rateLimitError } = await serviceClient.rpc("check_rate_limit", {
      _key: `recommend:${clientIp}`,
      _limit: RECOMMEND_RATE_LIMIT,
      _window_seconds: RECOMMEND_RATE_WINDOW_SECONDS,
    });
    if (rateLimitError) console.error("rate limit check failed:", rateLimitError);
    if (rateLimitError === null && allowed === false) {
      return new Response(JSON.stringify({ error: "请求过于频繁，请稍后再试。" }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const answers: string[] = Array.isArray(body.answers) ? body.answers : [];
    const products: { id: string }[] = Array.isArray(body.products) ? body.products : [];

    if (products.length === 0) {
      return new Response(JSON.stringify({ error: "No products supplied" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: "user", parts: [{ text: JSON.stringify({ answers, products }) }] }],
          generationConfig: { maxOutputTokens: 300, responseMimeType: "application/json" },
        }),
      }
    );

    if (!response.ok) {
      const txt = await response.text();
      console.error("gemini_recommend_error", { status: response.status, body: txt });
      return new Response(JSON.stringify(fallbackFor(products)), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    try {
      const parsed = JSON.parse(replyText);
      // Guard against a hallucinated product_id that doesn't exist in the
      // list we sent — fall back rather than recommend a dead link.
      const validId = products.some((p) => p.id === parsed.product_id);
      if (!validId) throw new Error("product_id not in supplied product list");
      return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } catch (err) {
      console.warn("recommend_parse_failed", { error: String(err), replyText });
      return new Response(JSON.stringify(fallbackFor(products)), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (e) {
    console.error("recommend_error", { message: e instanceof Error ? e.message : String(e) });
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
