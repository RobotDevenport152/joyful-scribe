import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Bridges WeChat Official Account web OAuth into a real Supabase session.
// Supabase has no built-in WeChat provider, so this does the exchange by
// hand: WeChat code -> openid/profile -> find-or-create an auth.users row
// -> mint a session via a magiclink token, which the frontend redeems with
// supabase.auth.verifyOtp(). Only works when opened inside WeChat's own
// in-app browser (scope=snsapi_userinfo requires it) -- a normal desktop or
// mobile browser outside WeChat cannot complete this flow. Desktop "scan to
// login" is a different product (WeChat Open Platform, open.weixin.qq.com)
// requiring a separate app registration; not implemented here.

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (origin === "https://pacificalpaca.com") return true;
  if (origin.startsWith("http://localhost")) return true;
  if (origin.endsWith(".lovable.app")) return true;
  if (origin.endsWith(".lovableproject.com")) return true;
  if (origin.endsWith(".vercel.app")) return true;
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

interface WeChatTokenResponse {
  access_token?: string;
  openid?: string;
  unionid?: string;
  errcode?: number;
  errmsg?: string;
}

interface WeChatUserInfo {
  nickname?: string;
  headimgurl?: string;
  errcode?: number;
  errmsg?: string;
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { code } = await req.json();
    if (!code || typeof code !== "string") {
      return new Response(JSON.stringify({ error: "Missing code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const appId = Deno.env.get("WECHAT_APPID");
    const appSecret = Deno.env.get("WECHAT_APPSECRET");
    if (!appId || !appSecret) {
      throw new Error("WECHAT_APPID / WECHAT_APPSECRET not configured");
    }

    // 1. Exchange code for an access_token + openid.
    const tokenRes = await fetch(
      `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appId}&secret=${appSecret}&code=${encodeURIComponent(code)}&grant_type=authorization_code`,
    );
    const token: WeChatTokenResponse = await tokenRes.json();
    if (!token.access_token || !token.openid) {
      console.error("wechat_token_error", token);
      throw new Error(token.errmsg || "WeChat token exchange failed");
    }

    // 2. Fetch profile (nickname/avatar) — best-effort, login still proceeds
    // without it since only openid is required to identify the user.
    let profile: WeChatUserInfo = {};
    try {
      const profileRes = await fetch(
        `https://api.weixin.qq.com/sns/userinfo?access_token=${token.access_token}&openid=${token.openid}&lang=zh_CN`,
      );
      profile = await profileRes.json();
    } catch (e) {
      console.error("wechat_userinfo_error", e);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceRoleKey);

    // 3. Find or create the auth user linked to this openid.
    const { data: existing } = await admin
      .from("wechat_identities")
      .select("user_id")
      .eq("openid", token.openid)
      .maybeSingle();

    let userId: string;
    const syntheticEmail = `wechat-${token.openid}@wechat.pacificalpacas.internal`;

    if (existing) {
      userId = existing.user_id;
      await admin
        .from("wechat_identities")
        .update({
          nickname: profile.nickname ?? undefined,
          avatar_url: profile.headimgurl ?? undefined,
          last_login_at: new Date().toISOString(),
        })
        .eq("openid", token.openid);
    } else {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email: syntheticEmail,
        email_confirm: true,
        user_metadata: {
          provider: "wechat",
          nickname: profile.nickname ?? null,
          avatar_url: profile.headimgurl ?? null,
        },
      });
      if (createErr || !created.user) {
        console.error("wechat_create_user_error", createErr);
        throw new Error("Failed to create user");
      }
      userId = created.user.id;

      const { error: linkErr } = await admin.from("wechat_identities").insert({
        user_id: userId,
        openid: token.openid,
        unionid: token.unionid ?? null,
        nickname: profile.nickname ?? null,
        avatar_url: profile.headimgurl ?? null,
      });
      if (linkErr) {
        console.error("wechat_link_identity_error", linkErr);
        throw new Error("Failed to link WeChat identity");
      }
    }

    // 4. Mint a real Supabase session: generate a magiclink token server-side,
    // return it to the frontend, which redeems it via verifyOtp(). Never
    // exposes the service_role key or a password to the client.
    const { data: linkData, error: linkGenErr } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: syntheticEmail,
    });
    if (linkGenErr || !linkData) {
      console.error("wechat_generate_link_error", linkGenErr);
      throw new Error("Failed to create session");
    }

    return new Response(
      JSON.stringify({
        email: syntheticEmail,
        token_hash: linkData.properties?.hashed_token,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("wechat_auth_error", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
