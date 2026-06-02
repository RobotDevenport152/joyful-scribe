import { useTranslation } from 'react-i18next';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { ExternalLink } from 'lucide-react';

// 媒体来源 — 对应品牌手册 P16–P19 媒体背书
const MEDIA = [
  { labelZh: '央视 CCTV', labelEn: 'CCTV' },
  { labelZh: '新华社', labelEn: 'Xinhua' },
  { labelZh: '胡润百富', labelEn: 'Hurun Report' },
  { labelZh: '国际商报', labelEn: 'Int'l Business Daily' },
  { labelZh: '人民日报海外版', labelEn: "People's Daily Overseas" },
];

// 新闻动态 — 包含2025–2026最新内容
const NEWS = [
  {
    tag: '2026 · 新品',
    tagEn: '2026 · New',
    titleZh: '第六届消博会全球首发羊驼顶垫',
    titleEn: 'World Premiere: Alpaca Topper at 6th CIIE',
    summaryZh:
      '2026年4月第六届中国国际消费品博览会，太平洋羊驼全球首发羊驼顶垫，主打100%羊驼毛填充，聚焦深度睡眠场景创新，吸引大批采购商洽谈合作。',
    summaryEn:
      'At the 6th CIIE in April 2026, Pacific Alpacas premiered the Alpaca Topper worldwide — 100% alpaca fill engineered for deep-sleep performance.',
    highlight: true,
  },
  {
    tag: '2025 · 里程碑',
    tagEn: '2025 · Milestone',
    titleZh: '三亚免税店正式入驻 · 消博会连续六年参展',
    titleEn: 'Sanya Duty-Free Entry & 6th Consecutive CIIE',
    summaryZh:
      '第五届消博会期间正式进驻三亚免税店，成为中国高端消费市场的重要渠道落地；2025年7月，率先签约第六届消博会，成为1号参展商。',
    summaryEn:
      'Entered Sanya duty-free retail at the 5th CIIE; in July 2025 became the first brand to sign for the 6th edition — confirming six consecutive years of participation.',
    highlight: true,
  },
  {
    tag: '2024 · 合作',
    tagEn: '2024 · Partnership',
    titleZh: '成为中国女子橄榄球队官方合作伙伴',
    titleEn: 'Official Partner of China Women\'s Rugby Team',
    summaryZh:
      '2024年10月正式签约，研究运动员深度睡眠与身体恢复数据，将羊驼纤维的科学属性与竞技体育结合，进一步强化品牌的睡眠科学叙事。',
    summaryEn:
      'Signed in October 2024 to study athletes' deep sleep and recovery, linking alpaca fiber science to elite sports performance.',
    highlight: false,
  },
  {
    tag: '2023 · 荣誉',
    tagEn: '2023 · Award',
    titleZh: '荣获胡润至尚优品2023金奖',
    titleEn: 'Wins Hurun Best of the Best 2023 Gold Award',
    summaryZh:
      '第十九届胡润至尚优品评选中，斩获"软装家居"新秀奖金奖，与瑞士瑞联、达索猎鹰等国际顶级品牌同台获奖，品牌奢侈品定位获权威认可。',
    summaryEn:
      'Won the "Soft Furnishing" New Arrival Gold Award at the 19th Hurun Best of the Best, alongside Swiss Re and Dassault Falcon.',
    highlight: false,
  },
  {
    tag: '2022 · 供应链',
    tagEn: '2022 · Supply Chain',
    titleZh: '新西兰史上最大羊驼纤维出口',
    titleEn: 'NZ's Largest-Ever Alpaca Fiber Export',
    summaryZh:
      '获新西兰初级产业部批准，将3.3吨优质羊驼纤维出口中国，创新西兰历史最大单次羊驼纤维出口纪录，成为中新羊驼纤维领域合作典范。',
    summaryEn:
      'Approved by NZ MPI to export 3.3 tonnes of premium fiber to China — the largest single alpaca fiber export in NZ history.',
    highlight: false,
  },
];

const MediaCoverageSection = () => {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="py-20 md:py-28 bg-secondary/50">
      <div className="container mx-auto px-4">
        {/* 标题 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-12"
        >
          <p className="text-xs tracking-[0.3em] uppercase text-accent mb-4 font-body">
            {lang === 'zh' ? '媒体报道 · 品牌动态' : 'Media Coverage · Brand News'}
          </p>
          <h2 className="font-display text-3xl md:text-4xl text-foreground mb-4">
            {lang === 'zh' ? '30+ 主流媒体 · 持续关注' : '30+ Mainstream Media'}
          </h2>
          <div className="gold-line w-20 mx-auto" />
        </motion.div>

        {/* 媒体名称栏 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-center gap-8 md:gap-14 mb-16 flex-wrap"
        >
          {MEDIA.map((m, idx) => (
            <motion.span
              key={m.labelEn}
              initial={{ opacity: 0, y: 10 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3 + idx * 0.1 }}
              className="font-display text-lg md:text-xl text-foreground/50 hover:text-foreground/80 transition-colors cursor-default"
            >
              {lang === 'zh' ? m.labelZh : m.labelEn}
            </motion.span>
          ))}
        </motion.div>

        {/* 新闻卡片 */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {NEWS.map((news, idx) => (
            <motion.div
              key={news.titleEn}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.4 + idx * 0.08 }}
              className={`bg-card border rounded-sm p-6 flex flex-col gap-3 hover:shadow-md transition-shadow ${
                news.highlight
                  ? 'border-accent/40 ring-1 ring-accent/20'
                  : 'border-border'
              }`}
            >
              {/* 标签 */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-body tracking-wider uppercase px-2 py-0.5 rounded-full ${
                    news.highlight
                      ? 'bg-accent/10 text-accent'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {lang === 'zh' ? news.tag : news.tagEn}
                </span>
                {news.highlight && (
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                )}
              </div>

              {/* 标题 */}
              <h3 className="font-display text-base text-foreground leading-snug">
                {lang === 'zh' ? news.titleZh : news.titleEn}
              </h3>

              {/* 摘要 */}
              <p className="text-xs font-body text-muted-foreground leading-relaxed flex-1">
                {lang === 'zh' ? news.summaryZh : news.summaryEn}
              </p>
            </motion.div>
          ))}
        </div>

        {/* 底部统计 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.8 }}
          className="mt-16 flex flex-wrap justify-center gap-10 md:gap-20"
        >
          {[
            { valueZh: '30+', labelZh: '主流媒体报道', labelEn: 'Media Outlets' },
            { valueZh: '1000万+', labelZh: '网络传播量', labelEn: 'Online Impressions' },
            { valueZh: '6届', labelZh: '连续参展消博会', labelEn: 'Consecutive CIIE Years' },
          ].map((stat) => (
            <div key={stat.labelEn} className="text-center">
              <p className="font-display text-3xl text-accent mb-1">{stat.valueZh}</p>
              <p className="text-xs font-body text-muted-foreground uppercase tracking-wider">
                {lang === 'zh' ? stat.labelZh : stat.labelEn}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default MediaCoverageSection;
