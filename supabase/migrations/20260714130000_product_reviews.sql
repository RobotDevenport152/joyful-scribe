-- Real, purchase-verified product reviews. Replaces the hardcoded
-- MOCK_REVIEWS in ProductDetail.tsx, which fabricated "Verified Purchase"
-- badges on invented content — a genuine trust/compliance risk for reviews
-- displayed to real customers.
create table public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) not null,
  order_id uuid references public.orders(id) not null,
  user_id uuid references auth.users(id) not null,
  rating integer not null check (rating between 1 and 5),
  comment text not null,
  author_name text not null,
  variant text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz default now(),
  unique (order_id, product_id)
);

create index product_reviews_product_id_idx on public.product_reviews(product_id) where status = 'approved';

alter table public.product_reviews enable row level security;

-- Every review here is inherently "verified purchase" by construction (see
-- can_review_product below) — there is no separate verified flag to fake.
create or replace function public.can_review_product(_user_id uuid, _order_id uuid, _product_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.orders o
    join public.order_items oi on oi.order_id = o.id
    where o.id = _order_id
      and o.user_id = _user_id
      and o.status = 'paid'
      and oi.product_id = _product_id
  )
$$;

create policy "reviews_public_read_approved" on public.product_reviews
  for select using (status = 'approved');

create policy "reviews_own_read" on public.product_reviews
  for select using (user_id = auth.uid());

create policy "reviews_insert_own_verified_purchase" on public.product_reviews
  for insert with check (
    user_id = auth.uid()
    and public.can_review_product(auth.uid(), order_id, product_id)
  );

create policy "reviews_admin_all" on public.product_reviews
  for all using (public.has_role(auth.uid(), 'admin'));
