-- verify_certificate() compared c.code = _code exactly, but
-- generate_certificate_code() always stores codes in uppercase hex
-- ("PA-CERT-<UPPERHEX>"). A genuinely valid certificate typed in lowercase
-- or mixed case (plausible when copying by hand off a printed card) would
-- silently fail to match, showing "not found" to a real customer even
-- though the code exists. Compare case-insensitively so a valid code is
-- always found regardless of how it's typed.
--
-- Also switch the products join from INNER to LEFT: is_valid is already
-- determined true before this join runs, so an INNER join could drop a
-- genuinely valid certificate's row entirely (returning "not found" while
-- still incrementing verification_count) if its product row were ever
-- missing. A LEFT join guarantees a matched certificate always returns a
-- row.
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
  select * into cert from public.product_certificates c where upper(c.code) = upper(_code);

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
    left join public.products p on p.id = c.product_id
    left join public.fiber_batches fb on fb.id = c.fiber_batch_id
    left join public.growers g on g.id = fb.grower_id
    where c.id = cert.id;
end;
$$;
