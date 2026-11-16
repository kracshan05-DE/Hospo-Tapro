-- Recreates the LIVE production schema and RLS policies exactly as reported by
-- the snapshot query on 2026-11-16 (before the security migration), plus a
-- small representative dataset. Used to prove the migration and rollback
-- against the real starting state, not an idealised one.

create table public.products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  volume      text not null default '',
  description text not null default '',
  image_url   text not null default '',
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create table public.inquiries (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  email        text not null,
  message      text not null,
  created_at   timestamptz not null default now(),
  brand        text not null default 'hospo_fresh',
  business     text,
  phone        text,
  enquiry_type text
);

create table public.admin_audit_log (
  id          uuid primary key default gen_random_uuid(),
  actor_email text not null,
  action      text not null,
  entity_id   uuid,
  details     jsonb,
  created_at  timestamptz not null default now()
);

alter table public.products        enable row level security;
alter table public.inquiries       enable row level security;
alter table public.admin_audit_log enable row level security;

-- Live policies (verbatim from snapshot)
create policy "authenticated can read audit log"  on public.admin_audit_log for select to authenticated using (true);
create policy "authenticated can write audit log" on public.admin_audit_log for insert to authenticated with check (true);
create policy "Authenticated users can read inquiries" on public.inquiries for select to authenticated using (true);
create policy "Public can submit inquiries"            on public.inquiries for insert to anon, authenticated with check (true);
create policy "Authenticated users can delete products" on public.products for delete to authenticated using (true);
create policy "Authenticated users can insert products" on public.products for insert to authenticated with check (true);
create policy "Authenticated users can update products" on public.products for update to authenticated using (true);
create policy "Public can read products"                on public.products for select to public using (true);

insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true);
create policy "Authenticated users can delete product images" on storage.objects for delete to authenticated using (bucket_id = 'product-images');
create policy "Authenticated users can upload product images" on storage.objects for insert to authenticated with check (bucket_id = 'product-images');
create policy "Public can view product images"                on storage.objects for select to public using (bucket_id = 'product-images');

-- Data -----------------------------------------------------------------------
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'admin@gmail.com'),
  ('22222222-2222-2222-2222-222222222222', 'stranger@example.com');

insert into public.products (name, volume, description, image_url, sort_order) values
  ('Red Kochchi Sauce', '250ml Bottle', 'A fiery chilli sauce.', '', 1),
  ('Green Kochchi Sauce', '250ml Bottle', 'Fresh green chilli heat.',
   'https://menywvdaswxfqrbvicqw.supabase.co/storage/v1/object/public/product-images/a.jpg', 2),
  ('Seeni Sambol', '350g Jar', 'Caramelised onion relish.', '', 3);

insert into public.inquiries (brand, name, email, message, business, phone, enquiry_type) values
  ('hospo_fresh', 'Jane Buyer',  'jane@cafe.com.au',  'Please send your wholesale catalogue.', 'Cafe One', '0400 000 000', 'Wholesale'),
  ('hospo_fresh', 'Raj Patel',   'raj@resto.com.au',  'Do you deliver to Dandenong?', null, null, null),
  ('tapro',       'Ama Silva',   'ama@shop.lk',       'Stockist enquiry for Colombo.', 'Silva Stores', null, null),
  ('tapro',       'Tom Lee',     'tom@import.co',     'Export partnership interest.', null, '+61 3 9000 0000', null);

insert into public.admin_audit_log (actor_email, action, entity_id, details) values
  ('admin@gmail.com', 'product.create', gen_random_uuid(), '{"name":"Red Kochchi Sauce"}'),
  ('admin@gmail.com', 'product.update', gen_random_uuid(), '{"name":"Seeni Sambol"}');

insert into storage.objects (bucket_id, name) values ('product-images', 'a.jpg');
