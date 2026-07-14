-- Fixes from Supabase Performance Advisor, batch 2: multiple_permissive_policies.
-- Pattern: each table had a broad "<table>_admin_all" (FOR ALL) policy plus one or
-- more narrower per-command policies (owner/public read, owner insert, etc). Postgres
-- OR's multiple PERMISSIVE policies together per command, so having both cost an extra
-- policy evaluation on every query. Fix: split the admin ALL policy into per-command
-- policies and merge each with its overlapping narrow policy via OR — net access is
-- unchanged (admin OR owner/public, same as before), just evaluated as one policy
-- instead of two.

-- ── fiber_batches (SELECT overlap: admin_all + public_read) ────────────────
DROP POLICY IF EXISTS fiber_batches_admin_all ON public.fiber_batches;
DROP POLICY IF EXISTS fiber_batches_public_read ON public.fiber_batches;

CREATE POLICY fiber_batches_select ON public.fiber_batches
  FOR SELECT USING (true);
CREATE POLICY fiber_batches_admin_insert ON public.fiber_batches
  FOR INSERT WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));
CREATE POLICY fiber_batches_admin_update ON public.fiber_batches
  FOR UPDATE USING (has_role((select auth.uid()), 'admin'::app_role))
             WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));
CREATE POLICY fiber_batches_admin_delete ON public.fiber_batches
  FOR DELETE USING (has_role((select auth.uid()), 'admin'::app_role));

-- ── grower_applications (INSERT/SELECT overlap) ─────────────────────────────
DROP POLICY IF EXISTS grower_applications_admin_all ON public.grower_applications;
DROP POLICY IF EXISTS grower_applications_own_insert ON public.grower_applications;
DROP POLICY IF EXISTS grower_applications_own_select ON public.grower_applications;

CREATE POLICY grower_applications_select ON public.grower_applications
  FOR SELECT USING (
    user_id = (select auth.uid()) OR has_role((select auth.uid()), 'admin'::app_role)
  );
CREATE POLICY grower_applications_insert ON public.grower_applications
  FOR INSERT WITH CHECK (
    user_id = (select auth.uid()) OR has_role((select auth.uid()), 'admin'::app_role)
  );
CREATE POLICY grower_applications_admin_update ON public.grower_applications
  FOR UPDATE USING (has_role((select auth.uid()), 'admin'::app_role))
             WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));
CREATE POLICY grower_applications_admin_delete ON public.grower_applications
  FOR DELETE USING (has_role((select auth.uid()), 'admin'::app_role));

-- ── growers (SELECT/UPDATE overlap) ─────────────────────────────────────────
DROP POLICY IF EXISTS growers_admin_all ON public.growers;
DROP POLICY IF EXISTS growers_public_read ON public.growers;
DROP POLICY IF EXISTS growers_own_update ON public.growers;

CREATE POLICY growers_select ON public.growers
  FOR SELECT USING (true);
CREATE POLICY growers_update ON public.growers
  FOR UPDATE USING (
    (user_id = (select auth.uid()))
    OR (owner_name = ((SELECT users.email FROM auth.users WHERE users.id = (select auth.uid()))::text))
    OR has_role((select auth.uid()), 'admin'::app_role)
  )
  WITH CHECK (
    (user_id = (select auth.uid()))
    OR (owner_name = ((SELECT users.email FROM auth.users WHERE users.id = (select auth.uid()))::text))
    OR has_role((select auth.uid()), 'admin'::app_role)
  );
CREATE POLICY growers_admin_insert ON public.growers
  FOR INSERT WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));
CREATE POLICY growers_admin_delete ON public.growers
  FOR DELETE USING (has_role((select auth.uid()), 'admin'::app_role));

-- ── order_items (INSERT/SELECT overlap) ─────────────────────────────────────
DROP POLICY IF EXISTS order_items_admin_all ON public.order_items;
DROP POLICY IF EXISTS order_items_insert ON public.order_items;
DROP POLICY IF EXISTS order_items_own_read ON public.order_items;

CREATE POLICY order_items_select ON public.order_items
  FOR SELECT USING (
    order_id IN (SELECT orders.id FROM orders WHERE orders.user_id = (select auth.uid()))
    OR has_role((select auth.uid()), 'admin'::app_role)
  );
CREATE POLICY order_items_insert ON public.order_items
  FOR INSERT WITH CHECK (
    order_id IN (SELECT orders.id FROM orders WHERE orders.user_id = (select auth.uid()))
    OR has_role((select auth.uid()), 'admin'::app_role)
  );
CREATE POLICY order_items_admin_update ON public.order_items
  FOR UPDATE USING (has_role((select auth.uid()), 'admin'::app_role))
             WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));
CREATE POLICY order_items_admin_delete ON public.order_items
  FOR DELETE USING (has_role((select auth.uid()), 'admin'::app_role));

-- ── orders (INSERT/SELECT overlap) ───────────────────────────────────────────
DROP POLICY IF EXISTS orders_admin_all ON public.orders;
DROP POLICY IF EXISTS orders_insert ON public.orders;
DROP POLICY IF EXISTS orders_own_read ON public.orders;

CREATE POLICY orders_select ON public.orders
  FOR SELECT USING (
    (select auth.uid()) = user_id OR has_role((select auth.uid()), 'admin'::app_role)
  );
CREATE POLICY orders_insert ON public.orders
  FOR INSERT WITH CHECK (
    (select auth.uid()) = user_id OR has_role((select auth.uid()), 'admin'::app_role)
  );
CREATE POLICY orders_admin_update ON public.orders
  FOR UPDATE USING (has_role((select auth.uid()), 'admin'::app_role))
             WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));
CREATE POLICY orders_admin_delete ON public.orders
  FOR DELETE USING (has_role((select auth.uid()), 'admin'::app_role));

-- ── product_reviews (INSERT/SELECT overlap, SELECT is 3-way) ────────────────
DROP POLICY IF EXISTS reviews_admin_all ON public.product_reviews;
DROP POLICY IF EXISTS reviews_insert_own_verified_purchase ON public.product_reviews;
DROP POLICY IF EXISTS reviews_own_read ON public.product_reviews;
DROP POLICY IF EXISTS reviews_public_read_approved ON public.product_reviews;

CREATE POLICY reviews_select ON public.product_reviews
  FOR SELECT USING (
    status = 'approved'::text
    OR user_id = (select auth.uid())
    OR has_role((select auth.uid()), 'admin'::app_role)
  );
CREATE POLICY reviews_insert ON public.product_reviews
  FOR INSERT WITH CHECK (
    (user_id = (select auth.uid()) AND can_review_product((select auth.uid()), order_id, product_id))
    OR has_role((select auth.uid()), 'admin'::app_role)
  );
CREATE POLICY reviews_admin_update ON public.product_reviews
  FOR UPDATE USING (has_role((select auth.uid()), 'admin'::app_role))
             WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));
CREATE POLICY reviews_admin_delete ON public.product_reviews
  FOR DELETE USING (has_role((select auth.uid()), 'admin'::app_role));

-- ── products (SELECT overlap) ────────────────────────────────────────────────
DROP POLICY IF EXISTS products_admin_all ON public.products;
DROP POLICY IF EXISTS products_public_read ON public.products;

CREATE POLICY products_select ON public.products
  FOR SELECT USING (
    is_active = true OR has_role((select auth.uid()), 'admin'::app_role)
  );
CREATE POLICY products_admin_insert ON public.products
  FOR INSERT WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));
CREATE POLICY products_admin_update ON public.products
  FOR UPDATE USING (has_role((select auth.uid()), 'admin'::app_role))
             WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));
CREATE POLICY products_admin_delete ON public.products
  FOR DELETE USING (has_role((select auth.uid()), 'admin'::app_role));

-- ── promo_codes (SELECT overlap) ─────────────────────────────────────────────
DROP POLICY IF EXISTS promo_admin_all ON public.promo_codes;
DROP POLICY IF EXISTS promo_public_read ON public.promo_codes;

CREATE POLICY promo_select ON public.promo_codes
  FOR SELECT USING (
    is_active = true OR has_role((select auth.uid()), 'admin'::app_role)
  );
CREATE POLICY promo_admin_insert ON public.promo_codes
  FOR INSERT WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));
CREATE POLICY promo_admin_update ON public.promo_codes
  FOR UPDATE USING (has_role((select auth.uid()), 'admin'::app_role))
             WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));
CREATE POLICY promo_admin_delete ON public.promo_codes
  FOR DELETE USING (has_role((select auth.uid()), 'admin'::app_role));

-- ── stock_notifications (INSERT overlap) ─────────────────────────────────────
DROP POLICY IF EXISTS stock_notifications_admin ON public.stock_notifications;
DROP POLICY IF EXISTS stock_notifications_insert ON public.stock_notifications;

CREATE POLICY stock_notifications_insert ON public.stock_notifications
  FOR INSERT WITH CHECK (
    length(email) > 3 OR has_role((select auth.uid()), 'admin'::app_role)
  );
CREATE POLICY stock_notifications_admin_select ON public.stock_notifications
  FOR SELECT USING (has_role((select auth.uid()), 'admin'::app_role));
CREATE POLICY stock_notifications_admin_update ON public.stock_notifications
  FOR UPDATE USING (has_role((select auth.uid()), 'admin'::app_role))
             WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));
CREATE POLICY stock_notifications_admin_delete ON public.stock_notifications
  FOR DELETE USING (has_role((select auth.uid()), 'admin'::app_role));

-- ── user_roles (SELECT overlap) ──────────────────────────────────────────────
DROP POLICY IF EXISTS user_roles_admin_all ON public.user_roles;
DROP POLICY IF EXISTS user_roles_own_read ON public.user_roles;

CREATE POLICY user_roles_select ON public.user_roles
  FOR SELECT USING (
    user_id = (select auth.uid()) OR has_role((select auth.uid()), 'admin'::app_role)
  );
CREATE POLICY user_roles_admin_insert ON public.user_roles
  FOR INSERT WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));
CREATE POLICY user_roles_admin_update ON public.user_roles
  FOR UPDATE USING (has_role((select auth.uid()), 'admin'::app_role))
             WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));
CREATE POLICY user_roles_admin_delete ON public.user_roles
  FOR DELETE USING (has_role((select auth.uid()), 'admin'::app_role));
