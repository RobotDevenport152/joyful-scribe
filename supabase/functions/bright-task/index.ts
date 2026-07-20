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

const FORM_RATE_LIMIT = 5; // submissions
const FORM_RATE_WINDOW_SECONDS = 600; // per 10 minutes per IP

// Real fallback now that pacificalpaca.com is verified in Resend. RESEND_FROM_EMAIL
// is the actual switch (see customDomainVerified below) — this constant only
// covers the case where that secret somehow isn't set on the deployed function.
const DEFAULT_FROM = "Pacific Alpacas <info@pacificalpaca.com>";
const DEFAULT_ADMIN_EMAIL = "info@pacificalpacas.nz";

interface ContactPayload {
  formType: "contact";
  locale: "zh" | "en";
  name: string;
  email: string;
  enquiryType?: string;
  message: string;
}

interface WholesalePayload {
  formType: "wholesale";
  locale: "zh" | "en";
  companyName: string;
  contactName: string;
  email: string;
  country?: string;
  productInterest?: string;
  volume?: string;
  message?: string;
}

type Payload = ContactPayload | WholesalePayload;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function validate(payload: Payload): string | null {
  if (payload.formType === "contact") {
    if (!payload.name?.trim()) return "name is required";
    if (!payload.email?.trim() || !payload.email.includes("@")) return "valid email is required";
    if (!payload.message?.trim() || payload.message.trim().length < 10) return "message must be at least 10 characters";
    return null;
  }
  if (payload.formType === "wholesale") {
    if (!payload.companyName?.trim()) return "companyName is required";
    if (!payload.contactName?.trim()) return "contactName is required";
    if (!payload.email?.trim() || !payload.email.includes("@")) return "valid email is required";
    return null;
  }
  return "unknown formType";
}

function buildAdminNotification(payload: Payload): { subject: string; html: string } {
  if (payload.formType === "contact") {
    return {
      subject: `[Contact] ${payload.enquiryType || "Enquiry"} from ${payload.name}`,
      html: `
        <h2>New contact form submission</h2>
        <p><strong>Name:</strong> ${escapeHtml(payload.name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(payload.email)}</p>
        <p><strong>Type:</strong> ${escapeHtml(payload.enquiryType || "—")}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(payload.message).replace(/\n/g, "<br/>")}</p>
      `,
    };
  }
  return {
    subject: `[Wholesale] Enquiry from ${payload.companyName}`,
    html: `
      <h2>New wholesale enquiry</h2>
      <p><strong>Company:</strong> ${escapeHtml(payload.companyName)}</p>
      <p><strong>Contact:</strong> ${escapeHtml(payload.contactName)}</p>
      <p><strong>Email:</strong> ${escapeHtml(payload.email)}</p>
      <p><strong>Country:</strong> ${escapeHtml(payload.country || "—")}</p>
      <p><strong>Product interest:</strong> ${escapeHtml(payload.productInterest || "—")}</p>
      <p><strong>Volume:</strong> ${escapeHtml(payload.volume || "—")}</p>
      <p><strong>Message:</strong></p>
      <p>${escapeHtml(payload.message || "—").replace(/\n/g, "<br/>")}</p>
    `,
  };
}

function buildCustomerConfirmation(payload: Payload): { subject: string; html: string } {
  const zh = payload.locale === "zh";
  if (payload.formType === "contact") {
    return {
      subject: zh ? "我们已收到您的消息 / We've received your message" : "We've received your message",
      html: zh
        ? `<p>您好 ${escapeHtml(payload.name)}，</p><p>感谢您联系太平洋羊驼，我们会尽快回复您。</p>`
        : `<p>Hi ${escapeHtml(payload.name)},</p><p>Thanks for reaching out to Pacific Alpacas — we'll get back to you shortly.</p>`,
    };
  }
  return {
    subject: zh ? "批发询价已收到 / Wholesale enquiry received" : "Wholesale enquiry received",
    html: zh
      ? `<p>您好 ${escapeHtml(payload.contactName)}，</p><p>感谢您对太平洋羊驼批发合作的兴趣，我们会尽快与 ${escapeHtml(payload.companyName)} 联系。</p>`
      : `<p>Hi ${escapeHtml(payload.contactName)},</p><p>Thanks for your interest in wholesale with Pacific Alpacas — we'll be in touch with ${escapeHtml(payload.companyName)} shortly.</p>`,
  };
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

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const payload = (await req.json()) as Payload;
    const validationError = validate(payload);
    if (validationError) {
      return new Response(JSON.stringify({ error: validationError }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const { data: allowed, error: rateLimitError } = await serviceClient.rpc("check_rate_limit", {
      _key: `send-form-email:${clientIp}`,
      _limit: FORM_RATE_LIMIT,
      _window_seconds: FORM_RATE_WINDOW_SECONDS,
    });
    if (rateLimitError) console.error("rate_limit_check_failed", { message: rateLimitError.message });
    if (rateLimitError === null && allowed === false) {
      return new Response(JSON.stringify({
        error: payload.locale === "zh" ? "提交过于频繁，请稍后再试。" : "Too many submissions — please try again later.",
      }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      // Fails loudly rather than silently "succeeding" — the whole point of
      // this function is that submissions no longer vanish into a black hole.
      console.error("send_form_email_missing_key", { formType: payload.formType });
      return new Response(JSON.stringify({
        error: payload.locale === "zh"
          ? "邮件服务暂未配置，请直接发送邮件至 info@pacificalpacas.nz"
          : "Email service is not configured yet — please email info@pacificalpacas.nz directly.",
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // RESEND_FROM_EMAIL is only set once a real domain is verified in Resend
    // (Domains → Add Domain). Until then, Resend's shared sandbox sender can
    // only deliver to the Resend account's own email — sending a "confirmation"
    // to an arbitrary customer address would silently fail, which is worse
    // than not sending one. So the customer email stays off until this is set.
    const customDomainVerified = !!Deno.env.get("RESEND_FROM_EMAIL");
    const fromAddress = Deno.env.get("RESEND_FROM_EMAIL") || DEFAULT_FROM;
    const adminEmail = Deno.env.get("ADMIN_NOTIFY_EMAIL") || DEFAULT_ADMIN_EMAIL;

    const notification = buildAdminNotification(payload);
    await sendEmail(resendApiKey, fromAddress, adminEmail, notification.subject, notification.html);

    if (customDomainVerified) {
      const confirmation = buildCustomerConfirmation(payload);
      await sendEmail(resendApiKey, fromAddress, payload.email, confirmation.subject, confirmation.html);
    }

    return new Response(JSON.stringify({ success: true, customerConfirmationSent: customDomainVerified }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send_form_email_error", { message: e instanceof Error ? e.message : String(e) });
    return new Response(JSON.stringify({ error: "Failed to send email" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
