import { useApp } from '@/contexts/AppContext';
import { motion, useInView } from 'framer-motion';
import { lazy, Suspense, useRef } from 'react';
import { Link } from 'react-router-dom';
import { buildMapPoints } from '@/data/growerLocations';

const FarmMap = lazy(() => import('@/components/growers/FarmMap'));

export default function GrowerNetworkSection() {
  const { locale } = useApp();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="py-24 bg-primary text-primary-foreground overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <span className="text-gold text-xs tracking-[0.3em] uppercase font-body">
            {locale === 'zh' ? '全球供应网络' : 'Global Supply Network'}
          </span>
          <h2 className="font-display text-3xl md:text-5xl mt-4">
            {locale === 'zh' ? '来自新西兰 800 家牧场的承诺' : 'A Promise from 800 NZ Farms'}
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Real collection-point / farm-visit map (shared with /growers-info) */}
          <div>
            <Suspense fallback={
              <div className="h-[420px] rounded-lg border border-primary-foreground/10 bg-primary-foreground/5 flex items-center justify-center font-body text-sm text-primary-foreground/60">
                {locale === 'zh' ? '地图加载中…' : 'Loading map…'}
              </div>
            }>
              <FarmMap locale={locale} points={buildMapPoints(locale)} />
            </Suspense>
          </div>

          {/* Stats & CTA */}
          <div>
            <div className="grid grid-cols-2 gap-6 mb-8">
              {[
                { value: '800+', labelZh: '合作养殖户', labelEn: 'Partner Farms' },
                { value: '25', labelZh: '年深耕历史', labelEn: 'Years of Heritage' },
                { value: '100+', labelZh: '吨原料掌控', labelEn: 'Tonnes Controlled' },
                { value: '70%', labelZh: '新西兰市占率', labelEn: 'NZ Market Share' },
              ].map((stat, idx) => (
                <motion.div
                  key={stat.value}
                  initial={{ opacity: 0, y: 20 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                  className="text-center"
                >
                  <p className="font-display text-3xl font-semibold text-gold">{stat.value}</p>
                  <p className="text-primary-foreground/60 font-body text-sm mt-1">
                    {locale === 'zh' ? stat.labelZh : stat.labelEn}
                  </p>
                </motion.div>
              ))}
            </div>
            <p className="text-primary-foreground/60 font-body text-sm leading-relaxed mb-6">
              {locale === 'zh'
                ? '每一批纤维均可追溯到具体农场。从北地到南地，遍布全新西兰的800+牧场网络是我们最坚实的护城河。'
                : 'Every fiber batch is traceable to its specific farm. Our network of 800+ farms across all of New Zealand is our deepest competitive moat.'}
            </p>
            <Link to="/traceability" className="inline-block px-6 py-3 border border-gold/40 text-gold hover:bg-gold/10 rounded-sm font-body text-sm tracking-wider transition-colors">
              {locale === 'zh' ? '查询溯源' : 'Trace Your Fiber'}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
