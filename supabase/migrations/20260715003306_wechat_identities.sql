create table public.wechat_identities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  openid text not null unique,
  unionid text,
  nickname text,
  avatar_url text,
  created_at timestamptz not null default now(),
  last_login_at timestamptz not null default now()
);

create index wechat_identities_user_id_idx on public.wechat_identities(user_id);

alter table public.wechat_identities enable row level security;

create or replace function public.get_my_wechat_identity()
returns table (nickname text, avatar_url text, linked_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select nickname, avatar_url, created_at
  from public.wechat_identities
  where user_id = auth.uid()
$$;

grant execute on function public.get_my_wechat_identity() to authenticated;
