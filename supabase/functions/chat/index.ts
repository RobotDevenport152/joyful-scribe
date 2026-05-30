import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `你是太平洋羊驼（Pacific Alpacas）的专业客服助手。
公司背景：新西兰最大羊驼纤维供应商，成立于2001年，与800家农场合作，占新西兰市场70%份额。
获奖：2023胡润至尚优品金奖、新西兰政府银蕨认证、总理签名溯源证书。
产品：初生被/经典款/轻奢款/高奢款羊驼被，以及大衣、马甲、围巾系列。
价格范围：NZD 249 - NZD 1,680（折合人民币约1,100 - 7,500元）。
核心卖点：WASM实验证明增加25%深度睡眠，螨虫趋避率64.37%，被窝恒温32-34°C。
回答风格：专业但亲切，优先中文，回答简洁（200字以内）。
不确定的内容：引导用户联系微信客服或发邮件至 info@pacificalpacas.com`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

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
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents,
          generationConfig: { maxOutputTokens: 500 },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "请求过于频繁，请稍后再试。" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("gemini_api_error", { status: response.status, body: t });
      return new Response(JSON.stringify({ error: "AI 服务暂不可用" }), {
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
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
