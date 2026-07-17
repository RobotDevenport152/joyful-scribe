-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Growers table
create table public.growers (
  id uuid primary key default uuid_generate_v4(),
  farm_name text not null,
  owner_name text not null,
  region text not null,
  alpaca_count integer default 0,
  coordinates point,
  description text,
  cover_image_url text,
  is_featured boolean default false,
  credit_balance numeric(10,2) default 0,
  created_at timestamptz default now()
);

-- Fiber Batches table
create table public.fiber_batches (
  id uuid primary key default uuid_generate_v4(),
  batch_code text unique not null,
  grower_id uuid references public.growers(id),
  harvest_date date not null,
  weight_kg numeric(8,2),
  micron_avg numeric(5,2),
  grade text check (grade in ('baby','royal','adult','suri')),
  region text,
  processing_status text default 'raw'
    check (processing_status in ('raw','scoured','combed','ready')),
  notes text,
  created_at timestamptz default now()
);

-- Products table
create table public.products (
  id uuid primary key default uuid_generate_v4(),
  name_zh text not null,
  name_en text not null,
  slug text unique not null,
  category text not null,
  tier text,
  description_zh text,
  description_en text,
  price_nzd numeric(10,2) not null,
  price_cny numeric(10,2) not null default 0,
  price_usd numeric(10,2) not null default 0,
  image text,
  images jsonb default '[]',
  weight_grams integer,
  size_options jsonb,
  color_options jsonb,
  fill_material text,
  fabric_material text,
  fiber_batch_id uuid references public.fiber_batches(id),
  stock integer not null default 0,
  stock_quantity integer not null default 0,
  is_active boolean default true,
  is_featured boolean default false,
  sort_order integer default 0,
  certifications text[] default '{}',
  rating numeric(2,1) default 0,
  review_count integer default 0,
  weight text,
  fill_power text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Orders table
create table public.orders (
  id uuid primary key default uuid_generate_v4(),
  order_number text unique not null,
  user_id uuid references auth.users(id),
  status text default 'pending'
    check (status in ('pending','paid','processing','shipped','delivered','cancelled')),
  shipping_name text,
  shipping_email text,
  shipping_phone text,
  shipping_address jsonb,
  payment_method text,
  payment_intent_id text,
  subtotal numeric(10,2) default 0,
  discount numeric(10,2) default 0,
  shipping_cost numeric(10,2) default 0,
  total numeric(10,2) default 0,
  currency text default 'NZD',
  promo_code text,
  tracking_number text,
  carrier text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Order items table
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id),
  product_name text not null,
  variant text,
  quantity integer not null default 1,
  unit_price numeric(10,2) not null,
  total_price numeric(10,2) not null,
  created_at timestamptz default now()
);

-- Grower Transactions table
create table public.grower_transactions (
  id uuid primary key default uuid_generate_v4(),
  grower_id uuid references public.growers(id) not null,
  type text check (type in ('purchase','adjustment','payout','bonus')),
  amount_nzd numeric(10,2) not null,
  description text,
  batch_id uuid references public.fiber_batches(id),
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- Promo Codes table
create table public.promo_codes (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  discount_type text check (discount_type in ('percent','fixed')),
  discount_value numeric(8,2),
  min_order_nzd numeric(10,2) default 0,
  usage_limit integer,
  used_count integer default 0,
  expires_at timestamptz,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Sleep Assessments table
create table public.sleep_assessments (
  id uuid primary key default uuid_generate_v4(),
  session_id text,
  answers jsonb,
  recommended_products jsonb,
  converted boolean default false,
  created_at timestamptz default now()
);

-- Stock notifications table
create table public.stock_notifications (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now(),
  notified_at timestamptz,
  unique(product_id, email)
);

-- User roles
create type public.app_role as enum ('admin', 'moderator', 'grower', 'customer');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);

-- Security definer function for role checks
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- Enable RLS
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.growers enable row level security;
alter table public.grower_transactions enable row level security;
alter table public.promo_codes enable row level security;
alter table public.fiber_batches enable row level security;
alter table public.sleep_assessments enable row level security;
alter table public.user_roles enable row level security;
alter table public.stock_notifications enable row level security;

-- RLS policies
create policy "products_public_read" on public.products for select using (is_active = true);
create policy "products_admin_all" on public.products for all using (public.has_role(auth.uid(), 'admin'));
create policy "fiber_batches_public_read" on public.fiber_batches for select using (true);
create policy "fiber_batches_admin_all" on public.fiber_batches for all using (public.has_role(auth.uid(), 'admin'));
create policy "orders_own_read" on public.orders for select using (auth.uid() = user_id);
create policy "orders_insert" on public.orders for insert with check (auth.uid() = user_id);
create policy "orders_admin_all" on public.orders for all using (public.has_role(auth.uid(), 'admin'));
create policy "order_items_own_read" on public.order_items for select using (order_id in (select id from public.orders where user_id = auth.uid()));
create policy "order_items_insert" on public.order_items for insert to authenticated with check (order_id in (select id from public.orders where user_id = auth.uid()));
create policy "order_items_admin_all" on public.order_items for all using (public.has_role(auth.uid(), 'admin'));
create policy "growers_public_read" on public.growers for select using (true);
create policy "growers_admin_all" on public.growers for all using (public.has_role(auth.uid(), 'admin'));
create policy "promo_public_read" on public.promo_codes for select using (is_active = true);
create policy "promo_admin_all" on public.promo_codes for all using (public.has_role(auth.uid(), 'admin'));
create policy "assessments_insert" on public.sleep_assessments for insert with check (true);
create policy "assessments_admin_read" on public.sleep_assessments for select using (public.has_role(auth.uid(), 'admin'));
create policy "user_roles_admin_all" on public.user_roles for all using (public.has_role(auth.uid(), 'admin'));
create policy "user_roles_own_read" on public.user_roles for select using (user_id = auth.uid());
create policy "stock_notifications_insert" on public.stock_notifications for insert with check (length(email) > 3);
create policy "stock_notifications_admin" on public.stock_notifications for all using (public.has_role(auth.uid(), 'admin'));

-- Updated_at trigger
create or replace function public.update_updated_at_column()
returns trigger as $$ begin NEW.updated_at = now(); return NEW; end; $$ language plpgsql;
create trigger update_products_updated_at before update on public.products for each row execute function public.update_updated_at_column();
create trigger update_orders_updated_at before update on public.orders for each row execute function public.update_updated_at_column();
