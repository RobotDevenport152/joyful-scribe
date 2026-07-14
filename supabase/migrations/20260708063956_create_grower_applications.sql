-- Backfilled from live schema on 2026-07-15 — this table already existed in
-- production (applied directly, never saved as a local file) but was
-- missing from supabase/migrations/, so a fresh `supabase start` local dev
-- database would never get it. Reconstructed from the live table definition;
-- version number matches the existing remote ledger entry for this change.
create table public.grower_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  farm_name text not null,
  owner_name text not null,
  region text not null,
  phone text,
  message text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id)
);

alter table public.grower_applications enable row level security;

create policy "grower_applications_select" on public.grower_applications
  for select using (
    (user_id = (select auth.uid())) or public.has_role((select auth.uid()), 'admin')
  );

create policy "grower_applications_insert" on public.grower_applications
  for insert with check (
    (user_id = (select auth.uid())) or public.has_role((select auth.uid()), 'admin')
  );

create policy "grower_applications_admin_update" on public.grower_applications
  for update using (public.has_role((select auth.uid()), 'admin'))
  with check (public.has_role((select auth.uid()), 'admin'));

create policy "grower_applications_admin_delete" on public.grower_applications
  for delete using (public.has_role((select auth.uid()), 'admin'));
