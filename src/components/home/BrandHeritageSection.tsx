import { useTranslation } from 'react-i18next';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import nzAlpacaImg from '@/assets/nz-alpaca.jpg';
import alpacaFiberImg from '@/assets/alpaca-fiber.jpg';

const CountUp = ({ end }: { end: string }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="text-3xl md:text-4xl font-display font-bold text-gold"
    >
      {end}
    </motion.span>
  );
};

const GALLERY = [
  { src: '/images/product-coat-women.jpg', captionZh: '女款大衣', captionEn: "Women's Coat" },
  { src: '/images/product-coat-men.jpg', captionZh: '男款大衣', captionEn: "Men's Coat" },
  { src: '/images/product-vest-x6-front.jpg', captionZh: 'X6羊驼马甲', captionEn: 'X6 Alpaca Vest' },
  { src: '/images/product-scarf-maori.jpg', captionZh: '毛利图案围巾', captionEn: 'Māori Design Scarf' },
];

const BrandHeritageSection = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  const stats = [
    { value: '25+', label: t('brand.years') },
    { value: '800+', label: t('brand.farms') },
    { value: '70%', label: t('brand.market') },
    { value: '100+', label: t('brand.material') },
  ];

  return (
    <section ref={ref} className="py-20 md:py-32 bg-background">
      <div className="container mx-auto px-6">

        {/* Top: image column + text column */}
        <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center mb-20">

          {/* Left: main image with fiber close-up overlay */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <img
              src={nzAlpacaImg}
              alt="New Zealand Alpaca"
              className="w-full rounded-sm shadow-soft"
              loading="lazy"
              width={1200}
              height={800}
            />
            {/* Fiber close-up inset — bottom-right overlay */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="absolute bottom-4 right-4 w-28 md:w-36 rounded-sm overflow-hidden shadow-lg border-2 border-background"
            >
              <img
                src={alpacaFiberImg}
                alt="Alpaca Fiber Close-up"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </motion.div>
          </motion.div>

          {/* Right: brand story */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <img
              src="/images/brand-logo-mark.jpg"
              alt="Pacific Alpacas — Luxury for Generations"
              className="h-10 md:h-12 w-auto mb-6 object-contain"
              loading="lazy"
            />
            <p className="text-sm tracking-[0.2em] uppercase text-gold mb-3 font-body">
              {t('brand.sectionLabel')}
            </p>
            <h2 className="font-display text-3xl md:text-4xl text-foreground mb-6 leading-tight">
              {t('brand.title')}
            </h2>
            <div className="gold-line w-16 mb-6" />
            <p className="text-muted-foreground leading-relaxed mb-4 font-body">
              {t('brand.desc')}
            </p>
            <p className="text-muted-foreground leading-relaxed mb-10 font-body">
              {t('brand.desc2')}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <CountUp end={stat.value} />
                  <p className="text-xs text-muted-foreground mt-1 font-body">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Cloud of Dreams — Māori artist story */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="grid md:grid-cols-2 gap-10 items-center bg-primary/5 border border-border rounded-sm p-8 md:p-12 mb-16"
        >
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-gold font-body mb-3">
              {lang === 'zh' ? '独家设计' : 'Exclusive Design'}
            </p>
            <h3 className="font-display text-2xl md:text-3xl mb-4">
              {lang === 'zh' ? 'Cloud of Dreams · 云之梦图案' : 'Cloud of Dreams'}
            </h3>
            <div className="gold-line w-12 mb-5" />
            <p className="font-body text-muted-foreground text-sm leading-relaxed mb-4">
              {lang === 'zh'
                ? '每一床太平洋羊驼被上都绣有我们的注册商标"云之梦"图案。该图案由新西兰丰盛湾 Arawan 部落的毛利艺术家 Patricia Erueti 专为 Pacific Alpacas 独家设计。'
                : "Each Pacific Alpacas duvet features our trademarked 'Cloud of Dreams' pattern, designed exclusively by Māori artist Patricia Erueti of the Arawan tribe from New Zealand's Bay of Plenty."}
            </p>
            <p className="font-body text-muted-foreground text-sm leading-relaxed">
              {lang === 'zh'
                ? '购买一床太平洋羊驼被，不仅是拥有顶级品质寝具，更是将一件新西兰毛利文化遗产带回家中。每件图案均经版权保护，全球唯一。'
                : 'Every purchase carries a piece of New Zealand Māori heritage. The pattern is copyright-protected and found nowhere else in the world.'}
            </p>
          </div>
          <div className="relative">
            <img
              src="/images/product-luxury-duvet.jpg"
              alt={lang === 'zh' ? 'Cloud of Dreams 图案' : 'Cloud of Dreams Pattern'}
              className="w-full rounded-sm shadow-soft"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent rounded-sm" />
          </div>
        </motion.div>

        {/* Product gallery — 4 studio shots with hover effect */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <p className="text-xs tracking-[0.3em] uppercase text-gold font-body text-center mb-6">
            {lang === 'zh' ? '精选系列' : 'Featured Collection'}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {GALLERY.map((item, idx) => (
              <motion.div
                key={item.src}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.5 + idx * 0.08 }}
                className="group relative aspect-[3/4] overflow-hidden rounded-sm bg-card"
              >
                <img
                  src={item.src}
                  alt={lang === 'zh' ? item.captionZh : item.captionEn}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/30 transition-colors duration-300" />
                <p className="absolute bottom-3 left-0 right-0 text-center text-xs font-body text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 px-2">
                  {lang === 'zh' ? item.captionZh : item.captionEn}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>
    </section>
  );
};

export default BrandHeritageSection;
