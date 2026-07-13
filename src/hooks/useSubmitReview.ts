import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SubmitReviewInput {
  productId: string;
  orderId: string;
  userId: string;
  rating: number;
  comment: string;
  authorName: string;
  variant: string | null;
}

// Insert is gated by the reviews_insert_own_verified_purchase RLS policy
// (can_review_product) — this call will fail server-side for anyone who
// didn't actually pay for this product, regardless of what the client sends.
export function useSubmitReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SubmitReviewInput) => {
      const { error } = await supabase.from('product_reviews').insert({
        product_id: input.productId,
        order_id: input.orderId,
        user_id: input.userId,
        rating: input.rating,
        comment: input.comment,
        author_name: input.authorName,
        variant: input.variant,
      });
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['review-eligibility', variables.productId, variables.userId] });
    },
  });
}
