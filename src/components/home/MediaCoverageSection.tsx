import { useTranslation } from 'react-i18next';
import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { Play } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

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
    summaryZh: '太平洋羊驼成为首个进入三亚国际免税渠道的新西兰羊驼品牌，同年在消博会连续六届斩获1号展位，标志品牌进入中国高端零售主流渠道。CGTN专题采访太平洋羊驼执行董事Eric Geng。',
    summaryEn: 'First NZ alpaca brand in Sanya duty-free retail; secured CIIE Booth #1 for the 6th consecutive year. CGTN interviewed Pacific Alpacas Executive Director Eric Geng on-site.',
    date: '2025',
    isNew: true,
    image: '/images/media-ciie-still.jpg',
    video: '/videos/cgtn-highlight.mp4',
  },
  {
    titleZh: '太平洋羊驼获2023胡润至尚优品金奖',
    titleEn: 'Pacific Alpacas Wins 2023 Hurun Best of the Best Gold Award',
    summaryZh: '新西兰Pacific Alpacas品牌斩获"软装家居"新秀奖，与瑞士瑞联、达索猎鹰等品牌同获殊荣。',
    summaryEn: 'Pacific Alpacas won the "Soft Furnishing" New Arrival Award alongside Swiss Re and Dassault Falcon.',
    date: '2023',
    isNew: false,
    image: '/images/cert-hurun-2023.jpg',
  },
  {
    titleZh: 'CCTV13专题报道太平洋羊驼品牌',
    titleEn: 'CCTV13 Features Pacific Alpacas Brand',
    summaryZh: '"客从海上来·记者探访消费品展区"栏目专题报道"羊驼制品：进博会上的温暖展品"，截至2025年，太平洋羊驼已受到30多家主流媒体广泛关注。',
    summaryEn: 'CCTV13 featured "Alpaca Products: A Warm Exhibit at CIIE" in its consumer goods segment. By 2025, Pacific Alpacas has been covered by 30+ mainstream media.',
    date: '2024',
    isNew: false,
    image: '/images/media-cctv13-still.jpg',
    video: '/videos/cctv13-report.mp4',
  },
  {
    titleZh: '太平洋羊驼成为中国女子橄榄球队官方合作伙伴',
    titleEn: 'Pacific Alpacas Becomes Official Partner of China Women\'s Rugby Team',
    summaryZh: '2024年10月正式成为中国女子橄榄球队官方合作伙伴和指定品牌，研究运动员深度睡眠与恢复。',
    summaryEn: 'Official partner since Oct 2024, researching athletes\' deep sleep and recovery performance.',
    date: '2024',
    isNew: false,
  },
  {
    titleZh: '国际商报·上海第一财经等多家媒体报道',
    titleEn: 'Featured in International Business Daily, Yicai and More',
    summaryZh: '商务部《国际商报》以"来自南太平洋的甜与暖"为题报道，《上海第一财经》同步跟进，太平洋羊驼被超过22家电视媒体点赞。',
    summaryEn: 'MOFCOM\'s International Business Daily profiled the brand as "Sweetness and Warmth from the South Pacific"; Yicai and 22+ TV outlets followed.',
    date: '2022',
    isNew: false,
    image: '/images/media-newspaper-clippings.jpg',
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
  const [openVideo, setOpenVideo] = useState<string | null>(null);

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

        {/* News cards — latest first */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-14">
          {NEWS.map((news, idx) => (
            <motion.div
              key={news.titleEn}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.4 + idx * 0.08 }}
              className={`relative bg-card border rounded-sm overflow-hidden ${
                news.isNew ? 'border-red-400/40' : 'border-border'
              }`}
            >
              {news.isNew && (
                <span className="absolute top-3 right-3 z-10 bg-red-500 text-white text-[9px] font-body px-2 py-0.5 rounded-full">
                  NEW
                </span>
              )}
              {news.image && (
                <button
                  type="button"
                  onClick={() => news.video && setOpenVideo(news.video)}
                  className={`relative block w-full aspect-video overflow-hidden bg-black/5 ${news.video ? 'cursor-pointer group' : ''}`}
                >
                  <img
                    src={news.image}
                    alt={lang === 'zh' ? news.titleZh : news.titleEn}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {news.video && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/35 transition-colors">
                      <span className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                        <Play className="w-4 h-4 text-foreground ml-0.5" fill="currentColor" />
                      </span>
                    </span>
                  )}
                </button>
              )}
              <div className="p-6">
                <span className={`text-xs font-body ${news.isNew ? 'text-red-500' : 'text-accent'}`}>
                  {news.date}
                </span>
                <h3 className="font-display text-base text-foreground mt-2 mb-3 leading-snug">
                  {lang === 'zh' ? news.titleZh : news.titleEn}
                </h3>
                <p className="text-xs font-body text-muted-foreground leading-relaxed">
                  {lang === 'zh' ? news.summaryZh : news.summaryEn}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <Dialog open={openVideo !== null} onOpenChange={() => setOpenVideo(null)}>
          <DialogContent className="sm:max-w-2xl p-0 overflow-hidden bg-black">
            <DialogTitle className="sr-only">
              {lang === 'zh' ? '媒体报道视频' : 'Media coverage video'}
            </DialogTitle>
            {openVideo && (
              <video
                src={openVideo}
                controls
                autoPlay
                className="w-full aspect-video"
              />
            )}
          </DialogContent>
        </Dialog>

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
