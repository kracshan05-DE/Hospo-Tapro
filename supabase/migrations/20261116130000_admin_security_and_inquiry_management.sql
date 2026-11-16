-- =============================================================================
-- Admin security + inquiry management
-- =============================================================================
-- Written against the live database snapshot taken on 2026-11-16.
--
-- What this changes, and why:
--   1. Admin allowlist (public.admin_users + public.is_admin()). Being logged in
--      is no longer enough; a user must be listed here. Only the database owner
--      (Supabase SQL editor / service role) can add or remove admins.
--   2. Every RLS policy rewritten so writes and private reads require
--      is_admin(). Enforced by Postgres itself, so it holds for the website,
--      the Supabase REST API and any other client using the public anon key.
--   3. Inquiries can no longer be inserted by anonymous clients. The website
--      inserts them server-side with the service-role key after validation,
--      Turnstile and rate limiting. Admins may only change status/admin_notes;
--      the customer's own submission cannot be edited.
--   4. Inquiry status (new / in_progress / resolved), internal notes and email
--      delivery tracking columns, plus indexes for the dashboard queries.
--   5. Audit log written by database triggers (not by the app), so entries
--      cannot be forged by a client.
--   6. Storage: only admins may upload/replace/delete product images; bucket
--      limited to JPEG/PNG/WebP up to 5 MB.
--
-- Safe to run more than once. Runs in a single transaction: if any statement
-- fails, nothing is changed. Existing rows are preserved.
-- Rollback: supabase/rollbacks/20261116130000_admin_security_and_inquiry_management.rollback.sql
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. Admin allowlist
-- -----------------------------------------------------------------------------
create table if not exists public.admin_users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  role       text not null default 'admin' check (role in ('owner', 'admin')),
  -- Set true when an admin is given a temporary password; the dashboard
  -- forces a password change and the server clears it afterwards.
  must_change_password boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.admin_users is
  'Website administrators. Managed only from the Supabase SQL editor (no client write policies).';

alter table public.admin_users enable row level security;

-- SECURITY DEFINER so policies can consult admin_users without granting
-- clients read access to it. search_path pinned to '' to prevent hijacking.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users au where au.user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;

drop policy if exists "admins can view admin list" on public.admin_users;
create policy "admins can view admin list"
  on public.admin_users for select to authenticated
  using ((select public.is_admin()));

-- No insert/update/delete policies: clients can never change the admin list.
revoke all on public.admin_users from anon;
revoke insert, update, delete, truncate on public.admin_users from authenticated;

-- -----------------------------------------------------------------------------
-- 2. Products
-- -----------------------------------------------------------------------------
drop policy if exists "Public can read products"                on public.products;
drop policy if exists "Authenticated users can insert products" on public.products;
drop policy if exists "Authenticated users can update products" on public.products;
drop policy if exists "Authenticated users can delete products" on public.products;
drop policy if exists "products are publicly readable"          on public.products;
drop policy if exists "admins can insert products"              on public.products;
drop policy if exists "admins can update products"              on public.products;
drop policy if exists "admins can delete products"              on public.products;

create policy "products are publicly readable"
  on public.products for select to anon, authenticated
  using (true);

create policy "admins can insert products"
  on public.products for insert to authenticated
  with check ((select public.is_admin()));

create policy "admins can update products"
  on public.products for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "admins can delete products"
  on public.products for delete to authenticated
  using ((select public.is_admin()));

revoke insert, update, delete, truncate on public.products from anon;

-- -----------------------------------------------------------------------------
-- 3. Inquiries: new columns
-- -----------------------------------------------------------------------------
alter table public.inquiries
  add column if not exists status        text        not null default 'new',
  add column if not exists admin_notes   text,
  add column if not exists updated_at    timestamptz not null default now(),
  -- Existing rows were submitted before notifications existed: mark them
  -- 'skipped' (the column default at add-time), then switch the default to
  -- 'pending' for new rows.
  add column if not exists email_status  text        not null default 'skipped',
  add column if not exists email_error   text,
  add column if not exists email_sent_at timestamptz;

alter table public.inquiries alter column email_status set default 'pending';

-- -----------------------------------------------------------------------------
-- 4. Data-integrity constraints (database-level, cannot be bypassed)
-- Added NOT VALID so this migration can never fail on existing data; new and
-- updated rows are always checked. Existing rows are then validated where
-- possible, and any that don't fit are reported as a NOTICE (not an error).
-- -----------------------------------------------------------------------------
do $$
declare
  c record;
begin
  for c in
    select * from (values
      ('public.inquiries', 'inquiries_status_check',       $c$check (status in ('new', 'in_progress', 'resolved'))$c$),
      ('public.inquiries', 'inquiries_email_status_check', $c$check (email_status in ('pending', 'sent', 'failed', 'skipped'))$c$),
      ('public.inquiries', 'inquiries_brand_check',        $c$check (brand in ('hospo_fresh', 'tapro'))$c$),
      ('public.inquiries', 'inquiries_name_check',         $c$check (char_length(btrim(name)) between 1 and 200)$c$),
      ('public.inquiries', 'inquiries_email_check',        $c$check (char_length(email) <= 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$')$c$),
      ('public.inquiries', 'inquiries_message_check',      $c$check (char_length(btrim(message)) between 1 and 5000)$c$),
      ('public.inquiries', 'inquiries_business_check',     $c$check (business is null or char_length(business) <= 200)$c$),
      ('public.inquiries', 'inquiries_phone_check',        $c$check (phone is null or char_length(phone) <= 40)$c$),
      ('public.inquiries', 'inquiries_enquiry_type_check', $c$check (enquiry_type is null or char_length(enquiry_type) <= 100)$c$),
      ('public.inquiries', 'inquiries_admin_notes_check',  $c$check (admin_notes is null or char_length(admin_notes) <= 5000)$c$),
      ('public.products',  'products_name_check',          $c$check (char_length(btrim(name)) between 1 and 200)$c$),
      ('public.products',  'products_volume_check',        $c$check (char_length(volume) <= 100)$c$),
      ('public.products',  'products_description_check',   $c$check (char_length(description) <= 4000)$c$),
      ('public.products',  'products_image_url_check',     $c$check (image_url = '' or image_url ~ '^https://[a-z0-9-]+\.supabase\.co/storage/v1/object/public/product-images/')$c$)
    ) as t(tbl, name, def)
  loop
    if not exists (
      select 1 from pg_constraint where conname = c.name and conrelid = c.tbl::regclass
    ) then
      execute format('alter table %s add constraint %I %s not valid', c.tbl, c.name, c.def);
    end if;
    begin
      execute format('alter table %s validate constraint %I', c.tbl, c.name);
    exception when check_violation then
      raise notice 'Existing rows in % do not satisfy % (new rows are still enforced).', c.tbl, c.name;
    end;
  end loop;
end
$$;

-- -----------------------------------------------------------------------------
-- 5. Inquiries: indexes for the admin dashboard (newest first, filters)
-- -----------------------------------------------------------------------------
create index if not exists inquiries_created_at_idx        on public.inquiries (created_at desc);
create index if not exists inquiries_status_created_at_idx on public.inquiries (status, created_at desc);
create index if not exists inquiries_brand_created_at_idx  on public.inquiries (brand, created_at desc);

-- -----------------------------------------------------------------------------
-- 6. Inquiries: updated_at maintenance
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists inquiries_set_updated_at on public.inquiries;
create trigger inquiries_set_updated_at
  before update on public.inquiries
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 7. Inquiries: access
--    * No INSERT policy: only the server (service role) can create inquiries.
--    * Admins can read, delete, and change ONLY status / admin_notes.
-- -----------------------------------------------------------------------------
drop policy if exists "Public can submit inquiries"            on public.inquiries;
drop policy if exists "Authenticated users can read inquiries" on public.inquiries;
drop policy if exists "admins can read inquiries"              on public.inquiries;
drop policy if exists "admins can update inquiries"            on public.inquiries;
drop policy if exists "admins can delete inquiries"            on public.inquiries;

create policy "admins can read inquiries"
  on public.inquiries for select to authenticated
  using ((select public.is_admin()));

create policy "admins can update inquiries"
  on public.inquiries for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "admins can delete inquiries"
  on public.inquiries for delete to authenticated
  using ((select public.is_admin()));

revoke all on public.inquiries from anon;
revoke insert, update, truncate on public.inquiries from authenticated;
grant select, delete on public.inquiries to authenticated;
grant update (status, admin_notes) on public.inquiries to authenticated;

-- -----------------------------------------------------------------------------
-- 8. Audit log: written only by triggers (cannot be forged by clients)
-- -----------------------------------------------------------------------------
drop policy if exists "authenticated can read audit log"  on public.admin_audit_log;
drop policy if exists "authenticated can write audit log" on public.admin_audit_log;
drop policy if exists "admins can read audit log"         on public.admin_audit_log;

create policy "admins can read audit log"
  on public.admin_audit_log for select to authenticated
  using ((select public.is_admin()));

revoke all on public.admin_audit_log from anon;
revoke insert, update, delete, truncate on public.admin_audit_log from authenticated;

create index if not exists admin_audit_log_created_at_idx on public.admin_audit_log (created_at desc);

create or replace function public.audit_admin_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row     jsonb := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  v_action  text  := tg_argv[0] || '.' || case tg_op when 'INSERT' then 'create' else lower(tg_op) end;
  v_details jsonb;
begin
  if tg_table_name = 'inquiries' then
    -- Never copy customer details into the audit log; record only what changed.
    v_details := case when tg_op = 'UPDATE' then
      jsonb_strip_nulls(jsonb_build_object(
        'status_from', case when old.status is distinct from new.status then old.status end,
        'status_to',   case when old.status is distinct from new.status then new.status end,
        'notes_changed', case when old.admin_notes is distinct from new.admin_notes then true end))
    end;
  else
    v_details := jsonb_build_object('name', v_row ->> 'name');
  end if;

  insert into public.admin_audit_log (actor_email, action, entity_id, details)
  values (
    coalesce((select auth.jwt() ->> 'email'), 'system'),
    v_action,
    (v_row ->> 'id')::uuid,
    v_details
  );
  return null;
end;
$$;

revoke all on function public.audit_admin_change() from public, anon, authenticated;

drop trigger if exists products_audit on public.products;
create trigger products_audit
  after insert or update or delete on public.products
  for each row execute function public.audit_admin_change('product');

-- Only status/notes changes and deletions are audited; the server's own
-- email_status bookkeeping is not.
drop trigger if exists inquiries_audit on public.inquiries;
create trigger inquiries_audit
  after update of status, admin_notes or delete on public.inquiries
  for each row execute function public.audit_admin_change('inquiry');

-- -----------------------------------------------------------------------------
-- 9. Storage: product images
-- -----------------------------------------------------------------------------
update storage.buckets
   set file_size_limit    = 5242880,  -- 5 MB
       allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
 where id = 'product-images';

drop policy if exists "Authenticated users can upload product images" on storage.objects;
drop policy if exists "Authenticated users can delete product images" on storage.objects;
drop policy if exists "admins can upload product images"              on storage.objects;
drop policy if exists "admins can update product images"              on storage.objects;
drop policy if exists "admins can delete product images"              on storage.objects;

create policy "admins can upload product images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and (select public.is_admin()));

create policy "admins can update product images"
  on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()))
  with check (bucket_id = 'product-images' and (select public.is_admin()));

create policy "admins can delete product images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()));

-- "Public can view product images" (SELECT) is intentionally left unchanged.

commit;
