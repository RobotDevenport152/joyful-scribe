import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ReviewEligibility {
  eligible: boolean;
  alreadyReviewed: boolean;
  orderId: string | null;
  variant: string | null;
}

// A user can review a product only if they have a paid order containing it
// (enforced again server-side by can_review_product() in the insert RLS
// policy — this hook just decides whether to show the "write a review" form).
export function useReviewEligibility(productId: string | undefined, userId: string | undefined) {
  return useQuery<ReviewEligibility>({
    queryKey: ['review-eligibility', productId, userId],
    queryFn: async () => {
      const { data: existingReview } = await supabase
        .from('product_reviews')
        .select('id')
        .eq('product_id', productId as string)
        .eq('user_id', userId as string)
        .maybeSingle();

      if (existingReview) {
        return { eligible: false, alreadyReviewed: true, orderId: null, variant: null };
      }

      const { data: eligibleOrderItem } = await supabase
        .from('order_items')
        .select('order_id, variant, orders!inner(user_id, status)')
        .eq('product_id', productId as string)
        .eq('orders.user_id', userId as string)
        .eq('orders.status', 'paid')
        .limit(1)
        .maybeSingle();

      if (!eligibleOrderItem) {
        return { eligible: false, alreadyReviewed: false, orderId: null, variant: null };
      }

      return {
        eligible: true,
        alreadyReviewed: false,
        orderId: eligibleOrderItem.order_id,
        variant: eligibleOrderItem.variant,
      };
    },
    enabled: !!productId && !!userId,
  });
}
