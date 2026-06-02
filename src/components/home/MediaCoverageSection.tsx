import { useTranslation } from 'react-i18next';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const MEDIA = [
  { name: 'CCTV', labelZh: '央视', labelEn: 'CCTV' },
  { name: '新华网', labelZh: '新华网', labelEn: 'Xinhua' },
  { name: '央视国际', labelZh: '央视国际', labelEn: 'CCTV Intl' },
  { name: '胡润百富', labelZh: '胡润百富', labelEn: 'Hurun Report' },
];

const NEWS = [
  {
    titleZh: '2026羊驼顶垫消博会全球首发',
    titleEn: '2026 Alpaca Topper Global Premiere at CIIE',
    summaryZh: '太平洋羊驼携全新"羊驼顶垫"亮相2026年海南消费品博览会，作为1号参展商全球首发，引发高净值消费群体强烈关注。',
    summaryEn: 'Pacific Alpacas unveiled the 2026 Alpaca Topper at the Hainan CIIE as Booth #1 exhibitor, generating strong interest from high-net-worth consumers worldwide.',
    date: '2026',
    isNew: true,
  },
  {
    titleZh: '三亚国际免税城正式入驻 · 消博会1号参展商',
    titleEn: 'Sanya Duty-Free Entry & CIIE Booth #1',
    summaryZh: '太平洋羊驼成为首个进入三亚国际免税渠道的新西兰羊驼品牌，同年在消博会连续六届斩获1号展位，标志品牌进入中国高端零售主流渠道。',
    summaryEn: 'First NZ alpaca brand in Sanya duty-free retail; secured CIIE Booth #1 for the 6th consecutive year, marking entry into China\'s mainstream premium retail channels.',
    date: '2025',
    isNew: true,
  },
  {
    titleZh: '太平洋羊驼获2023胡润至尚优品金奖',
    titleEn: 'Pacific Alpacas Wins 2023 Hurun Best of the Best Gold Award',
    summaryZh: '新西兰Pacific Alpacas品牌斩获"软装家居"新秀奖，与瑞士瑞联、达索猎鹰等品牌同获殊荣。',
    summaryEn: 'Pacific Alpacas won the "Soft Furnishing" New Arrival Award alongside Swiss Re and Dassault Falcon.',
    date: '2023',
    isNew: false,
  },
  {
    titleZh: 'CCTV13专题报道太平洋羊驼品牌',
    titleEn: 'CCTV13 Features Pacific Alpacas Brand',
    summaryZh: '截至2025年，太平洋羊驼已受到30多家主流媒体广泛关注，网络传播量突破千万次。',
    summaryEn: 'By 2025, Pacific Alpacas has been covered by 30+ mainstream media with 10M+ online impressions.',
    date: '2024',
    isNew: false,
  },
  {
    titleZh: '太平洋羊驼成为中国女子橄榄球队官方合作伙伴',
    titleEn: 'Pacific Alpacas Becomes Official Partner of China Women\'s Rugby Team',
    summaryZh: '2024年10月正式成为中国女子橄榄球队官方合作伙伴和指定品牌，研究运动员深度睡眠与恢复。',
    summaryEn: 'Official partner since Oct 2024, researching athletes\' deep sleep and recovery performance.',
    date: '2024',
    isNew: false,
  },
];

const STATS = [
  { valueZh: '30+', labelZh: '主流媒体报道', labelEn: '30+ Media Outlets' },
  { valueZh: '1000万+', labelZh: '累计传播量', labelEn: '10M+ Impressions' },
  { valueZh: '6届', labelZh: '连续参展消博会', labelEn: '6 Consecutive Shows' },
];

const MediaCoverageSection = () => {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="py-20 md:py-28 bg-secondary/50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-12"
        >
          <p className="text-xs tracking-[0.3em] uppercase text-accent mb-4 font-body">
            {lang === 'zh' ? '媒体报道' : 'Media Coverage'}
          </p>
          <h2 className="font-display text-3xl md:text-4xl text-foreground mb-4">
            {lang === 'zh' ? '30+ 主流媒体广泛关注' : '30+ Mainstream Media Coverage'}
          </h2>
          <div className="gold-line w-20 mx-auto" />
        </motion.div>

        {/* Media logos */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-center gap-8 md:gap-16 mb-16 flex-wrap"
        >
          {MEDIA.map((m, idx) => (
            <motion.div
              key={m.name}
              initial={{ opacity: 0, y: 10 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3 + idx * 0.1 }}
              className="text-center"
            >
              <span className="font-display text-xl md:text-2xl text-foreground/60">
                {lang === 'zh' ? m.labelZh : m.labelEn}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* News cards — latest first, 2 new + 3 existing */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-14">
          {NEWS.map((news, idx) => (
            <motion.div
              key={news.titleEn}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.4 + idx * 0.08 }}
              className={`relative bg-card border rounded-sm p-6 ${
                news.isNew ? 'border-red-400/40' : 'border-border'
              }`}
            >
              {news.isNew && (
                <span className="absolute top-3 right-3 bg-red-500 text-white text-[9px] font-body px-2 py-0.5 rounded-full">
                  NEW
                </span>
              )}
              <span className={`text-xs font-body ${news.isNew ? 'text-red-500' : 'text-accent'}`}>
                {news.date}
              </span>
              <h3 className="font-display text-base text-foreground mt-2 mb-3 leading-snug">
                {lang === 'zh' ? news.titleZh : news.titleEn}
              </h3>
              <p className="text-xs font-body text-muted-foreground leading-relaxed">
                {lang === 'zh' ? news.summaryZh : news.summaryEn}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Bottom stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.7 }}
          className="grid grid-cols-3 gap-6 max-w-xl mx-auto text-center"
        >
          {STATS.map((s) => (
            <div key={s.labelEn}>
              <p className="font-display text-2xl md:text-3xl font-semibold text-gold">{s.valueZh}</p>
              <p className="text-xs font-body text-muted-foreground mt-1">
                {lang === 'zh' ? s.labelZh : s.labelEn}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default MediaCoverageSection;
