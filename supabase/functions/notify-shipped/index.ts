import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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

async function sendSms(accountSid: string, authToken: string, from: string, to: string, body: string) {
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
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

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the caller's identity with their own JWT first, then check the
    // admin role with the service client -- mirrors the orders_admin_all RLS
    // policy this replaces for the "shipped" transition (this function needs
    // service_role to call the Twilio secrets and update status regardless
    // of RLS, so the admin check has to happen explicitly here instead).
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: isAdmin } = await serviceClient.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { orderId } = await req.json() as { orderId: string };
    if (!orderId) {
      return new Response(JSON.stringify({ error: "Missing orderId" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: order, error: orderError } = await serviceClient
      .from("orders")
      .update({ status: "shipped" })
      .eq("id", orderId)
      .select("id, order_number, shipping_phone, tracking_number, carrier")
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: orderError?.message ?? "Order not found" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Best-effort, same principle as stripe-webhook's confirmation SMS: the
    // status update above already succeeded, so a Twilio failure here must
    // not be reported back as an overall failure to the admin.
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioFromNumber = Deno.env.get("TWILIO_FROM_NUMBER");
    if (twilioAccountSid && twilioAuthToken && twilioFromNumber && order.shipping_phone) {
      try {
        const trackingLine = order.tracking_number
          ? ` ${order.carrier ? order.carrier + " " : ""}物流单号 / Tracking: ${order.tracking_number}`
          : "";
        const smsBody = `您的太平洋羊驼订单 ${order.order_number} 已发货！${trackingLine} / Your Pacific Alpacas order ${order.order_number} has shipped!${trackingLine}`;
        await sendSms(twilioAccountSid, twilioAuthToken, twilioFromNumber, order.shipping_phone, smsBody);
        console.log("shipped_sms_sent", { order_id: order.id });
      } catch (e) {
        console.error("shipped_sms_failed", {
          order_id: order.id,
          message: e instanceof Error ? e.message : String(e),
        });
      }
    } else if (!twilioAccountSid || !twilioAuthToken || !twilioFromNumber) {
      console.log("shipped_sms_skipped_not_configured", { order_id: order.id });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("notify_shipped_error", { message });
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...getCorsHeaders(req.headers.get("origin")), "Content-Type": "application/json" },
    });
  }
});
