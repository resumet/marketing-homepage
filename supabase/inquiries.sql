-- Run once in the Supabase SQL Editor (safe to run again).
create table if not exists public.inquiries (
  id uuid primary key,
  name text not null check (char_length(name) between 1 and 80),
  phone text not null check (phone ~ '^010-[0-9]{4}-[0-9]{4}$'),
  email text not null check (char_length(email) between 3 and 254),
  fax text not null default '' check (char_length(fax) <= 30),
  message text not null check (char_length(message) between 1 and 1500),
  rate_key text not null,
  created_at timestamptz not null default now(),
  is_read boolean not null default false
);
alter table public.inquiries enable row level security;
revoke all on public.inquiries from anon, authenticated;
grant all on public.inquiries to service_role;
create index if not exists inquiries_created_at_idx on public.inquiries (created_at desc);
create index if not exists inquiries_rate_key_idx on public.inquiries (rate_key, created_at desc);

-- Serialize requests per sender to enforce the rate limit across server instances.
create or replace function public.submit_inquiry(
  submission_id uuid, sender_name text, sender_phone text,
  sender_email text, sender_fax text, inquiry_message text, sender_key text
) returns text language plpgsql security definer set search_path = public as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(sender_key, 0));
  if exists (select 1 from public.inquiries where id = submission_id) then
    return 'accepted';
  end if;
  if (select count(*) from public.inquiries where rate_key = sender_key
      and created_at > now() - interval '1 hour') >= 5 then
    return 'rate_limited';
  end if;
  insert into public.inquiries (id, name, phone, email, fax, message, rate_key)
  values (submission_id, sender_name, sender_phone, sender_email, sender_fax, inquiry_message, sender_key)
  on conflict (id) do nothing;
  return 'accepted';
end;
$$;
revoke all on function public.submit_inquiry(uuid,text,text,text,text,text,text) from public, anon, authenticated;
grant execute on function public.submit_inquiry(uuid,text,text,text,text,text,text) to service_role;
