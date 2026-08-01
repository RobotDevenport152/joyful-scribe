-- One-time reconciliation for the stock-decrement bug fixed in
-- 20260731120000_atomic_checkout_fulfillment.sql: decrement_stock() had been
-- silently broken since 20260408003807 (reading a JSON column that no longer
-- existed on `orders`), so no paid order's stock was ever actually
-- subtracted from products.stock_quantity. The new trigger added in that
-- migration only fires on order_items rows inserted after it exists -- it
-- cannot retroactively correct quantities already sold. This corrects that
-- historical drift once, so future decrements start from an accurate
-- baseline instead of freezing the existing error in place.
--
-- Verified against production before writing this (2026-08-01): 7 paid
-- orders, 6 units of real drift across 3 products (Cloud of Dreams Coat -4,
-- Premium Luxury Duvet -1, All-Seasons Duvets -1), all remain comfortably
-- positive after correction -- this is a live query over order_items/orders
-- rather than hardcoded product ids/quantities, so it stays correct for
-- whatever has actually sold by the time this migration is applied, not just
-- what was true at the moment this file was written.
--
-- Safe to run exactly once: this and 20260731120000 are applied together in
-- the same deploy, and the new order_items-insert trigger only fires on rows
-- inserted after it's created, so every order_items row visible to the
-- subquery below necessarily predates the trigger's existence and has never
-- been decremented.
update public.products p
set stock_quantity = p.stock_quantity - sold.qty,
    updated_at = now()
from (
  select oi.product_id, sum(oi.quantity) as qty
  from public.order_items oi
  join public.orders o on o.id = oi.order_id
  where o.status = 'paid'
    and oi.product_id is not null
  group by oi.product_id
) sold
where p.id = sold.product_id;
