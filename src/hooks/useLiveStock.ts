import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { products as LOCAL_PRODUCTS } from '@/lib/store';

function isSupabaseConfigured() {
  return !!import.meta.env.VITE_SUPABASE_URL;
}

// Stock changes far more often than the rest of a product's data (name, price,
// images), so this deliberately bypasses useProduct()'s 5-minute cache
// (CLAUDE.md §17) with its own always-fresh, frequently-polled query instead.
// Shared by LiveInventory (the "in stock / low stock / out of stock" label)
// and ProductDetail's Add to Cart buttons, which used to read the cached
// product.stock instead — the two could disagree for up to 5 minutes after a
// product actually sold out, showing "Out of Stock" next to a still-clickable
// Add to Cart button. Both must read from here so they can't drift apart again.
//
// Mirrors useProduct()'s local-fallback branch (src/hooks/useProducts.ts):
// without VITE_SUPABASE_URL, the client is the FakeQuery stub (client.ts),
// whose .single() always resolves { data: null }. Without this branch that
// silently collapses `data?.stock_quantity ?? 0` to 0 for every product —
// this is the exact failure mode the commit introducing this hook traced a
// live bug to on Vercel Preview (missing env var → every product "Out of
// Stock" next to an enabled button reading the fallback dataset's own
// number). That instance was patched by adding the env var in Vercel, but
// the same collapse-to-0 happens in any environment without it configured,
// local dev included — so it needs a real fix here, not just there.
//
// productId must be the resolved product UUID (`product.id`), not a raw
// route param — ProductDetail's route also accepts slugs (AI chat links,
// SEO URLs; see useProduct()'s UUID_RE branch), and `.eq('id', ...)` against
// a slug throws "invalid input syntax for type uuid". Passing the raw param
// here would reintroduce, on slug URLs, the exact label/button disagreement
// this hook exists to prevent: LiveInventory (fed product.id) shows real
// stock while the Add to Cart buttons (fed the slug) silently resolve to 0.
export function useLiveStock(productId: string | undefined) {
  return useQuery({
    queryKey: ['inventory', productId],
    queryFn: async () => {
      if (!isSupabaseConfigured()) {
        return LOCAL_PRODUCTS.find(p => p.id === productId)?.stock ?? 0;
      }
      const { data, error } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', productId!)
        .maybeSingle();
      // Throw rather than swallow: `data?.stock_quantity ?? 0` on a real
      // error (vs. a legitimately-missing row) would record a *successful*
      // 0 result, which React Query won't retry — one transient failure
      // would pin the product to "Sold Out" until the next 30s poll.
      // Throwing leaves `data` undefined so callers' `?? product.stock`
      // fallback applies instead, and React Query retries normally.
      if (error) throw error;
      return data?.stock_quantity ?? 0;
    },
    enabled: !!productId,
    refetchInterval: 30000,
    staleTime: 0,
  });
}

// Same always-fresh guarantee as useLiveStock, but for listing pages (Shop's
// grid) that render many products at once. One request for the whole page
// instead of one per card — N individual polling queries would multiply into
// N requests every 30s, and was how the grid ended up reading product.stock
// from useProducts()'s 5-minute cache in the first place (nobody wanted to
// pay for N live queries just to unify with LiveInventory/ProductDetail).
// Keyed by the sorted id set so the query naturally refetches when the
// visible product list changes (e.g. category filter) but not on re-renders.
export function useLiveStockMap(productIds: string[]) {
  const key = [...productIds].sort().join(',');
  return useQuery({
    queryKey: ['inventory-map', key],
    queryFn: async () => {
      if (!isSupabaseConfigured()) {
        const map: Record<string, number> = {};
        for (const id of productIds) map[id] = LOCAL_PRODUCTS.find(p => p.id === id)?.stock ?? 0;
        return map;
      }
      const { data, error } = await supabase
        .from('products')
        .select('id, stock_quantity')
        .in('id', productIds);
      // Same reasoning as useLiveStock: throw on a real error instead of
      // swallowing it into an empty map, so React Query's error/retry flow
      // applies instead of silently caching a stale "no live data" result
      // for a full 30s poll cycle.
      if (error) throw error;
      const map: Record<string, number> = {};
      for (const row of data ?? []) map[row.id] = row.stock_quantity ?? 0;
      return map;
    },
    enabled: productIds.length > 0,
    refetchInterval: 30000,
    staleTime: 0,
  });
}
