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
-- 1. Extensions + internal schema
-- ---------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- The `private` schema holds helper functions that should NEVER be
-- callable via PostgREST (/rest/v1/rpc/...). RLS policies still call
-- them directly because USAGE + EXECUTE is granted to anon /
-- authenticated / service_role, but PostgREST is configured to only
-- expose the `public` schema, so anonymous can't hit them as RPCs.
create schema if not exists private;
grant usage on schema private to anon, authenticated, service_role;

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

-- Promo-code scope: limit which products / categories a code applies to.
-- NULL or empty array → applies to every product (back-compat).
alter table public.promo_codes
  add column if not exists applies_to_product_ids  uuid[],
  add column if not exists applies_to_category_slugs text[];

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

-- handle_new_user: trigger fn that creates a profile row on signup and
-- auto-grants admin to the owner email. Lives in `private` so it's not
-- exposed via /rest/v1/rpc/handle_new_user.
create or replace function private.handle_new_user()
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

-- Triggers don't need EXECUTE grants — Postgres bypasses them for
-- BEFORE/AFTER triggers. Revoke aggressively so the function is
-- unreachable from any client role.
revoke all on function private.handle_new_user() from public;
revoke all on function private.handle_new_user() from anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure private.handle_new_user();

-- Drop the old public.handle_new_user (was tied to the trigger above).
drop function if exists public.handle_new_user();

-- Promote the existing owner account (idempotent)
update public.profiles
   set role = 'admin'
 where lower(email) = lower('redbarnmarket@protonmail.com');

-- is_admin: auth helper used in RLS policies. Lives in `private` so
-- it's not exposed via /rest/v1/rpc/is_admin. RLS evaluation in
-- Postgres runs with the calling user's role, so anon / authenticated
-- still need EXECUTE permission for the policies to evaluate.
create or replace function private.is_admin()
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

revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to anon, authenticated, service_role;

-- Atomic stock decrement at checkout. SECURITY INVOKER (was DEFINER):
-- the Stripe webhook calls this with the service-role key, which
-- bypasses RLS, so the inner UPDATE is unrestricted. Admin users
-- calling it would go through their RLS "admin write" policy on
-- products. Regular users have no UPDATE policy so the function is
-- effectively a no-op for them. Result: same behaviour without the
-- privilege-escalation surface area.
create or replace function public.decrement_product_stock(items jsonb)
returns table (product_id uuid, new_stock int)
language plpgsql
security invoker
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

-- admin_list_users (staff page): returns every profile when caller is
-- admin. Stays SECURITY DEFINER because it intentionally reads other
-- users' rows past RLS. The internal `private.is_admin()` check makes
-- non-admins receive an empty result.
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
  where private.is_admin()
  order by p.created_at desc;
$$;

-- anon cannot call this even if they tried (returns empty due to the
-- internal is_admin check, but better to revoke EXECUTE outright).
revoke all on function public.admin_list_users() from public, anon;
grant execute on function public.admin_list_users() to authenticated;

-- admin_subscriber_emails (campaigns page)
-- Drop old single-column signature so PostgREST exposes only the new one.
drop function if exists public.admin_subscriber_emails();

create or replace function public.admin_subscriber_emails()
returns table (email text, subscribed_at timestamptz)
language sql
security definer
set search_path = public, pg_temp
as $$
  select p.email, p.created_at
  from public.profiles p
  where private.is_admin()
    and p.marketing_optin = true
    and p.email is not null;
$$;

revoke all on function public.admin_subscriber_emails() from public, anon;
grant execute on function public.admin_subscriber_emails() to authenticated;

-- Drop the old public.is_admin. CASCADE removes any RLS policies that
-- still reference the old function — that's fine because Section 4
-- below recreates every policy from scratch using private.is_admin().
drop function if exists public.is_admin() cascade;

-- Promo code: validate + consume
-- Drop old single-arg signature so PostgREST/Supabase only exposes the new
-- one (avoids dual-overload ambiguity in the .rpc() client).
drop function if exists public.validate_promo_code(text);

create or replace function public.validate_promo_code(
  p_code text,
  p_cart_product_ids uuid[] default null
)
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
  scope_active boolean := false;
  scope_ok     boolean := false;
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

  -- Scope check. If the admin restricted this code to specific products /
  -- categories, at least one cart item must match.
  scope_active :=
    (rec.applies_to_product_ids   is not null and array_length(rec.applies_to_product_ids,   1) > 0)
    or (rec.applies_to_category_slugs is not null and array_length(rec.applies_to_category_slugs, 1) > 0);
  if scope_active then
    if p_cart_product_ids is not null and array_length(p_cart_product_ids, 1) > 0 then
      if rec.applies_to_product_ids is not null
         and array_length(rec.applies_to_product_ids, 1) > 0
         and exists (
           select 1 from unnest(p_cart_product_ids) cid
           where cid = any(rec.applies_to_product_ids)
         )
      then
        scope_ok := true;
      end if;
      if (not scope_ok)
         and rec.applies_to_category_slugs is not null
         and array_length(rec.applies_to_category_slugs, 1) > 0
         and exists (
           select 1 from public.products p
           where p.id = any(p_cart_product_ids)
             and p.category_slug = any(rec.applies_to_category_slugs)
         )
      then
        scope_ok := true;
      end if;
    end if;
    if not scope_ok then
      return query select rec.code, rec.discount_type, rec.discount_value, false, 'NOT_APPLICABLE'::text;
      return;
    end if;
  end if;

  return query select rec.code, rec.discount_type, rec.discount_value, true, 'OK'::text;
end;
$$;

grant execute on function public.validate_promo_code(text, uuid[]) to anon, authenticated;

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
--    (select private.is_admin()) so policies evaluate once per query,
--    not once per row (5-50x faster on protected reads).
--    is_admin lives in the `private` schema so it can't be invoked via
--    PostgREST /rest/v1/rpc/.
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
  using ((select auth.uid()) = id or (select private.is_admin()));

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
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- Products (customers see published only; admin sees all)
drop policy if exists "products public read" on public.products;
create policy "products public read" on public.products
  for select using (published = true or (select private.is_admin()));

drop policy if exists "products admin write" on public.products;
create policy "products admin write" on public.products
  for all
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- Messages (contact form). Public INSERT — with realistic length
-- guards so the policy is no longer "always true" and to reject
-- trivial spam (empty fields, oversized blobs).
drop policy if exists "messages anyone insert" on public.messages;
create policy "messages anyone insert" on public.messages
  for insert with check (
    length(coalesce(name, ''))    between 1 and 200
    and length(coalesce(email, '')) between 3 and 320
    and position('@' in email) > 1
    and length(coalesce(message, '')) between 1 and 10000
  );

drop policy if exists "messages admin read" on public.messages;
create policy "messages admin read" on public.messages
  for select using ((select private.is_admin()));

drop policy if exists "messages admin write" on public.messages;
create policy "messages admin write" on public.messages
  for all
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- Bulk quotes (contractor inquiry form). Same realistic guards as
-- messages so the policy is no longer "always true".
drop policy if exists "bulk_quotes anyone insert" on public.bulk_quotes;
create policy "bulk_quotes anyone insert" on public.bulk_quotes
  for insert with check (
    length(coalesce(company,            '')) between 1 and 200
    and length(coalesce(contact,        '')) between 1 and 200
    and length(coalesce(email,          '')) between 3 and 320
    and position('@' in email) > 1
    and length(coalesce(phone,          '')) between 1 and 50
    and length(coalesce(project_type,   '')) between 1 and 200
    and length(coalesce(estimated_quantity, '')) between 1 and 200
    and length(coalesce(timeline,       '')) between 1 and 200
    and length(coalesce(notes,          '')) <= 5000
  );

drop policy if exists "bulk_quotes admin read" on public.bulk_quotes;
create policy "bulk_quotes admin read" on public.bulk_quotes
  for select using ((select private.is_admin()));

drop policy if exists "bulk_quotes admin write" on public.bulk_quotes;
create policy "bulk_quotes admin write" on public.bulk_quotes
  for all
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- Orders: admin full access, customer self-read by case-insensitive email,
-- webhook inserts via service-role (bypasses RLS).
drop policy if exists "orders admin read" on public.orders;
create policy "orders admin read" on public.orders
  for select using ((select private.is_admin()));

drop policy if exists "orders admin write" on public.orders;
create policy "orders admin write" on public.orders
  for all
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- Customer can read their own orders. We compare the row's email to the
-- JWT's `email` claim — authenticated users can't read `auth.users`
-- directly so a subquery there would always return NULL, which is what
-- previously made the /account/orders page come back empty even when
-- the order row existed.
drop policy if exists "orders user read own" on public.orders;
create policy "orders user read own" on public.orders
  for select using (
    customer_email is not null
    and lower(customer_email) = lower(
      coalesce((auth.jwt() ->> 'email')::text, '')
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
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- Promo codes (admin only; storefront uses RPC, never the table)
drop policy if exists "promo_codes_admin_all" on public.promo_codes;
create policy "promo_codes_admin_all" on public.promo_codes
  for all
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- Delivery zones (public read, admin write)
drop policy if exists "delivery_zones_public_read" on public.delivery_zones;
create policy "delivery_zones_public_read" on public.delivery_zones
  for select using (true);

drop policy if exists "delivery_zones_admin_all" on public.delivery_zones;
create policy "delivery_zones_admin_all" on public.delivery_zones
  for all
  using ((select private.is_admin()))
  with check ((select private.is_admin()));


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

-- NOTE: there is intentionally NO public SELECT policy on
-- storage.objects for `product-images`. The bucket is configured as
-- `public = true` above, which makes object URLs publicly readable.
-- A broad SELECT policy would also let anonymous clients LIST every
-- file (which we don't need or want).
drop policy if exists "product_images_public_read" on storage.objects;

drop policy if exists "product_images_admin_insert" on storage.objects;
create policy "product_images_admin_insert" on storage.objects
  for insert with check (
    bucket_id = 'product-images'
    and (select private.is_admin())
  );

drop policy if exists "product_images_admin_update" on storage.objects;
create policy "product_images_admin_update" on storage.objects
  for update using (
    bucket_id = 'product-images'
    and (select private.is_admin())
  );

drop policy if exists "product_images_admin_delete" on storage.objects;
create policy "product_images_admin_delete" on storage.objects
  for delete using (
    bucket_id = 'product-images'
    and (select private.is_admin())
  );

-- ---------------------------------------------------------------------
-- 6. Order numbers + shipping address (idempotent)
-- ---------------------------------------------------------------------

alter table public.orders
  add column if not exists order_number    text,
  add column if not exists shipping_name   text,
  add column if not exists shipping_address jsonb,
  add column if not exists customer_phone  text;

create unique index if not exists orders_order_number_uniq
  on public.orders (order_number);

-- Generate a human-friendly alphanumeric order number, e.g. RB-A3K9X2P7.
-- 8 chars from a 32-char alphabet that excludes confusing chars
-- (0/O, 1/I/L) -> ~1.1 trillion combinations; the unique index protects
-- against the astronomically unlikely collision.
create or replace function private.generate_order_number()
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  out_code text;
  i int;
begin
  out_code := 'RB-';
  for i in 1..8 loop
    out_code := out_code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  end loop;
  return out_code;
end;
$$;

revoke all on function private.generate_order_number() from public, anon, authenticated;

-- Trigger: assign order_number on insert if not provided, retrying on
-- the very unlikely event of a collision.
create or replace function private.assign_order_number()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  candidate text;
  attempts  int := 0;
begin
  if new.order_number is not null and new.order_number <> '' then
    return new;
  end if;
  loop
    candidate := private.generate_order_number();
    attempts := attempts + 1;
    if not exists (select 1 from public.orders where order_number = candidate) then
      new.order_number := candidate;
      return new;
    end if;
    if attempts > 10 then
      raise exception 'Could not generate unique order_number after 10 attempts';
    end if;
  end loop;
end;
$$;

revoke all on function private.assign_order_number() from public, anon, authenticated;

drop trigger if exists on_order_assign_number on public.orders;
create trigger on_order_assign_number
  before insert on public.orders
  for each row execute procedure private.assign_order_number();

-- Backfill any pre-existing rows that don't have an order_number yet.
do $$
declare r record; new_num text; attempts int;
begin
  for r in select id from public.orders where order_number is null loop
    attempts := 0;
    loop
      new_num := private.generate_order_number();
      attempts := attempts + 1;
      begin
        update public.orders set order_number = new_num where id = r.id;
        exit;
      exception when unique_violation then
        if attempts > 10 then
          raise exception 'Backfill could not generate unique order_number';
        end if;
      end;
    end loop;
  end loop;
end $$;

-- =====================================================================
-- Done. Future schema changes should edit THIS file and re-run it
-- rather than adding new incremental migration files.
-- =====================================================================
