import { useState, useRef, useEffect, Fragment } from 'react';
import { MessageCircle, X, Send, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

type Msg = { role: 'user' | 'assistant'; content: string };

// Renders assistant replies, turning [Product Name](/product/slug) into clickable links.
// Only same-site, single-leading-slash paths are linkified — anything else (protocol-relative
// "//evil.com", "javascript:", absolute URLs, etc.) is rendered as plain text.
const MARKDOWN_LINK = /\[([^\]]+)\]\((\/[^)]+)\)/g;
const SAFE_INTERNAL_PATH = /^\/(?![/\\])[A-Za-z0-9._~!$&'()*+,;=:@%/-]*$/;

const renderMessageContent = (content: string) => {
  const parts: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = MARKDOWN_LINK.exec(content)) !== null) {
    if (match.index > lastIndex) parts.push(content.slice(lastIndex, match.index));
    const [full, label, path] = match;
    if (SAFE_INTERNAL_PATH.test(path)) {
      parts.push(
        <Link key={key++} to={path} className="underline font-medium text-accent-foreground hover:opacity-80">
          {label}
        </Link>
      );
    } else {
      parts.push(full);
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < content.length) parts.push(content.slice(lastIndex));

  return parts.map((part, i) => <Fragment key={i}>{part}</Fragment>);
};

const QUICK_REPLIES = [
  { zh: '推荐适合我的被子',         en: 'Recommend a duvet for me' },
  { zh: '高奢款和轻奢款有什么区别',   en: "Premium vs Luxury — what's the difference?" },
  { zh: '发货需要多久',             en: 'How long does shipping take?' },
  { zh: '查询我的订单',             en: 'Check my order status' },
];

const CHAT_STORAGE_KEY = 'pa-chat-history';
// Full history is sent to the model on every turn — cap it so a long-lived
// stored conversation doesn't grow the request payload/cost without bound.
const MAX_HISTORY = 40;

const greeting = (lang: string): Msg => ({
  role: 'assistant',
  content: lang === 'zh'
    ? '您好！我是太平洋羊驼的 AI 助手，可以帮您了解产品、查询订单或推荐最适合您的羊驼被。'
    : "Hi! I'm Pacific Alpacas' AI assistant. I can help you with products, orders, or finding the perfect alpaca duvet.",
});

const isMsg = (m: unknown): m is Msg =>
  !!m && typeof m === 'object'
  && ((m as Msg).role === 'user' || (m as Msg).role === 'assistant')
  && typeof (m as Msg).content === 'string';

const loadStoredMessages = (lang: string): Msg[] => {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed.every(isMsg)) return parsed;
    }
  } catch {
    // corrupted or inaccessible storage — fall back to a fresh greeting
  }
  return [greeting(lang)];
};

const trimHistory = (msgs: Msg[]) => msgs.length > MAX_HISTORY ? msgs.slice(msgs.length - MAX_HISTORY) : msgs;

const ChatWidget = () => {
  const lang = (() => { try { return localStorage.getItem('pa-locale') || 'zh'; } catch { return 'zh'; } })();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>(() => loadStoredMessages(lang));
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQuick, setShowQuick] = useState(messages.length <= 1);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo(0, listRef.current.scrollHeight);
  }, [messages]);

  useEffect(() => {
    try { localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages)); } catch {
      // storage unavailable (private browsing, quota) — conversation just won't persist
    }
  }, [messages]);

  const startNewChat = () => {
    setMessages([greeting(lang)]);
    setShowQuick(true);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    setShowQuick(false);
    const userMsg: Msg = { role: 'user', content: text };
    const newMsgs = trimHistory([...messages, userMsg]);
    setMessages(newMsgs);
    setInput('');
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('chat', {
        body: { messages: newMsgs.map(m => ({ role: m.role, content: m.content })), locale: lang },
      });

      if (error) throw error;
      const reply = data?.choices?.[0]?.message?.content || data?.content || data?.text
        || (lang === 'zh' ? '抱歉，我暂时无法回答，请稍后再试。' : "Sorry, I can't answer that right now — please try again.");
      setMessages(trimHistory([...newMsgs, { role: 'assistant', content: reply }]));
    } catch (e: any) {
      console.error('Chat error:', e);
      let message = lang === 'zh'
        ? '网络异常，请稍后重试或联系微信客服。'
        : 'Network error — please try again or contact us via WeChat.';
      // Edge function returns a descriptive { error: string } body on 4xx/5xx — surface it if present
      try {
        const body = await e?.context?.json?.();
        if (typeof body?.error === 'string' && body.error) message = body.error;
      } catch {
        // response body wasn't JSON — fall back to the generic message above
      }
      setMessages(trimHistory([...newMsgs, { role: 'assistant', content: message }]));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setOpen(true)}
            aria-label={lang === 'zh' ? '打开聊天助手' : 'Open chat assistant'}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-accent text-accent-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
          >
            <MessageCircle className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat dialog */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-[360px] h-[500px] bg-card rounded-2xl shadow-elevated flex flex-col overflow-hidden border"
          >
            {/* Header */}
            <div className="bg-primary px-4 py-3 flex items-center justify-between">
              <div>
                <h3 className="text-primary-foreground font-display text-sm">太平洋羊驼 AI 助手</h3>
                <p className="text-primary-foreground/60 text-xs">在线</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={startNewChat}
                  title={lang === 'zh' ? '开始新对话' : 'Start new conversation'}
                  className="text-primary-foreground/70 hover:text-primary-foreground p-1"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  aria-label={lang === 'zh' ? '关闭聊天' : 'Close chat'}
                  className="text-primary-foreground/70 hover:text-primary-foreground p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'bg-accent text-accent-foreground rounded-br-sm'
                      : 'bg-muted text-foreground rounded-bl-sm'
                  }`}>
                    {msg.role === 'assistant' ? renderMessageContent(msg.content) : msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

              {/* Quick replies */}
              {showQuick && messages.length <= 1 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {QUICK_REPLIES.map((q) => (
                    <button
                      key={q.zh}
                      onClick={() => sendMessage(lang === 'zh' ? q.zh : q.en)}
                      className="text-xs border rounded-full px-3 py-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      {lang === 'zh' ? q.zh : q.en}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t p-3 flex gap-2">
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
                placeholder="输入消息..."
                className="flex-1 text-sm"
                disabled={loading}
              />
              <Button size="icon" onClick={() => sendMessage(input)} disabled={loading || !input.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatWidget;
