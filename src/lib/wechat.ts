// WeChat Official Account web OAuth (snsapi_userinfo) only completes inside
// WeChat's own in-app browser — a normal Chrome/Safari tab can't reach
// api.weixin.qq.com's login flow at all. isWeChatBrowser() gates the button
// so it's only offered where it can actually work.
export function isWeChatBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /MicroMessenger/i.test(navigator.userAgent);
}

const WECHAT_APPID = import.meta.env.VITE_WECHAT_APPID as string | undefined;

// state is a CSRF nonce round-tripped through WeChat and re-checked in the
// callback; redirectPath (where to land after login) is smuggled inside it
// since WeChat only echoes back the literal state string, not custom params.
export function buildWeChatAuthUrl(redirectPath: string): string {
  const state = `${crypto.randomUUID()}::${redirectPath}`;
  sessionStorage.setItem('wechat_oauth_state', state);

  const callbackUrl = `${window.location.origin}/auth/wechat/callback`;
  const params = new URLSearchParams({
    appid: WECHAT_APPID ?? '',
    redirect_uri: callbackUrl,
    response_type: 'code',
    scope: 'snsapi_userinfo',
    state,
  });
  return `https://open.weixin.qq.com/connect/oauth2/authorize?${params.toString()}#wechat_redirect`;
}
