import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import type { Locale } from '@/lib/i18n';
import { useProduct, useProducts } from '@/hooks/useProducts';
import Footer from '@/components/Footer';
import { ShieldCheck, Feather, Droplets, Bug, Zap, ChevronLeft, ChevronDown, ChevronUp, MapPin, Heart, ZoomIn, X, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useWishlist } from '@/hooks/useWishlist';
import { toast } from 'sonner';
import StockNotifyForm from '@/components/StockNotifyForm';
import { ProductTraceability } from '@/components/traceability/ProductTraceability';
import { useAuth } from '@/hooks/useAuth';
import { useProductReviews, type ProductReview } from '@/hooks/useProductReviews';
import { useReviewEligibility } from '@/hooks/useReviewEligibility';
import { useSubmitReview } from '@/hooks/useSubmitReview';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Star } from 'lucide-react';

const BENEFITS = [
  { icon: ShieldCheck, labelZh: '保暖', labelEn: 'Warmth', descZh: '3倍于羊毛', descEn: '3× warmer than wool' },
  { icon: Feather, labelZh: '轻盈', labelEn: 'Light', descZh: '仅羊毛被30%重量', descEn: '30% weight of wool' },
  { icon: Droplets, labelZh: '排潮', labelEn: 'Moisture', descZh: '吸收35%水蒸气', descEn: '35% vapor absorption' },
  { icon: Bug, labelZh: '抑螨', labelEn: 'Anti-mite', descZh: '64.37%趋避率', descEn: '64.37% avoidance' },
  { icon: Zap, labelZh: '阻电', labelEn: 'Anti-static', descZh: '天然抗静电', descEn: 'Natural anti-static' },
];

const COMPARISON = [
  { key: '保暖性', keyEn: 'Warmth', alpaca: '★★★★★', wool: '★★★☆☆', silk: '★★☆☆☆' },
  { key: '轻盈度', keyEn: 'Lightness', alpaca: '★★★★★', wool: '★★☆☆☆', silk: '★★★★☆' },
  { key: '排湿性', keyEn: 'Moisture', alpaca: '★★★★★', wool: '★★★☆☆', silk: '★★★☆☆' },
  { key: '抗螨性', keyEn: 'Anti-mite', alpaca: '★★★★★', wool: '★★☆☆☆', silk: '★★★☆☆' },
  { key: '耐用性', keyEn: 'Durability', alpaca: '★★★★★', wool: '★★★★☆', silk: '★★☆☆☆' },
  { key: '抗静电', keyEn: 'Anti-static', alpaca: '★★★★★', wool: '★☆☆☆☆', silk: '★★★☆☆' },
];

interface ReviewCardProps {
  review: ProductReview;
  locale: Locale;
}

function ReviewCard({ review, locale }: ReviewCardProps) {
  return (
    <div className="border border-border rounded-sm p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="font-body font-semibold text-sm">{review.author_name}</span>
          <span className="ml-2 text-xs text-green-600 font-body">✓ 已验证购买 / Verified Purchase</span>
        </div>
        <span className="text-xs text-muted-foreground font-body">
          {review.created_at ? new Date(review.created_at).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-NZ') : ''}
        </span>
      </div>
      <div className="text-gold text-sm mb-1">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</div>
      {review.variant && (
        <div className="text-xs text-muted-foreground font-body mb-2">{locale === 'zh' ? '购买规格' : 'Variant'}: {review.variant}</div>
      )}
      <p className="text-sm font-body text-muted-foreground">{review.comment}</p>
    </div>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { locale, fp, currency, addToCart, t, recentlyViewed, addRecentlyViewed } = useApp();
  const { toggle: toggleWishlist, isWishlisted } = useWishlist();
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [careOpen, setCareOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'care' | 'reviews'>('description');
  const [allReviewsOpen, setAllReviewsOpen] = useState(false);
  const [reviewSort, setReviewSort] = useState<'newest' | 'highest' | 'lowest'>('newest');
  const [imageZoomOpen, setImageZoomOpen] = useState(false);
  const { data: product, isLoading } = useProduct(id || '');
  const { data: allProducts } = useProducts();
  const { user } = useAuth();
  const { data: reviews } = useProductReviews(product?.id);
  const { data: eligibility } = useReviewEligibility(product?.id, user?.id);
  const submitReview = useSubmitReview();
  const [reviewForm, setReviewForm] = useState({ authorName: '', rating: 5, comment: '' });

  useEffect(() => {
    if (product) {
      addRecentlyViewed(id || '');
    }
  }, [product?.id]);

  const [activeImg, setActiveImg] = useState(0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="pt-32 text-center">
          <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <div className="pt-32 text-center">
          <h1 className="font-display text-3xl mb-4">{locale === 'zh' ? '产品未找到' : 'Product Not Found'}</h1>
          <Link to="/shop" className="text-gold hover:underline font-body">
            {locale === 'zh' ? '返回产品列表' : 'Back to Shop'}
          </Link>
        </div>
      </div>
    );
  }

  const images: string[] = (product as any).images?.length > 0
    ? (product as any).images
    : [product.image];

  // A selected size can cost far more than the base price (a carpet's largest
  // size is ~12x its smallest) — always price off the selected variant, and
  // show a range rather than a single (misleadingly low) price when none is
  // selected yet and sizes aren't all priced the same.
  const selectedVariantObj = selectedVariant
    ? product.variants?.find(v => v.value === selectedVariant)
    : undefined;
  const displayPrices = selectedVariantObj?.prices ?? product.prices;
  const variantPrices = product.variants?.map(v => v.prices[currency]) ?? [];
  const hasVariablePricing = variantPrices.length > 0 && new Set(variantPrices).size > 1;
  const showPriceRange = !selectedVariantObj && hasVariablePricing;
  const priceRange = showPriceRange
    ? { min: Math.min(...variantPrices), max: Math.max(...variantPrices) }
    : null;

  const careTipsZh = [
    '手洗或洗衣机轻柔模式，30°C 以下冷水',
    '使用羊毛专用洗涤剂，避免含酶洗涤剂',
    '平铺晾干，避免直接暴晒',
    '储存时置于透气袋中，放置樟脑球可防蛀',
    '切勿干洗（化学溶剂会破坏羊驼纤维蛋白质结构）',
  ];
  const careTipsEn = [
    'Hand wash or gentle machine cycle, cold water ≤30°C',
    'Use wool-specific detergent, avoid enzyme-based products',
    'Lay flat to dry, avoid direct sunlight',
    'Store in breathable bag with cedar balls to prevent moths',
    'Do not dry clean — solvents damage alpaca fiber proteins',
  ];

  const sameCategoryProducts = allProducts
    ? allProducts.filter(p => p.category === product.category && p.id !== product.id)
    : [];
  const featuredFill = allProducts
    ? allProducts.filter(p => p.featured && p.id !== product.id && !sameCategoryProducts.find(s => s.id === p.id))
    : [];
  const alsoBought = [...sameCategoryProducts, ...featuredFill].slice(0, 3);

  const approvedReviews = reviews ?? [];
  const sortedReviews = [...approvedReviews].sort((a, b) => {
    if (reviewSort === 'highest') return b.rating - a.rating;
    if (reviewSort === 'lowest') return a.rating - b.rating;
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });
  const reviewCount = approvedReviews.length;
  const avgRating = reviewCount > 0
    ? approvedReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
    : 0;
  const ratingDistribution = [5, 4, 3, 2, 1].map(stars => ({
    stars,
    label: `${stars}★`,
    pct: reviewCount > 0 ? Math.round((approvedReviews.filter(r => r.rating === stars).length / reviewCount) * 100) : 0,
  }));

  const handleSubmitReview = async () => {
    if (!user || !eligibility?.eligible || !eligibility.orderId || !product) return;
    if (!reviewForm.authorName.trim() || !reviewForm.comment.trim()) {
      toast.error(locale === 'zh' ? '请填写姓名和评价内容' : 'Please fill in your name and comment');
      return;
    }
    try {
      await submitReview.mutateAsync({
        productId: product.id,
        orderId: eligibility.orderId,
        userId: user.id,
        rating: reviewForm.rating,
        comment: reviewForm.comment.trim(),
        authorName: reviewForm.authorName.trim(),
        variant: eligibility.variant,
      });
      toast.success(locale === 'zh' ? '评价已提交，审核通过后将展示给其他客户' : 'Review submitted — it will appear once approved');
      setReviewForm({ authorName: '', rating: 5, comment: '' });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : (locale === 'zh' ? '提交失败' : 'Submission failed'));
    }
  };

  const recentIds = recentlyViewed.filter(rid => rid !== id);
  const recentProducts = allProducts
    ? recentIds.map(rid => allProducts.find(p => p.id === rid)).filter(Boolean).slice(0, 4)
    : [];

  const tabs = [
    { key: 'description' as const, zh: '描述', en: 'Description' },
    { key: 'specs' as const, zh: '规格', en: 'Specifications' },
    { key: 'care' as const, zh: '护理', en: 'Care' },
    { key: 'reviews' as const, zh: '评论', en: 'Reviews' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">

      <div className="pt-24 pb-16 flex-1">
        <div className="container mx-auto px-6">
          <Link to="/shop" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground font-body mb-8">
            <ChevronLeft className="w-4 h-4" />
            {locale === 'zh' ? '返回产品列表' : 'Back to Shop'}
          </Link>

          <div className="grid lg:grid-cols-2 gap-12">
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
              {/* P1 FIX: Image gallery — uses products.images[] array from DB */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setImageZoomOpen(true)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setImageZoomOpen(true); }}
                aria-label={locale === 'zh' ? '点击查看大图' : 'Click to zoom image'}
                className="relative aspect-square rounded-lg overflow-hidden bg-card group cursor-zoom-in"
              >
                <img
                  src={images[activeImg]}
                  alt={locale === 'zh' ? product.nameZh : product.nameEn}
                  className="w-full h-full object-cover transition-opacity duration-300"
                />
                <div className="absolute top-3 right-3 w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ZoomIn className="w-4 h-4" />
                </div>
                <Link
                  to="/traceability"
                  onClick={e => e.stopPropagation()}
                  className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-primary/80 backdrop-blur-sm text-primary-foreground text-xs font-body px-3 py-1.5 rounded-full hover:bg-primary transition-colors"
                >
                  <MapPin className="w-3 h-3 text-gold" />
                  {locale === 'zh' ? '可溯源至新西兰牧场' : 'Traceable NZ Farm'}
                  <span className="text-gold ml-0.5">→</span>
                </Link>
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 mt-3">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImg(i)}
                      className={`w-16 h-16 rounded-sm overflow-hidden border-2 transition-colors flex-shrink-0 ${
                        activeImg === i ? 'border-gold' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              <Dialog open={imageZoomOpen} onOpenChange={setImageZoomOpen}>
                <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black border-0">
                  <DialogTitle className="sr-only">
                    {locale === 'zh' ? product.nameZh : product.nameEn}
                  </DialogTitle>
                  <div className="relative">
                    <img
                      src={images[activeImg]}
                      alt={locale === 'zh' ? product.nameZh : product.nameEn}
                      className="w-full max-h-[85vh] object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => setImageZoomOpen(false)}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                      aria-label={locale === 'zh' ? '关闭' : 'Close'}
                    >
                      <X className="w-4 h-4" />
                    </button>
                    {images.length > 1 && (
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                        {images.map((img, i) => (
                          <button
                            key={i}
                            onClick={() => setActiveImg(i)}
                            className={`w-12 h-12 rounded-sm overflow-hidden border-2 transition-colors flex-shrink-0 ${
                              activeImg === i ? 'border-gold' : 'border-white/30 hover:border-white/70'
                            }`}
                          >
                            <img src={img} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="flex flex-col">
              <span className="text-gold text-xs tracking-[0.3em] uppercase font-body mb-2">{product.category}</span>
              <h1 className="font-display text-3xl md:text-4xl font-semibold mb-1">
                {locale === 'zh' ? product.nameZh : product.nameEn}
              </h1>
              <p className="text-muted-foreground font-body text-sm mb-2">
                {locale === 'zh' ? product.nameEn : product.nameZh}
              </p>
              <p className="text-gold font-display text-3xl font-semibold mb-1">
                {priceRange ? `${fp(priceRange.min)} – ${fp(priceRange.max)}` : fp(displayPrices[currency])}
              </p>
              <p className="text-muted-foreground/70 font-body text-xs mb-4">
                {locale === 'zh'
                  ? '所有价格均以新西兰元 (NZD) 计价，已含GST。海外购买的货币兑换由您的信用卡机构负责。'
                  : 'All prices are in NZD and inclusive of GST. For international purchases, your credit card company is responsible for the currency conversion.'}
              </p>
              <p className="text-muted-foreground font-body leading-relaxed mb-6">
                {locale === 'zh' ? product.descZh : product.descEn}
              </p>

              {product.variants && product.variants.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <p className="text-xs font-body text-muted-foreground">{locale === 'zh' ? '选择尺寸' : 'Select Size'}</p>
                    <button
                      onClick={() => setSizeGuideOpen(v => !v)}
                      className="text-xs font-body text-gold hover:underline flex items-center gap-0.5"
                    >
                      {locale === 'zh' ? '尺寸参考' : 'Size Guide'}
                      {sizeGuideOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>
                  {sizeGuideOpen && (
                    <div className="mb-3 bg-muted rounded-sm p-3 text-xs font-body space-y-1.5 border border-border">
                      <p className="font-semibold text-foreground mb-2">{locale === 'zh' ? '中国床尺寸对照' : 'Bed Size Reference'}</p>
                      {[
                        { bed: locale === 'zh' ? '标准双人床（1.5m）' : 'Double (1.5m)', rec: '200×230cm' },
                        { bed: locale === 'zh' ? '大双人床（1.8m）' : 'Queen/King (1.8m)', rec: '220×240cm' },
                        { bed: locale === 'zh' ? '儿童床（0.9–1.2m）' : 'Single/Child', rec: '150×180cm' },
                      ].map(r => (
                        <div key={r.bed} className="flex justify-between items-center">
                          <span className="text-muted-foreground">{r.bed}</span>
                          <span className="font-semibold text-foreground">{locale === 'zh' ? '推荐' : 'Rec.'} {r.rec}</span>
                        </div>
                      ))}
                      <p className="text-muted-foreground/70 pt-1 border-t border-border">
                        {locale === 'zh' ? '建议比床宽各多出 30cm 以上，以获得最佳包裹感。' : 'Choose 30cm+ wider than your bed for best coverage.'}
                      </p>
                    </div>
                  )}
                  <div className="flex gap-2 flex-wrap">
                    {product.variants.map(v => (
                      <button
                        key={v.value}
                        onClick={() => setSelectedVariant(v.value)}
                        className={`px-4 py-2 rounded-sm border text-sm font-body transition-colors ${
                          selectedVariant === v.value
                            ? 'bg-foreground text-background border-foreground'
                            : 'border-border text-foreground hover:border-gold'
                        }`}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* P2 FIX: Threshold display instead of exact stock number */}
              {product.stock > 0 && product.stock <= 10 && (
                <p className="text-xs font-body mb-2 text-amber-600">
                  {product.stock <= 4
                    ? (locale === 'zh' ? `仅剩 ${product.stock} 件，手慢无` : `Only ${product.stock} left`)
                    : (locale === 'zh' ? '仅剩少量' : 'Low stock')}
                </p>
              )}

              {/* Care Instructions */}
              <div className="mb-4 border border-border rounded-sm overflow-hidden">
                <button
                  onClick={() => setCareOpen(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-body font-semibold hover:bg-muted transition-colors"
                >
                  <span>{locale === 'zh' ? '🧺 护理说明' : '🧺 Care Instructions'}</span>
                  {careOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>
                {careOpen && (
                  <div className="px-4 pb-4 space-y-1.5 text-xs font-body text-muted-foreground border-t border-border pt-3">
                    {(locale === 'zh' ? careTipsZh : careTipsEn).map((tip, i) => (
                      <p key={i} className="flex gap-2"><span className="text-gold flex-shrink-0">·</span>{tip}</p>
                    ))}
                  </div>
                )}
              </div>

              {/* P0 FIX: Variant required before add to cart */}
              {product.stock <= 0 ? (
                /* P1 FIX: Out-of-stock notify form replaces grey Sold Out button */
                <StockNotifyForm productId={product.id} locale={locale as 'zh' | 'en'} />
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (product.variants && product.variants.length > 0 && !selectedVariant) {
                        toast.error(locale === 'zh' ? '请先选择规格' : 'Please select a size first');
                        return;
                      }
                      addToCart(product, selectedVariant || undefined);
                    }}
                    className="flex-1 py-3 bg-accent text-accent-foreground font-body font-semibold rounded-sm tracking-wider hover:bg-accent/90 transition"
                  >
                    {t.products.addToCart}
                  </button>
                  {/* P1 FIX: Wishlist heart button */}
                  <button
                    onClick={() => {
                      toggleWishlist(product.id);
                      toast.success(
                        isWishlisted(product.id)
                          ? (locale === 'zh' ? '已从收藏移除' : 'Removed from wishlist')
                          : (locale === 'zh' ? '已加入收藏' : 'Added to wishlist'),
                      );
                    }}
                    className="px-4 py-3 border border-border rounded-sm hover:border-gold transition-colors flex-shrink-0"
                    aria-label={locale === 'zh' ? '收藏' : 'Wishlist'}
                  >
                    <Heart
                      className={`w-5 h-5 transition-colors ${isWishlisted(product.id) ? 'fill-gold text-gold' : 'text-muted-foreground'}`}
                    />
                  </button>
                </div>
              )}

              <div className="mt-4">
                {product.fiberBatchId ? (
                  <ProductTraceability batchId={product.fiberBatchId} />
                ) : (
                  <Link
                    to="/traceability"
                    className="inline-flex items-center gap-2 px-4 py-2 border border-gold/40 text-gold-dark rounded-sm text-sm font-body hover:bg-gold/10 transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    {locale === 'zh' ? '验证产品真实性' : 'Verify Product Authenticity'}
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-5 gap-3 mt-8">
                {BENEFITS.map((b) => (
                  <div key={b.labelEn} className="text-center">
                    <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-1">
                      <b.icon className="w-5 h-5 text-gold" />
                    </div>
                    <p className="text-xs font-body font-semibold">{locale === 'zh' ? b.labelZh : b.labelEn}</p>
                    <p className="text-[10px] text-muted-foreground font-body">{locale === 'zh' ? b.descZh : b.descEn}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Tab Navigation */}
          <div className="mt-16">
            <div className="flex gap-0 border-b border-border mb-8">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-5 py-3 text-sm font-body transition-colors ${
                    activeTab === tab.key
                      ? 'border-b-2 border-gold text-foreground font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {locale === 'zh' ? tab.zh : tab.en}
                  {locale === 'zh' && <span className="text-muted-foreground font-normal ml-1 text-xs">/ {tab.en}</span>}
                  {locale !== 'zh' && <span className="text-muted-foreground font-normal ml-1 text-xs">/ {tab.zh}</span>}
                </button>
              ))}
            </div>

            {activeTab === 'description' && (
              <div>
                <div className="max-w-3xl mx-auto mb-10">
                  <h2 className="font-display text-2xl mb-4">{locale === 'zh' ? '产品故事' : 'Product Story'}</h2>
                  <p className="font-body text-muted-foreground leading-relaxed">
                    {locale === 'zh' ? product.descZh : product.descEn}
                  </p>
                </div>

                <div className="mb-10">
                  <h3 className="font-display text-xl text-center mb-6">{locale === 'zh' ? '五大优势' : 'Five Key Benefits'}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-6 max-w-3xl mx-auto">
                    {BENEFITS.map((b) => (
                      <div key={b.labelEn} className="text-center">
                        <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-2">
                          <b.icon className="w-6 h-6 text-gold" />
                        </div>
                        <p className="text-sm font-body font-semibold">{locale === 'zh' ? b.labelZh : b.labelEn}</p>
                        <p className="text-xs text-muted-foreground font-body">{locale === 'zh' ? b.descZh : b.descEn}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-display text-xl text-center mb-6">{locale === 'zh' ? '被窝指标对比' : 'Duvet Comparison'}</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full max-w-2xl mx-auto text-sm font-body">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left p-3">{locale === 'zh' ? '指标' : 'Metric'}</th>
                          <th className="text-center p-3">{locale === 'zh' ? '羊驼被' : 'Alpaca'}</th>
                          <th className="text-center p-3">{locale === 'zh' ? '羊毛被' : 'Wool'}</th>
                          <th className="text-center p-3">{locale === 'zh' ? '蚕丝被' : 'Silk'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {COMPARISON.map((row) => (
                          <tr key={row.key} className="border-b border-border">
                            <td className="p-3 font-semibold">{locale === 'zh' ? row.key : row.keyEn}</td>
                            <td className="p-3 text-center text-gold">{row.alpaca}</td>
                            <td className="p-3 text-center">{row.wool}</td>
                            <td className="p-3 text-center">{row.silk}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'specs' && (
              <div>
                <div className="max-w-2xl mx-auto mb-10">
                  <h2 className="font-display text-2xl mb-6">{locale === 'zh' ? '产品规格' : 'Product Specifications'}</h2>
                  <table className="w-full text-sm font-body">
                    <tbody>
                      {[
                        { labelZh: '重量', labelEn: 'Weight', value: product.weight || '—' },
                        { labelZh: '充绒量', labelEn: 'Fill Power', value: product.fillPower || '—' },
                        { labelZh: '填充物', labelEn: 'Material', value: '100% Alpaca Fiber' },
                        { labelZh: '面料', labelEn: 'Cover', value: locale === 'zh' ? '纯棉' : 'Pure Cotton' },
                        { labelZh: '认证', labelEn: 'Certifications', value: product.certifications?.join(', ') || '—' },
                      ].map(row => (
                        <tr key={row.labelEn} className="border-b border-border">
                          <td className="py-3 pr-6 font-semibold text-muted-foreground w-40">{locale === 'zh' ? row.labelZh : row.labelEn}</td>
                          <td className="py-3">{row.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-primary text-primary-foreground rounded-lg overflow-hidden max-w-3xl mx-auto">
                  <div className="h-1 bg-gradient-to-r from-transparent via-gold to-transparent" />
                  <div className="p-8 md:p-12 text-center">
                    <h2 className="font-display text-2xl md:text-3xl mb-6">
                      {locale === 'zh' ? '云之梦图案' : 'Cloud of Dreams'}
                    </h2>
                    <p className="font-body text-primary-foreground/80 leading-relaxed text-sm md:text-base">
                      {locale === 'zh'
                        ? '每一床太平洋羊驼被上都绣有我们的注册商标"云之梦"图案。该图案由新西兰丰盛湾阿拉旺部落的毛利艺术家 Patricia Erueti 专为 Pacific Alpacas 设计。购买一床太平洋羊驼被，不仅是拥有顶级品质寝具，更是将一件新西兰文化遗产带回家中。'
                        : "Each of our duvets features our trademarked 'Cloud of Dreams' pattern, designed exclusively for Pacific Alpacas by Māori artist Patricia Erueti of the Arawan tribe from New Zealand's Bay of Plenty. Every purchase carries a piece of New Zealand heritage."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'care' && (
              <div className="max-w-2xl mx-auto">
                <h2 className="font-display text-2xl mb-6">{locale === 'zh' ? '护理说明' : 'Care Instructions'}</h2>
                <ul className="space-y-3">
                  {(locale === 'zh' ? careTipsZh : careTipsEn).map((tip, i) => (
                    <li key={i} className="flex gap-3 font-body text-sm text-muted-foreground">
                      <span className="text-gold flex-shrink-0 mt-0.5">·</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="max-w-2xl mx-auto">
                {reviewCount > 0 ? (
                  <>
                    <div className="mb-8 text-center">
                      <div className="text-4xl font-display font-semibold mb-1">{avgRating.toFixed(1)}</div>
                      <div className="text-gold text-xl mb-1">{'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))}</div>
                      <div className="text-sm text-muted-foreground font-body">
                        {locale === 'zh' ? `${reviewCount}条评价` : `${reviewCount} review${reviewCount === 1 ? '' : 's'}`}
                      </div>
                    </div>

                    <div className="space-y-2 mb-8 max-w-xs mx-auto">
                      {ratingDistribution.map(row => (
                        <div key={row.stars} className="flex items-center gap-3 text-sm font-body">
                          <span className="w-6 text-muted-foreground">{row.label}</span>
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-gold rounded-full" style={{ width: `${row.pct}%` }} />
                          </div>
                          <span className="w-8 text-right text-muted-foreground">{row.pct}%</span>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-4 mb-6">
                      {sortedReviews.slice(0, 3).map(review => (
                        <ReviewCard key={review.id} review={review} locale={locale} />
                      ))}
                    </div>

                    {sortedReviews.length > 3 && (
                      <div className="text-center mb-8">
                        <button
                          type="button"
                          onClick={() => setAllReviewsOpen(true)}
                          className="text-sm font-body text-gold hover:underline"
                        >
                          {locale === 'zh' ? '查看全部评价' : 'View all reviews'} →
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-center text-sm text-muted-foreground font-body mb-8">
                    {locale === 'zh' ? '暂无评价，欢迎成为第一位分享体验的顾客。' : 'No reviews yet — be the first to share your experience.'}
                  </p>
                )}

                {eligibility?.eligible && (
                  <div className="border border-border rounded-sm p-4 mb-6">
                    <h3 className="font-body font-semibold text-sm mb-3">
                      {locale === 'zh' ? '写一条评价' : 'Write a Review'}
                    </h3>
                    <div className="flex gap-1 mb-3">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewForm(p => ({ ...p, rating: star }))}
                          aria-label={`${star} star`}
                        >
                          <Star
                            className={`w-5 h-5 ${star <= reviewForm.rating ? 'fill-gold text-gold' : 'text-muted-foreground'}`}
                          />
                        </button>
                      ))}
                    </div>
                    <div className="space-y-2 mb-3">
                      <Label className="text-xs">{locale === 'zh' ? '显示名称' : 'Display name'}</Label>
                      <Input
                        value={reviewForm.authorName}
                        onChange={e => setReviewForm(p => ({ ...p, authorName: e.target.value }))}
                        placeholder={locale === 'zh' ? '例如：张女士' : 'e.g. J. Smith'}
                      />
                    </div>
                    <div className="space-y-2 mb-3">
                      <Label className="text-xs">{locale === 'zh' ? '评价内容' : 'Comment'}</Label>
                      <Textarea
                        value={reviewForm.comment}
                        onChange={e => setReviewForm(p => ({ ...p, comment: e.target.value }))}
                        rows={3}
                      />
                    </div>
                    <Button onClick={handleSubmitReview} disabled={submitReview.isPending} size="sm">
                      {submitReview.isPending
                        ? (locale === 'zh' ? '提交中…' : 'Submitting…')
                        : (locale === 'zh' ? '提交评价' : 'Submit Review')}
                    </Button>
                  </div>
                )}
                {eligibility?.alreadyReviewed && (
                  <p className="text-center text-xs text-muted-foreground font-body mb-6">
                    {locale === 'zh' ? '感谢您的评价！' : 'Thanks for your review!'}
                  </p>
                )}

                <Dialog open={allReviewsOpen} onOpenChange={setAllReviewsOpen}>
                  <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
                    <DialogHeader>
                      <DialogTitle className="font-display">
                        {locale === 'zh' ? '全部评价' : 'All Reviews'} · {reviewCount}
                      </DialogTitle>
                    </DialogHeader>

                    {/* Summary recap — so this reads as a complete reviews view,
                        not just a longer list appended to what's already shown */}
                    <div className="flex items-center gap-6 pb-4 border-b border-border flex-shrink-0">
                      <div className="text-center flex-shrink-0">
                        <div className="text-3xl font-display font-semibold">{avgRating.toFixed(1)}</div>
                        <div className="text-gold text-sm">{'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))}</div>
                      </div>
                      <div className="flex-1 space-y-1">
                        {ratingDistribution.map(row => (
                          <div key={row.stars} className="flex items-center gap-2 text-xs font-body">
                            <span className="w-5 text-muted-foreground">{row.label}</span>
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-gold rounded-full" style={{ width: `${row.pct}%` }} />
                            </div>
                            <span className="w-7 text-right text-muted-foreground">{row.pct}%</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Sort control */}
                    <div className="flex items-center gap-2 py-3 flex-shrink-0">
                      <span className="text-xs font-body text-muted-foreground">
                        {locale === 'zh' ? '排序：' : 'Sort:'}
                      </span>
                      {([
                        { key: 'newest' as const, zh: '最新', en: 'Newest' },
                        { key: 'highest' as const, zh: '评分最高', en: 'Highest Rated' },
                        { key: 'lowest' as const, zh: '评分最低', en: 'Lowest Rated' },
                      ]).map(opt => (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => setReviewSort(opt.key)}
                          className={`px-2.5 py-1 rounded-full text-xs font-body transition-colors ${
                            reviewSort === opt.key
                              ? 'bg-accent text-accent-foreground'
                              : 'bg-muted text-muted-foreground hover:bg-muted/70'
                          }`}
                        >
                          {locale === 'zh' ? opt.zh : opt.en}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-4 overflow-y-auto pr-1">
                      {sortedReviews.map(review => (
                        <ReviewCard key={review.id} review={review} locale={locale} />
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>

          {/* Customers Also Bought */}
          {alsoBought.length > 0 && (
            <div className="mt-16">
              <h2 className="font-display text-2xl mb-6">
                {locale === 'zh' ? '购买此商品的顾客还购买了' : 'Customers Also Bought'}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {alsoBought.map(p => (
                  <Link key={p.id} to={`/product/${p.id}`} className="group block">
                    <div className="aspect-square rounded-lg overflow-hidden bg-card mb-3">
                      <img src={p.image} alt={locale === 'zh' ? p.nameZh : p.nameEn} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                    <p className="font-body font-semibold text-sm mb-1">{locale === 'zh' ? p.nameZh : p.nameEn}</p>
                    <p className="text-gold font-display text-sm">{fp(p.prices[currency])}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Recently Viewed */}
          {recentProducts.length > 0 && (
            <div className="mt-16">
              <h2 className="font-display text-2xl mb-6">
                {locale === 'zh' ? '最近查看' : 'Recently Viewed'}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {recentProducts.map(p => (
                  <Link key={p!.id} to={`/product/${p!.id}`} className="group block">
                    <div className="aspect-square rounded-lg overflow-hidden bg-card mb-3">
                      <img src={p!.image} alt={locale === 'zh' ? p!.nameZh : p!.nameEn} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                    <p className="font-body font-semibold text-sm mb-1">{locale === 'zh' ? p!.nameZh : p!.nameEn}</p>
                    <p className="text-gold font-display text-sm">{fp(p!.prices[currency])}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* P2 FIX: Mobile sticky add-to-cart bar with variant guard */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border px-4 pt-4 safe-bottom flex items-center gap-4 z-40">
        <span className="text-gold font-display text-xl font-semibold">
          {priceRange ? `${fp(priceRange.min)}+` : fp(displayPrices[currency])}
        </span>
        <button
          onClick={() => {
            if (product.variants && product.variants.length > 0 && !selectedVariant) {
              toast.error(locale === 'zh' ? '请先选择规格' : 'Please select a size');
              return;
            }
            addToCart(product, selectedVariant || undefined);
          }}
          disabled={product.stock <= 0}
          className="flex-1 py-3 bg-accent text-accent-foreground font-body font-semibold rounded-sm disabled:opacity-50"
        >
          {product.stock <= 0 ? (locale === 'zh' ? '已售罄' : 'Sold Out') : t.products.addToCart}
        </button>
      </div>

      <Footer />
    </div>
  );
}
