import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type ProductCertificate = Tables<'product_certificates'>;

export function useCertificates(productId?: string) {
  return useQuery({
    queryKey: ['certificates', productId],
    queryFn: async () => {
      let query = supabase
        .from('product_certificates')
        .select('*')
        .order('created_at', { ascending: false });
      if (productId) query = query.eq('product_id', productId);

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled: productId !== undefined,
  });
}

interface GenerateCertificatesInput {
  productId: string;
  fiberBatchId: string | null;
  quantity: number;
}

// Codes are generated server-side by generate_certificate_code() (the column
// default) — we only supply the product/batch link, one row per unit.
export function useGenerateCertificates() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, fiberBatchId, quantity }: GenerateCertificatesInput) => {
      const rows = Array.from({ length: quantity }, () => ({
        product_id: productId,
        fiber_batch_id: fiberBatchId,
      }));
      const { data, error } = await supabase.from('product_certificates').insert(rows).select();
      if (error) throw error;
      return data ?? [];
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['certificates', variables.productId] });
    },
  });
}
