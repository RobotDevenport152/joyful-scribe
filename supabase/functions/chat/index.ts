import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { fetchWithRetry } from "../_shared/retry.ts";

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (origin === "https://pacificalpaca.com" || origin === "https://www.pacificalpaca.com") return true;
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
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

const CHAT_RATE_LIMIT = 20; // requests
const CHAT_RATE_WINDOW_SECONDS = 60;

const BRAND_FACTS = `公司背景：新西兰最大羊驼纤维供应商，成立于2001年，与800家农场合作，占新西兰市场70%份额。
获奖：2023胡润至尚优品金奖、新西兰政府银蕨认证、总理签名溯源证书。
核心卖点：WASM实验证明增加25%深度睡眠，螨虫趋避率64.37%，被窝恒温32-34°C。`;

const BRAND_FACTS_EN = `Company background: New Zealand's largest alpaca fiber supplier, founded in 2001, partnered with 800 farms, holding 70% of the NZ market.
Awards: 2023 Hurun Best of the Best Gold Award, NZ Government FernMark certification, PM-signed traceability certificate.
Key selling points: lab tests show +25% deep sleep, 64.37% mite-repellent rate, duvet maintains 32-34°C.`;

function buildCatalogText(products: any[], locale: string): string {
  if (!products.length) return locale === "en"
    ? "(Catalogue temporarily unavailable — do not invent products or prices.)"
    : "（商品目录暂时无法加载，请勿编造产品或价格。）";

  return products.map((p) => {
    const name = locale === "en" ? (p.name_en || p.name_zh) : (p.name_zh || p.name_en);
    const desc = (locale === "en" ? p.description_en : p.description_zh) || "";
    const shortDesc = desc.length > 80 ? desc.slice(0, 80) + "…" : desc;
    const tier = p.tier ? ` | ${p.tier}` : "";
    return `- ${name} | ${p.category}${tier} | NZD ${p.price_nzd} | /product/${p.slug}${shortDesc ? ` | ${shortDesc}` : ""}`;
  }).join("\n");
}

function buildOrderContext(orders: any[], locale: string, loggedIn: boolean): string {
  if (!loggedIn) {
    return locale === "en"
      ? "(Customer is not logged in — no order data available. If asked about an order, direct them to log in and check /my-orders, or provide their order number for WeChat support / info@pacificalpaca.com. Never say you can't access order info — always give this redirect instead.)"
      : "（客户未登录，无订单数据。如客户询问订单状态，请引导其登录后前往 /my-orders 查看，或提供订单号联系微信客服 / info@pacificalpaca.com。禁止说'我无法查询/访问'，一律用上述引导代替。）";
  }
  if (!orders.length) {
    return locale === "en"
      ? "(This logged-in customer has no orders on file.)"
      : "（该已登录客户名下暂无订单记录。）";
  }
  return orders.map((o) => {
    const tracking = o.tracking_number ? ` | tracking ${o.tracking_number}${o.carrier ? ` (${o.carrier})` : ""}` : "";
    const date = new Date(o.created_at).toISOString().slice(0, 10);
    return `- #${o.order_number} | ${o.status} | ${o.currency} ${o.total} | ${date}${tracking}`;
  }).join("\n");
}

function buildSystemPrompt(catalogText: string, orderContext: string, locale: string): string {
  if (locale === "en") {
    return `You are the professional shopping consultant and customer service assistant for Pacific Alpacas.

${BRAND_FACTS_EN}

## Your core task: understand the customer's needs and recommend the best-fit product
1. If you don't yet know enough (budget, sleeping preferences — hot/cold sleeper, allergies, bed size, season, who it's for), ask 1-2 short clarifying questions first.
2. Once you have enough information, briefly restate what you understood in a short clause (e.g. "for a cold sleeper, budget around $300") so the customer can correct you if you got it wrong — then pick 1-2 products from the "Current catalogue" below that best match, and briefly explain WHY (e.g. warmth level, price fit, fiber content, size).
3. Treat earlier turns in this conversation as already-confirmed — don't re-ask for details the customer already gave.
4. When recommending a product, include a link in this exact format: [Product Name](/product/slug)
5. Never invent products, prices, or specs that are not in the catalogue below. If nothing fits, say so honestly and suggest contacting WeChat support or info@pacificalpaca.com.
6. If the customer asks about an order's status, tracking, or history, answer only from the "Customer's orders" section below — never invent an order number, status, or tracking code.
7. Keep replies friendly but professional.

## Current catalogue (only recommend from this list)
${catalogText}

## Customer's orders (only source of truth for order questions)
${orderContext}`;
  }

  return `你是太平洋羊驼（Pacific Alpacas）的专业购物顾问与客服助手。

${BRAND_FACTS}

## 你的核心任务：理解客户需求，并推荐最合适的产品
1. 如果信息不足（预算、睡眠习惯：怕冷/怕热、过敏情况、床品尺寸、季节、送礼对象等），先用1-2个简短问题澄清需求。
2. 信息足够后，先用一句话简要复述你理解的需求（如"怕冷、预算300纽币左右"），让客户可以纠正你的理解是否有误；再从下方"当前在售商品目录"中挑选1-2款最匹配的产品，并简要说明推荐理由（如保暖等级、价格区间、纤维成分、尺寸是否合适）。
3. 把对话中之前几轮已确认的信息当作已知，不要重复询问客户已经给过的信息。
4. 推荐产品时，必须使用以下格式附上链接：[产品名称](/product/slug)
5. 不要编造目录之外不存在的产品、价格或参数。如果没有合适的产品，请如实告知，并引导联系微信客服或邮箱 info@pacificalpaca.com。
6. 如果客户询问订单状态、物流或历史订单，只能根据下方"客户订单"部分作答，禁止编造订单号、状态或物流单号。
7. 回答专业且亲切。

## 当前在售商品目录（只能从此列表中推荐）
${catalogText}

## 客户订单（订单相关问题的唯一依据）
${orderContext}`;
}

// Guards against the model breaking character (disclosing it's an AI,
// claiming it can't access something) and against degenerate output
// (empty / truncated / runaway length). Falls back to a safe, on-brand
// message that points the customer to a human channel instead.
function validateOutput(content: string, locale: "zh" | "en"): { valid: boolean; fallback?: string } {
  const genericFallback = locale === "en"
    ? "The AI assistant is temporarily unavailable. Please try again later or contact info@pacificalpaca.com."
    : "AI 助手暂时无法回复，请稍后再试或联系微信客服 / info@pacificalpaca.com。";

  if (!content || content.length < 2) return { valid: false, fallback: genericFallback };
  if (content.length > 4000) return { valid: false, fallback: genericFallback };

  const aiSelfDisclosure = ["As an AI", "I'm an AI", "I cannot access", "I don't have access", "作为一个AI", "作为AI"];
  if (aiSelfDisclosure.some((s) => content.includes(s))) return { valid: false, fallback: genericFallback };

  return { valid: true };
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let lang: "zh" | "en" = "zh";

  try {
    const { messages, locale } = await req.json();
    lang = locale === "en" ? "en" : "zh";

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const { data: allowed, error: rateLimitError } = await serviceClient.rpc("check_rate_limit", {
      _key: `chat:${clientIp}`,
      _limit: CHAT_RATE_LIMIT,
      _window_seconds: CHAT_RATE_WINDOW_SECONDS,
    });
    if (rateLimitError) console.error("rate_limit_check_failed", { message: rateLimitError.message });
    if (rateLimitError === null && allowed === false) {
      return new Response(JSON.stringify({
        error: lang === "en"
          ? "Too many requests right now — please try again in a moment."
          : "请求过于频繁，请稍后再试。",
      }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("name_zh, name_en, slug, category, tier, price_nzd, description_zh, description_en")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .limit(30);

    if (productsError) console.error("chat_products_fetch_error", { message: productsError.message });

    // Chat is used by anonymous visitors too, so a missing/invalid Authorization
    // header just means "not logged in" — never reject the request over it.
    let authedUserId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const { data: userData } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
      authedUserId = userData?.user?.id ?? null;
    }

    let orders: any[] = [];
    if (authedUserId) {
      const { data: orderRows, error: ordersError } = await serviceClient
        .from("orders")
        .select("order_number, status, tracking_number, carrier, total, currency, created_at")
        .eq("user_id", authedUserId)
        .order("created_at", { ascending: false })
        .limit(5);
      if (ordersError) console.error("chat_orders_fetch_error", { message: ordersError.message });
      orders = orderRows ?? [];
    }

    const catalogText = buildCatalogText(products ?? [], lang);
    const orderContext = buildOrderContext(orders, lang, authedUserId !== null);
    const systemPrompt = buildSystemPrompt(catalogText, orderContext, lang);

    // Convert OpenAI-format messages to Gemini format
    // Gemini uses "model" instead of "assistant" for role
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const response = await fetchWithRetry(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: { maxOutputTokens: 1500 },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({
          error: lang === "en"
            ? "Too many requests right now — please try again in a moment."
            : "请求过于频繁，请稍后再试。",
        }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("gemini_api_error", { status: response.status, body: t });
      return new Response(JSON.stringify({
        error: lang === "en"
          ? "The AI assistant is temporarily unavailable. Please try again later or contact info@pacificalpaca.com."
          : "AI 助手暂时无法回复，请稍后再试或联系微信客服 / info@pacificalpaca.com。",
      }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    // Transform Gemini response to OpenAI format so ChatWidget needs no changes
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const check = validateOutput(text, lang);
    if (!check.valid) text = check.fallback!;

    const openAiFormat = {
      choices: [{ message: { role: "assistant", content: text } }],
    };
    return new Response(JSON.stringify(openAiFormat), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("chat_error", { message: e instanceof Error ? e.message : String(e) });
    return new Response(JSON.stringify({
      error: lang === "en"
        ? "The AI assistant is temporarily unavailable. Please try again later or contact info@pacificalpaca.com."
        : "AI 助手暂时无法回复，请稍后再试或联系微信客服 / info@pacificalpaca.com。",
    }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
