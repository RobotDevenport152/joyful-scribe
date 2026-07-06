-- Fixes two known P1 bugs documented in CLAUDE.md §18 "Known Bugs":
--
-- 1. app_role enum was ('admin','moderator','user') — 'grower' and
--    'customer' were never added, even though ProtectedRoute and
--    has_role() are called with requiredRole="grower" throughout the app.
--    Every such call currently throws a DB error (invalid enum input),
--    so grower routes were only ever protected by the dashboard's own
--    ad-hoc `.eq('user_id', user.id)` lookup, not by has_role()/RLS.
--
-- 2. orders.status check constraint didn't allow 'payment_failed', even
--    though OrderSuccess.tsx has a whole UI branch for it. That branch
--    was dead code — the DB could never actually store that value.

-- ── 1. Extend app_role enum ────────────────────────────────────────────────
-- ADD VALUE IF NOT EXISTS is safe to re-run and does not require recreating
-- the type or touching existing rows.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'grower';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'customer';

-- ── 2. Extend orders.status check constraint ───────────────────────────────
-- The original constraint was unnamed, so look it up by inspecting which
-- constraint is actually attached to orders.status rather than assuming
-- Postgres's default auto-generated name.
DO $$
DECLARE
  con record;
BEGIN
  FOR con IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.orders'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE public.orders DROP CONSTRAINT %I', con.conname);
  END LOOP;
END $$;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'paid', 'processing', 'payment_failed', 'shipped', 'delivered', 'cancelled'));
