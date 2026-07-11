import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

function buildSystemPrompt(catalogText: string, locale: string): string {
  if (locale === "en") {
    return `You are the professional shopping consultant and customer service assistant for Pacific Alpacas.

${BRAND_FACTS_EN}

## Your core task: understand the customer's needs and recommend the best-fit product
1. If you don't yet know enough (budget, sleeping preferences — hot/cold sleeper, allergies, bed size, season, who it's for), ask 1-2 short clarifying questions first.
2. Once you understand their needs, pick 1-2 products from the "Current catalogue" below that best match, and briefly explain WHY (e.g. warmth level, price fit, fiber content, size).
3. When recommending a product, include a link in this exact format: [Product Name](/product/slug)
4. Never invent products, prices, or specs that are not in the catalogue below. If nothing fits, say so honestly and suggest contacting WeChat support or info@pacificalpacas.com.
5. Keep replies concise (under 120 words), friendly but professional.

## Current catalogue (only recommend from this list)
${catalogText}`;
  }

  return `你是太平洋羊驼（Pacific Alpacas）的专业购物顾问与客服助手。

${BRAND_FACTS}

## 你的核心任务：理解客户需求，并推荐最合适的产品
1. 如果信息不足（预算、睡眠习惯：怕冷/怕热、过敏情况、床品尺寸、季节、送礼对象等），先用1-2个简短问题澄清需求。
2. 了解需求后，从下方"当前在售商品目录"中挑选1-2款最匹配的产品，并简要说明推荐理由（如保暖等级、价格区间、纤维成分、尺寸是否合适）。
3. 推荐产品时，必须使用以下格式附上链接：[产品名称](/product/slug)
4. 不要编造目录之外不存在的产品、价格或参数。如果没有合适的产品，请如实告知，并引导联系微信客服或邮箱 info@pacificalpacas.com。
5. 回答简洁（200字以内），专业且亲切。

## 当前在售商品目录（只能从此列表中推荐）
${catalogText}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let lang: "zh" | "en" = "zh";

  try {
    const { messages, locale } = await req.json();
    lang = locale === "en" ? "en" : "zh";

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

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

    const catalogText = buildCatalogText(products ?? [], lang);
    const systemPrompt = buildSystemPrompt(catalogText, lang);

    // Convert OpenAI-format messages to Gemini format
    // Gemini uses "model" instead of "assistant" for role
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: { maxOutputTokens: 500 },
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
          ? "The AI assistant is temporarily unavailable. Please try again later or contact info@pacificalpacas.com."
          : "AI 助手暂时无法回复，请稍后再试或联系微信客服 / info@pacificalpacas.com。",
      }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    // Transform Gemini response to OpenAI format so ChatWidget needs no changes
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
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
        ? "The AI assistant is temporarily unavailable. Please try again later or contact info@pacificalpacas.com."
        : "AI 助手暂时无法回复，请稍后再试或联系微信客服 / info@pacificalpacas.com。",
    }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
