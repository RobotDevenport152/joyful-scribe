-- Fixes an "orphaned order" bug in stripe-webhook's checkout.session.completed
-- handler: orders / order_items / product_certificates / checkout_sessions.status
-- were written with separate sequential awaits, not one transaction. If the DB
-- (or the Edge Function process) died partway through -- e.g. right after the
-- `orders` row landed but before `order_items` did -- Stripe's automatic retry
-- of the same event would re-run the handler, but the retry's `orders` insert
-- would fail on the `order_number` UNIQUE constraint (order already exists from
-- the partial attempt), the handler would log-and-break without redoing the
-- missing steps, and then mark the event processed -- permanently: an order
-- with no order_items, no certificates, no confirmation email/SMS, and
-- checkout_sessions.status stuck at 'pending_payment' forever, with nothing to
-- retry it again.
--
-- Fix: move the whole "create order from a paid checkout session" write into
-- one PL/pgSQL function. A function body is one transaction from the caller's
-- point of view -- either everything below commits together, or (on any
-- error) none of it does, and checkout_sessions stays 'pending_payment' so
-- Stripe's retry starts clean instead of hitting a half-written state.
--
-- `FOR UPDATE` on the checkout_sessions row also closes a separate race:
-- Stripe can and does deliver the same event more than once concurrently
-- (not just after a failure). Two overlapping deliveries for the same
-- session now serialize on this lock instead of both racing to insert the
-- same order_number.

-- ---------------------------------------------------------------------------
-- Also fixes a second, independent, previously-undiscovered bug found while
-- building the function below: `decrement_stock()` (from the very first
-- migration, 20260328220859) reads `NEW.items` off the `orders` row. That
-- column hasn't existed since `core_schema` (20260408003807) recreated
-- `orders` without it -- and dropping/recreating the table also dropped the
-- `on_order_paid` trigger that used to fire it. Net effect: stock has not
-- been decremented on any real paid order since that migration, silently --
-- CLAUDE.md's "stock decrements are triggered server-side" (§5) has been
-- inaccurate the whole time. Replaced with a trigger on `order_items`
-- (fired per line item actually written, not off a JSON column on `orders`
-- that no longer exists) so it can't drift out of sync with the orders
-- schema the same way again.
drop trigger if exists on_order_paid on public.orders;
drop function if exists public.decrement_stock();

create or replace function public.decrement_stock_for_order_item()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- order_items rows are only ever written together with a 'paid' order
  -- (create-checkout never writes them; stripe-webhook / fulfill_checkout_session
  -- only insert them alongside an order created with status='paid'), but this
  -- checks the parent order's status explicitly anyway rather than relying on
  -- that always being true everywhere, forever.
  if exists (
    select 1 from public.orders o
    where o.id = NEW.order_id and o.status = 'paid'
  ) then
    update public.products
      set stock_quantity = stock_quantity - NEW.quantity,
          updated_at = now()
      where id = NEW.product_id;
  end if;
  return NEW;
end;
$$;

drop trigger if exists on_order_item_insert on public.order_items;
create trigger on_order_item_insert
  after insert on public.order_items
  for each row
  execute function public.decrement_stock_for_order_item();

revoke execute on function public.decrement_stock_for_order_item() from public, anon, authenticated;
grant execute on function public.decrement_stock_for_order_item() to postgres, service_role;

-- ---------------------------------------------------------------------------
-- Atomically fulfils a checkout_sessions row into a real paid order: inserts
-- orders (status='paid', which fires stock decrement via order_items above),
-- order_items, one product_certificates row per unit purchased, and marks
-- the session 'completed' -- all in one transaction. Returns the resulting
-- order id/number and certificate codes so the caller (stripe-webhook) can
-- send the confirmation email/SMS without re-deriving them.
--
-- Idempotent by design: if the session is already 'completed' (a Stripe
-- retry arriving after a previous successful call), returns the existing
-- order with already_fulfilled=true instead of erroring or double-writing.
create or replace function public.fulfill_checkout_session(
  _checkout_session_id uuid,
  _payment_intent_id text default null
)
returns table (
  order_id uuid,
  order_number text,
  already_fulfilled boolean,
  certificate_codes text[]
)
language plpgsql
security definer
set search_path = public
as $$
declare
  session record;
  new_order_id uuid;
  existing_order_id uuid;
  cert_codes text[] := '{}';
  item_cert_codes text[];
  item jsonb;
  fiber_batch uuid;
  item_product_id uuid;
  item_quantity integer;
begin
  -- Locks the row for the duration of this transaction: a concurrent call
  -- for the same session (Stripe redelivering the same event, or a genuine
  -- duplicate) blocks here until this one commits or rolls back, then sees
  -- the up-to-date status instead of racing on the orders insert below.
  select * into session from public.checkout_sessions
    where id = _checkout_session_id
    for update;

  if not found then
    raise exception 'fulfill_checkout_session: checkout_session % not found', _checkout_session_id;
  end if;

  if session.status = 'completed' then
    select o.id into existing_order_id from public.orders o where o.order_number = session.order_number;
    return query select existing_order_id, session.order_number, true, '{}'::text[];
    return;
  end if;

  insert into public.orders (
    order_number, user_id, shipping_name, shipping_email, shipping_phone,
    shipping_address, subtotal, discount, shipping_cost, total, currency,
    payment_method, payment_intent_id, promo_code, status
  ) values (
    session.order_number, session.user_id, session.shipping_name, session.shipping_email,
    session.shipping_phone, session.shipping_address, session.subtotal, session.discount,
    session.shipping_cost, session.total, session.currency, 'stripe', _payment_intent_id,
    session.promo_code, 'paid'
  )
  returning id into new_order_id;

  for item in select * from jsonb_array_elements(session.items)
  loop
    item_product_id := nullif(item->>'productId', '')::uuid;
    item_quantity := (item->>'quantity')::integer;

    insert into public.order_items (
      order_id, product_id, product_name, variant, quantity, unit_price, total_price
    ) values (
      new_order_id, item_product_id, item->>'name', nullif(item->>'variant', ''),
      item_quantity, (item->>'price')::numeric, (item->>'price')::numeric * item_quantity
    );

    fiber_batch := null;
    if item_product_id is not null then
      select p.fiber_batch_id into fiber_batch from public.products p where p.id = item_product_id;
    end if;

    -- One certificate per unit purchased. generate_series(1,0) (or negative)
    -- yields zero rows rather than erroring, so a malformed quantity just
    -- produces no certificates for that line instead of failing the order.
    with ins as (
      insert into public.product_certificates (product_id, fiber_batch_id, order_id)
      select item_product_id, fiber_batch, new_order_id
      from generate_series(1, item_quantity)
      returning code
    )
    select array_agg(code) into item_cert_codes from ins;

    cert_codes := cert_codes || coalesce(item_cert_codes, '{}'::text[]);
  end loop;

  update public.checkout_sessions set status = 'completed' where id = _checkout_session_id;

  return query select new_order_id, session.order_number, false, cert_codes;
  return;
end;
$$;

revoke execute on function public.fulfill_checkout_session(uuid, text) from public, anon, authenticated;
grant execute on function public.fulfill_checkout_session(uuid, text) to service_role;
