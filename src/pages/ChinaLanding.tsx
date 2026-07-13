import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import {
  Trophy, Tv, Leaf, PawPrint, Thermometer, Feather, Droplets, Bug, Zap,
  MessageCircle, ShieldCheck, Store, MapPin, Crown,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const AUTHORITY = [
  { icon: Trophy, title: '胡润至尚优品2023金奖', desc: '第十九届"软装家居"新秀奖' },
  { icon: Tv, title: '央视CCTV13专题报道', desc: '30+主流媒体关注' },
  { icon: Leaf, title: '新西兰政府银蕨认证', desc: 'NZFM101008' },
  { icon: PawPrint, title: '国际羊驼协会唯一企业成员', desc: 'Cert. 02-041' },
  {
    icon: Store,
    title: '消博会1号参展商',
    desc: '连续6届 · 2026羊驼顶垫全球首发',
    isNew: true,
  },
  {
    icon: MapPin,
    title: '三亚国际免税城入驻',
    desc: '首个NZ羊驼品牌进入免税渠道',
    isNew: true,
  },
  {
    icon: Crown,
    title: 'Miss新西兰代言',
    desc: '新西兰小姐官方指定寝具品牌',
    isNew: true,
  },
];

const WHY_ALPACA = [
  { icon: Thermometer, title: '保暖', value: '3倍于羊毛' },
  { icon: Feather, title: '轻盈', value: '仅羊毛被重量30%' },
  { icon: Droplets, title: '排潮', value: '可吸收35%水蒸气' },
  { icon: Bug, title: '抑螨', value: '趋避率64.37%（实验数据）' },
  { icon: Zap, title: '阻电', value: '天然抗静电，不吸灰尘' },
];

const PRODUCTS = [
  {
    img: '/images/product-duvet-giftbox.jpg',
    nameZh: '轻奢款羊驼被',
    nameEn: 'Luxury Alpaca Duvet',
    priceZh: '¥5,880 起',
    tag: null,
    slug: 'duvet-luxury',
  },
  {
    img: '/images/product-duvet-rolled.jpg',
    nameZh: '经典款羊驼被',
    nameEn: 'Classic Alpaca Duvet',
    priceZh: '¥2,880 起',
    tag: null,
    slug: 'duvet-classic',
  },
  {
    img: '/images/product-coat-women.jpg',
    nameZh: '云梦羊驼大衣',
    nameEn: 'Cloud of Dreams Coat',
    priceZh: '¥5,980 起',
    tag: null,
    slug: 'coat-classic',
  },
  {
    img: '/images/product-duvet-bed-lifestyle.jpg',
    nameZh: '羊驼顶垫',
    nameEn: 'Alpaca Topper',
    priceZh: '即将发售',
    tag: '2026新品·全球首发',
    slug: null,
  },
];

export default function ChinaLandingPage() {
  const copyWechat = () => {
    navigator.clipboard.writeText('pacificalpacas');
    toast.success('微信号已复制！');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* Hero */}
      <section className="pt-24 pb-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
            <p className="text-xs tracking-[0.3em] uppercase text-gold font-body mb-4">太平洋羊驼 · 中国官方旗舰</p>
            <h1 className="font-display text-4xl md:text-6xl mb-4 leading-tight">
              新西兰顶级羊驼被 · 官方旗舰
            </h1>
            <p className="font-body text-primary-foreground/70 text-lg mb-8">
              太平洋羊驼 — 新西兰最大羊驼纤维供应商，25年品牌积淀
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/shop"
                className="px-10 py-4 bg-accent text-accent-foreground font-body font-semibold rounded-sm tracking-wider hover:bg-accent/90 transition">
                立即选购
              </Link>
              <button onClick={copyWechat}
                className="px-10 py-4 border border-gold/40 text-gold font-body rounded-sm tracking-wider hover:bg-gold/10 transition">
                联系微信客服
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Authority Signals */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-6">
          <p className="text-xs tracking-[0.3em] uppercase text-gold font-body text-center mb-8">品牌背书</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {AUTHORITY.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`relative bg-card rounded-lg border p-6 text-center hover:border-gold/30 transition-colors ${
                  item.isNew ? 'border-red-400/40' : 'border-border'
                }`}
              >
                {item.isNew && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-body px-2 py-0.5 rounded-full">
                    新
                  </span>
                )}
                <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-3">
                  <item.icon className="w-6 h-6 text-gold" />
                </div>
                <h3 className="font-display text-sm font-semibold mb-1">{item.title}</h3>
                <p className="text-xs text-muted-foreground font-body">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Products — real studio shots + 2026 new product */}
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-6">
          <p className="text-xs tracking-[0.3em] uppercase text-gold font-body text-center mb-3">精选系列</p>
          <h2 className="font-display text-3xl text-center mb-10">我们的产品</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {PRODUCTS.map((p, i) => (
              <motion.div
                key={p.nameZh}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group bg-card rounded-lg border border-border overflow-hidden hover:border-gold/30 hover:shadow-lg transition-all"
              >
                <div className="relative aspect-[3/4] overflow-hidden">
                  <img
                    src={p.img}
                    alt={p.nameZh}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  {p.tag && (
                    <span className="absolute top-2 left-2 bg-red-600 text-white text-[9px] font-body px-2 py-1 rounded-full leading-tight">
                      {p.tag}
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-display text-sm font-semibold mb-1">{p.nameZh}</h3>
                  <p className="text-gold font-display text-sm mb-3">{p.priceZh}</p>
                  {p.slug ? (
                    <Link
                      to={`/shop`}
                      className="block text-center text-xs font-body border border-gold/40 text-gold px-3 py-1.5 rounded hover:bg-gold hover:text-white transition"
                    >
                      查看详情
                    </Link>
                  ) : (
                    <button
                      onClick={() => toast.info('2026新品即将发售，敬请期待！')}
                      className="w-full text-xs font-body border border-red-400/40 text-red-500 px-3 py-1.5 rounded hover:bg-red-50 transition"
                    >
                      预约通知
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Alpaca + science data */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-6">
          <h2 className="font-display text-3xl text-center mb-10">为什么选择羊驼纤维</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 max-w-4xl mx-auto mb-10">
            {WHY_ALPACA.map((item, i) => (
              <motion.div key={item.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className="text-center">
                <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-3">
                  <item.icon className="w-7 h-7 text-gold" />
                </div>
                <h3 className="font-display text-sm font-semibold mb-1">{item.title}</h3>
                <p className="text-xs text-primary-foreground/60 font-body">{item.value}</p>
              </motion.div>
            ))}
          </div>
          {/* Science data bar */}
          <div className="grid grid-cols-3 gap-6 max-w-xl mx-auto text-center border-t border-primary-foreground/10 pt-8">
            {[
              { value: '64.37%', label: '螨虫趋避率（实验室数据）' },
              { value: '3×', label: '保暖性优于羊毛' },
              { value: '35%', label: '水蒸气吸收率' },
            ].map(d => (
              <div key={d.label}>
                <p className="font-display text-2xl md:text-3xl font-semibold text-gold">{d.value}</p>
                <p className="text-xs text-primary-foreground/60 font-body mt-1">{d.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cloud of Dreams — Māori designer story */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-xs tracking-[0.3em] uppercase text-gold font-body mb-3">独家文化设计</p>
              <h2 className="font-display text-2xl md:text-3xl mb-4">Cloud of Dreams · 云之梦</h2>
              <div className="w-12 h-px bg-gold mb-5" />
              <p className="font-body text-muted-foreground text-sm leading-relaxed mb-4">
                每一床太平洋羊驼被上都绣有注册商标"云之梦"图案——由新西兰丰盛湾 Arawan 部落毛利艺术家 Patricia Erueti 专为 Pacific Alpacas 独家设计。
              </p>
              <p className="font-body text-muted-foreground text-sm leading-relaxed">
                购买太平洋羊驼被，不仅是拥有顶级品质寝具，更是将一件新西兰毛利文化遗产带回家中。图案受版权保护，全球唯一。
              </p>
            </div>
            <div className="relative">
              <img
                src="/images/product-duvet-texture.jpg"
                alt="Cloud of Dreams 图案"
                className="w-full rounded-sm shadow-lg"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Traceability */}
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-6 text-center max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <ShieldCheck className="w-12 h-12 text-gold mx-auto mb-4" />
            <h2 className="font-display text-3xl mb-4">每一床被子都有溯源码</h2>
            <p className="font-body text-muted-foreground text-sm leading-relaxed mb-6">
              扫描产品上的溯源码，即可查看您的羊驼被来自哪个牧场、哪批次纤维、经过怎样的加工流程。透明可追溯，是我们对品质的承诺。
            </p>
            <Link to="/traceability"
              className="inline-block px-8 py-3 bg-accent text-accent-foreground font-body rounded-sm hover:bg-accent/90 transition">
              查看溯源示例
            </Link>
          </motion.div>
        </div>
      </section>

      {/* WeChat Contact */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-6 text-center max-w-lg">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <MessageCircle className="w-16 h-16 text-gold mx-auto mb-4" />
            <h2 className="font-display text-2xl mb-2">微信客服</h2>
            <p className="font-body text-lg font-semibold mb-2">pacificalpacas</p>
            <p className="font-body text-sm text-primary-foreground/60 mb-6">
              添加微信，享专属中文服务、报价咨询及优先发货
            </p>
            <button onClick={copyWechat}
              className="px-10 py-4 bg-accent text-accent-foreground font-body font-semibold rounded-sm tracking-wider hover:bg-accent/90 transition">
              复制微信号
            </button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
