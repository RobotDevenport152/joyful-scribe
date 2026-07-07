import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { products as LOCAL_PRODUCTS } from '@/lib/store';
import type { Tables } from '@/integrations/supabase/types';
import type { Currency } from '@/lib/store';
import { useExchangeRates, type ExchangeRates } from '@/hooks/useExchangeRates';

type DbProduct = Tables<'products'>;

const FALLBACK_RATES: ExchangeRates = { NZD: 1, CNY: 4.5, USD: 0.6 };

// Convert DB product to legacy Product format for compatibility
export function dbToLegacyProduct(p: DbProduct, rates: ExchangeRates = FALLBACK_RATES) {
  // images is jsonb [{url,alt,is_primary}] or text[] of URL strings — handle both
  const rawImages = Array.isArray(p.images) ? (p.images as any[]) : [];
  const imageUrls: string[] = rawImages
    .map((img: any) => (typeof img === 'string' ? img : img?.url || ''))
    .filter(Boolean);
  const images = imageUrls;
  const nzd = Number(p.price_nzd);
  return {
    id: p.id,
    nameEn: p.name_en,
    nameZh: p.name_zh,
    descEn: p.description_en || '',
    descZh: p.description_zh || '',
    category: p.category as any,
    prices: {
      NZD: nzd,
      CNY: Math.round(nzd * rates.CNY),
      USD: Math.round(nzd * rates.USD),
    } as Record<Currency, number>,
    image: images[0] || '/placeholder.svg',
    images: images,
    badge: p.is_featured ? 'Featured' : undefined,
    variants: Array.isArray(p.size_options)
      ? (p.size_options as any[]).map((v: any) => ({ label: v.name || v.label || v, value: v.name || v.value || v }))
      : undefined,
    stock: p.stock_quantity ?? 0,
    featured: p.is_featured ?? false,
    slug: p.slug,
    rating: 0,
    reviewCount: 0,
    weight: p.weight_grams ? `${p.weight_grams}g` : null,
    fillPower: p.fill_material || null,
    certifications: Array.isArray(p.certifications) ? (p.certifications as string[]) : [],
  };
}

export function useProducts(category?: string) {
  const { rates } = useExchangeRates();
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const useLocal = !SUPABASE_URL;
  const queryKey = useLocal
    ? ['products', category, rates, 'local-fallback']
    : ['products', category, rates];

  const queryFn = async () => {
    if (useLocal) {
      const list = LOCAL_PRODUCTS.slice();
      if (category && category !== 'all') return list.filter(p => p.category === category);
      return list;
    }

    let query = supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('is_featured', { ascending: false });

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(p => dbToLegacyProduct(p, rates));
  };

  return useQuery({ queryKey, queryFn });
}

export function useProduct(id: string) {
  const { rates } = useExchangeRates();
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const useLocal = !SUPABASE_URL;
  const queryKey = useLocal ? ['product', id, rates, 'local-fallback'] : ['product', id, rates];

  const queryFn = async () => {
    if (useLocal) {
      const found = LOCAL_PRODUCTS.find(p => p.id === id || p.slug === id);
      if (!found) throw new Error('Product not found');
      return found;
    }

    // Try by UUID first, then by slug
    let result = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (!result.data) {
      result = await supabase
        .from('products')
        .select('*')
        .eq('slug', id)
        .maybeSingle();
    }

    if (result.error) throw result.error;
    if (!result.data) throw new Error('Product not found');
    return dbToLegacyProduct(result.data, rates);
  };

  return useQuery({ queryKey, queryFn, enabled: !!id });
}

export function useFeaturedProducts() {
  const { rates } = useExchangeRates();
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const useLocal = !SUPABASE_URL;
  const queryKey = useLocal ? ['products', 'featured', rates, 'local-fallback'] : ['products', 'featured', rates];

  const queryFn = async () => {
    if (useLocal) return LOCAL_PRODUCTS.filter(p => p.featured && p.stock > 0).slice(0, 6);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_featured', true)
      .eq('is_active', true)
      .limit(6);
    if (error) throw error;
    return (data ?? []).map(p => dbToLegacyProduct(p, rates));
  };

  return useQuery({ queryKey, queryFn });
}
