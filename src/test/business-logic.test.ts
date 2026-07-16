import { describe, it, expect } from 'vitest';
import { formatPrice, CURRENCY_SYMBOLS, EXCHANGE_RATES, getItemPrices, type CartItem } from '@/lib/store';
import { checkoutSchema, contactSchema, batchCodeSchema } from '@/lib/schemas';
import { dbToLegacyProduct } from '@/hooks/useProducts';
import type { Tables } from '@/integrations/supabase/types';

// ── formatPrice ────────────────────────────────────────────────────────────────

describe('formatPrice', () => {
  it('formats NZD with symbol', () => {
    expect(formatPrice(579, 'NZD')).toBe('NZD $579');
  });

  it('formats CNY with ¥ and no decimal', () => {
    expect(formatPrice(2880, 'CNY')).toBe('¥2,880');
  });

  it('formats USD with symbol', () => {
    expect(formatPrice(349, 'USD')).toBe('US$349');
  });

  it('formats zero correctly', () => {
    expect(formatPrice(0, 'NZD')).toBe('NZD $0');
  });

  it('formats large amounts with thousand separator', () => {
    expect(formatPrice(10000, 'CNY')).toBe('¥10,000');
  });
});

// ── CURRENCY_SYMBOLS ──────────────────────────────────────────────────────────

describe('CURRENCY_SYMBOLS', () => {
  it('has correct symbols for all three currencies', () => {
    expect(CURRENCY_SYMBOLS.NZD).toBe('NZD $');
    expect(CURRENCY_SYMBOLS.CNY).toBe('¥');
    expect(CURRENCY_SYMBOLS.USD).toBe('US$');
  });
});

// ── EXCHANGE_RATES fallback ───────────────────────────────────────────────────

describe('EXCHANGE_RATES fallback', () => {
  it('NZD base rate is 1', () => {
    expect(EXCHANGE_RATES.NZD).toBe(1);
  });

  it('CNY fallback is approximately 4-5x NZD', () => {
    expect(EXCHANGE_RATES.CNY).toBeGreaterThan(3);
    expect(EXCHANGE_RATES.CNY).toBeLessThan(7);
  });

  it('USD fallback is below 1 NZD', () => {
    expect(EXCHANGE_RATES.USD).toBeGreaterThan(0);
    expect(EXCHANGE_RATES.USD).toBeLessThan(1);
  });
});

// ── dbToLegacyProduct ─────────────────────────────────────────────────────────

const mockDbProduct: Tables<'products'> = {
  id: 'test-id',
  name_en: 'Classic Alpaca Duvet',
  name_zh: '经典款羊驼被',
  slug: 'classic-alpaca-duvet',
  category: 'duvet',
  tier: 'classic',
  description_en: 'A fine duvet.',
  description_zh: '一条精美的被子。',
  price_nzd: 500,
  stock_quantity: 10,
  is_active: true,
  is_featured: false,
  sort_order: 1,
  images: [{ url: '/img/duvet.jpg', alt: 'duvet', is_primary: true }],
  certifications: ['NZ Made'],
  size_options: [{ name: '200x230cm', value: '200x230' }],
  color_options: null,
  fill_material: '100% alpaca',
  fabric_material: '40S cotton',
  fiber_batch_id: null,
  weight_grams: 2600,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

describe('dbToLegacyProduct', () => {
  it('maps name fields correctly', () => {
    const p = dbToLegacyProduct(mockDbProduct);
    expect(p.nameEn).toBe('Classic Alpaca Duvet');
    expect(p.nameZh).toBe('经典款羊驼被');
  });

  it('uses NZD as source of truth for prices', () => {
    const p = dbToLegacyProduct(mockDbProduct);
    expect(p.prices.NZD).toBe(500);
  });

  it('converts CNY using provided rates', () => {
    const rates = { NZD: 1, CNY: 5.0, USD: 0.6 };
    const p = dbToLegacyProduct(mockDbProduct, rates);
    expect(p.prices.CNY).toBe(2500); // 500 * 5.0
  });

  it('converts USD using provided rates', () => {
    const rates = { NZD: 1, CNY: 4.5, USD: 0.6 };
    const p = dbToLegacyProduct(mockDbProduct, rates);
    expect(p.prices.USD).toBe(300); // 500 * 0.6
  });

  it('falls back to default rates when none provided', () => {
    const p = dbToLegacyProduct(mockDbProduct);
    expect(p.prices.CNY).toBe(Math.round(500 * 4.5));
  });

  it('extracts image URL from jsonb array', () => {
    const p = dbToLegacyProduct(mockDbProduct);
    expect(p.image).toBe('/img/duvet.jpg');
  });

  it('falls back to placeholder when images is empty', () => {
    const p = dbToLegacyProduct({ ...mockDbProduct, images: [] });
    expect(p.image).toBe('/placeholder.svg');
  });

  it('maps stock_quantity to stock', () => {
    const p = dbToLegacyProduct(mockDbProduct);
    expect(p.stock).toBe(10);
  });

  it('stock defaults to 0 when null', () => {
    const p = dbToLegacyProduct({ ...mockDbProduct, stock_quantity: null });
    expect(p.stock).toBe(0);
  });

  it('variants without a price_nzd override inherit the base product price', () => {
    const p = dbToLegacyProduct(mockDbProduct);
    expect(p.variants?.[0].prices.NZD).toBe(500);
  });

  it('variants with a price_nzd override price independently of the base product', () => {
    const p = dbToLegacyProduct({
      ...mockDbProduct,
      size_options: [
        { label: 'Small', price_nzd: 840 },
        { label: 'Large', price_nzd: 10286 },
      ],
    });
    expect(p.variants?.[0].prices.NZD).toBe(840);
    expect(p.variants?.[1].prices.NZD).toBe(10286);
    // Base product price is unaffected by variant overrides
    expect(p.prices.NZD).toBe(500);
  });

  it('handles legacy plain-string size_options (no per-size price)', () => {
    const p = dbToLegacyProduct({ ...mockDbProduct, size_options: ['Queen', 'King'] });
    expect(p.variants).toEqual([
      { label: 'Queen', value: 'Queen', prices: p.prices },
      { label: 'King', value: 'King', prices: p.prices },
    ]);
  });
});

// ── getItemPrices ──────────────────────────────────────────────────────────────

describe('getItemPrices', () => {
  const product = dbToLegacyProduct({
    ...mockDbProduct,
    size_options: [
      { label: 'Small', price_nzd: 840 },
      { label: 'Large', price_nzd: 10286 },
    ],
  });

  it('returns the base product price when no variant is selected', () => {
    const item: CartItem = { product, quantity: 1 };
    expect(getItemPrices(item).NZD).toBe(500);
  });

  it("returns the selected variant's own price, not the base product price", () => {
    const item: CartItem = { product, quantity: 1, variant: 'Large' };
    expect(getItemPrices(item).NZD).toBe(10286);
  });

  it('falls back to the base price if the variant string does not match any known variant', () => {
    const item: CartItem = { product, quantity: 1, variant: 'Nonexistent Size' };
    expect(getItemPrices(item).NZD).toBe(500);
  });
});

// ── checkoutSchema ─────────────────────────────────────────────────────────────

describe('checkoutSchema', () => {
  const valid = {
    name: 'Li Wei',
    email: 'li@example.com',
    phone: '0211234567',
    province: 'Guangdong',
    city: 'Shenzhen',
    address: '123 Test Street',
    paymentMethod: 'stripe' as const,
    isGift: false,
  };

  it('accepts valid data', () => {
    expect(() => checkoutSchema.parse(valid)).not.toThrow();
  });

  it('rejects empty name', () => {
    const result = checkoutSchema.safeParse({ ...valid, name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects malformed email', () => {
    const result = checkoutSchema.safeParse({ ...valid, email: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('rejects short phone', () => {
    const result = checkoutSchema.safeParse({ ...valid, phone: '123' });
    expect(result.success).toBe(false);
  });

  // A physical product needs a shipping address — these were previously
  // .optional() in the schema, so an order could be placed and paid for
  // with zero address info and would have no way to ship.
  it('rejects missing province', () => {
    const result = checkoutSchema.safeParse({ ...valid, province: undefined });
    expect(result.success).toBe(false);
  });

  it('rejects missing city', () => {
    const result = checkoutSchema.safeParse({ ...valid, city: undefined });
    expect(result.success).toBe(false);
  });

  it('rejects missing address', () => {
    const result = checkoutSchema.safeParse({ ...valid, address: undefined });
    expect(result.success).toBe(false);
  });

  it('accepts missing district (still optional)', () => {
    const result = checkoutSchema.safeParse({ ...valid, district: undefined });
    expect(result.success).toBe(true);
  });

  it('rejects invalid payment method', () => {
    const result = checkoutSchema.safeParse({ ...valid, paymentMethod: 'bitcoin' });
    expect(result.success).toBe(false);
  });

  it('gift message over 100 chars fails', () => {
    const result = checkoutSchema.safeParse({ ...valid, isGift: true, giftMessage: 'a'.repeat(101) });
    expect(result.success).toBe(false);
  });

  it('gift message of exactly 100 chars passes', () => {
    const result = checkoutSchema.safeParse({ ...valid, isGift: true, giftMessage: 'a'.repeat(100) });
    expect(result.success).toBe(true);
  });
});

// ── contactSchema ──────────────────────────────────────────────────────────────

describe('contactSchema', () => {
  const valid = { name: 'Ben', email: 'ben@example.com', message: 'Hello there, I have a question.' };

  it('accepts valid data', () => {
    expect(() => contactSchema.parse(valid)).not.toThrow();
  });

  it('rejects message shorter than 10 chars', () => {
    const result = contactSchema.safeParse({ ...valid, message: 'Hi' });
    expect(result.success).toBe(false);
  });

  it('email is required and validated', () => {
    const result = contactSchema.safeParse({ ...valid, email: 'bad' });
    expect(result.success).toBe(false);
  });
});

// ── batchCodeSchema ────────────────────────────────────────────────────────────

describe('batchCodeSchema', () => {
  it('accepts valid format PA-YYYY-NNN', () => {
    expect(() => batchCodeSchema.parse('PA-2025-001')).not.toThrow();
    expect(() => batchCodeSchema.parse('PA-2024-999')).not.toThrow();
  });

  it('rejects wrong prefix', () => {
    expect(batchCodeSchema.safeParse('XX-2025-001').success).toBe(false);
  });

  it('rejects missing leading zeros', () => {
    expect(batchCodeSchema.safeParse('PA-2025-1').success).toBe(false);
  });

  it('rejects lowercase', () => {
    expect(batchCodeSchema.safeParse('pa-2025-001').success).toBe(false);
  });

  it('rejects extra characters', () => {
    expect(batchCodeSchema.safeParse('PA-2025-0010').success).toBe(false);
  });
});
