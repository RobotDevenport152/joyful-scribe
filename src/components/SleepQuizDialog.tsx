import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useApp } from '@/contexts/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useProducts } from '@/hooks/useProducts';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STEPS = [
  {
    questionZh: '您主要的睡眠困扰是什么？',
    questionEn: 'What is your main sleep concern?',
    options: [
      { zh: '怕冷/保暖不足', en: 'Too cold / Insufficient warmth', value: 'cold' },
      { zh: '出汗/闷热', en: 'Sweating / Too hot', value: 'hot' },
      { zh: '过敏/螨虫', en: 'Allergies / Dust mites', value: 'allergy' },
      { zh: '总体睡眠质量差', en: 'Poor overall sleep quality', value: 'quality' },
    ],
  },
  {
    questionZh: '您的体型？',
    questionEn: 'Your body type?',
    options: [
      { zh: '偏瘦', en: 'Slim', value: 'slim' },
      { zh: '中等', en: 'Medium', value: 'medium' },
      { zh: '偏胖', en: 'Large', value: 'large' },
    ],
  },
  {
    questionZh: '您的预算范围？',
    questionEn: 'Your budget range?',
    options: [
      { zh: '¥1,000-2,000', en: 'NZ$249-449', value: 'budget' },
      { zh: '¥2,000-4,000', en: 'NZ$449-899', value: 'mid' },
      { zh: '¥4,000以上', en: 'NZ$899+', value: 'premium' },
    ],
  },
  {
    questionZh: '主要使用季节？',
    questionEn: 'Primary season of use?',
    options: [
      { zh: '春秋', en: 'Spring/Autumn', value: 'spring_autumn' },
      { zh: '冬季', en: 'Winter', value: 'winter' },
      { zh: '四季通用', en: 'All seasons', value: 'all' },
    ],
  },
];

// Local, rule-based fallback used when the AI recommendation call is
// unavailable or fails — the quiz should never dead-end for the customer.
const PRODUCT_MAP: Record<string, { zh: string; en: string; id: string }> = {
  premium: { zh: '高奢款羊驼被', en: 'Premium Luxury Duvet', id: 'duvet-premium' },
  mid: { zh: '轻奢款羊驼被', en: 'Luxury Alpaca Duvet', id: 'duvet-luxury' },
  budget: { zh: '经典款羊驼被', en: 'Classic Alpaca Duvet', id: 'duvet-classic' },
};

interface Recommendation {
  id: string;
  name: string;
  reason?: string;
}

export function SleepQuizDialog({ open, onOpenChange }: Props) {
  const { locale } = useApp();
  const { data: dbProducts } = useProducts();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);

  const fallbackRecommendation = (): Recommendation => {
    const budget = answers[2];
    const p = PRODUCT_MAP[budget] || PRODUCT_MAP.mid;
    return { id: p.id, name: locale === 'zh' ? p.zh : p.en };
  };

  const fetchRecommendation = async (finalAnswers: string[]) => {
    setLoading(true);
    try {
      const products = (dbProducts ?? []).map((p) => ({
        id: p.id,
        name_en: p.nameEn,
        name_zh: p.nameZh,
        category: p.category,
      }));

      if (products.length === 0) {
        setRecommendation(fallbackRecommendation());
        return;
      }

      const { data, error } = await supabase.functions.invoke('recommend', {
        body: { answers: finalAnswers, products },
      });

      if (error || !data?.product_id) {
        setRecommendation(fallbackRecommendation());
        return;
      }

      const matched = dbProducts?.find((p) => p.id === data.product_id);
      setRecommendation({
        id: data.product_id,
        name: matched ? (locale === 'zh' ? matched.nameZh : matched.nameEn) : data.product_id,
        reason: locale === 'zh' ? data.reason_zh : data.reason_en,
      });
    } catch {
      setRecommendation(fallbackRecommendation());
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (value: string) => {
    const newAnswers = [...answers, value];
    setAnswers(newAnswers);
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      setDone(true);
      fetchRecommendation(newAnswers);
    }
  };

  const reset = () => { setStep(0); setAnswers([]); setDone(false); setRecommendation(null); };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {locale === 'zh' ? '找到适合你的被子' : 'Find Your Perfect Duvet'}
          </DialogTitle>
        </DialogHeader>

        {!done ? (
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              {/* Progress */}
              <div className="flex gap-1 mb-4">
                {STEPS.map((_, i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-accent' : 'bg-muted'}`} />
                ))}
              </div>

              <p className="font-body text-sm mb-4">{locale === 'zh' ? STEPS[step].questionZh : STEPS[step].questionEn}</p>

              <div className="space-y-2">
                {STEPS[step].options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleSelect(opt.value)}
                    className="w-full text-left px-4 py-3 rounded-sm border border-border hover:border-accent hover:bg-accent/5 transition-colors font-body text-sm text-foreground"
                  >
                    {locale === 'zh' ? opt.zh : opt.en}
                  </button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
            <p className="text-muted-foreground font-body text-sm mb-2">
              {locale === 'zh' ? '为您推荐' : 'Recommended for You'}
            </p>
            {loading || !recommendation ? (
              <div className="h-8 flex items-center justify-center">
                <div className="h-5 w-5 rounded-full border-2 border-accent border-t-transparent animate-spin" />
              </div>
            ) : (
              <>
                <p className="font-display text-2xl font-semibold mb-2">{recommendation.name}</p>
                {recommendation.reason && (
                  <p className="text-muted-foreground font-body text-xs mb-4 px-2">{recommendation.reason}</p>
                )}
                <Link
                  to={`/product/${recommendation.id}`}
                  onClick={() => onOpenChange(false)}
                  className="inline-block px-6 py-2 bg-accent text-accent-foreground rounded-sm font-body hover:bg-accent/90 transition-colors"
                >
                  {locale === 'zh' ? '查看产品' : 'View Product'}
                </Link>
              </>
            )}
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
}
