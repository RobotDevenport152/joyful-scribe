import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function ApplyGrowerPage() {
  const { locale } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ farmName: '', ownerName: '', region: '', phone: '', message: '' });
  const [loading, setLoading] = useState(false);

  const update = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('grower_applications').insert({
        user_id: user.id,
        farm_name: form.farmName,
        owner_name: form.ownerName,
        region: form.region,
        phone: form.phone || null,
        message: form.message || null,
      });
      if (error) throw error;
      toast.success(locale === 'zh' ? '申请已提交，我们会尽快审核！' : 'Application submitted — we will review it shortly!');
      navigate('/growers-info');
    } catch (err: any) {
      const isDuplicate = err?.code === '23505';
      toast.error(
        isDuplicate
          ? (locale === 'zh' ? '您已有一份待审核的申请' : 'You already have a pending application')
          : err.message || (locale === 'zh' ? '提交失败' : 'Submission failed')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title={locale === 'zh' ? '申请成为牧场主' : 'Apply as a Grower'}
        description={locale === 'zh' ? '申请加入太平洋羊驼牧场主网络' : 'Apply to join the Pacific Alpacas grower network'}
      />

      <div className="flex-1 flex items-center justify-center px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-card rounded-lg border border-border p-8">
            <div className="text-center mb-8">
              <h1 className="font-display text-3xl font-semibold mb-2">
                {locale === 'zh' ? '申请成为牧场主' : 'Apply as a Grower'}
              </h1>
              <p className="text-sm text-muted-foreground font-body">
                {locale === 'zh'
                  ? '提交您的农场信息，我们审核通过后会为您开通牧场主门户账号'
                  : "Submit your farm details — we'll enable your grower portal account once approved"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-body text-muted-foreground mb-1">
                  {locale === 'zh' ? '农场名称' : 'Farm Name'}
                </label>
                <input
                  required
                  value={form.farmName}
                  onChange={e => update('farmName', e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-sm bg-background font-body text-sm focus:outline-none focus:border-gold transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-body text-muted-foreground mb-1">
                  {locale === 'zh' ? '业主姓名' : 'Owner Name'}
                </label>
                <input
                  required
                  value={form.ownerName}
                  onChange={e => update('ownerName', e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-sm bg-background font-body text-sm focus:outline-none focus:border-gold transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-body text-muted-foreground mb-1">
                  {locale === 'zh' ? '所在地区' : 'Region'}
                </label>
                <input
                  required
                  value={form.region}
                  onChange={e => update('region', e.target.value)}
                  placeholder={locale === 'zh' ? '例如：Canterbury' : 'e.g. Canterbury'}
                  className="w-full px-4 py-3 border border-border rounded-sm bg-background font-body text-sm focus:outline-none focus:border-gold transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-body text-muted-foreground mb-1">
                  {locale === 'zh' ? '联系电话（选填）' : 'Phone (optional)'}
                </label>
                <input
                  value={form.phone}
                  onChange={e => update('phone', e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-sm bg-background font-body text-sm focus:outline-none focus:border-gold transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-body text-muted-foreground mb-1">
                  {locale === 'zh' ? '补充信息（选填）' : 'Message (optional)'}
                </label>
                <textarea
                  value={form.message}
                  onChange={e => update('message', e.target.value)}
                  rows={3}
                  placeholder={locale === 'zh' ? '羊驼数量、纤维产量等' : 'Herd size, fibre volume, etc.'}
                  className="w-full px-4 py-3 border border-border rounded-sm bg-background font-body text-sm focus:outline-none focus:border-gold transition-colors resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-accent text-accent-foreground font-body font-semibold rounded-sm tracking-wider hover:bg-accent/90 transition disabled:opacity-50"
              >
                {loading ? '...' : (locale === 'zh' ? '提交申请' : 'Submit Application')}
              </button>
            </form>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
