-- Fixes from Supabase Performance/Security Advisor, batch 1: mechanical, zero-semantic-change fixes.
-- 1) auth_rls_initplan: wrap auth.uid() in (select auth.uid()) so Postgres evaluates it once
--    per query (via InitPlan) instead of once per row.
-- 2) unindexed_foreign_keys: add covering indexes on FK columns.
-- 3) unused_index: drop two indexes with zero recorded scans.
-- 4) function_search_path_mutable: pin search_path on generate_certificate_code.

-- ── 1. auth_rls_initplan ────────────────────────────────────────────────────

ALTER POLICY fiber_batches_admin_all ON public.fiber_batches
  USING (has_role((select auth.uid()), 'admin'::app_role));

ALTER POLICY orders_own_read ON public.orders
  USING ((select auth.uid()) = user_id);

ALTER POLICY orders_insert ON public.orders
  WITH CHECK ((select auth.uid()) = user_id);

ALTER POLICY orders_admin_all ON public.orders
  USING (has_role((select auth.uid()), 'admin'::app_role));

ALTER POLICY order_items_own_read ON public.order_items
  USING (order_id IN (SELECT orders.id FROM orders WHERE orders.user_id = (select auth.uid())));

ALTER POLICY order_items_insert ON public.order_items
  WITH CHECK (order_id IN (SELECT orders.id FROM orders WHERE orders.user_id = (select auth.uid())));

ALTER POLICY order_items_admin_all ON public.order_items
  USING (has_role((select auth.uid()), 'admin'::app_role));

ALTER POLICY growers_admin_all ON public.growers
  USING (has_role((select auth.uid()), 'admin'::app_role));

ALTER POLICY growers_own_update ON public.growers
  USING (
    (user_id = (select auth.uid()))
    OR (owner_name = ((SELECT users.email FROM auth.users WHERE users.id = (select auth.uid()))::text))
  )
  WITH CHECK (
    (user_id = (select auth.uid()))
    OR (owner_name = ((SELECT users.email FROM auth.users WHERE users.id = (select auth.uid()))::text))
  );

ALTER POLICY promo_admin_all ON public.promo_codes
  USING (has_role((select auth.uid()), 'admin'::app_role));

ALTER POLICY assessments_admin_read ON public.sleep_assessments
  USING (has_role((select auth.uid()), 'admin'::app_role));

ALTER POLICY user_roles_admin_all ON public.user_roles
  USING (has_role((select auth.uid()), 'admin'::app_role));

ALTER POLICY user_roles_own_read ON public.user_roles
  USING (user_id = (select auth.uid()));

ALTER POLICY stock_notifications_admin ON public.stock_notifications
  USING (has_role((select auth.uid()), 'admin'::app_role));

ALTER POLICY grower_transactions_read ON public.grower_transactions
  USING (has_role((select auth.uid()), 'admin'::app_role));

ALTER POLICY grower_transactions_insert ON public.grower_transactions
  WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));

ALTER POLICY grower_applications_own_insert ON public.grower_applications
  WITH CHECK (user_id = (select auth.uid()));

ALTER POLICY grower_applications_own_select ON public.grower_applications
  USING (user_id = (select auth.uid()));

ALTER POLICY grower_applications_admin_all ON public.grower_applications
  USING (has_role((select auth.uid()), 'admin'::app_role));

ALTER POLICY certificates_admin_all ON public.product_certificates
  USING (has_role((select auth.uid()), 'admin'::app_role));

ALTER POLICY reviews_own_read ON public.product_reviews
  USING (user_id = (select auth.uid()));

ALTER POLICY reviews_insert_own_verified_purchase ON public.product_reviews
  WITH CHECK (
    (user_id = (select auth.uid()))
    AND can_review_product((select auth.uid()), order_id, product_id)
  );

ALTER POLICY reviews_admin_all ON public.product_reviews
  USING (has_role((select auth.uid()), 'admin'::app_role));

ALTER POLICY products_admin_all ON public.products
  USING (has_role((select auth.uid()), 'admin'::app_role));

-- ── 2. unindexed_foreign_keys ────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_checkout_sessions_user_id ON public.checkout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_fiber_batches_grower_id ON public.fiber_batches(grower_id);
CREATE INDEX IF NOT EXISTS idx_grower_applications_reviewed_by ON public.grower_applications(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_grower_transactions_batch_id ON public.grower_transactions(batch_id);
CREATE INDEX IF NOT EXISTS idx_grower_transactions_created_by ON public.grower_transactions(created_by);
CREATE INDEX IF NOT EXISTS idx_grower_transactions_grower_id ON public.grower_transactions(grower_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_product_certificates_created_by ON public.product_certificates(created_by);
CREATE INDEX IF NOT EXISTS idx_product_certificates_fiber_batch_id ON public.product_certificates(fiber_batch_id);
CREATE INDEX IF NOT EXISTS idx_product_certificates_order_id ON public.product_certificates(order_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id ON public.product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_products_fiber_batch_id ON public.products(fiber_batch_id);

-- ── 3. unused_index ──────────────────────────────────────────────────────────
-- Zero recorded scans per advisor; safe to drop pre-launch, cheap to re-add later.

DROP INDEX IF EXISTS public.growers_user_id_idx;
DROP INDEX IF EXISTS public.product_certificates_product_id_idx;

-- ── 4. function_search_path_mutable ─────────────────────────────────────────

ALTER FUNCTION public.generate_certificate_code() SET search_path = public;
