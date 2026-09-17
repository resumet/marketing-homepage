create table if not exists public.site_content (
  id integer primary key check (id = 1),
  data jsonb not null check (jsonb_array_length(data->'products') = 4),
  updated_at timestamptz not null default now()
);
alter table public.site_content enable row level security;
revoke all on public.site_content from anon, authenticated;
grant all on public.site_content to service_role;

create table if not exists public.login_attempts (
  key text primary key,
  attempts integer not null default 1,
  window_start timestamptz not null default now()
);
alter table public.login_attempts enable row level security;
revoke all on public.login_attempts from anon, authenticated;
create or replace function public.allow_admin_attempt(attempt_key text)
returns boolean language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  delete from public.login_attempts where window_start < now() - interval '1 day';
  insert into public.login_attempts as a (key) values (attempt_key)
  on conflict (key) do update set
    attempts = case when a.window_start < now() - interval '15 minutes' then 1 else a.attempts + 1 end,
    window_start = case when a.window_start < now() - interval '15 minutes' then now() else a.window_start end
  returning attempts into n;
  return n <= 10;
end;
$$;
revoke all on function public.allow_admin_attempt(text) from public, anon, authenticated;
grant execute on function public.allow_admin_attempt(text) to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 4194304, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 4194304,
allowed_mime_types = array['image/jpeg','image/png','image/webp'];
-- Uploads are performed only by the authenticated server with service_role.
