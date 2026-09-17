-- Unified schema for the Hospo Fresh Group app (Hospo Fresh + Tapro).
-- Run this in the Supabase SQL editor for a fresh project, or diff it
-- against your existing tables before applying to a live database.

-- ── inquiries ────────────────────────────────────────────────────────────
-- Both brands' public contact forms write here, distinguished by `brand`.
-- If you're migrating from the old separate `hospo_inquiries` / `inquiries`
-- tables, see the migration note at the bottom of this file instead of
-- running this CREATE TABLE as-is.
create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  brand text not null check (brand in ('hospo_fresh', 'tapro')),
  name text not null,
  email text not null,
  business text,
  phone text,
  enquiry_type text,
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists inquiries_brand_created_at_idx
  on public.inquiries (brand, created_at desc);

alter table public.inquiries enable row level security;

-- Public (anonymous) visitors may INSERT their own enquiry, never read any.
create policy "public can submit inquiries"
  on public.inquiries for insert
  to anon
  with check (true);

-- Only authenticated (admin) users may read.
create policy "authenticated can read inquiries"
  on public.inquiries for select
  to authenticated
  using (true);

-- ── products (Tapro only) ───────────────────────────────────────────────
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  volume text default '',
  description text default '',
  image_url text default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;

-- Anyone can read products (they're shown on the public Tapro site).
create policy "public can read products"
  on public.products for select
  to anon, authenticated
  using (true);

-- Only authenticated (admin) users may write.
create policy "authenticated can manage products"
  on public.products for all
  to authenticated
  using (true)
  with check (true);

-- ── admin_audit_log ──────────────────────────────────────────────────────
-- Records who changed what in the admin dashboard. No UI is built for this
-- (deliberately — a small internal tool doesn't need one yet); query it
-- directly in the Supabase Table Editor or SQL editor when needed.
create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_email text not null,
  action text not null,           -- e.g. 'product.create', 'product.update', 'product.delete'
  entity_id uuid,
  details jsonb,
  created_at timestamptz not null default now()
);

alter table public.admin_audit_log enable row level security;

create policy "authenticated can read audit log"
  on public.admin_audit_log for select
  to authenticated
  using (true);

create policy "authenticated can write audit log"
  on public.admin_audit_log for insert
  to authenticated
  with check (true);

-- ── Storage bucket for product photos ───────────────────────────────────
-- Create a PUBLIC bucket named `product-images` in Supabase Storage, then:
create policy "public can view product images"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'product-images');

create policy "authenticated can upload product images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images');

create policy "authenticated can delete product images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images');

-- ── Migrating from the old two-site setup ───────────────────────────────
-- If you already have a `hospo_inquiries` table (Hospo Fresh) and a plain
-- `inquiries` table (Tapro, no brand column), migrate their rows in like this
-- AFTER creating the new `inquiries` table above with a different temp name,
-- e.g. run the CREATE TABLE as `inquiries_new`, then:
--
--   insert into public.inquiries_new (brand, name, email, business, phone, enquiry_type, message, created_at)
--   select 'hospo_fresh', name, email, business, phone, enquiry_type, message, created_at
--   from public.hospo_inquiries;
--
--   insert into public.inquiries_new (brand, name, email, message, created_at)
--   select 'tapro', name, email, message, created_at
--   from public.inquiries;
--
--   drop table public.hospo_inquiries;
--   alter table public.inquiries rename to inquiries_old_tapro_only;
--   alter table public.inquiries_new rename to inquiries;
--   drop table public.inquiries_old_tapro_only;
