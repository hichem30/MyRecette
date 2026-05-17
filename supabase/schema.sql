-- =====================================================================
-- Red Barn Western Market — Canonical Supabase schema
-- =====================================================================
-- Run this ONE file in the Supabase SQL editor (or `supabase db push`).
-- It is fully idempotent: safe to re-run on an existing database; will
-- create what is missing and bring policies / functions / indexes to
-- the latest shape without dropping any existing data.
--
-- Replaces all of the previous incremental migrations 0001 – 0013.
-- Those files are kept under supabase/migrations/ for history only.
--
-- Sections:
--   1. Extensions
--   2. Tables (profiles, categories, products, messages, bulk_quotes,
--              orders, wishlists, bundles, promo_codes, delivery_zones)
--   3. Functions (auto-create profile, is_admin, stock decrement, promo
--                 codes, admin user lookup, touch_updated_at)
--   4. Row Level Security
--   5. Indexes
--   6. Storage bucket + policies (product-images)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Extensions
-- ---------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- 2. Tables
-- ---------------------------------------------------------------------

-- Profiles (linked to auth.users)
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text,
  role            text not null default 'user' check (role in ('user', 'admin')),
  marketing_optin boolean not null default false,
  created_at      timestamptz not null default now()
);

alter table public.profiles
  add column if not exists marketing_optin boolean not null default false;

-- Categories (translatable name via JSONB)
create table if not exists public.categories (
  id                  uuid primary key default gen_random_uuid(),
  slug                text unique not null,
  name                jsonb not null,
  parent_id           uuid references public.categories(id) on delete set null,
  image_url           text,
  icon                text,
  item_count          int,
  discount_percent    integer not null default 0 check (discount_percent >= 0 and discount_percent <= 90),
  discount_starts_at  timestamptz,
  discount_ends_at    timestamptz,
  created_at          timestamptz not null default now()
);

alter table public.categories
  add column if not exists discount_percent integer not null default 0
    check (discount_percent >= 0 and discount_percent <= 90),
  add column if not exists discount_starts_at timestamptz,
  add column if not exists discount_ends_at   timestamptz;

-- Products
create table if not exists public.products (
  id                  uuid primary key default gen_random_uuid(),
  slug                text unique not null,
  name                jsonb not null,
  description         jsonb not null default '{"en":"","es":""}'::jsonb,
  price               numeric(10,2) not null,
  original_price      numeric(10,2),
  image_url           text,
  category_slug       text not null,
  discount            boolean not null default false,
  discount_text       jsonb,
  discount_starts_at  timestamptz,
  discount_ends_at    timestamptz,
  new_arrival         boolean not null default false,
  stock               int not null default 0,
  featured            boolean not null default false,
  best_seller         boolean not null default false,
  free_shipping       boolean not null default false,
  published           boolean not null default true,
  updated_at          timestamptz not null default now(),
  created_at          timestamptz not null default now()
);

alter table public.products
  add column if not exists discount_starts_at timestamptz,
  add column if not exists discount_ends_at   timestamptz,
  add column if not exists published          boolean not null default true,
  add column if not exists updated_at         timestamptz not null default now();

-- products.stock must never go negative
alter table public.products
  drop constraint if exists products_stock_nonneg;
alter table public.products
  add constraint products_stock_nonneg check (stock >= 0);

-- Messages (contact form submissions)
create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  message     text not null,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table public.messages
  add column if not exists subject text;

-- Bulk quote requests
create table if not exists public.bulk_quotes (
  id                  uuid primary key default gen_random_uuid(),
  company             text not null,
  contact             text not null,
  email               text not null,
  phone               text not null,
  project_type        text not null,
  estimated_quantity  text not null,
  delivery            text not null check (delivery in ('deliver','pickup')),
  timeline            text not null,
  notes               text,
  status              text not null default 'new' check (status in ('new','contacted','quoted','closed')),
  created_at          timestamptz not null default now()
);

-- Orders (populated by Stripe webhook + /checkout/success safety net)
create table if not exists public.orders (
  id                  uuid primary key default gen_random_uuid(),
  stripe_session_id   text unique not null,
  customer_email      text,
  total_amount        numeric(10,2) not null,
  line_items          jsonb not null default '[]'::jsonb,
  status              text not null default 'paid',
  notes               text,
  created_at          timestamptz not null default now()
);

alter table public.orders
  add column if not exists notes text;

-- Full lifecycle status check
do $$
declare cons_name text;
begin
  select conname into cons_name
  from pg_constraint
  where conrelid = 'public.orders'::regclass
    and conname like 'orders_status_%';
  if cons_name is not null then
    execute format('alter table public.orders drop constraint %I', cons_name);
  end if;
end $$;

alter table public.orders
  add constraint orders_status_check
  check (status in ('paid','processing','shipped','delivered','cancelled','refunded'));

-- Wishlists (per-user)
create table if not exists public.wishlists (
  user_id    uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

-- Bundles
create table if not exists public.bundles (
  id           uuid primary key default gen_random_uuid(),
  name         jsonb not null default '{"en":"","es":""}'::jsonb,
  description  jsonb not null default '{"en":"","es":""}'::jsonb,
  bundle_price numeric(10,2) not null check (bundle_price >= 0),
  image_url    text,
  product_ids  uuid[] not null default '{}',
  starts_at    timestamptz,
  ends_at      timestamptz,
  active       boolean not null default true,
  updated_at   timestamptz not null default now(),
  created_at   timestamptz not null default now()
);

-- Promo codes
create table if not exists public.promo_codes (
  id             uuid primary key default gen_random_uuid(),
  code           text unique not null,
  description    text,
  discount_type  text not null check (discount_type in ('percent', 'amount')),
  discount_value numeric(10,2) not null check (discount_value > 0),
  max_uses       integer,
  uses_count     integer not null default 0,
  starts_at      timestamptz,
  ends_at        timestamptz,
  active         boolean not null default true,
  created_at     timestamptz not null default now()
);

-- Delivery zones (which US states / cities we ship to)
create table if not exists public.delivery_zones (
  id         uuid primary key default gen_random_uuid(),
  state_code text not null check (length(state_code) = 2),
  city       text,
  notes      text,
  created_at timestamptz not null default now()
);

create unique index if not exists delivery_zones_state_city_uniq
  on public.delivery_zones (state_code, coalesce(city, ''));


-- ---------------------------------------------------------------------
-- 3. Functions
-- ---------------------------------------------------------------------

-- Auto-create profile on signup. Auto-grants admin to the owner email
-- so the client can sign up and immediately get into /admin.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  owner_email constant text := 'redbarnmarket@protonmail.com';
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    case when lower(new.email) = lower(owner_email) then 'admin' else 'user' end
  )
  on conflict (id) do update
    set email = excluded.email,
        role  = case
          when lower(excluded.email) = lower(owner_email) then 'admin'
          else public.profiles.role
        end;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Promote the existing owner account (idempotent)
update public.profiles
   set role = 'admin'
 where lower(email) = lower('redbarnmarket@protonmail.com');

-- is_admin: auth helper used in RLS policies
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (select role = 'admin' from public.profiles where id = auth.uid()),
    false
  );
$$;

-- Atomic stock decrement at checkout
create or replace function public.decrement_product_stock(items jsonb)
returns table (product_id uuid, new_stock int)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  item jsonb;
  pid  uuid;
  qty  int;
begin
  for item in select * from jsonb_array_elements(items)
  loop
    pid := (item->>'product_id')::uuid;
    qty := coalesce((item->>'quantity')::int, 0);
    if pid is null or qty <= 0 then
      continue;
    end if;

    update public.products p
       set stock = greatest(0, p.stock - qty)
     where p.id = pid
     returning p.id, p.stock into product_id, new_stock;

    if found then
      return next;
    end if;
  end loop;
end;
$$;

revoke all on function public.decrement_product_stock(jsonb) from public;
grant execute on function public.decrement_product_stock(jsonb) to service_role;
grant execute on function public.decrement_product_stock(jsonb) to authenticated;

-- Updated-at trigger for products / bundles
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at
  before update on public.products
  for each row execute procedure public.touch_updated_at();

drop trigger if exists bundles_updated_at on public.bundles;
create trigger bundles_updated_at
  before update on public.bundles
  for each row execute procedure public.touch_updated_at();

-- admin_list_users (staff page): returns every profile when caller is admin
create or replace function public.admin_list_users()
returns table (
  id              uuid,
  email           text,
  role            text,
  marketing_optin boolean,
  created_at      timestamptz
)
language sql
security definer
set search_path = public, pg_temp
as $$
  select p.id, p.email, p.role, p.marketing_optin, p.created_at
  from public.profiles p
  where public.is_admin()
  order by p.created_at desc;
$$;

grant execute on function public.admin_list_users() to authenticated;

-- admin_subscriber_emails (campaigns page)
create or replace function public.admin_subscriber_emails()
returns table (email text)
language sql
security definer
set search_path = public, pg_temp
as $$
  select p.email
  from public.profiles p
  where public.is_admin()
    and p.marketing_optin = true
    and p.email is not null;
$$;

grant execute on function public.admin_subscriber_emails() to authenticated;

-- Promo code: validate + consume
create or replace function public.validate_promo_code(p_code text)
returns table (
  code           text,
  discount_type  text,
  discount_value numeric(10,2),
  valid          boolean,
  reason         text
)
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  rec public.promo_codes%rowtype;
begin
  select * into rec from public.promo_codes
    where lower(promo_codes.code) = lower(trim(p_code))
    limit 1;
  if not found then
    return query select p_code, ''::text, 0::numeric(10,2), false, 'NOT_FOUND'::text;
    return;
  end if;
  if not rec.active then
    return query select rec.code, rec.discount_type, rec.discount_value, false, 'INACTIVE'::text;
    return;
  end if;
  if rec.starts_at is not null and rec.starts_at > now() then
    return query select rec.code, rec.discount_type, rec.discount_value, false, 'NOT_YET'::text;
    return;
  end if;
  if rec.ends_at is not null and rec.ends_at < now() then
    return query select rec.code, rec.discount_type, rec.discount_value, false, 'EXPIRED'::text;
    return;
  end if;
  if rec.max_uses is not null and rec.uses_count >= rec.max_uses then
    return query select rec.code, rec.discount_type, rec.discount_value, false, 'EXHAUSTED'::text;
    return;
  end if;
  return query select rec.code, rec.discount_type, rec.discount_value, true, 'OK'::text;
end;
$$;

grant execute on function public.validate_promo_code(text) to anon, authenticated;

create or replace function public.consume_promo_code(p_code text)
returns boolean
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  rec public.promo_codes%rowtype;
begin
  select * into rec from public.promo_codes
    where lower(promo_codes.code) = lower(trim(p_code))
    for update;
  if not found or not rec.active then return false; end if;
  if rec.ends_at   is not null and rec.ends_at   < now() then return false; end if;
  if rec.starts_at is not null and rec.starts_at > now() then return false; end if;
  if rec.max_uses  is not null and rec.uses_count >= rec.max_uses then return false; end if;
  update public.promo_codes set uses_count = uses_count + 1 where id = rec.id;
  return true;
end;
$$;

-- product_sales view (best-seller list, used by admin /products sort)
drop view if exists public.product_sales;
create view public.product_sales
with (security_invoker = true) as
select
  (li ->> 'product_id')::uuid as product_id,
  sum( coalesce((li ->> 'quantity')::int, 0) )::int as units_sold
from public.orders o
cross join lateral jsonb_array_elements(o.line_items) li
where coalesce(li ->> 'product_id', '') <> ''
  and o.status not in ('cancelled', 'refunded')
group by 1;

grant select on public.product_sales to anon, authenticated;


-- ---------------------------------------------------------------------
-- 4. Row Level Security
--    Every USING/WITH CHECK uses (select auth.uid()) /
--    (select public.is_admin()) so policies evaluate once per query,
--    not once per row (5-50x faster on protected reads).
-- ---------------------------------------------------------------------

alter table public.profiles         enable row level security;
alter table public.categories       enable row level security;
alter table public.products         enable row level security;
alter table public.messages         enable row level security;
alter table public.bulk_quotes      enable row level security;
alter table public.orders           enable row level security;
alter table public.wishlists        enable row level security;
alter table public.bundles          enable row level security;
alter table public.promo_codes      enable row level security;
alter table public.delivery_zones   enable row level security;

-- Profiles
drop policy if exists "profiles read own" on public.profiles;
create policy "profiles read own" on public.profiles for select
  using ((select auth.uid()) = id or (select public.is_admin()));

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles for update
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Categories
drop policy if exists "categories public read" on public.categories;
create policy "categories public read" on public.categories
  for select using (true);

drop policy if exists "categories admin write" on public.categories;
create policy "categories admin write" on public.categories
  for all
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Products (customers see published only; admin sees all)
drop policy if exists "products public read" on public.products;
create policy "products public read" on public.products
  for select using (published = true or (select public.is_admin()));

drop policy if exists "products admin write" on public.products;
create policy "products admin write" on public.products
  for all
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Messages
drop policy if exists "messages anyone insert" on public.messages;
create policy "messages anyone insert" on public.messages
  for insert with check (true);

drop policy if exists "messages admin read" on public.messages;
create policy "messages admin read" on public.messages
  for select using ((select public.is_admin()));

drop policy if exists "messages admin write" on public.messages;
create policy "messages admin write" on public.messages
  for all
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Bulk quotes
drop policy if exists "bulk_quotes anyone insert" on public.bulk_quotes;
create policy "bulk_quotes anyone insert" on public.bulk_quotes
  for insert with check (true);

drop policy if exists "bulk_quotes admin read" on public.bulk_quotes;
create policy "bulk_quotes admin read" on public.bulk_quotes
  for select using ((select public.is_admin()));

drop policy if exists "bulk_quotes admin write" on public.bulk_quotes;
create policy "bulk_quotes admin write" on public.bulk_quotes
  for all
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Orders: admin full access, customer self-read by case-insensitive email,
-- webhook inserts via service-role (bypasses RLS).
drop policy if exists "orders admin read" on public.orders;
create policy "orders admin read" on public.orders
  for select using ((select public.is_admin()));

drop policy if exists "orders admin write" on public.orders;
create policy "orders admin write" on public.orders
  for all
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "orders user read own" on public.orders;
create policy "orders user read own" on public.orders
  for select using (
    customer_email is not null
    and lower(customer_email) = (
      select lower(email) from auth.users where id = (select auth.uid())
    )
  );

-- Wishlists
drop policy if exists "wishlists read own" on public.wishlists;
create policy "wishlists read own" on public.wishlists
  for select using ((select auth.uid()) = user_id);

drop policy if exists "wishlists insert own" on public.wishlists;
create policy "wishlists insert own" on public.wishlists
  for insert with check ((select auth.uid()) = user_id);

drop policy if exists "wishlists delete own" on public.wishlists;
create policy "wishlists delete own" on public.wishlists
  for delete using ((select auth.uid()) = user_id);

-- Bundles
drop policy if exists "bundles_public_read" on public.bundles;
create policy "bundles_public_read" on public.bundles
  for select using (active = true);

drop policy if exists "bundles_admin_all" on public.bundles;
create policy "bundles_admin_all" on public.bundles
  for all
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Promo codes (admin only; storefront uses RPC, never the table)
drop policy if exists "promo_codes_admin_all" on public.promo_codes;
create policy "promo_codes_admin_all" on public.promo_codes
  for all
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Delivery zones (public read, admin write)
drop policy if exists "delivery_zones_public_read" on public.delivery_zones;
create policy "delivery_zones_public_read" on public.delivery_zones
  for select using (true);

drop policy if exists "delivery_zones_admin_all" on public.delivery_zones;
create policy "delivery_zones_admin_all" on public.delivery_zones
  for all
  using ((select public.is_admin()))
  with check ((select public.is_admin()));


-- ---------------------------------------------------------------------
-- 5. Indexes
-- ---------------------------------------------------------------------
create index if not exists products_category_idx     on public.products  (category_slug);
create index if not exists products_featured_idx     on public.products  (featured)   where featured = true;
create index if not exists products_discount_idx     on public.products  (discount)   where discount = true;
create index if not exists products_published_idx    on public.products  (published);
create index if not exists products_updated_at_idx   on public.products  (updated_at desc);
create index if not exists profiles_id_idx           on public.profiles  (id);
create index if not exists orders_email_idx          on public.orders    (customer_email);
create index if not exists orders_session_idx        on public.orders    (stripe_session_id);
create index if not exists orders_created_at_idx     on public.orders    (created_at desc);
create index if not exists wishlists_user_idx        on public.wishlists (user_id);


-- ---------------------------------------------------------------------
-- 6. Storage bucket for product / category / bundle images
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  524288,    -- 512 KB hard cap (resize.ts targets ~200 KB)
  array['image/webp', 'image/jpeg', 'image/png']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "product_images_public_read" on storage.objects;
create policy "product_images_public_read" on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists "product_images_admin_insert" on storage.objects;
create policy "product_images_admin_insert" on storage.objects
  for insert with check (
    bucket_id = 'product-images'
    and (select public.is_admin())
  );

drop policy if exists "product_images_admin_update" on storage.objects;
create policy "product_images_admin_update" on storage.objects
  for update using (
    bucket_id = 'product-images'
    and (select public.is_admin())
  );

drop policy if exists "product_images_admin_delete" on storage.objects;
create policy "product_images_admin_delete" on storage.objects
  for delete using (
    bucket_id = 'product-images'
    and (select public.is_admin())
  );

-- =====================================================================
-- Done. Future schema changes should edit THIS file and re-run it
-- rather than adding new incremental migration files.
-- =====================================================================
