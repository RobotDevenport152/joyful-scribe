export type Currency = 'NZD' | 'CNY' | 'USD';

export interface ProductVariant {
  label: string;
  value: string;
  prices: Record<Currency, number>;
}

export interface Product {
  id: string;
  nameEn: string;
  nameZh: string;
  descEn: string;
  descZh: string;
  category: 'bedding' | 'outerwear' | 'accessories' | 'carpet';
  prices: Record<Currency, number>;
  image: string;
  badge?: string;
  variants?: ProductVariant[];
  stock: number;
  featured: boolean;
  fiberBatchId?: string | null;
  // Present when sourced from dbToLegacyProduct (real DB data); absent on
  // the local fallback dataset below, where `id` already doubles as a slug
  // and `image` as the sole photo. Every read site must handle undefined.
  slug?: string;
  images?: string[];
  weight?: string | null;
  fillPower?: string | null;
  certifications?: string[];
  rating?: number;
  reviewCount?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  variant?: string;
}

// A cart item's price depends on which variant was selected — a carpet's
// 300x400cm size costs ~12x its 70x140cm size. Always read prices through
// this helper rather than item.product.prices directly, or every size will
// silently charge the same (base/cheapest) price.
export function getItemPrices(item: CartItem): Record<Currency, number> {
  if (item.variant) {
    const variant = item.product.variants?.find(v => v.value === item.variant);
    if (variant) return variant.prices;
  }
  return item.product.prices;
}

export const EXCHANGE_RATES: Record<Currency, number> = {
  NZD: 1,
  CNY: 4.5,
  USD: 0.6,
};

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  NZD: 'NZD $',
  CNY: '¥',
  USD: 'US$',
};

// NZ standard + Chinese standard bed sizes — matches the size matrix offered on pacificalpacas.com.
// This local fallback catalogue has no per-size pricing data of its own, so every
// size is priced the same as the base product (matches its historical behavior).
const DUVET_SIZE_LABELS = [
  { label: 'Single (140×210cm)', value: 'single-140x210' },
  { label: 'King Single (180×210cm)', value: 'king-single-180x210' },
  { label: 'Queen (210×210cm)', value: 'queen-210x210' },
  { label: 'King (240×210cm)', value: 'king-240x210' },
  { label: 'Super King (265×210cm)', value: 'super-king-265x210' },
  { label: 'Chinese Single (150×200cm)', value: 'cn-single-150x200' },
  { label: 'Chinese Double (180×200cm)', value: 'cn-double-180x200' },
  { label: 'Chinese Queen (200×230cm)', value: 'cn-queen-200x230' },
  { label: 'Chinese King (220×240cm)', value: 'cn-king-220x240' },
];

function sameSizeVariants(labels: { label: string; value: string }[], prices: Record<Currency, number>): ProductVariant[] {
  return labels.map(l => ({ ...l, prices }));
}

export const products: Product[] = [
  {
    id: 'duvet-classic',
    nameEn: 'Classic Alpaca Duvet',
    nameZh: '经典款羊驼被',
    descEn: 'Our flagship 100% alpaca fiber duvet with 40S pure cotton cover. Spring/Autumn weight.',
    descZh: '旗舰款100%羊驼毛填充，40S纯棉面料。春秋款。',
    category: 'bedding',
    prices: { NZD: 579, CNY: 2880, USD: 349 },
    image: '/images/product-duvet-rolled.jpg',
    badge: 'Bestseller',
    stock: 45,
    featured: true,
    variants: sameSizeVariants(DUVET_SIZE_LABELS, { NZD: 579, CNY: 2880, USD: 349 }),
  },
  {
    id: 'duvet-luxury',
    nameEn: 'Luxury Alpaca Duvet',
    nameZh: '轻奢款羊驼被',
    descEn: 'Premium belly-fiber fill with 180S Pima cotton. Unparalleled softness.',
    descZh: '甄选羊驼腹部毛填充，180S匹马棉面料。极致柔软。',
    category: 'bedding',
    prices: { NZD: 1280, CNY: 5880, USD: 768 },
    image: '/images/product-duvet-giftbox.jpg',
    stock: 20,
    featured: true,
    variants: sameSizeVariants(DUVET_SIZE_LABELS, { NZD: 1280, CNY: 5880, USD: 768 }),
  },
  {
    id: 'duvet-premium',
    nameEn: 'Premium Luxury Duvet',
    nameZh: '高奢款羊驼被',
    descEn: 'Young alpaca fiber (<3yo) with 180S Egyptian long-staple cotton. The pinnacle.',
    descZh: '3岁以下小羊驼毛，180S埃及长绒棉。至臻之选。',
    category: 'bedding',
    prices: { NZD: 2680, CNY: 12800, USD: 1608 },
    image: '/images/product-duvet-box.jpg',
    badge: 'Premium',
    stock: 8,
    featured: true,
    variants: sameSizeVariants(DUVET_SIZE_LABELS, { NZD: 2680, CNY: 12800, USD: 1608 }),
  },
  {
    id: 'coat-classic',
    nameEn: 'Cloud of Dreams Coat',
    nameZh: '云梦羊驼大衣',
    descEn: '40% wool + 60% alpaca fiber blend. Lightweight, warm, anti-pilling.',
    descZh: '40%羊毛+60%羊驼纤维混纺。轻盈保暖，抗起球。',
    category: 'outerwear',
    prices: { NZD: 980, CNY: 5980, USD: 588 },
    image: '/images/product-coat-cloud-camel.jpg',
    stock: 30,
    featured: true,
    variants: sameSizeVariants(
      [{ label: 'S', value: 'S' }, { label: 'M', value: 'M' }, { label: 'L', value: 'L' }],
      { NZD: 980, CNY: 5980, USD: 588 },
    ),
  },
  {
    id: 'vest-x6',
    nameEn: 'X6 Alpaca Vest',
    nameZh: 'X6羊驼马甲',
    descEn: '100% alpaca fiber with DuPont 3-proof fabric. Zero-weight warmth.',
    descZh: '100%羊驼毛填充，杜邦三防面料。零负重锁温。',
    category: 'outerwear',
    prices: { NZD: 380, CNY: 1980, USD: 228 },
    image: '/images/product-vest-x6-giftbag.jpg',
    stock: 50,
    featured: true,
    variants: sameSizeVariants(
      [{ label: 'S', value: 'S' }, { label: 'M', value: 'M' }, { label: 'L', value: 'L' }, { label: 'XL', value: 'XL' }],
      { NZD: 380, CNY: 1980, USD: 228 },
    ),
  },
  {
    id: 'sweater-alpaca',
    nameEn: 'Alpaca Sweater',
    nameZh: '羊驼毛衣',
    descEn: 'Soft, breathable knitwear made from premium alpaca fiber.',
    descZh: '甄选优质羊驼纤维，柔软透气针织毛衣。',
    category: 'accessories',
    prices: { NZD: 220, CNY: 1280, USD: 132 },
    image: '/images/product-sweater-cardigan-lifestyle.jpg',
    stock: 35,
    featured: false,
  },
  {
    id: 'scarf-alpaca',
    nameEn: 'Alpaca Scarf',
    nameZh: '羊驼围巾',
    descEn: 'Elegant warmth for any occasion. Ultra-soft alpaca fiber.',
    descZh: '优雅温暖，适合任何场合。超柔羊驼纤维。',
    category: 'accessories',
    prices: { NZD: 120, CNY: 680, USD: 72 },
    image: '/images/product-scarf-maori.jpg',
    stock: 60,
    featured: false,
  },
  {
    id: 'duvet-newborn',
    nameEn: 'Newborn Alpaca Blanket',
    nameZh: '初生羊驼被',
    descEn: 'Pure newborn comfort. 100S organic long-staple cotton with 100% alpaca fill.',
    descZh: '纯净初生，安享睡眠。100S有机长绒棉，100%羊驼毛填充。',
    category: 'bedding',
    prices: { NZD: 289, CNY: 1680, USD: 173 },
    image: '/images/product-newborn-blanket.jpg',
    stock: 25,
    featured: false,
  },
];

export const PROMO_CODES: Record<string, { discount: number; type: 'percent' | 'fixed'; minAmount?: number }> = {
  'WELCOME10': { discount: 10, type: 'percent' },
  'LUXURY20': { discount: 20, type: 'percent', minAmount: 500 },
  'ALPACA50': { discount: 50, type: 'fixed' },
};

export function formatPrice(amount: number, currency: Currency): string {
  const symbol = CURRENCY_SYMBOLS[currency];
  if (currency === 'CNY') {
    return `${symbol}${amount.toLocaleString()}`;
  }
  return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 0 })}`;
}
