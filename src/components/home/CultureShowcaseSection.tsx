import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { ArrowRight } from 'lucide-react';

const CULTURE_PREVIEW = [
  '/images/art/art-tang-xiaoming.jpg',
  '/images/ciie-booth-01.jpg',
  '/images/shearing-detail-02.jpg',
  '/images/art/art-bao-lei.jpg',
];

const LOOKBOOK_PREVIEW = [
  '/images/lookbook2/city-01.jpg',
  '/images/lookbook2/city-04.jpg',
  '/images/lookbook2/city-08.jpg',
  '/images/lookbook2/city-12.jpg',
];

function PreviewGrid({ photos }: { photos: string[] }) {
  return (
    <div className="grid grid-cols-4 gap-1.5 mb-6">
      {photos.map((src) => (
        <div key={src} className="aspect-square overflow-hidden rounded-sm bg-muted">
          <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
        </div>
      ))}
    </div>
  );
}

const CultureShowcaseSection = () => {
  const { locale } = useApp();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="py-20 md:py-28 bg-secondary/30">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs tracking-[0.3em] uppercase text-gold font-body mb-3">
            {locale === 'zh' ? '走进太平洋羊驼' : 'Beyond the Product'}
          </p>
          <h2 className="font-display text-3xl md:text-4xl mb-4">
            {locale === 'zh' ? '11位画家、上百张牧场实拍' : 'Eleven Artists, Hundreds of Real Moments'}
          </h2>
          <p className="text-muted-foreground font-body text-sm">
            {locale === 'zh'
              ? '从新西兰牧场到消博会展位，从画家笔下的羊驼到街头造型——真实记录，不止是卖被子。'
              : "From New Zealand farms to our CIIE booth, from artists' interpretations to street style — real documentation, not just product shots."}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 md:gap-10 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="bg-card border border-border rounded-sm p-6 md:p-8"
          >
            <PreviewGrid photos={CULTURE_PREVIEW} />
            <h3 className="font-display text-xl mb-2">
              {locale === 'zh' ? '艺术画廊 · 品牌纪实' : 'Art Gallery & Behind the Scenes'}
            </h3>
            <p className="text-muted-foreground font-body text-sm mb-5">
              {locale === 'zh'
                ? '11位画家共同创作的羊驼主题画作，以及牧场剪毛、工厂车间、消博会展位的真实影像。'
                : 'Alpaca-themed works from 11 artists, alongside real footage from shearing day, the factory floor, and our CIIE booth.'}
            </p>
            <Link
              to="/culture"
              className="inline-flex items-center gap-1.5 text-sm font-body text-gold hover:underline font-semibold"
            >
              {locale === 'zh' ? '查看艺术画廊' : 'View Art Gallery'}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="bg-card border border-border rounded-sm p-6 md:p-8"
          >
            <PreviewGrid photos={LOOKBOOK_PREVIEW} />
            <h3 className="font-display text-xl mb-2">
              {locale === 'zh' ? '造型集' : 'Lookbook'}
            </h3>
            <p className="text-muted-foreground font-body text-sm mb-5">
              {locale === 'zh'
                ? '真实拍摄，未经摆拍修饰——羊驼马甲与大衣在日常穿搭与城市街头中的样子。'
                : 'Real shoots, not staged renders — vests and coats in everyday styling and city streets.'}
            </p>
            <Link
              to="/lookbook"
              className="inline-flex items-center gap-1.5 text-sm font-body text-gold hover:underline font-semibold"
            >
              {locale === 'zh' ? '查看造型集' : 'View Lookbook'}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CultureShowcaseSection;
