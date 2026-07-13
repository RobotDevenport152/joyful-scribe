-- Per-unit anti-counterfeit certificates.
-- Unlike fiber_batches.batch_code (one code shared by an entire harvest lot,
-- guessable "PA-YYYYMM-NNNN" format), each row here is a single unguessable
-- code meant for exactly one physical product/certificate.
create extension if not exists pgcrypto;

create or replace function public.generate_certificate_code()
returns text
language sql
volatile
as $$
  -- 9 random bytes -> 18 hex chars (~72 bits entropy). Hex alphabet (0-9a-f)
  -- has no visually-ambiguous characters, unlike the batch_code format.
  select 'PA-CERT-' || upper(encode(gen_random_bytes(9), 'hex'))
$$;

create table public.product_certificates (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null default public.generate_certificate_code(),
  product_id uuid references public.products(id) not null,
  fiber_batch_id uuid references public.fiber_batches(id),
  order_id uuid references public.orders(id),
  issued_at timestamptz default now(),
  first_verified_at timestamptz,
  verification_count integer not null default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

create index product_certificates_product_id_idx on public.product_certificates(product_id);

alter table public.product_certificates enable row level security;

-- No public select/insert policy: direct table reads are blocked for
-- anon/authenticated so codes can't be enumerated or scraped in bulk.
-- Public verification only happens through verify_certificate() below.
create policy "certificates_admin_all" on public.product_certificates
  for all using (public.has_role(auth.uid(), 'admin'));

-- Public verification RPC. security definer so it can read
-- product_certificates/products/fiber_batches/growers despite RLS,
-- the same pattern used by has_role().
create or replace function public.verify_certificate(_code text)
returns table (
  is_valid boolean,
  product_id uuid,
  product_name_zh text,
  product_name_en text,
  product_slug text,
  product_images jsonb,
  fiber_batch_id uuid,
  batch_code text,
  grower_farm_name text,
  region text,
  harvest_date date,
  grade text,
  processing_status text,
  issued_at timestamptz,
  first_verified_at timestamptz,
  verification_count integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  cert record;
begin
  select * into cert from public.product_certificates c where c.code = _code;

  if not found then
    return query select
      false, null::uuid, null::text, null::text, null::text, null::jsonb,
      null::uuid, null::text, null::text, null::text, null::date, null::text, null::text,
      null::timestamptz, null::timestamptz, null::integer;
    return;
  end if;

  update public.product_certificates c
    set verification_count = c.verification_count + 1,
        first_verified_at = coalesce(c.first_verified_at, now())
    where c.id = cert.id;

  return query
    select
      true,
      p.id, p.name_zh, p.name_en, p.slug, p.images,
      fb.id, fb.batch_code, g.farm_name, fb.region, fb.harvest_date, fb.grade, fb.processing_status,
      cert.issued_at, coalesce(cert.first_verified_at, now()), cert.verification_count + 1
    from public.product_certificates c
    join public.products p on p.id = c.product_id
    left join public.fiber_batches fb on fb.id = c.fiber_batch_id
    left join public.growers g on g.id = fb.grower_id
    where c.id = cert.id;
end;
$$;

grant execute on function public.verify_certificate(text) to anon, authenticated;
