import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function WeChatCallbackPage() {
  const { locale } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const code = searchParams.get('code');
      const returnedState = searchParams.get('state');
      const expectedState = sessionStorage.getItem('wechat_oauth_state');
      sessionStorage.removeItem('wechat_oauth_state');

      if (!code || !returnedState || returnedState !== expectedState) {
        setError(locale === 'zh' ? '登录状态校验失败，请重新尝试' : 'Login state check failed, please try again');
        return;
      }
      const redirectPath = returnedState.split('::')[1] || '/';

      try {
        const { data, error: fnError } = await supabase.functions.invoke('wechat-auth', {
          body: { code },
        });
        if (fnError) throw fnError;
        if (!data?.token_hash || !data?.email) throw new Error('Invalid response from server');

        const { error: verifyError } = await supabase.auth.verifyOtp({
          email: data.email,
          token: data.token_hash,
          type: 'magiclink',
        });
        if (verifyError) throw verifyError;

        toast.success(locale === 'zh' ? '登录成功！' : 'Logged in successfully!');
        navigate(redirectPath, { replace: true });
      } catch (err) {
        console.error('wechat_callback_error', err);
        setError(locale === 'zh' ? '微信登录失败，请重试' : 'WeChat login failed, please try again');
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="text-center">
        {error ? (
          <>
            <p className="text-sm text-destructive font-body mb-4">{error}</p>
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="text-sm text-gold hover:underline font-body"
            >
              {locale === 'zh' ? '返回登录页' : 'Back to login'}
            </button>
          </>
        ) : (
          <>
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground font-body">
              {locale === 'zh' ? '正在登录…' : 'Signing in…'}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
