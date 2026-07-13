import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CertificateVerification {
  isValid: boolean;
  productId: string | null;
  productNameZh: string | null;
  productNameEn: string | null;
  productSlug: string | null;
  productImages: unknown;
  fiberBatchId: string | null;
  batchCode: string | null;
  growerFarmName: string | null;
  region: string | null;
  harvestDate: string | null;
  grade: string | null;
  processingStatus: string | null;
  issuedAt: string | null;
  firstVerifiedAt: string | null;
  verificationCount: number | null;
}

// Calls the verify_certificate() RPC rather than selecting product_certificates
// directly — the table has no public read policy, so this RPC is the only
// way to look up a code, and it also increments verification_count server-side.
export function useVerifyCertificate() {
  return useMutation({
    mutationFn: async (code: string): Promise<CertificateVerification> => {
      const { data, error } = await supabase.rpc('verify_certificate', { _code: code.trim() });
      if (error) throw error;

      const row = data?.[0];
      if (!row) {
        return { isValid: false } as CertificateVerification;
      }

      return {
        isValid: row.is_valid,
        productId: row.product_id,
        productNameZh: row.product_name_zh,
        productNameEn: row.product_name_en,
        productSlug: row.product_slug,
        productImages: row.product_images,
        fiberBatchId: row.fiber_batch_id,
        batchCode: row.batch_code,
        growerFarmName: row.grower_farm_name,
        region: row.region,
        harvestDate: row.harvest_date,
        grade: row.grade,
        processingStatus: row.processing_status,
        issuedAt: row.issued_at,
        firstVerifiedAt: row.first_verified_at,
        verificationCount: row.verification_count,
      };
    },
  });
}
