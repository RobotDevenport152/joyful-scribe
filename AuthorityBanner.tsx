import { useTranslation } from 'react-i18next';
import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { ShieldCheck, Leaf, Award, Tv, Star, Store, Medal } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

// 新增：消博会1号参展商 + 三亚免税店（2025–2026最新动态）
const BADGES = [
  {
    icon: Medal,
    titleZh: '消博会1号参展商',
    titleEn: 'CIIE #1 Exhibitor',
    detailZh: '第六届中国国际消费品博览会首个签约参展品牌\n连续六年参展，2025年7月率先签约',
    detailEn: 'First brand to sign for the 6th China CIIE\nConsecutive 6-year exhibitor, signed July 2025',
    color: 'text-red-400',
    highlight: true, // 新动态，高亮显示
  },
  {
    icon: Store,
    titleZh: '三亚免税店',
    titleEn: 'Sanya Duty-Free',
    detailZh: '第五届消博会期间正式进驻三亚免税店\n中国高端消费市场重要里程碑',
    detailEn: 'Officially entered Sanya duty-free stores during the 5th CIIE\nA milestone for the Chinese luxury consumer market',
    color: 'text-cyan-400',
    highlight: true,
  },
  {
    icon: Star,
    titleZh: '胡润至尚优品 2023',
    titleEn: 'Hurun Best of Best 2023',
    detailZh: '第十九届2023胡润至尚优品金奖\n"软装家居"新秀奖',
    detailEn: '19th Hurun Best of the Best 2023 Gold Award\n"Soft Furnishing" New Arrival Award',
    color: 'text-yellow-400',
    highlight: false,
  },
  {
    icon: Tv,
    titleZh: 'CCTV 报道',
    titleEn: 'CCTV Coverage',
    detailZh: '央视 CCTV13 专题报道\n30+ 主流媒体广泛关注，网络传播量破千万',
    detailEn: 'Featured on CCTV13\nCovered by 30+ mainstream media, 10M+ online impressions',
    color: 'text-red-400',
    highlight: false,
  },
  {
    icon: Leaf,
    titleZh: '银蕨认证',
    titleEn: 'FernMark',
    detailZh: '新西兰政府银蕨认证 NZFM101008\n经过新西兰政府严苛审核通过',
    detailEn: 'NZ Government FernMark NZFM101008\nPassed rigorous NZ government review',
    color: 'text-emerald-400',
    highlight: false,
  },
  {
    icon: ShieldCheck,
    titleZh: 'NZ Made',
    titleEn: 'NZ Made',
    detailZh: 'NZ Made & Grown 认证\n证书号 803724，100% 新西兰制造',
    detailEn: 'NZ Made & Grown Certification\nLicence #803724, 100% Made in NZ',
    color: 'text-green-400',
    highlight: false,
  },
  {
    icon: Award,
    titleZh: '国际羊驼协会',
    titleEn: 'IAA Member',
    detailZh: '国际羊驼协会成员 Cert. 02-041\n新西兰唯一企业成员',
    detailEn: 'International Alpaca Association Cert. 02-041\nOnly NZ corporate member',
    color: 'text-amber-400',
    highlight: false,
  },
];

const AuthorityBanner = () => {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <section ref={ref} className="bg-foreground py-8 overflow-hidden">
      <div className="container mx-auto px-4">
        {/* 最新动态标签 */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-4"
        >
          <span className="inline-flex items-center gap-1.5 text-xs font-body tracking-widest uppercase text-primary-foreground/40">
            <span className="w-1 h-1 rounded-full bg-red-400 animate-pulse" />
            {lang === 'zh' ? '最新动态' : 'Latest Updates'}
          </span>
        </motion.div>

        <div className="flex items-center gap-6 md:gap-10 overflow-x-auto pb-2 md:justify-center scrollbar-hide">
          {BADGES.map((badge, idx) => {
            const Icon = badge.icon;
            return (
              <motion.button
                key={badge.titleEn}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: idx * 0.08 }}
                onClick={() => setSelected(idx)}
                className="flex flex-col items-center gap-2 min-w-[90px] flex-shrink-0 group cursor-pointer relative"
              >
                {/* 新动态高亮圆点 */}
                {badge.highlight && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-400" />
                )}
                <Icon
                  className={`w-7 h-7 ${badge.color} group-hover:scale-110 transition-transform`}
                />
                <span className="text-xs font-body text-primary-foreground/80 text-center whitespace-nowrap">
                  {lang === 'zh' ? badge.titleZh : badge.titleEn}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* 详情弹窗 */}
      <Dialog open={selected !== null} onOpenChange={() => setSelected(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogTitle className="font-display text-lg">
            {selected !== null &&
              (lang === 'zh' ? BADGES[selected].titleZh : BADGES[selected].titleEn)}
          </DialogTitle>
          {selected !== null && (
            <div className="py-4">
              <div className="flex justify-center mb-4">
                {(() => {
                  const Icon = BADGES[selected].icon;
                  return (
                    <Icon className={`w-16 h-16 ${BADGES[selected].color}`} />
                  );
                })()}
              </div>
              <p className="text-sm font-body text-foreground whitespace-pre-line text-center leading-relaxed">
                {lang === 'zh'
                  ? BADGES[selected].detailZh
                  : BADGES[selected].detailEn}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default AuthorityBanner;
