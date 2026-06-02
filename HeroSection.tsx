import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronDown, Play } from 'lucide-react';
import { useState } from 'react';

// 宣传视频.mp4 (65s, 5MB) — 放在 public/videos/promo.mp4
// 备用封面图 — public/images/hero-comforter.jpg
const VIDEO_SRC = '/videos/promo.mp4';
const POSTER_SRC = '/images/hero-comforter.jpg';

const HeroSection = () => {
  const { t } = useTranslation();
  const [videoError, setVideoError] = useState(false);

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* ── 背景：优先用视频，失败时降级为图片 ── */}
      {!videoError ? (
        <video
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          poster={POSTER_SRC}
          onError={() => setVideoError(true)}
          aria-hidden="true"
        >
          <source src={VIDEO_SRC} type="video/mp4" />
        </video>
      ) : (
        <img
          src={POSTER_SRC}
          alt="Pacific Alpaca Luxury Duvet"
          className="absolute inset-0 w-full h-full object-cover"
          fetchPriority="high"
          width={1920}
          height={1080}
        />
      )}

      {/* ── 渐变遮罩：底部更深，保持文字可读 ── */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/70" />

      {/* ── 左下角：视频播放标识 ── */}
      {!videoError && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-24 left-8 flex items-center gap-2 text-white/50 z-10"
        >
          <Play className="w-3 h-3 fill-current" />
          <span className="text-xs font-body tracking-widest uppercase">
            New Zealand Alpaca Farms
          </span>
        </motion.div>
      )}

      {/* ── 主内容 ── */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6">
        {/* 消博会"1号参展商"徽章 — 最新动态，2025年7月 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-6 inline-flex items-center gap-2 border border-pa-gold/40 px-4 py-1.5 rounded-full"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-pa-gold animate-pulse" />
          <span className="text-xs font-body text-pa-gold tracking-widest uppercase">
            第六届消博会 · 1号参展商
          </span>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="eyebrow text-pa-ivory/80 mb-4"
        >
          {t('hero.subtitle')}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="font-display text-5xl md:text-6xl lg:text-7xl font-light leading-tight text-pa-ivory mb-4"
        >
          {t('hero.title')}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="font-display italic text-lg md:text-xl text-pa-gold-lt mb-10"
        >
          {t('hero.tagline')}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Link
            to="/shop"
            className="inline-block px-10 py-4 bg-pa-green text-pa-ivory font-body text-sm tracking-widest uppercase hover:bg-pa-green-md transition-colors"
          >
            {t('hero.cta')}
          </Link>
          <Link
            to="/china"
            className="inline-block px-10 py-4 border border-pa-gold/50 text-pa-gold font-body text-sm tracking-widest uppercase hover:bg-pa-gold/10 transition-colors"
          >
            中文官网
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="absolute bottom-10 flex flex-col items-center text-pa-ivory/60"
        >
          <span className="text-xs tracking-widest mb-2 font-body">{t('hero.scroll')}</span>
          <ChevronDown className="w-5 h-5 animate-bounce" />
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
