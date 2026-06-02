import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import {
  Trophy, Tv, Leaf, PawPrint, Thermometer, Feather,
  Droplets, Bug, Zap, Store, Medal, ShieldCheck, Star
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

// ── 权威背书（按信任层级排序）──
const AUTHORITY = [
  {
    icon: Medal,
    title: '消博会1号参展商',
    desc: '第六届消博会首个签约品牌 · 连续六年',
    highlight: true,
  },
  {
    icon: Store,
    title: '三亚免税店正式入驻',
    desc: '第五届消博会达成 · 中国高端渠道落地',
    highlight: true,
  },
  {
    icon: Trophy,
    title: '胡润至尚优品2023金奖',
    desc: '第十九届"软装家居"新秀奖',
    highlight: false,
  },
  {
    icon: Tv,
    title: '央视CCTV13专题报道',
    desc: '30+主流媒体关注 · 传播量破千万',
    highlight: false,
  },
  {
    icon: Leaf,
    title: '新西兰银蕨认证',
    desc: 'NZFM101008 · 政府最高品质认证',
    highlight: false,
  },
  {
    icon: PawPrint,
    title: '国际羊驼协会成员',
    desc: 'Cert. 02-041 · 新西兰唯一企业成员',
    highlight: false,
  },
  {
    icon: ShieldCheck,
    title: 'NZ Made & Grown',
    desc: '证书号 803724 · 100%新西兰制造',
    highlight: false,
  },
  {
    icon: Star,
    title: 'Miss 新西兰代言',
    desc: '新西兰形象大使官方代言品牌',
    highlight: false,
  },
];

// ── 羊驼纤维五大科学数据（来自品牌手册 P8–P9）──
const WHY_ALPACA = [
  { icon: Thermometer, title: '保暖', value: '3倍于羊毛', detail: '恒温体感 32–34°C' },
  { icon: Feather,     title: '轻盈', value: '仅羊毛重30%', detail: '含气率高出羽绒25%' },
  { icon: Droplets,    title: '排潮', value: '吸收35%水蒸气', detail: '天然排湿不闷热' },
  { icon: Bug,         title: '抑螨', value: '趋避率64.37%', detail: '实验室认证数据' },
  { icon: Zap,         title: '阻电', value: '天然抗静电', detail: '不吸尘 · 不起球' },
];

// ── 产品系列（2026最新，含羊驼顶垫新品）──
const PRODUCTS = [
  {
    img: '/images/product-luxury-duvet.jpg',
    name: 'Cloud of Dreams 奢华系列',
    tag: '明星产品',
    price: '¥ 2,680 起',
  },
  {
    img: '/images/product-classic-duvet.jpg',
    name: 'DEEP SLEEP 深睡系列',
    tag: '畅销爆款',
    price: '¥ 1,280 起',
  },
  {
    img: '/images/product-coat-women.jpg',
    name: '羊驼毛大衣',
    tag: '服饰系列',
    price: '¥ 3,800 起',
  },
  {
    img: '/images/product-premium-duvet.jpg',
    name: '羊驼顶垫',
    tag: '2026新品 · 全球首发',
    price: '咨询客服',
    isNew: true,
  },
];

export default function ChinaLandingPage() {
  const copyWechat = () => {
    navigator.clipboard.writeText('pacificalpacas');
    toast.success('微信号已复制！添加客服即可咨询或订购。');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── Hero ── */}
      <section className="pt-24 pb-20 bg-primary text-primary-foreground relative overflow-hidden">
        {/* 背景产品图 */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'url(/images/hero-comforter.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="container mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto"
          >
            {/* 最新动态标签 */}
            <div className="inline-flex items-center gap-2 border border-gold/30 px-4 py-1.5 rounded-full mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
              <span className="text-xs font-body text-gold tracking-widest">
                第六届消博会 1号参展商 · 三亚免税店正式入驻
              </span>
            </div>

            <h1 className="font-display text-4xl md:text-6xl mb-4 leading-tight">
              新西兰顶级羊驼被 · 官方旗舰
            </h1>
            <p className="font-body text-primary-foreground/70 text-lg mb-8">
              太平洋羊驼 — 新西兰最大羊驼纤维供应商，25年品牌积淀
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/shop"
                className="px-10 py-4 bg-accent text-accent-foreground font-body font-semibold rounded-sm tracking-wider hover:bg-accent/90 transition"
              >
                立即选购
              </Link>
              <button
                onClick={copyWechat}
                className="px-10 py-4 border border-gold/40 text-gold font-body rounded-sm tracking-wider hover:bg-gold/10 transition"
              >
                📱 复制微信号咨询
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── 权威背书 ── */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-10">
            <p className="text-xs tracking-[0.3em] uppercase text-gold font-body mb-2">
              权威认证 · 媒体背书
            </p>
            <h2 className="font-display text-2xl text-foreground">
              多重权威认证，品质有据可查
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {AUTHORITY.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className={`bg-card rounded-lg border p-5 text-center hover:border-gold/30 transition-colors relative ${
                  item.highlight ? 'border-accent/40 ring-1 ring-accent/20' : 'border-border'
                }`}
              >
                {item.highlight && (
                  <span className="absolute -top-2 -right-2 text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-full font-body">
                    新
                  </span>
                )}
                <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-3">
                  <item.icon className="w-5 h-5 text-gold" />
                </div>
                <h3 className="font-display text-sm font-semibold mb-1 text-foreground">
                  {item.title}
                </h3>
                <p className="text-xs font-body text-muted-foreground leading-tight">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 科学数据：为什么选羊驼被 ── */}
      <section className="py-16 bg-secondary/40">
        <div className="container mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="font-display text-2xl md:text-3xl text-foreground mb-2">
              不是营销语言，是实验室数据
            </h2>
            <p className="text-sm font-body text-muted-foreground">
              以下数据来自新西兰权威检测机构，经国际羊驼协会认证
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-4xl mx-auto">
            {WHY_ALPACA.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.08 }}
                className="bg-card rounded-lg border border-border p-5 text-center hover:border-gold/30 transition-colors"
              >
                <item.icon className="w-7 h-7 text-gold mx-auto mb-3" />
                <p className="font-display text-lg font-bold text-gold mb-1">{item.value}</p>
                <p className="text-sm font-body text-foreground mb-1">{item.title}</p>
                <p className="text-xs font-body text-muted-foreground">{item.detail}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 产品系列（含2026新品）── */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-10">
            <p className="text-xs tracking-[0.3em] uppercase text-gold font-body mb-2">
              精选产品
            </p>
            <h2 className="font-display text-2xl md:text-3xl text-foreground">
              明星产品 · 2026新品上市
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {PRODUCTS.map((p, i) => (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group relative bg-card border border-border rounded-sm overflow-hidden hover:border-gold/30 transition-colors"
              >
                {/* 新品标签 */}
                {p.isNew && (
                  <div className="absolute top-2 left-2 z-10 bg-accent text-accent-foreground text-xs font-body px-2 py-1 rounded-sm">
                    {p.tag}
                  </div>
                )}
                <div className="aspect-square overflow-hidden">
                  <img
                    src={p.img}
                    alt={p.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    width={400}
                    height={400}
                  />
                </div>
                <div className="p-4">
                  {!p.isNew && (
                    <span className="text-xs font-body text-accent tracking-wider">{p.tag}</span>
                  )}
                  <h3 className="font-display text-sm text-foreground mt-1 mb-2">{p.name}</h3>
                  <p className="text-sm font-body font-semibold text-gold">{p.price}</p>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              to="/shop"
              className="inline-block px-10 py-4 bg-primary text-primary-foreground font-body text-sm tracking-widest uppercase hover:bg-primary/90 transition"
            >
              查看全部产品
            </Link>
          </div>
        </div>
      </section>

      {/* ── Cloud of Dreams 设计故事 ── */}
      <section className="py-16 bg-card border-t border-border">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-10 items-center max-w-4xl mx-auto">
            <div>
              <img
                src="/images/product-luxury-duvet.jpg"
                alt="Cloud of Dreams — Maori Design"
                className="w-full rounded-sm shadow-soft"
                loading="lazy"
                width={800}
                height={600}
              />
            </div>
            <div>
              <p className="text-xs tracking-[0.3em] uppercase text-gold font-body mb-3">
                文化传承
              </p>
              <h3 className="font-display text-2xl text-foreground mb-4">
                Cloud of Dreams · 毛利艺术家专属设计
              </h3>
              <div className="gold-line w-12 mb-6" />
              <p className="text-sm font-body text-muted-foreground leading-relaxed mb-4">
                每一床太平洋羊驼被上都绣有注册商标"Cloud of Dreams"图案，
                由新西兰丰盛湾 Arawan 部落毛利艺术家 Patricia Erueti 专属设计，
                融合毛利传统纹样与现代美学。
              </p>
              <p className="text-sm font-body text-muted-foreground leading-relaxed">
                每次购买，不只是一件寝具，更是一份可以世代珍藏的新西兰文化遗产。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 底部联系 ── */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-6 text-center">
          <h2 className="font-display text-2xl md:text-3xl mb-4">
            立即咨询 · 专属服务
          </h2>
          <p className="font-body text-primary-foreground/70 mb-8 text-sm">
            微信号：pacificalpacas · 全国包邮 · 48小时发货 · 7天无理由退换
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={copyWechat}
              className="px-10 py-4 bg-accent text-accent-foreground font-body font-semibold rounded-sm tracking-wider hover:bg-accent/90 transition"
            >
              复制微信号
            </button>
            <Link
              to="/shop"
              className="px-10 py-4 border border-primary-foreground/30 text-primary-foreground font-body rounded-sm tracking-wider hover:bg-primary-foreground/10 transition"
            >
              进入官网商城
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
