-- generate_certificate_code() called gen_random_bytes() unqualified, but
-- pgcrypto is installed in the "extensions" schema (Supabase default), not
-- "public" or any schema in this function's search_path. Every certificate
-- generation (the column default used by product_certificates.code) has been
-- failing with "function gen_random_bytes(integer) does not exist" since the
-- function was created. Schema-qualify the call to fix it permanently.
create or replace function public.generate_certificate_code()
returns text
language sql
volatile
set search_path = public, extensions
as $$
  select 'PA-CERT-' || upper(encode(extensions.gen_random_bytes(9), 'hex'))
$$;
