import { useApp } from '@/contexts/AppContext';
import { motion } from 'framer-motion';
import { MapPin, Store } from 'lucide-react';
import { CertificationBadges } from '@/components/traceability/CertificationBadges';

const CIIE_PHOTOS = [
  '/images/ciie-booth-01.jpg',
  '/images/ciie-booth-02.jpg',
  '/images/ciie-booth-03.jpg',
  '/images/ciie-booth-04.jpg',
];

export function TrustSignals() {
  const { locale } = useApp();

  return (
    <section className="max-w-4xl mx-auto mb-16">
      <div className="text-center mb-8">
        <span className="text-gold text-xs tracking-[0.3em] uppercase font-body">
          {locale === 'zh' ? '真实渠道背书' : 'Verified Channel Presence'}
        </span>
        <h2 className="font-display text-2xl md:text-3xl mt-3">
          {locale === 'zh' ? '不止是网上贸易商' : 'Not Just an Online Trader'}
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {CIIE_PHOTOS.map((src, i) => (
          <motion.div
            key={src}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            className="aspect-square overflow-hidden rounded-sm bg-muted"
          >
            <img src={src} alt="CIIE" className="w-full h-full object-cover" loading="lazy" />
          </motion.div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <div className="flex items-start gap-3 bg-card border border-border rounded-sm p-4">
          <Store className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-body font-semibold">
              {locale === 'zh' ? '消博会1号参展商' : 'Hainan CIIE Booth #1'}
            </p>
            <p className="text-xs text-muted-foreground font-body mt-0.5">
              {locale === 'zh' ? '2025–2026年海南消费品博览会，连续6届参展' : '2025–2026 Hainan Consumer Products Expo, 6 consecutive shows'}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 bg-card border border-border rounded-sm p-4">
          <MapPin className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-body font-semibold">
              {locale === 'zh' ? '三亚国际免税城正式入驻' : 'Sanya International Duty-Free City'}
            </p>
            <p className="text-xs text-muted-foreground font-body mt-0.5">
              {locale === 'zh' ? '首个进入国际免税渠道的新西兰羊驼品牌' : 'First NZ alpaca fiber brand in duty-free retail'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <CertificationBadges certifications={['NZ Made', 'FernMark', 'IAA Alpaca Mark', 'NZ Grown']} />
      </div>
    </section>
  );
}
