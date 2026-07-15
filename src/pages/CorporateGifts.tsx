import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import { motion } from 'framer-motion';
import { Gift, Palette, CalendarClock } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { TrustSignals } from '@/components/wholesale/TrustSignals';

const GIFT_PHOTOS = [
  { src: '/images/product-duvet-giftbox.jpg', capZh: '被子礼盒装', capEn: 'Duvet gift box' },
  { src: '/images/product-duvet-box.jpg', capZh: '产品包装展示', capEn: 'Retail packaging' },
  { src: '/images/product-vest-x6-giftbag.jpg', capZh: '马甲礼品袋装', capEn: 'Vest gift bag' },
];

const USE_CASES = [
  { icon: Gift, titleZh: '节日礼品', titleEn: 'Holiday Gifting', descZh: '春节、中秋等节庆员工/客户礼品', descEn: 'Employee/client gifts for Chinese New Year, Mid-Autumn, etc.' },
  { icon: Palette, titleZh: '品牌定制', titleEn: 'Custom Branding', descZh: '包装、吊牌可加入企业标识', descEn: 'Packaging and tags can carry your company branding' },
  { icon: CalendarClock, titleZh: '按需排期', titleEn: 'Scheduled Delivery', descZh: '按活动/发货节点安排交付', descEn: 'Delivery scheduled around your event or rollout date' },
];

export default function CorporateGiftsPage() {
  const { locale } = useApp();
  const [form, setForm] = useState({
    companyName: '', contactName: '', email: '', country: '',
    quantity: '', occasion: '', customization: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyName || !form.contactName || !form.email) return;
    setLoading(true);
    try {
      const messageParts = [
        form.occasion && (locale === 'zh' ? `使用场景/节日：${form.occasion}` : `Occasion: ${form.occasion}`),
        form.customization && (locale === 'zh' ? `定制需求：${form.customization}` : `Customization needs: ${form.customization}`),
      ].filter(Boolean);

      const { error } = await supabase.functions.invoke('bright-task', {
        body: {
          formType: 'wholesale',
          locale,
          companyName: form.companyName,
          contactName: form.contactName,
          email: form.email,
          country: form.country,
          productInterest: locale === 'zh' ? '企业礼品定制' : 'Corporate Gifting',
          volume: form.quantity,
          message: messageParts.join('\n') || undefined,
        },
      });
      if (error) throw error;
      toast.success(locale === 'zh' ? '礼品定制询价已提交！我们会尽快联系您。' : 'Enquiry submitted! We\'ll be in touch shortly.');
      setForm({ companyName: '', contactName: '', email: '', country: '', quantity: '', occasion: '', customization: '' });
    } catch {
      toast.error(locale === 'zh' ? '提交失败，请稍后重试或直接联系 info@pacificalpaca.com' : 'Submission failed — please try again or email info@pacificalpaca.com');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title={locale === 'zh' ? '企业礼品定制' : 'Corporate Gifting'}
        description={locale === 'zh' ? '太平洋羊驼企业礼品定制与批量采购' : 'Corporate gifting and bulk custom orders from Pacific Alpacas'}
      />

      <section className="pt-24 pb-12 bg-primary text-primary-foreground">
        <div className="container mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="text-gold text-xs tracking-[0.3em] uppercase font-body">
              {locale === 'zh' ? '企业采购' : 'Corporate Gifting'}
            </span>
            <h1 className="font-display text-4xl md:text-5xl mt-4 mb-4">
              {locale === 'zh' ? '企业礼品定制' : 'Gifts Worth Giving'}
            </h1>
            <p className="font-body text-primary-foreground/70 max-w-2xl mx-auto">
              {locale === 'zh'
                ? '新西兰新息峰100%羊驼纤维成品，适合节庆礼赠、客户答谢、员工福利。支持包装与吊牌定制。'
                : '100% New Zealand alpaca fiber finished goods for holiday gifting, client appreciation, and staff rewards. Packaging and tag branding available.'}
            </p>
          </motion.div>
        </div>
      </section>

      <div className="flex-1 py-16">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-16">
            {GIFT_PHOTOS.map((photo, i) => (
              <motion.div
                key={photo.src}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="relative aspect-[4/3] overflow-hidden rounded-sm bg-muted"
              >
                <img src={photo.src} alt={locale === 'zh' ? photo.capZh : photo.capEn} className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                  <p className="text-white text-xs font-body tracking-wide">{locale === 'zh' ? photo.capZh : photo.capEn}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-16">
            {USE_CASES.map((item, i) => (
              <motion.div key={item.titleEn} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-card rounded-lg border border-border p-6 text-center hover:border-gold/30 transition-colors">
                <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-6 h-6 text-gold" />
                </div>
                <h3 className="font-display text-lg font-semibold mb-2">{locale === 'zh' ? item.titleZh : item.titleEn}</h3>
                <p className="text-xs text-muted-foreground font-body">{locale === 'zh' ? item.descZh : item.descEn}</p>
              </motion.div>
            ))}
          </div>

          <TrustSignals />

          <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="max-w-2xl mx-auto bg-card rounded-lg border border-border p-8 space-y-5">
            <h2 className="font-display text-2xl mb-2">
              {locale === 'zh' ? '礼品定制询价' : 'Gifting Enquiry'}
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-body text-muted-foreground mb-1">{locale === 'zh' ? '公司名称 *' : 'Company Name *'}</label>
                <input type="text" required value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
                  className="w-full px-4 py-3 border border-border rounded-sm bg-background font-body text-sm focus:outline-none focus:border-gold transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-body text-muted-foreground mb-1">{locale === 'zh' ? '联系人 *' : 'Contact Name *'}</label>
                <input type="text" required value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))}
                  className="w-full px-4 py-3 border border-border rounded-sm bg-background font-body text-sm focus:outline-none focus:border-gold transition-colors" />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-body text-muted-foreground mb-1">{locale === 'zh' ? '邮箱 *' : 'Email *'}</label>
                <input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-4 py-3 border border-border rounded-sm bg-background font-body text-sm focus:outline-none focus:border-gold transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-body text-muted-foreground mb-1">{locale === 'zh' ? '预估数量' : 'Est. Quantity'}</label>
                <input type="text" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                  placeholder={locale === 'zh' ? '件数' : 'units'}
                  className="w-full px-4 py-3 border border-border rounded-sm bg-background font-body text-sm focus:outline-none focus:border-gold transition-colors" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-body text-muted-foreground mb-1">{locale === 'zh' ? '使用场景/节日' : 'Occasion'}</label>
              <input type="text" value={form.occasion} onChange={e => setForm(f => ({ ...f, occasion: e.target.value }))}
                placeholder={locale === 'zh' ? '如：春节客户礼品、员工年终福利' : 'e.g. Chinese New Year client gifts, year-end staff rewards'}
                className="w-full px-4 py-3 border border-border rounded-sm bg-background font-body text-sm focus:outline-none focus:border-gold transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-body text-muted-foreground mb-1">{locale === 'zh' ? '定制需求' : 'Customization Needs'}</label>
              <textarea rows={3} value={form.customization} onChange={e => setForm(f => ({ ...f, customization: e.target.value }))}
                placeholder={locale === 'zh' ? '如：包装印企业logo、指定交付日期' : 'e.g. branded packaging, specific delivery date'}
                className="w-full px-4 py-3 border border-border rounded-sm bg-background font-body text-sm focus:outline-none focus:border-gold transition-colors resize-none" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-accent text-accent-foreground font-body font-semibold rounded-sm tracking-wider hover:bg-accent/90 transition disabled:opacity-50">
              {loading ? '...' : (locale === 'zh' ? '提交礼品定制询价' : 'Submit Gifting Enquiry')}
            </button>
          </motion.form>
        </div>
      </div>

      <Footer />
    </div>
  );
}
