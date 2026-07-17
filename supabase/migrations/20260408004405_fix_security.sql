
-- Fix grower_transactions missing RLS policy
CREATE POLICY "grower_transactions_read" ON public.grower_transactions
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "grower_transactions_insert" ON public.grower_transactions
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Fix update_updated_at_column search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
