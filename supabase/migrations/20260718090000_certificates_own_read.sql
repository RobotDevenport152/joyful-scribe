-- Lets a customer read the certificates tied to their own orders.
-- Previously product_certificates had no policy for regular customers at
-- all (only "certificates_admin_all") because every certificate was
-- pre-printed on a physical card and generated manually via the admin
-- panel, decoupled from any specific online order -- customers never
-- needed to query this table, only the public verify_certificate() RPC.
-- Now that stripe-webhook auto-generates one certificate per unit at
-- checkout time and links it via order_id, a customer needs to be able to
-- see their own order's codes (surfaced in MyOrders.tsx) without needing
-- the admin role.
create policy "certificates_own_read" on public.product_certificates
  for select using (order_id in (select id from public.orders where user_id = auth.uid()));
