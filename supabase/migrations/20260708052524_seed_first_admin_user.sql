insert into public.user_roles (user_id, role)
values ('0ceba7b5-8059-4d50-8e40-c7458625d698', 'admin')
on conflict (user_id, role) do nothing;