import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type GrowerTransaction = Tables<'grower_transactions'>;

export interface GrowerCreditsData {
  balance: number;
  transactions: GrowerTransaction[];
}

export function useGrowerCredits(userId: string) {
  return useQuery<GrowerCreditsData>({
    queryKey: ['grower-credits', userId],
    queryFn: async () => {
      // growers.user_id added via migration 20260329100000_add_growers_user_id.sql
      const { data: grower } = await supabase
        .from('growers')
        .select('id, credit_balance')
        .eq('user_id' as never, userId)
        .maybeSingle();

      if (!grower) return { balance: 0, transactions: [] };

      const { data: transactions, error } = await supabase
        .from('grower_transactions')
        .select('*')
        .eq('grower_id', grower.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        balance: Number(grower.credit_balance ?? 0),
        transactions: transactions ?? [],
      };
    },
    enabled: !!userId,
  });
}
