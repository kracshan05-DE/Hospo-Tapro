-- Run this in the SQL Editor of your EXISTING Supabase project
-- (menywvdaswxfqrbvicqw.supabase.co) — NOT supabase/schema.sql, which
-- assumes a blank database and would silently skip your live `inquiries`
-- table since it already exists.
--
-- This adapts your current tables in place. It does not delete any
-- enquiry data. Read it before running — it's short.

-- 1. Add the columns the unified app needs to your existing Tapro
--    `inquiries` table (currently just name/email/message).
alter table public.inquiries
  add column if not exists brand text,
  add column if not exists business text,
  add column if not exists phone text,
  add column if not exists enquiry_type text;

-- Every existing row in this table is a Tapro submission (Hospo Fresh has
-- always used its own separate `hospo_inquiries` table).
update public.inquiries set brand = 'tapro' where brand is null;

alter table public.inquiries alter column brand set not null;

do $$
begin
  alter table public.inquiries
    add constraint inquiries_brand_check check (brand in ('hospo_fresh', 'tapro'));
exception when duplicate_object then null;
end $$;

create index if not exists inquiries_brand_created_at_idx
  on public.inquiries (brand, created_at desc);

-- 2. Copy your existing Hospo Fresh enquiries into the same table, then
--    retire the now-redundant `hospo_inquiries` table.
insert into public.inquiries (brand, name, email, business, phone, enquiry_type, message, created_at)
select 'hospo_fresh', name, email, business, phone, enquiry_type, message, created_at
from public.hospo_inquiries;

drop table public.hospo_inquiries;

-- 3. New table the unified app adds: a lightweight admin audit log.
--    Your existing `products` table and its RLS policies are untouched —
--    they already work correctly with the unified app as-is.
create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_email text not null,
  action text not null,
  entity_id uuid,
  details jsonb,
  created_at timestamptz not null default now()
);

alter table public.admin_audit_log enable row level security;

do $$
begin
  create policy "authenticated can read audit log"
    on public.admin_audit_log for select to authenticated using (true);
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy "authenticated can write audit log"
    on public.admin_audit_log for insert to authenticated with check (true);
exception when duplicate_object then null;
end $$;

-- 4. Sanity check — run this after the above and confirm the counts make sense.
select brand, count(*) from public.inquiries group by brand;
