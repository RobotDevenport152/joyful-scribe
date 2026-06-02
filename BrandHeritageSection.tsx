import { useTranslation } from 'react-i18next';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

// 品牌手册 P20–P26 图片素材
// public/images/nz-alpaca.jpg        — 牧场羊驼近景
// public/images/alpaca-fiber.jpg     — 纤维原料特写
// public/images/hero-alpacas.jpg     — 牧场航拍/群体图

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

const BrandHeritageSection = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  const stats = [
    { value: '25+', labelZh: '品牌年份', labelEn: 'Years' },
    { value: '900+', labelZh: '合作牧场', labelEn: 'Farms' },
    { value: '93%', labelZh: '新西兰市场份额', labelEn: 'NZ Market Share' },
    { value: '50t+', labelZh: '累计收购纤维', labelEn: 'Fibre Collected' },
  ];

  return (
    <section ref={ref} className="py-20 md:py-32 bg-background">
      <div className="container mx-auto px-6">

        {/* ── 顶部：品牌故事 ── */}
        <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center mb-24">
          {/* 左图：牧场羊驼 */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <img
              src="/images/nz-alpaca.jpg"
              alt="New Zealand Alpaca Farm"
              className="w-full rounded-sm shadow-soft object-cover aspect-[4/3]"
              loading="lazy"
              width={1200}
              height={900}
            />
            {/* 小图叠层：纤维特写 */}
            <div className="absolute -bottom-6 -right-6 w-40 h-40 md:w-48 md:h-48 rounded-sm overflow-hidden border-4 border-background shadow-lg hidden md:block">
              <img
                src="/images/alpaca-fiber.jpg"
                alt="Alpaca Fiber Detail"
                className="w-full h-full object-cover"
                loading="lazy"
                width={400}
                height={400}
              />
            </div>
          </motion.div>

          {/* 右侧：品牌叙事 */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <p className="text-sm tracking-[0.2em] uppercase text-gold mb-3 font-body">
              {lang === 'zh' ? '品牌传承' : 'Our Heritage'}
            </p>
            <h2 className="font-display text-3xl md:text-4xl text-foreground mb-6 leading-tight">
              {lang === 'zh'
                ? '2001年创立 · 新西兰最大羊驼纤维供应商'
                : 'Founded 2001 · NZ\'s Largest Alpaca Fibre Collector'}
            </h2>
            <div className="gold-line w-16 mb-6" />
            <p className="text-muted-foreground leading-relaxed mb-4 font-body">
              {lang === 'zh'
                ? 'Pacific Alpacas 自2001年创立于新西兰奥克兰，历经25年专注于羊驼纤维收购与高端家纺研发，与全国900余家牧场建立稳定合作，覆盖新西兰93%的羊驼纤维产量。'
                : 'Founded in Auckland in 2001, Pacific Alpacas has spent 25 years mastering alpaca fibre collection and luxury bedding. Our network of 900+ farms covers 93% of New Zealand\'s alpaca fibre production.'}
            </p>
            <p className="text-muted-foreground leading-relaxed mb-10 font-body">
              {lang === 'zh'
                ? '从中央奥塔哥的牧场到中国进博会的展台，我们用每一根纤维讲述新西兰的土地故事，让世代相传的奢华触手可及。'
                : 'From the high-country farms of Central Otago to the floors of China\'s top trade expos, every fibre carries a story of the New Zealand land — luxury made to last for generations.'}
            </p>

            {/* 数据统计 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat) => (
                <div key={stat.labelEn} className="text-center">
                  <CountUp end={stat.value} />
                  <p className="text-xs text-muted-foreground mt-1 font-body">
                    {lang === 'zh' ? stat.labelZh : stat.labelEn}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── Cloud of Dreams：毛利艺术家故事 ── */}
        {/* 来源：官网 Store 页 + 品牌手册 P21 Cloud of Dreams 子品牌介绍 */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="bg-card border border-border rounded-sm overflow-hidden"
        >
          <div className="grid md:grid-cols-2 gap-0">
            {/* 左：被子产品图 */}
            <div className="relative aspect-[4/3] md:aspect-auto overflow-hidden">
              <img
                src="/images/product-luxury-duvet.jpg"
                alt="Cloud of Dreams Duvet — Cloud of Dreams Pattern"
                className="w-full h-full object-cover"
                loading="lazy"
                width={800}
                height={600}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/20" />
            </div>

            {/* 右：文字故事 */}
            <div className="p-8 md:p-12 flex flex-col justify-center">
              <p className="text-xs tracking-[0.3em] uppercase text-gold mb-3 font-body">
                {lang === 'zh' ? '设计故事' : 'Design Story'}
              </p>
              <h3 className="font-display text-2xl md:text-3xl text-foreground mb-4">
                Cloud of Dreams
              </h3>
              <div className="gold-line w-12 mb-6" />
              <p className="text-muted-foreground text-sm leading-relaxed mb-4 font-body">
                {lang === 'zh'
                  ? '每一床太平洋羊驼被上都绣有我们注册商标"Cloud of Dreams"图案。该图案由新西兰丰盛湾 Arawan 部落的毛利艺术家 Patricia Erueti 专门设计，融合了毛利传统纹样与当代美学。'
                  : 'Every Pacific Alpacas duvet features our trademarked "Cloud of Dreams" pattern — designed exclusively by Māori artist Patricia Erueti of the Arawan tribe from New Zealand\'s Bay of Plenty, weaving traditional Māori motifs into contemporary design.'}
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed font-body">
                {lang === 'zh'
                  ? '每一次购买，您不只是拥有一件顶级寝具，更是珍藏了一份新西兰文化遗产，世代相传。'
                  : 'Each purchase is not just a luxury bedding item — it\'s a piece of living New Zealand heritage, crafted to be passed down through generations.'}
              </p>

              {/* 认证标记 */}
              <div className="mt-8 flex gap-3 flex-wrap">
                {['NZ Made', 'NZ Grown', 'Māori Design'].map((badge) => (
                  <span
                    key={badge}
                    className="text-xs font-body border border-gold/30 text-gold px-3 py-1 rounded-full"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── 产品图集：棚拍产品展示 ── */}
        {/* 来源：品牌手册图片素材 — 大衣、马甲、围巾系列 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-20"
        >
          <div className="text-center mb-10">
            <p className="text-xs tracking-[0.3em] uppercase text-gold mb-3 font-body">
              {lang === 'zh' ? '产品系列' : 'Product Collection'}
            </p>
            <h3 className="font-display text-2xl md:text-3xl text-foreground">
              {lang === 'zh' ? '从寝具到服饰 · 完整产品线' : 'Bedding to Apparel · Full Range'}
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { src: '/images/product-coat-women.jpg', captionZh: '女款长款大衣', captionEn: 'Women\'s Coat' },
              { src: '/images/product-coat-men.jpg', captionZh: '男款驼色大衣', captionEn: 'Men\'s Coat' },
              { src: '/images/product-vest-x6-front.jpg', captionZh: '羊驼毛马甲', captionEn: 'Alpaca Vest' },
              { src: '/images/product-scarf-maori.jpg', captionZh: '毛利图案围巾', captionEn: 'Māori Scarf' },
            ].map((item, idx) => (
              <motion.div
                key={item.captionEn}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.7 + idx * 0.1 }}
                className="relative group overflow-hidden rounded-sm aspect-[3/4]"
              >
                <img
                  src={item.src}
                  alt={lang === 'zh' ? item.captionZh : item.captionEn}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  width={600}
                  height={800}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <p className="absolute bottom-3 left-3 text-xs font-body text-white tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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
