import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Stock changes far more often than the rest of a product's data (name, price,
// images), so this deliberately bypasses useProduct()'s 5-minute cache
// (CLAUDE.md §17) with its own always-fresh, frequently-polled query instead.
// Shared by LiveInventory (the "in stock / low stock / out of stock" label)
// and ProductDetail's Add to Cart buttons, which used to read the cached
// product.stock instead — the two could disagree for up to 5 minutes after a
// product actually sold out, showing "Out of Stock" next to a still-clickable
// Add to Cart button. Both must read from here so they can't drift apart again.
export function useLiveStock(productId: string | undefined) {
  return useQuery({
    queryKey: ['inventory', productId],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', productId!)
        .single();
      return data?.stock_quantity ?? 0;
    },
    enabled: !!productId,
    refetchInterval: 30000,
    staleTime: 0,
  });
}
