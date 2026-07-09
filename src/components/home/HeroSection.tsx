import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import heroImg from '@/assets/hero-comforter.jpg';

const HeroSection = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoFailed, setVideoFailed] = useState(false);

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Video background — auto-degrades to static image if video fails to load */}
      {!videoFailed ? (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          poster="/images/hero-comforter.jpg"
          onError={() => setVideoFailed(true)}
        >
          <source src="/videos/promo.mp4" type="video/mp4" />
        </video>
      ) : (
        <img
          src={heroImg}
          alt="Pacific Alpaca Luxury Duvet"
          className="absolute inset-0 w-full h-full object-cover"
          fetchPriority="high"
          width={1920}
          height={1080}
        />
      )}
      <div className="absolute inset-0 hero-overlay" />

      {/* 消博会1号参展商 corner badge */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.5 }}
        className="absolute top-24 right-6 z-20 bg-red-600 text-white text-[10px] font-body px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg"
      >
        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
        {lang === 'zh' ? '消博会1号参展商' : 'CIIE Booth #1'}
      </motion.div>

      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6">
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
          className="flex flex-col sm:flex-row gap-4 items-center"
        >
          <Link
            to="/shop"
            className="inline-block px-10 py-4 bg-navy text-cream font-body text-sm tracking-widest uppercase hover:bg-navy-light transition-colors"
          >
            {t('hero.cta')}
          </Link>
          <Link
            to="/china"
            className="inline-block px-8 py-4 bg-navy/40 backdrop-blur-sm border border-gold text-gold-light font-body text-sm tracking-widest hover:bg-navy/60 transition-colors"
          >
            {lang === 'zh' ? '中文官网入口' : 'Chinese Site'}
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
