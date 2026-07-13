import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useInView } from 'framer-motion';
import { MapPin, Scissors, Droplets, Sparkles, BedDouble, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const STEPS = [
  { icon: MapPin,    key: 'farm',          image: '/images/farmstory-farm.jpg',          link: '/growers-info' },
  { icon: Scissors,  key: 'shearing',      image: '/images/farmstory-shearing.jpg',      link: '/traceability' },
  { icon: Droplets,  key: 'processing',    image: '/images/farmstory-processing.jpg',    link: '/traceability' },
  { icon: Sparkles,  key: 'craftsmanship', image: '/images/farmstory-craftsmanship.jpg', link: '/traceability' },
  { icon: BedDouble, key: 'luxury',        image: '/images/farmstory-luxury.jpg',         link: '/shop' },
] as const;

const FarmStorySection = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="py-20 md:py-32 bg-pa-navy text-pa-ivory overflow-hidden">
      <div className="container mx-auto px-6">

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-xs tracking-[0.35em] uppercase text-pa-gold-lt mb-4 font-body">
            {lang === 'zh' ? '供应链透明化' : 'Supply Chain'}
          </p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-light text-pa-ivory mb-4">
            {lang === 'zh' ? '从新西兰牧场到您的卧室' : 'From NZ Farm to Your Bedroom'}
          </h2>
          <p className="font-body text-pa-ivory/60 text-sm">
            {lang === 'zh' ? '每一件产品，都有自己的故事' : 'Every product has its own story to tell'}
          </p>
          <div className="w-16 h-px bg-pa-gold-lt mx-auto mt-6" />
        </motion.div>

        {/* Banner photo */}
        <motion.div
          initial={{ opacity: 0, scale: 1.02 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.9 }}
          className="max-w-4xl mx-auto mb-16 rounded-sm overflow-hidden"
        >
          <img
            src="/images/hero-alpacas.jpg"
            alt="Pacific Alpacas duvet with grazing alpaca herd, New Zealand coastline"
            className="w-full h-auto"
            loading="lazy"
          />
        </motion.div>

        {/* Steps — vertical timeline */}
        <div className="max-w-3xl mx-auto relative">
          {/* Vertical connecting line — ties the icons into a visible sequence;
              needed most on mobile, where each step's image+text block is
              tall and icons would otherwise look disconnected */}
          <div className="absolute left-6 md:left-8 top-6 bottom-6 w-px bg-pa-ivory/10" />

          {STEPS.map(({ icon: Icon, key, image, link }, idx) => {
            const title = lang === 'zh'
              ? (['新西兰牧场', '年度剪获', '专有加工工艺', '匠心制造', '奢华成品'] as const)[idx]
              : (['NZ Farm', 'Annual Shearing', 'Proprietary Processing', 'Craftsmanship', 'Luxury Product'] as const)[idx];

            const desc = lang === 'zh'
              ? ([
                '我们的纤维来自新西兰 800 多位牧场主，每一批都能追溯到具体的人。',
                '每头羊驼一年只剪一次毛，就为等到纤维最合适的长度和细度。',
                '独家"5缸6洗净洗工艺"，在去除杂质的同时保留天然柔软性。',
                '物理高温 + 臭氧 + 环氧乙烷专业灭菌，每件产品均达母婴级标准。',
                '这就是您手中的羊驼被——从牧场到卧室，每一步都可追溯、已认证。',
              ] as const)[idx]
              : ([
                'Our fiber comes from 800+ New Zealand farming families — every batch traceable back to a real person.',
                'Each alpaca is sheared just once a year, timed for exactly the right fiber length and fineness.',
                'Our exclusive 5-tank 6-wash process removes impurities while preserving natural softness.',
                'Physical sterilization using heat, ozone and ethylene oxide — meeting maternal-grade standards.',
                'This is the duvet in your hands — traceable and certified, every step from paddock to bedroom.',
              ] as const)[idx];

            const stat = lang === 'zh'
              ? (['800+ 合作牧场', '每年一次', '5缸6洗', '母婴级标准', '深睡提升 25%'] as const)[idx]
              : (['800+ Farms', 'Once a Year', '5-Tank 6-Wash', 'Maternal Grade', '+25% Deep Sleep'] as const)[idx];

            const isLast = idx === STEPS.length - 1;

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, x: -24 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.55, delay: 0.15 + idx * 0.12 }}
                className="flex gap-6 md:gap-10 mb-10 last:mb-0"
              >
                {/* Icon circle — links to the page covering this step */}
                <Link
                  to={link}
                  aria-label={title}
                  className="flex-shrink-0 w-12 h-12 md:w-16 md:h-16 rounded-full border border-pa-gold-lt/40 bg-pa-ivory/5 flex items-center justify-center hover:bg-pa-gold-lt/15 hover:border-pa-gold-lt transition-colors"
                >
                  <Icon className="w-5 h-5 md:w-6 md:h-6 text-pa-gold-lt" />
                </Link>

                {/* Content */}
                <div className="flex-1 pt-3 md:pt-4">
                  <div className="flex flex-col sm:flex-row gap-5">
                    <img
                      src={image}
                      alt={title}
                      className="w-full sm:w-28 md:w-32 h-28 md:h-32 object-cover rounded-sm flex-shrink-0 order-first sm:order-last"
                      loading="lazy"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h3 className="font-display text-lg md:text-xl text-pa-ivory">{title}</h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-pa-gold-lt/15 text-pa-gold-lt text-[10px] tracking-wider font-body uppercase">
                          {stat}
                        </span>
                      </div>
                      <p className="font-body text-sm text-pa-ivory/60 leading-relaxed">{desc}</p>
                    </div>
                  </div>

                  {/* Arrow connector — only between steps */}
                  {!isLast && (
                    <div className="flex items-center gap-1 mt-4 text-pa-ivory/20 md:hidden">
                      <div className="flex-1 h-px bg-pa-ivory/10" />
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="text-center mt-16"
        >
          <Link
            to="/traceability"
            className="inline-flex items-center gap-2 px-8 py-3.5 border border-pa-gold-lt/60 text-pa-gold-lt font-body text-sm tracking-widest uppercase hover:bg-pa-gold-lt/10 transition-colors"
          >
            {lang === 'zh' ? '追溯您的产品' : 'Trace Your Product'}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

      </div>
    </section>
  );
};

export default FarmStorySection;
