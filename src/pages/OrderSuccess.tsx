import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, MapPin, Clock, AlertCircle, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

type OrderStatus = 'loading' | 'paid' | 'processing_payment' | 'payment_failed' | 'not_found';

interface OrderCertificate {
  code: string;
  productName: string;
}

const MAX_POLLS     = 8;
const POLL_INTERVAL = 2000;

export default function OrderSuccessPage() {
  const { locale, clearCart } = useApp();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const orderNumber = searchParams.get('number') || '';
  const batchCode   = searchParams.get('batch') || 'PA-2025-001';

  const [orderStatus, setOrderStatus] = useState<OrderStatus>(
    orderNumber ? 'loading' : 'not_found',
  );
  const [certificates, setCertificates] = useState<OrderCertificate[]>([]);

  useEffect(() => {
    if (!orderNumber || !user) return;

    let cancelled = false;
    let attempts  = 0;

    async function poll() {
      if (cancelled) return;

      const { data } = await supabase
        .from('orders')
        .select('status, order_items(product_id, product_name), product_certificates(code, product_id)')
        .eq('order_number', orderNumber)
        .eq('user_id', user!.id)
        .maybeSingle();

      if (cancelled) return;

      if (data) {
        const status = data.status as string;
        if (['paid', 'processing', 'shipped', 'delivered'].includes(status)) {
          setOrderStatus('paid');
          clearCart();
          const items = (data.order_items ?? []) as { product_id: string | null; product_name: string }[];
          const certs = (data.product_certificates ?? []) as { code: string; product_id: string | null }[];
          setCertificates(certs.map(c => ({
            code: c.code,
            productName: items.find(i => i.product_id === c.product_id)?.product_name || '',
          })));
          return;
        }
        if (status === 'payment_failed') {
          setOrderStatus('payment_failed');
          return;
        }
      }

      // Order not in DB yet (webhook in-flight) or still pending — keep polling
      attempts++;
      if (attempts >= MAX_POLLS) {
        // After ~16s show "processing" rather than "not found" — the customer paid,
        // the webhook may just be slow. Showing "not found" would be alarming.
        setOrderStatus('processing_payment');
        return;
      }

      setTimeout(poll, POLL_INTERVAL);
    }

    poll();
    return () => { cancelled = true; };
  }, [orderNumber, user]);

  return (
    <div className="min-h-screen bg-background">
      <div className="pt-32 pb-16 text-center">

        {/* Confirming */}
        {orderStatus === 'loading' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin" />
            <p className="font-body text-sm text-muted-foreground">
              {locale === 'zh' ? '正在确认您的订单…' : 'Confirming your order…'}
            </p>
          </div>
        )}

        {/* Payment confirmed */}
        {orderStatus === 'paid' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="w-10 h-10 text-green-600" />
            </motion.div>

            <h1 className="font-display text-3xl mb-2">
              {locale === 'zh' ? '订单已确认！' : 'Order Confirmed!'}
            </h1>
            <p className="text-muted-foreground font-body mb-2">
              {locale === 'zh' ? '订单编号' : 'Order Number'}
            </p>
            <p className="font-mono text-lg text-gold font-semibold mb-8">{orderNumber}</p>
            <p className="text-muted-foreground font-body text-sm mb-8 max-w-md mx-auto">
              {locale === 'zh'
                ? '付款成功！我们会尽快处理并发货，订单详情与防伪码可随时在"我的订单"查看。'
                : 'Payment successful! We will process and ship your order soon. Your order details and authenticity code(s) are always available under "My Orders".'}
            </p>

            <div className="flex gap-4 justify-center mb-10">
              <Link to="/my-orders" className="px-6 py-3 border border-border rounded-sm font-body text-sm hover:bg-secondary transition-colors">
                {locale === 'zh' ? '查看我的订单' : 'My Orders'}
              </Link>
              <Link to="/shop" className="px-6 py-3 bg-accent text-accent-foreground rounded-sm font-body text-sm hover:bg-accent/90 transition-colors">
                {locale === 'zh' ? '继续购物' : 'Continue Shopping'}
              </Link>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="max-w-md mx-auto bg-card border border-border rounded-lg p-6"
            >
              <div className="flex items-center gap-2 mb-2 justify-center">
                <MapPin className="w-4 h-4 text-gold" />
                <p className="font-display text-lg font-semibold">
                  {locale === 'zh' ? '追溯您的羊驼被' : 'Trace Your Duvet'}
                </p>
              </div>
              <p className="font-mono text-base font-semibold text-gold mb-3">{batchCode}</p>
              <Link
                to={`/traceability?code=${batchCode}`}
                className="block w-full text-center py-2.5 border border-gold/40 text-gold rounded-sm font-body text-sm hover:bg-gold/10 transition-colors"
              >
                {locale === 'zh' ? '📱 查看溯源故事 →' : '📱 View Trace Story →'}
              </Link>
            </motion.div>

            {certificates.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                className="max-w-md mx-auto bg-card border border-border rounded-lg p-6 mt-4"
              >
                <div className="flex items-center gap-2 mb-3 justify-center">
                  <ShieldCheck className="w-4 h-4 text-gold" />
                  <p className="font-display text-lg font-semibold">
                    {locale === 'zh' ? '您的正品防伪码' : 'Your Authenticity Code(s)'}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground font-body mb-3">
                  {locale === 'zh'
                    ? '请妥善保存以下防伪码，可随时在正品验证页面核实真伪。'
                    : 'Save these codes — you can verify authenticity with them anytime.'}
                </p>
                <div className="space-y-2">
                  {certificates.map(c => (
                    <div key={c.code} className="flex items-center justify-between gap-2 bg-background rounded-sm px-3 py-2">
                      <div className="text-left">
                        {c.productName && <p className="text-xs text-muted-foreground font-body">{c.productName}</p>}
                        <p className="font-mono text-sm font-semibold text-gold">{c.code}</p>
                      </div>
                      <Link
                        to={`/verify/${c.code}`}
                        className="text-xs text-gold hover:underline font-body whitespace-nowrap"
                      >
                        {locale === 'zh' ? '验证 →' : 'Verify →'}
                      </Link>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Webhook in-flight or slow — reassure the customer */}
        {orderStatus === 'processing_payment' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md mx-auto">
            <div className="w-20 h-20 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-6">
              <Clock className="w-10 h-10 text-yellow-600" />
            </div>
            <h1 className="font-display text-2xl mb-4">
              {locale === 'zh' ? '订单处理中…' : 'Order Processing…'}
            </h1>
            <p className="text-muted-foreground font-body text-sm mb-6 max-w-md mx-auto">
              {locale === 'zh'
                ? '付款正在确认中，请稍候。如有疑问请联系我们，订单编号：'
                : 'Your payment is being confirmed. If you have questions, contact us with order number:'}
            </p>
            <p className="font-mono text-gold font-semibold mb-6">{orderNumber}</p>
            <Link to="/contact" className="px-6 py-3 border border-border rounded-sm font-body text-sm hover:bg-secondary">
              {locale === 'zh' ? '联系客服' : 'Contact Support'}
            </Link>
          </motion.div>
        )}

        {/* Payment failed */}
        {orderStatus === 'payment_failed' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md mx-auto">
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="font-display text-2xl mb-4">
              {locale === 'zh' ? '支付失败' : 'Payment Failed'}
            </h1>
            <p className="text-muted-foreground font-body text-sm mb-6">
              {locale === 'zh' ? '您的付款未能完成，请重试。' : 'Your payment could not be processed. Please try again.'}
            </p>
            <Link to="/checkout" className="px-6 py-3 bg-accent text-accent-foreground rounded-sm font-body text-sm hover:bg-accent/90">
              {locale === 'zh' ? '重新结账' : 'Try Again'}
            </Link>
          </motion.div>
        )}

        {/* No order number in URL — shouldn't happen via normal checkout flow */}
        {orderStatus === 'not_found' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h1 className="font-display text-2xl mb-4">
              {locale === 'zh' ? '未找到订单' : 'Order Not Found'}
            </h1>
            <Link to="/my-orders" className="text-gold hover:underline font-body text-sm">
              {locale === 'zh' ? '查看所有订单' : 'View All Orders'}
            </Link>
          </motion.div>
        )}

      </div>
    </div>
  );
}
