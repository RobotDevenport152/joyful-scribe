import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

const VEST_PHOTOS = Array.from({ length: 12 }, (_, i) => `/images/lookbook/vest-${String(i + 1).padStart(2, '0')}.jpg`);
const STREET_PHOTOS = Array.from({ length: 12 }, (_, i) => `/images/lookbook/street-${String(i + 1).padStart(2, '0')}.jpg`);
const CITY_PHOTOS = Array.from({ length: 15 }, (_, i) => `/images/lookbook2/city-${String(i + 1).padStart(2, '0')}.jpg`);

function PhotoGrid({ photos, onSelect }: { photos: string[]; onSelect: (src: string) => void }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
      {photos.map((src, i) => (
        <motion.button
          key={src}
          type="button"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.4, delay: (i % 8) * 0.05 }}
          onClick={() => onSelect(src)}
          className="relative aspect-[3/4] overflow-hidden rounded-sm bg-muted group"
        >
          <img
            src={src}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        </motion.button>
      ))}
    </div>
  );
}

export default function LookbookPage() {
  const { locale } = useApp();
  const [lightbox, setLightbox] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title={locale === 'zh' ? '造型集 — 太平洋羊驼' : 'Lookbook — Pacific Alpacas'}
        description={locale === 'zh' ? '羊驼马甲与羊驼大衣的真实穿搭造型集' : 'Real styling shots of Pacific Alpacas vests and coats'}
      />

      <div className="pt-24 pb-16 flex-1">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <span className="text-gold text-xs tracking-[0.3em] uppercase font-body">
              {locale === 'zh' ? '造型灵感' : 'Style Inspiration'}
            </span>
            <h1 className="font-display text-4xl md:text-5xl mt-4 mb-4">
              {locale === 'zh' ? '造型集' : 'Lookbook'}
            </h1>
            <p className="text-muted-foreground font-body">
              {locale === 'zh'
                ? '真实拍摄，未经摆拍修饰 — 看看羊驼马甲与大衣在日常穿搭中的样子。'
                : 'Real shoots, not staged renders — see how our vests and coats look in everyday styling.'}
            </p>
          </div>

          <div className="mb-16">
            <h2 className="font-display text-2xl mb-6">
              {locale === 'zh' ? '羊驼马甲试穿' : 'Alpaca Vest, Styled'}
            </h2>
            <PhotoGrid photos={VEST_PHOTOS} onSelect={setLightbox} />
          </div>

          <div className="mb-16">
            <h2 className="font-display text-2xl mb-6">
              {locale === 'zh' ? '城市穿搭' : 'City Looks'}
            </h2>
            <PhotoGrid photos={STREET_PHOTOS} onSelect={setLightbox} />
          </div>

          <div>
            <h2 className="font-display text-2xl mb-6">
              {locale === 'zh' ? '更多造型' : 'More Looks'}
            </h2>
            <PhotoGrid photos={CITY_PHOTOS} onSelect={setLightbox} />
          </div>
        </div>
      </div>

      <Dialog open={lightbox !== null} onOpenChange={() => setLightbox(null)}>
        <DialogContent className="sm:max-w-2xl p-0 overflow-hidden bg-black border-0">
          <DialogTitle className="sr-only">
            {locale === 'zh' ? '造型集大图' : 'Lookbook photo'}
          </DialogTitle>
          {lightbox && (
            <div className="relative">
              <img src={lightbox} alt="" className="w-full max-h-[85vh] object-contain" />
              <button
                type="button"
                onClick={() => setLightbox(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
