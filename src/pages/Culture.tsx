import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

interface Artwork {
  src: string;
  artistZh: string;
  artistEn: string;
  titleZh?: string;
  titleEn?: string;
}

const ARTWORKS: Artwork[] = [
  { src: '/images/art/art-tang-xiaoming.jpg', artistZh: '汤晓明', artistEn: 'Tang Xiaoming', titleZh: '库克山下的羊驼 · 第六届上海进博会展出', titleEn: 'Alpacas Below Mount Cook — exhibited at the 6th China CIIE' },
  { src: '/images/art/art-fan-jingsheng.jpg', artistZh: '范京生', artistEn: 'Fan Jingsheng' },
  { src: '/images/art/art-xia-yang.jpg', artistZh: '夏阳', artistEn: 'Xia Yang' },
  { src: '/images/art/art-bao-lei.jpg', artistZh: '鲍雷', artistEn: 'Bao Lei', titleZh: '《開泰》精微素描', titleEn: '"Kaitai" — fine pencil drawing' },
  { src: '/images/art/art-wang-jianhua.jpg', artistZh: '王建华', artistEn: 'Wang Jianhua' },
  { src: '/images/art/art-zhang-yong.jpg', artistZh: '张勇', artistEn: 'Zhang Yong', titleZh: '中国画《羊驼》', titleEn: 'Chinese ink painting "Alpaca"' },
  { src: '/images/art/art-lin-jinshui.jpg', artistZh: '林金水', artistEn: 'Lin Jinshui', titleZh: '快乐时光', titleEn: 'Happy Time' },
  { src: '/images/art/art-lei-shuqing.jpg', artistZh: '雷树清', artistEn: 'Lei Shuqing', titleZh: '我爱羊驼', titleEn: 'I Love Alpacas' },
  { src: '/images/art/art-wei-sisi.jpg', artistZh: '魏思偲', artistEn: 'Wei Sisi' },
  { src: '/images/art/art-li-wende.jpg', artistZh: '李文德', artistEn: 'Li Wende' },
  { src: '/images/art/art-zhou-xingrong.jpg', artistZh: '周兴荣', artistEn: 'Zhou Xingrong' },
];

const BRAND_PHOTOS = [
  { src: '/images/brand-campaign-haybale.jpg', capZh: '新西兰牧场实拍广告大片', capEn: 'On-location campaign shoot, NZ farm' },
  { src: '/images/factory-floor-sewing.jpg', capZh: '被芯生产车间', capEn: 'Duvet production floor' },
  { src: '/images/factory-floor-fiber-rolls.jpg', capZh: '羊驼纤维原料仓库', capEn: 'Raw alpaca fiber warehouse' },
  { src: '/images/shearing-detail-01.jpg', capZh: '年度剪毛现场', capEn: 'Annual shearing day' },
  { src: '/images/shearing-detail-02.jpg', capZh: '年度剪毛现场', capEn: 'Annual shearing day' },
  { src: '/images/shearing-detail-03.jpg', capZh: '年度剪毛现场', capEn: 'Annual shearing day' },
  { src: '/images/fiber-bales-warehouse.jpg', capZh: '原料分级打包仓库', capEn: 'Graded fiber storage' },
  { src: '/images/fiber-sorting.jpg', capZh: '纤维分拣', capEn: 'Fiber sorting' },
  { src: '/images/ciie-booth-01.jpg', capZh: '进博会展位实拍', capEn: 'CIIE exhibition booth' },
  { src: '/images/ciie-booth-02.jpg', capZh: '进博会展位实拍', capEn: 'CIIE exhibition booth' },
  { src: '/images/ciie-booth-03.jpg', capZh: '进博会展位实拍', capEn: 'CIIE exhibition booth' },
  { src: '/images/ciie-booth-04.jpg', capZh: '进博会展位实拍', capEn: 'CIIE exhibition booth' },
];

function ArtGrid({ artworks, onSelect }: { artworks: Artwork[]; onSelect: (a: Artwork) => void }) {
  const { locale } = useApp();
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
      {artworks.map((art, i) => (
        <motion.button
          key={art.src}
          type="button"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.4, delay: (i % 8) * 0.05 }}
          onClick={() => onSelect(art)}
          className="relative aspect-[3/4] overflow-hidden rounded-sm bg-muted group text-left"
        >
          <img
            src={art.src}
            alt={locale === 'zh' ? art.artistZh : art.artistEn}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
            <p className="text-white text-xs font-body tracking-wide">
              {locale === 'zh' ? art.artistZh : art.artistEn}
            </p>
          </div>
        </motion.button>
      ))}
    </div>
  );
}

export default function CulturePage() {
  const { locale } = useApp();
  const [lightbox, setLightbox] = useState<Artwork | null>(null);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title={locale === 'zh' ? '艺术画廊 — 太平洋羊驼' : 'Art Gallery — Pacific Alpacas'}
        description={locale === 'zh' ? '11位画家共同创作的羊驼主题画作，与品牌牧场、工厂实拍影像' : 'Alpaca-themed paintings by 11 artists, alongside on-location farm and factory photography'}
      />

      <div className="pt-24 pb-16 flex-1">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <span className="text-gold text-xs tracking-[0.3em] uppercase font-body">
              {locale === 'zh' ? '文化与艺术' : 'Culture & Art'}
            </span>
            <h1 className="font-display text-4xl md:text-5xl mt-4 mb-4">
              {locale === 'zh' ? '艺术画廊' : 'Art Gallery'}
            </h1>
            <p className="text-muted-foreground font-body">
              {locale === 'zh'
                ? '11位画家以羊驼为题共同创作，呈现同一份对新西兰牧场生活的喜爱。'
                : 'Eleven artists, one shared subject — a collection of alpaca-themed works celebrating life on the New Zealand farm.'}
            </p>
          </div>

          <div className="mb-16">
            <ArtGrid artworks={ARTWORKS} onSelect={setLightbox} />
          </div>

          <div className="text-center mb-10 max-w-2xl mx-auto">
            <h2 className="font-display text-2xl md:text-3xl mb-3">
              {locale === 'zh' ? '品牌纪实' : 'Behind the Scenes'}
            </h2>
            <p className="text-muted-foreground font-body text-sm">
              {locale === 'zh'
                ? '从牧场广告拍摄到新西兰工厂车间，真实记录太平洋羊驼的每一步。'
                : 'From on-farm campaign shoots to the New Zealand production floor — a real look at Pacific Alpacas.'}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {BRAND_PHOTOS.map((photo, i) => (
              <motion.button
                key={photo.src}
                type="button"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                onClick={() => setLightbox({ src: photo.src, artistZh: photo.capZh, artistEn: photo.capEn })}
                className="relative aspect-[4/3] overflow-hidden rounded-sm bg-muted group text-left"
              >
                <img
                  src={photo.src}
                  alt={locale === 'zh' ? photo.capZh : photo.capEn}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                  <p className="text-white text-xs font-body tracking-wide">
                    {locale === 'zh' ? photo.capZh : photo.capEn}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={lightbox !== null} onOpenChange={() => setLightbox(null)}>
        <DialogContent className="sm:max-w-2xl p-0 overflow-hidden bg-black border-0">
          <DialogTitle className="sr-only">
            {lightbox && (locale === 'zh' ? lightbox.artistZh : lightbox.artistEn)}
          </DialogTitle>
          {lightbox && (
            <div className="relative">
              <img src={lightbox.src} alt="" className="w-full max-h-[85vh] object-contain" />
              <button
                type="button"
                onClick={() => setLightbox(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <p className="text-white text-sm font-body">
                  {locale === 'zh' ? lightbox.artistZh : lightbox.artistEn}
                </p>
                {(lightbox.titleZh || lightbox.titleEn) && (
                  <p className="text-white/70 text-xs font-body mt-0.5">
                    {locale === 'zh' ? lightbox.titleZh : lightbox.titleEn}
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
