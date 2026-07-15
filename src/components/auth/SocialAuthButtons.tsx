import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { isWeChatBrowser, buildWeChatAuthUrl } from '@/lib/wechat';

type Provider = 'google' | 'facebook' | 'azure';

interface SocialAuthButtonsProps {
  locale: 'en' | 'zh';
  /** Path (relative to origin) to return to once the OAuth redirect completes. */
  redirectPath?: string;
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v2.96h3.86c2.26-2.08 3.56-5.14 3.56-8.78z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-2.96c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.32A7.19 7.19 0 0 1 4.87 12c0-.81.14-1.6.4-2.32V6.59H1.29A11.96 11.96 0 0 0 0 12c0 1.93.46 3.76 1.29 5.41l3.98-3.09z" />
      <path fill="#EA4335" d="M12 4.75c1.76 0 3.34.6 4.58 1.79l3.43-3.43C17.94 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.59l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
      <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
      <rect x="1" y="1" width="10" height="10" fill="#F25022" />
      <rect x="13" y="1" width="10" height="10" fill="#7FBA00" />
      <rect x="1" y="13" width="10" height="10" fill="#00A4EF" />
      <rect x="13" y="13" width="10" height="10" fill="#FFB900" />
    </svg>
  );
}

function WeChatIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true" fill="#07C160">
      <path d="M8.69 2.94C4.15 2.94.5 6.02.5 9.83c0 2.2 1.22 4.15 3.11 5.44a.6.6 0 0 1 .24.66l-.4 1.53a.3.3 0 0 0 .44.34l1.8-1.04a.6.6 0 0 1 .5-.06 9.6 9.6 0 0 0 2.5.33h.26a5.9 5.9 0 0 1-.2-1.5c0-3.5 3.4-6.33 7.6-6.33.25 0 .5.01.73.03C16.4 5.24 12.9 2.94 8.69 2.94zm-2.5 3.3a.9.9 0 1 1 0 1.8.9.9 0 0 1 0-1.8zm5 0a.9.9 0 1 1 0 1.8.9.9 0 0 1 0-1.8z" />
      <path d="M23.5 15.1c0-3.04-3.1-5.5-6.9-5.5s-6.9 2.46-6.9 5.5 3.1 5.5 6.9 5.5c.7 0 1.38-.08 2.02-.24a.5.5 0 0 1 .4.05l1.48.85a.25.25 0 0 0 .37-.28l-.33-1.25a.5.5 0 0 1 .2-.55c1.65-1.06 2.76-2.71 2.76-4.08zm-9.2-1.13a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5zm4.6 0a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5z" />
    </svg>
  );
}

export default function SocialAuthButtons({ locale, redirectPath = '/' }: SocialAuthButtonsProps) {
  const [loadingProvider, setLoadingProvider] = useState<Provider | null>(null);

  const handleOAuth = async (provider: Provider) => {
    setLoadingProvider(provider);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}${redirectPath}`,
        },
      });
      if (error) throw error;
      // On success the browser navigates away to the provider; nothing else to do here.
    } catch (err: any) {
      toast.error(err.message || (locale === 'zh' ? '登录失败，请重试' : 'Sign-in failed, please try again'));
      setLoadingProvider(null);
    }
  };

  const handleWeChat = () => {
    window.location.href = buildWeChatAuthUrl(redirectPath);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground font-body uppercase tracking-wider">
          {locale === 'zh' ? '或' : 'or'}
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => handleOAuth('google')}
          disabled={loadingProvider !== null}
          className="flex-1 flex items-center justify-center gap-1.5 py-3 border border-border rounded-sm font-body text-xs sm:text-sm hover:bg-muted transition disabled:opacity-50"
        >
          <GoogleIcon />
          {loadingProvider === 'google' ? '...' : 'Google'}
        </button>
        <button
          type="button"
          onClick={() => handleOAuth('facebook')}
          disabled={loadingProvider !== null}
          className="flex-1 flex items-center justify-center gap-1.5 py-3 border border-border rounded-sm font-body text-xs sm:text-sm hover:bg-muted transition disabled:opacity-50"
        >
          <FacebookIcon />
          {loadingProvider === 'facebook' ? '...' : 'Facebook'}
        </button>
        <button
          type="button"
          onClick={() => handleOAuth('azure')}
          disabled={loadingProvider !== null}
          className="flex-1 flex items-center justify-center gap-1.5 py-3 border border-border rounded-sm font-body text-xs sm:text-sm hover:bg-muted transition disabled:opacity-50"
        >
          <MicrosoftIcon />
          {loadingProvider === 'azure' ? '...' : 'Microsoft'}
        </button>
      </div>

      {isWeChatBrowser() && (
        <button
          type="button"
          onClick={handleWeChat}
          className="w-full flex items-center justify-center gap-1.5 py-3 border border-border rounded-sm font-body text-xs sm:text-sm hover:bg-muted transition"
        >
          <WeChatIcon />
          {locale === 'zh' ? '微信登录' : 'Log in with WeChat'}
        </button>
      )}
    </div>
  );
}
