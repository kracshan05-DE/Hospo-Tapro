-- =============================================================================
-- ROLLBACK for 20261116130000_admin_security_and_inquiry_management.sql
-- =============================================================================
-- Restores the access rules exactly as they were in the live snapshot taken on
-- 2026-11-16 (before the migration).
--
-- WARNING: this reopens the security holes the migration closed (any logged-in
-- user is treated as an admin; anonymous inquiry inserts). Use only to recover
-- from a failed release, and only together with redeploying the previous app
-- version. Inquiry status / admin notes / email-tracking data is dropped.
-- Products, inquiries (customer data) and the audit log rows are preserved.
-- =============================================================================

begin;

-- Storage --------------------------------------------------------------------
drop policy if exists "admins can upload product images" on storage.objects;
drop policy if exists "admins can update product images" on storage.objects;
drop policy if exists "admins can delete product images" on storage.objects;

create policy "Authenticated users can upload product images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images');
create policy "Authenticated users can delete product images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'product-images');

update storage.buckets
   set file_size_limit = null, allowed_mime_types = null
 where id = 'product-images';

-- Audit log --------------------------------------------------------------------
drop trigger if exists products_audit  on public.products;
drop trigger if exists inquiries_audit on public.inquiries;
drop function if exists public.audit_admin_change();
drop index if exists public.admin_audit_log_created_at_idx;

drop policy if exists "admins can read audit log" on public.admin_audit_log;
create policy "authenticated can read audit log"
  on public.admin_audit_log for select to authenticated using (true);
create policy "authenticated can write audit log"
  on public.admin_audit_log for insert to authenticated with check (true);
grant all on public.admin_audit_log to anon, authenticated;

-- Inquiries --------------------------------------------------------------------
drop policy if exists "admins can read inquiries"   on public.inquiries;
drop policy if exists "admins can update inquiries" on public.inquiries;
drop policy if exists "admins can delete inquiries" on public.inquiries;

create policy "Authenticated users can read inquiries"
  on public.inquiries for select to authenticated using (true);
create policy "Public can submit inquiries"
  on public.inquiries for insert to anon, authenticated with check (true);
grant all on public.inquiries to anon, authenticated;

drop trigger if exists inquiries_set_updated_at on public.inquiries;
drop function if exists public.set_updated_at();

drop index if exists public.inquiries_created_at_idx;
drop index if exists public.inquiries_status_created_at_idx;
drop index if exists public.inquiries_brand_created_at_idx;

alter table public.inquiries
  drop constraint if exists inquiries_status_check,
  drop constraint if exists inquiries_email_status_check,
  drop constraint if exists inquiries_brand_check,
  drop constraint if exists inquiries_name_check,
  drop constraint if exists inquiries_email_check,
  drop constraint if exists inquiries_message_check,
  drop constraint if exists inquiries_business_check,
  drop constraint if exists inquiries_phone_check,
  drop constraint if exists inquiries_enquiry_type_check,
  drop constraint if exists inquiries_admin_notes_check;

alter table public.inquiries
  drop column if exists status,
  drop column if exists admin_notes,
  drop column if exists updated_at,
  drop column if exists email_status,
  drop column if exists email_error,
  drop column if exists email_sent_at;

-- Products ---------------------------------------------------------------------
drop policy if exists "products are publicly readable" on public.products;
drop policy if exists "admins can insert products"     on public.products;
drop policy if exists "admins can update products"     on public.products;
drop policy if exists "admins can delete products"     on public.products;

create policy "Public can read products"
  on public.products for select to public using (true);
create policy "Authenticated users can insert products"
  on public.products for insert to authenticated with check (true);
create policy "Authenticated users can update products"
  on public.products for update to authenticated using (true);
create policy "Authenticated users can delete products"
  on public.products for delete to authenticated using (true);
grant all on public.products to anon, authenticated;

alter table public.products
  drop constraint if exists products_name_check,
  drop constraint if exists products_volume_check,
  drop constraint if exists products_description_check,
  drop constraint if exists products_image_url_check;

-- Admin allowlist --------------------------------------------------------------
drop policy if exists "admins can view admin list" on public.admin_users;
drop function if exists public.is_admin();
drop table if exists public.admin_users;

commit;
