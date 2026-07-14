import { useTranslation } from 'react-i18next';
import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { ShieldCheck, Leaf, Award, Tv, Star, Store, MapPin, Radio, Crown } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import type { LucideIcon } from 'lucide-react';

interface Badge {
  icon: LucideIcon;
  titleZh: string;
  titleEn: string;
  detailZh: string;
  detailEn: string;
  color: string;
  isNew: boolean;
  image?: string;
}

const BADGES: Badge[] = [
  {
    icon: Leaf,
    titleZh: '银蕨认证',
    titleEn: 'FernMark',
    detailZh: '新西兰政府银蕨认证 NZFM101008\n经过新西兰政府严苛审核通过',
    detailEn: 'NZ Government FernMark NZFM101008\nPassed rigorous NZ government review',
    color: 'text-emerald-400',
    isNew: false,
    image: '/images/cert-fernmark.jpg',
  },
  {
    icon: ShieldCheck,
    titleZh: 'NZ Made',
    titleEn: 'NZ Made',
    detailZh: 'NZ Made & Grown 认证\n证书号 803724，100%新西兰制造',
    detailEn: 'NZ Made & Grown Certification\nLicence #803724, 100% Made in NZ',
    color: 'text-green-400',
    isNew: false,
    image: '/images/cert-nz-made.jpg',
  },
  {
    icon: Star,
    titleZh: '胡润至尚优品 2023',
    titleEn: 'Hurun Best of Best 2023',
    detailZh: '第十九届2023胡润至尚优品金奖\n"软装家居"新秀奖',
    detailEn: '19th Hurun Best of the Best 2023 Gold Award\n"Soft Furnishing" New Arrival Award',
    color: 'text-yellow-400',
    isNew: false,
    image: '/images/cert-hurun-2023.jpg',
  },
  {
    icon: Award,
    titleZh: '国际羊驼协会',
    titleEn: 'IAA Member',
    detailZh: '国际羊驼协会成员 Cert. 02-041\n新西兰唯一企业成员',
    detailEn: 'International Alpaca Association Cert. 02-041\nOnly NZ corporate member',
    color: 'text-amber-400',
    isNew: false,
    image: '/images/cert-iaa-alpaca-mark.jpg',
  },
  {
    icon: Tv,
    titleZh: 'CCTV 报道',
    titleEn: 'CCTV Coverage',
    detailZh: '央视 CCTV13 专题报道\n30+主流媒体广泛关注',
    detailEn: 'Featured on CCTV13\nCovered by 30+ mainstream media',
    color: 'text-red-400',
    isNew: false,
    image: '/images/media-cctv13-still.jpg',
  },
  {
    icon: Store,
    titleZh: '消博会1号参展商',
    titleEn: 'CIIE Booth #1',
    detailZh: '2025–2026年海南消费品博览会\n1号展位，连续6届参展\n2026年羊驼顶垫全球首发',
    detailEn: 'Hainan CIIE 2025–2026\nBooth #1, 6 consecutive shows\nGlobal launch of 2026 Alpaca Topper',
    color: 'text-red-500',
    isNew: true,
    image: '/images/media-ciie-still.jpg',
  },
  {
    icon: MapPin,
    titleZh: '三亚免税店',
    titleEn: 'Sanya Duty-Free',
    detailZh: '太平洋羊驼正式入驻三亚国际免税城\n首个进入国际免税渠道的新西兰羊驼品牌',
    detailEn: 'Now available at Sanya International Duty-Free City\nFirst NZ alpaca fiber brand in duty-free retail',
    color: 'text-pink-400',
    isNew: true,
  },
  {
    icon: Crown,
    titleZh: 'Miss Rotorua 代言',
    titleEn: 'Miss Rotorua Ambassador',
    detailZh: 'Miss Rotorua 佩戴太平洋羊驼系列产品\n出席品牌推广活动',
    detailEn: 'Miss Rotorua wore and endorsed Pacific Alpacas\nproducts at a brand promotional event',
    color: 'text-rose-300',
    isNew: true,
    image: '/images/endorsement-miss-rotorua.jpg',
  },
  {
    icon: Radio,
    titleZh: '电台专访',
    titleEn: 'Radio Feature',
    detailZh: 'Te Arawa FM（iHeartRadio）\n品牌故事电台专访',
    detailEn: 'Featured interview on Te Arawa FM (iHeartRadio)\nsharing the Pacific Alpacas brand story',
    color: 'text-sky-400',
    isNew: true,
    image: '/images/endorsement-radio-te-arawa-fm.jpg',
  },
  {
    icon: Crown,
    titleZh: 'Miss National Worldwide 代言',
    titleEn: 'Miss National Worldwide Ambassador',
    detailZh: 'Miss National Worldwide 2020-22 People Choice\n获奖者佩戴太平洋羊驼系列产品',
    detailEn: 'Miss National Worldwide 2020-22 People Choice\nwore and endorsed Pacific Alpacas products',
    color: 'text-violet-300',
    isNew: true,
    image: '/images/endorsement-miss-national-worldwide.jpg',
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
        <p className="text-center text-[11px] tracking-[0.3em] uppercase text-primary-foreground/50 font-body mb-5">
          {lang === 'zh' ? '官方认证 · 权威背书 · 点击查看详情' : 'Certified & Recognized — Tap Any Badge for Details'}
        </p>
        <div className="flex items-center gap-6 md:gap-10 overflow-x-auto pb-2 md:justify-center scrollbar-hide">
          {BADGES.map((badge, idx) => {
            const Icon = badge.icon;
            return (
              <motion.button
                key={badge.titleEn}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: idx * 0.1 }}
                onClick={() => setSelected(idx)}
                className="relative flex flex-col items-center gap-2 min-w-[100px] flex-shrink-0 group cursor-pointer"
              >
                {/* Red pulsing dot for new badges */}
                {badge.isNew && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full">
                    <span className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75" />
                  </span>
                )}
                <Icon className={`w-8 h-8 ${badge.color} group-hover:scale-110 transition-transform`} />
                <span className="text-xs font-body text-primary-foreground/80 text-center whitespace-nowrap">
                  {lang === 'zh' ? badge.titleZh : badge.titleEn}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      <Dialog open={selected !== null} onOpenChange={() => setSelected(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogTitle className="font-display text-lg">
            {selected !== null && (lang === 'zh' ? BADGES[selected].titleZh : BADGES[selected].titleEn)}
          </DialogTitle>
          {selected !== null && (
            <div className="py-4">
              <div className="flex justify-center mb-4 relative">
                {BADGES[selected].image ? (
                  <img
                    src={BADGES[selected].image}
                    alt={lang === 'zh' ? BADGES[selected].titleZh : BADGES[selected].titleEn}
                    className="max-h-48 rounded-sm shadow-soft object-contain"
                  />
                ) : (
                  (() => {
                    const Icon = BADGES[selected].icon;
                    return <Icon className={`w-16 h-16 ${BADGES[selected].color}`} />;
                  })()
                )}
                {BADGES[selected].isNew && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-body px-1.5 py-0.5 rounded-full">
                    NEW
                  </span>
                )}
              </div>
              <p className="text-sm font-body text-foreground whitespace-pre-line text-center">
                {lang === 'zh' ? BADGES[selected].detailZh : BADGES[selected].detailEn}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default AuthorityBanner;
