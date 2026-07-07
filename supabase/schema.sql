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
create extension if not exists postgis;
create extension if not exists pg_trgm;

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
--    Every USING/WITH CHECK uses auth.uid() /
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
  using ((auth.uid() = id) or (select private.is_admin()));

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

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
  for select using ((published = true) or (select private.is_admin()));

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
  for select using (auth.uid() = user_id);

drop policy if exists "wishlists insert own" on public.wishlists;
create policy "wishlists insert own" on public.wishlists
  for insert with check (auth.uid() = user_id);

drop policy if exists "wishlists delete own" on public.wishlists;
create policy "wishlists delete own" on public.wishlists
  for delete using (auth.uid() = user_id);

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

-- ---------------------------------------------------------------------
-- MY RECETTE CUSTOM TABLES (Phase 1: CSV Bulk Upload)
-- ---------------------------------------------------------------------

-- Extend profiles table with supermarket-specific fields
alter table public.profiles
  add column if not exists is_supermarket boolean not null default false,
  add column if not exists supermarket_name jsonb,
  add column if not exists description jsonb,
  add column if not exists banner_url text,
  add column if not exists profile_picture_url text,
  add column if not exists address jsonb,
  add column if not exists location_geometry geography(POINT, 4326),
  add column if not exists phone text,
  add column if not exists website text,
  add column if not exists social_links jsonb,
  add column if not exists opening_hours jsonb,
  add column if not exists category_tags text[],
  add column if not exists subscription_status text not null 
    default 'inactive'
    check (subscription_status in ('inactive', 'active', 'trialing', 'past_due', 'canceled')),
  add column if not exists subscription_start_date timestamptz,
  add column if not exists subscription_end_date timestamptz;

-- Supermarket-specific products (links products to supermarkets with custom pricing/stock)
create table if not exists public.supermarket_products (
  id uuid primary key default gen_random_uuid(),
  supermarket_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  price numeric(10,2) not null,
  original_price numeric(10,2),
  stock integer not null default 0,
  is_available boolean default true,
  supermarket_sku text,
  supermarket_barcode text,
  location_in_store text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (supermarket_id, product_id)
);

-- Indexes for supermarket_products
create index if not exists idx_supermarket_products_supermarket 
  on public.supermarket_products(supermarket_id);

create index if not exists idx_supermarket_products_availability 
  on public.supermarket_products(supermarket_id, is_available) where is_available = true;

-- Partial unique indexes for SKU and barcode
create unique index if not exists idx_supermarket_products_sku_unique 
  on public.supermarket_products(supermarket_id, supermarket_sku) where supermarket_sku is not null;

create unique index if not exists idx_supermarket_products_barcode_unique 
  on public.supermarket_products(supermarket_id, supermarket_barcode) where supermarket_barcode is not null;

-- Index for supermarket location queries (geospatial)
create index if not exists idx_profiles_location_geometry 
  on public.profiles using gist(location_geometry) where location_geometry is not null;

-- Supermarket Follows (users following supermarkets)
create table if not exists public.supermarket_follows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  supermarket_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, supermarket_id)
);

-- Indexes for supermarket_follows
create index if not exists idx_supermarket_follows_user 
  on public.supermarket_follows(user_id);

create index if not exists idx_supermarket_follows_supermarket 
  on public.supermarket_follows(supermarket_id);

create index if not exists idx_supermarket_follows_created 
  on public.supermarket_follows(created_at desc);

-- Supermarket Coupons
create table if not exists public.supermarket_coupons (
  id uuid primary key default gen_random_uuid(),
  supermarket_id uuid not null references public.profiles(id) on delete cascade,
  code text not null unique,
  description jsonb not null,
  discount_type text not null check (discount_type in ('percent', 'amount')),
  discount_value numeric(10,2) not null,
  min_purchase_amount numeric(10,2),
  max_uses integer,
  uses_count integer default 0,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  active boolean default true,
  products_eligible uuid[],
  categories_eligible text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for supermarket_coupons
create index if not exists idx_supermarket_coupons_supermarket 
  on public.supermarket_coupons(supermarket_id);

create index if not exists idx_supermarket_coupons_code 
  on public.supermarket_coupons(code) where active = true;

create index if not exists idx_supermarket_coupons_active 
  on public.supermarket_coupons(supermarket_id, active) where active = true;

-- Supermarket Bundles
create table if not exists public.supermarket_bundles (
  id uuid primary key default gen_random_uuid(),
  supermarket_id uuid not null references public.profiles(id) on delete cascade,
  name jsonb not null,
  description jsonb not null,
  bundle_price numeric(10,2) not null,
  original_price numeric(10,2),
  image_url text,
  product_ids uuid[] not null,
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for supermarket_bundles
create index if not exists idx_supermarket_bundles_supermarket 
  on public.supermarket_bundles(supermarket_id);

create index if not exists idx_supermarket_bundles_active 
  on public.supermarket_bundles(supermarket_id, active) where active = true;

-- Supermarket Sales
create table if not exists public.supermarket_sales (
  id uuid primary key default gen_random_uuid(),
  supermarket_id uuid not null references public.profiles(id) on delete cascade,
  name jsonb not null,
  description jsonb,
  discount_percent numeric(5,2) not null check (discount_percent > 0 and discount_percent <= 100),
  applies_to_product_ids uuid[],
  applies_to_category_slugs text[],
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  active boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for supermarket_sales
create index if not exists idx_supermarket_sales_supermarket 
  on public.supermarket_sales(supermarket_id);

create index if not exists idx_supermarket_sales_active 
  on public.supermarket_sales(supermarket_id, active) where active = true;

-- Supermarket Jobs
create table if not exists public.supermarket_jobs (
  id uuid primary key default gen_random_uuid(),
  supermarket_id uuid not null references public.profiles(id) on delete cascade,
  title jsonb not null,
  description jsonb not null,
  position_type text not null check (position_type in ('full_time', 'part_time', 'temporary', 'contract', 'internship')),
  salary_range jsonb,
  requirements text[],
  benefits text[],
  contact_email text,
  contact_phone text,
  application_url text,
  application_email text,
  active boolean default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for supermarket_jobs
create index if not exists idx_supermarket_jobs_supermarket 
  on public.supermarket_jobs(supermarket_id);

create index if not exists idx_supermarket_jobs_active 
  on public.supermarket_jobs(supermarket_id, active) where active = true;

-- Supermarket Feed Posts
create table if not exists public.supermarket_feed (
  id uuid primary key default gen_random_uuid(),
  supermarket_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('new_product', 'price_change', 'sale_start', 'coupon_added', 'bundle_added', 'job_posted', 'announcement')),
  entity_id uuid,
  title jsonb not null,
  description jsonb,
  image_url text,
  action_url text not null,
  active boolean default true,
  pinned boolean default false,
  visibility text not null check (visibility in ('public', 'followers_only')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for supermarket_feed
create index if not exists idx_supermarket_feed_supermarket 
  on public.supermarket_feed(supermarket_id);

create index if not exists idx_supermarket_feed_created 
  on public.supermarket_feed(created_at desc);

create index if not exists idx_supermarket_feed_active 
  on public.supermarket_feed(supermarket_id, active) where active = true;

create index if not exists idx_supermarket_feed_pinned 
  on public.supermarket_feed(supermarket_id, pinned) where pinned = true;


-- ---------------------------------------------------------------------
-- MY RECETTE: Row Level Security for New Tables
-- ---------------------------------------------------------------------

-- Enable RLS on new tables
alter table public.supermarket_products enable row level security;

-- supermarket_products: supermarket can manage their own products, admin can manage all
create policy "supermarket_products: supermarket can manage own" on public.supermarket_products
  for all
  using (
    (select private.is_admin()) or
    (auth.uid() = supermarket_id)
  )
  with check (
    (select private.is_admin()) or
    (auth.uid() = supermarket_id)
  );

-- supermarket_products: read for all if available
create policy "supermarket_products: public can read available" on public.supermarket_products
  for select
  using ((is_available = true) or (select private.is_admin()));

-- Enable RLS on supermarket_follows
alter table public.supermarket_follows enable row level security;

-- supermarket_follows: users can follow/unfollow their own follows, admin can manage all
create policy "supermarket_follows: users can manage own" on public.supermarket_follows
  for all
  using (
    (select private.is_admin()) or
    (auth.uid() = user_id)
  )
  with check (
    (select private.is_admin()) or
    (auth.uid() = user_id)
  );

-- supermarket_follows: anyone can read follows for a supermarket (to show follower count)
create policy "supermarket_follows: public can read" on public.supermarket_follows
  for select
  using (true);

-- supermarket_follows: users can see who they follow
create policy "supermarket_follows: users can read own follows" on public.supermarket_follows
  for select
  using (
    (select private.is_admin()) or
    (auth.uid() = user_id)
  );

-- Enable RLS on supermarket_coupons
alter table public.supermarket_coupons enable row level security;

-- supermarket_coupons: supermarket can manage their own coupons, admin can manage all
create policy "supermarket_coupons: supermarket can manage own" on public.supermarket_coupons
  for all
  using (
    (select private.is_admin()) or
    (auth.uid() = supermarket_id)
  )
  with check (
    (select private.is_admin()) or
    (auth.uid() = supermarket_id)
  );

-- supermarket_coupons: public can read active coupons
create policy "supermarket_coupons: public can read active" on public.supermarket_coupons
  for select
  using (active = true and ends_at > now());

-- Enable RLS on supermarket_bundles
alter table public.supermarket_bundles enable row level security;

-- supermarket_bundles: supermarket can manage their own bundles, admin can manage all
create policy "supermarket_bundles: supermarket can manage own" on public.supermarket_bundles
  for all
  using (
    (select private.is_admin()) or
    (auth.uid() = supermarket_id)
  )
  with check (
    (select private.is_admin()) or
    (auth.uid() = supermarket_id)
  );

-- supermarket_bundles: public can read active bundles
create policy "supermarket_bundles: public can read active" on public.supermarket_bundles
  for select
  using (active = true);

-- Enable RLS on supermarket_sales
alter table public.supermarket_sales enable row level security;

-- supermarket_sales: supermarket can manage their own sales, admin can manage all
create policy "supermarket_sales: supermarket can manage own" on public.supermarket_sales
  for all
  using (
    (select private.is_admin()) or
    (auth.uid() = supermarket_id)
  )
  with check (
    (select private.is_admin()) or
    (auth.uid() = supermarket_id)
  );

-- supermarket_sales: public can read active sales
create policy "supermarket_sales: public can read active" on public.supermarket_sales
  for select
  using (active = true and ends_at > now());

-- Enable RLS on supermarket_jobs
alter table public.supermarket_jobs enable row level security;

-- supermarket_jobs: supermarket can manage their own jobs, admin can manage all
create policy "supermarket_jobs: supermarket can manage own" on public.supermarket_jobs
  for all
  using (
    (select private.is_admin()) or
    (auth.uid() = supermarket_id)
  )
  with check (
    (select private.is_admin()) or
    (auth.uid() = supermarket_id)
  );

-- supermarket_jobs: public can read active jobs
create policy "supermarket_jobs: public can read active" on public.supermarket_jobs
  for select
  using (active = true);

-- Enable RLS on supermarket_feed
alter table public.supermarket_feed enable row level security;

-- supermarket_feed: supermarket can manage their own feed posts, admin can manage all
create policy "supermarket_feed: supermarket can manage own" on public.supermarket_feed
  for all
  using (
    (select private.is_admin()) or
    (auth.uid() = supermarket_id)
  )
  with check (
    (select private.is_admin()) or
    (auth.uid() = supermarket_id)
  );

-- supermarket_feed: public can read active public posts
create policy "supermarket_feed: public can read public posts" on public.supermarket_feed
  for select
  using (active = true and visibility = 'public');

-- supermarket_feed: followers can read followers_only posts from supermarkets they follow
create policy "supermarket_feed: followers can read followers_only posts" on public.supermarket_feed
  for select
  using (
    active = true and 
    visibility = 'followers_only' and
    exists (
      select 1 from public.supermarket_follows 
      where supermarket_follows.supermarket_id = public.supermarket_feed.supermarket_id
      and supermarket_follows.user_id = auth.uid()
    )
  );


-- ---------------------------------------------------------------------
-- MY RECETTE: Helper Functions for CSV Processing
-- ---------------------------------------------------------------------

-- Function to find product by barcode, SKU, or name (in that order)
create or replace function public.find_product_by_identifier(
  barcode_val text default null,
  sku_val text default null,
  name_val text default null
)
returns table (
  id uuid,
  barcode text,
  sku text,
  name jsonb,
  category_slug text
)
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  -- Try barcode first (exact match)
  return query
  select pr.id, pr.barcode, pr.sku, pr.name, pr.category_slug
  from public.products pr
  where pr.barcode = barcode_val
  limit 1;
  
  -- Then try SKU
  return query
  select pr.id, pr.barcode, pr.sku, pr.name, pr.category_slug
  from public.products pr
  where pr.sku = sku_val
  limit 1;
  
  -- Then try name (case-insensitive, exact match on English name)
  return query
  select pr.id, pr.barcode, pr.sku, pr.name, pr.category_slug
  from public.products pr
  where lower(pr.name->>'en') = lower(name_val)
  limit 1;
  
  -- Finally try name (case-insensitive, partial match on English name as fallback)
  return query
  select pr.id, pr.barcode, pr.sku, pr.name, pr.category_slug
  from public.products pr
  where lower(pr.name->>'en') like '%' || lower(name_val) || '%'
  limit 1;
end;
$$;

-- Function to process bulk CSV upload for a supermarket
create or replace function public.process_supermarket_csv_batch(
  p_supermarket_id uuid,
  p_rows jsonb[]
)
returns table (
  row_index integer,
  product_id uuid,
  supermarket_product_id uuid,
  action text,
  status text,
  message text
)
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  row_record jsonb;
  row_index integer;
  matched_product_id uuid;
  matched_sku text;
  matched_barcode text;
  price_val numeric(10,2);
  stock_val integer;
  sku_val text;
  barcode_val text;
  name_val text;
  category_val text;
  description_val text;
  brand_val text;
  unit_val text;
  location_val text;
begin
  foreach row_record, row_index in array p_rows
  loop
    -- Extract values from JSON row
    price_val := coalesce((row_record->>'price')::numeric(10,2), 0);
    stock_val := coalesce((row_record->>'stock')::integer, 0);
    sku_val := coalesce(row_record->>'sku', '');
    barcode_val := coalesce(row_record->>'barcode', '');
    name_val := coalesce(row_record->>'name', '');
    category_val := coalesce(row_record->>'category', 'uncategorized');
    description_val := coalesce(row_record->>'description', '');
    brand_val := coalesce(row_record->>'brand', '');
    unit_val := coalesce(row_record->>'unit', '');
    location_val := coalesce(row_record->>'location_in_store', '');

    -- Validate required fields
    if price_val <= 0 or stock_val < 0 then
      return query select row_index, null::uuid, null::uuid, 'skip', 'error', 'Invalid price or stock value';
      continue;
    end if;

    if sku_val = '' and barcode_val = '' and name_val = '' then
      return query select row_index, null::uuid, null::uuid, 'skip', 'error', 'Missing product identifier (sku, barcode, or name required)';
      continue;
    end if;

    -- Try to find existing product by barcode -> SKU -> name
    select id, sku, barcode into matched_product_id, matched_sku, matched_barcode
    from public.find_product_by_identifier(barcode_val, sku_val, name_val)
    limit 1;

    if matched_product_id is not null then
      -- Product exists, create or update supermarket_products entry
      begin
        update public.supermarket_products
          set price = price_val,
              original_price = coalesce(original_price, price_val),
              stock = stock_val,
              is_available = (stock_val > 0),
              supermarket_sku = nullif(sku_val, ''),
              supermarket_barcode = nullif(barcode_val, ''),
              location_in_store = nullif(location_val, ''),
              updated_at = now()
        where supermarket_id = p_supermarket_id and product_id = matched_product_id
        returning id into matched_product_id;

        if matched_product_id is not null then
          return query select row_index, matched_product_id, matched_product_id, 'update', 'success', 'Updated existing supermarket product';
          continue;
        end if;
      exception when no_data_found then
        -- No existing supermarket_product, create new one
      end;

      -- Insert new supermarket_product
      insert into public.supermarket_products (
        supermarket_id, product_id, price, original_price, stock, 
        is_available, supermarket_sku, supermarket_barcode, location_in_store
      ) values (
        p_supermarket_id, matched_product_id, price_val, price_val, stock_val,
        (stock_val > 0), nullif(sku_val, ''), nullif(barcode_val, ''), nullif(location_val, '')
      ) returning id into matched_product_id;

      return query select row_index, matched_product_id, matched_product_id, 'insert', 'success', 'Created new supermarket product';
      continue;
    end if;

    -- No matching product found, create new product and supermarket_product
    begin
      insert into public.products (
        slug, name, description, price, original_price, category_slug, 
        image_url, stock, published, barcode, sku
      ) values (
        lower(replace(replace(name_val, ' ', '-'), '.', '')) || '-' || gen_random_uuid(),
        jsonb_build_object('en', name_val, 'es', name_val),
        jsonb_build_object('en', description_val, 'es', description_val),
        price_val, price_val, category_val, null, 0, true,
        nullif(barcode_val, ''), nullif(sku_val, '')
      ) returning id into matched_product_id;

      insert into public.supermarket_products (
        supermarket_id, product_id, price, original_price, stock,
        is_available, supermarket_sku, supermarket_barcode, location_in_store
      ) values (
        p_supermarket_id, matched_product_id, price_val, price_val, stock_val,
        (stock_val > 0), nullif(sku_val, ''), nullif(barcode_val, ''), nullif(location_val, '')
      ) returning id into matched_product_id;

      return query select row_index, matched_product_id, matched_product_id, 'insert_new', 'success', 'Created new product and supermarket product';
      continue;
    exception when others then
      return query select row_index, null::uuid, null::uuid, 'skip', 'error', 'Error creating new product: ' || SQLERRM;
      continue;
    end;
  end loop;
end;
$$;

grant execute on function public.process_supermarket_csv_batch(uuid, jsonb[]) to authenticated, service_role;
grant execute on function public.find_product_by_identifier(text, text, text) to authenticated, service_role;


-- ---------------------------------------------------------------------
-- MY RECETTE: Ingredient Database (Phase 2)
-- ---------------------------------------------------------------------

-- Extend products table with ingredient-related columns
alter table public.products
  add column if not exists is_ingredient boolean default false,
  add column if not exists ingredient_confidence numeric(3,2),
  add column if not exists ingredient_mapping_status text
    default 'pending'
    check (ingredient_mapping_status in ('auto', 'manual', 'pending', 'ignored'));

-- Ingredients Master List
create table if not exists public.ingredients (
  id uuid primary key default gen_random_uuid(),
  -- Canonical form (singular, lowercase)
  canonical_name text not null unique,
  -- Display forms
  display_name jsonb not null default '{}'::jsonb,
  plural_name text,
  -- Classification
  category text not null check (category in ('vegetable', 'fruit', 'protein', 'dairy', 'grain', 'spice', 'herb', 'oil', 'baking', 'canned', 'beverage', 'nuts', 'miscellaneous')),
  subcategory text,
  -- Metadata
  is_common boolean default true,
  is_basic boolean default false,
  description text,
  -- Nutrition (optional)
  calories_per_100g numeric(10,2),
  -- Timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for ingredients
create index if not exists idx_ingredients_canonical on public.ingredients(canonical_name);
create index if not exists idx_ingredients_category on public.ingredients(category);
create index if not exists idx_ingredients_common on public.ingredients(is_common) where is_common = true;

-- Ingredient Synonyms
create table if not exists public.ingredient_synonyms (
  id uuid primary key default gen_random_uuid(),
  ingredient_id uuid not null references public.ingredients(id) on delete cascade,
  synonym text not null,
  -- Priority: higher = more common alternative
  priority integer default 1,
  -- Context: where this synonym is used (e.g., 'UK', 'US', 'supermarket')
  context text,
  created_at timestamptz not null default now(),
  unique (ingredient_id, synonym)
);

create index if not exists idx_ingredient_synonyms_synonym on public.ingredient_synonyms(synonym);
create index if not exists idx_ingredient_synonyms_ingredient on public.ingredient_synonyms(ingredient_id);

-- Ingredient Patterns (for fuzzy/partial matching)
create table if not exists public.ingredient_patterns (
  id uuid primary key default gen_random_uuid(),
  ingredient_id uuid not null references public.ingredients(id) on delete cascade,
  -- Pattern type: 'contains', 'starts_with', 'ends_with', 'regex'
  pattern_type text not null check (pattern_type in ('contains', 'starts_with', 'ends_with', 'regex')),
  pattern text not null,
  -- Confidence score (0-1)
  confidence numeric(3,2) default 1.0,
  -- Is this pattern case-sensitive?
  case_sensitive boolean default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_ingredient_patterns_ingredient on public.ingredient_patterns(ingredient_id);

-- Ingredient Relationships (Hierarchy & Equivalents)
create table if not exists public.ingredient_relationships (
  id uuid primary key default gen_random_uuid(),
  ingredient_id uuid not null references public.ingredients(id) on delete cascade,
  related_ingredient_id uuid not null references public.ingredients(id) on delete cascade,
  -- Relationship type
  relationship_type text not null check (relationship_type in (
    'synonym',
    'variation',
    'substitute',
    'contains',
    'part_of',
    'parent',
    'child'
  )),
  -- Strength of relationship (0-1)
  strength numeric(3,2) default 1.0,
  -- Context (e.g., 'cooking', 'baking', 'raw')
  context text,
  created_at timestamptz not null default now(),
  check (ingredient_id != related_ingredient_id)
);

create index if not exists idx_ingredient_relationships_type on public.ingredient_relationships(relationship_type);
create index if not exists idx_ingredient_relationships_ingredient on public.ingredient_relationships(ingredient_id);

-- Product-Ingredient Mapping
create table if not exists public.product_ingredients (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete cascade,
  -- How was this mapping created?
  mapping_method text not null check (mapping_method in ('auto_name', 'auto_barcode', 'manual', 'admin')),
  -- Confidence score (0-1)
  confidence numeric(3,2) not null,
  -- Is this the primary ingredient?
  is_primary boolean default false,
  -- Quantity/weight if known
  quantity numeric(10,2),
  unit text,
  -- Notes
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, ingredient_id)
);

-- Indexes for product_ingredients
create index if not exists idx_product_ingredients_product on public.product_ingredients(product_id);
create index if not exists idx_product_ingredients_ingredient on public.product_ingredients(ingredient_id);
create index if not exists idx_product_ingredients_confidence on public.product_ingredients(confidence desc);

-- Pending Ingredient Mappings (For Admin Review)
create table if not exists public.pending_ingredient_mappings (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  supermarket_id uuid references public.profiles(id) on delete set null,
  -- Suggested ingredient (auto-extracted)
  suggested_ingredient_id uuid references public.ingredients(id) on delete set null,
  suggested_ingredient_name text,
  -- Confidence score
  confidence numeric(3,2) not null,
  -- Status
  status text not null check (status in ('pending', 'approved', 'rejected', 'ignored')) default 'pending',
  -- Who resolved it
  resolved_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

-- Indexes for pending_ingredient_mappings
create index if not exists idx_pending_mappings_status on public.pending_ingredient_mappings(status);
create index if not exists idx_pending_mappings_created on public.pending_ingredient_mappings(created_at desc);
create index if not exists idx_pending_mappings_product on public.pending_ingredient_mappings(product_id);

-- Recipes table (for My Recette - Supercook-style search)
create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  -- Recipe metadata
  title jsonb not null,  -- {en: "Spaghetti Bolognese", es: "Espaguetis a la boloñesa"}
  slug text not null unique,
  description jsonb,
  -- Author/owner
  author_id uuid references public.profiles(id) on delete set null,
  -- Content
  instructions jsonb,  -- Array of steps
  prep_time_minutes integer,
  cook_time_minutes integer,
  servings integer default 1,
  difficulty text check (difficulty in ('easy', 'medium', 'hard', 'expert')),
  -- Media
  image_url text,
  video_url text,  -- YouTube embed URL
  -- Ratings and engagement
  rating numeric(3,2) default 0,
  rating_count integer default 0,
  comment_count integer default 0,
  video_count integer default 0,
  view_count integer default 0,
  favorite_count integer default 0,
  -- SEO and categorization
  cuisine text,
  meal_type text check (meal_type in ('breakfast', 'lunch', 'dinner', 'dessert', 'snack', 'appetizer', 'drink')),
  dietary_tags text[],  -- ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', etc.]
  -- Timestamps
  published boolean default true,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for recipes
create index if not exists idx_recipes_slug on public.recipes(slug);
create index if not exists idx_recipes_author on public.recipes(author_id);
create index if not exists idx_recipes_published on public.recipes(published) where published = true;
create index if not exists idx_recipes_rating on public.recipes(rating desc);
create index if not exists idx_recipes_created_at on public.recipes(created_at desc);
create index if not exists idx_recipes_view_count on public.recipes(view_count desc);

-- Recipe-Ingredient Mapping
create table if not exists public.recipes_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete cascade,
  -- Quantity/measurement
  quantity numeric(10,2),
  unit text,
  -- Notes (e.g., "optional", "for garnish")
  notes text,
  -- Position in recipe (for ordered lists)
  "position" integer default 0,
  created_at timestamptz not null default now(),
  unique (recipe_id, ingredient_id)
);

-- Indexes for recipes_ingredients
create index if not exists idx_recipes_ingredients_recipe on public.recipes_ingredients(recipe_id);
create index if not exists idx_recipes_ingredients_ingredient on public.recipes_ingredients(ingredient_id);
create index if not exists idx_recipes_ingredients_position on public.recipes_ingredients(recipe_id, "position");

-- Recipe Instructions (steps for recipes)
create table if not exists public.recipe_instructions (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  step integer not null,
  text jsonb not null,  -- Translatable text: { en: "...", es: "..." }
  image_url text,
  created_at timestamptz not null default now(),
  unique (recipe_id, step)
);

-- Indexes for recipe_instructions
create index if not exists idx_recipe_instructions_recipe on public.recipe_instructions(recipe_id);
create index if not exists idx_recipe_instructions_step on public.recipe_instructions(recipe_id, step);

-- Recipe Comments (for user engagement)
create table if not exists public.recipe_comments (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid references public.recipe_comments(id) on delete cascade,  -- For replies
  content text not null,
  rating integer check (rating >= 1 and rating <= 5),  -- Optional rating (1-5)
  -- Moderation (currently disabled per requirements, but keeping structure)
  is_approved boolean default true,
  is_spam boolean default false,
  -- Timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for recipe_comments
create index if not exists idx_recipe_comments_recipe on public.recipe_comments(recipe_id);
create index if not exists idx_recipe_comments_author on public.recipe_comments(author_id);
create index if not exists idx_recipe_comments_parent on public.recipe_comments(parent_id) where parent_id is not null;
create index if not exists idx_recipe_comments_created on public.recipe_comments(created_at desc);

-- Recipe Favorites (users can favorite recipes)
create table if not exists public.recipe_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, recipe_id)
);

-- Recipe Videos (user-submitted videos for recipes - YouTube and Facebook only)
create table if not exists public.recipe_videos (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  -- Video source
  platform text not null check (platform in ('youtube', 'facebook')),
  video_url text not null,  -- Full video URL from YouTube or Facebook
  -- Extracted IDs for embed
  youtube_video_id text,  -- For YouTube videos
  facebook_video_id text,  -- For Facebook videos
  -- Video metadata
  thumbnail_url text,  -- Thumbnail URL from platform
  -- Content (multi-language)
  title jsonb,  -- {en: string, fr: string, es: string, ar: string}
  description jsonb,  -- {en: string, fr: string, es: string, ar: string}
  -- Engagement (can use platform's own counts, but track locally for analytics)
  like_count integer default 0,
  comment_count integer default 0,
  share_count integer default 0,
  view_count integer default 0,
  -- Status
  is_approved boolean default true,
  is_spam boolean default false,
  status text not null check (status in ('pending', 'approved', 'rejected', 'deleted')),
  rejection_reason text,
  -- Timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Video Comments (separate from recipe comments - for user-submitted videos)
create table if not exists public.video_comments (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.recipe_videos(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  parent_id uuid references public.video_comments(id) on delete cascade,  -- For nested replies
  content text not null,
  -- Engagement
  like_count integer default 0,
  -- Status
  is_approved boolean default true,
  is_spam boolean default false,
  -- Timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Video Comment Likes (users can like video comments)
create table if not exists public.video_comment_likes (
  comment_id uuid not null references public.video_comments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

-- Video Views (track unique views per video)
create table if not exists public.recipe_video_views (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.recipe_videos(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  ip_address text not null,
  user_agent text not null,
  created_at timestamptz not null default now()
);

-- Video Reactions (for like, love, laugh, etc. on videos)
create table if not exists public.video_reactions (
  video_id uuid not null references public.recipe_videos(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction_type text not null check (reaction_type in ('like', 'love', 'laugh', 'surprised', 'sad', 'angry')),
  created_at timestamptz not null default now(),
  primary key (video_id, user_id, reaction_type)
);

-- Indexes for recipe_videos
create index if not exists idx_recipe_videos_recipe on public.recipe_videos(recipe_id);
create index if not exists idx_recipe_videos_user on public.recipe_videos(user_id);
create index if not exists idx_recipe_videos_platform on public.recipe_videos(platform);
create index if not exists idx_recipe_videos_status on public.recipe_videos(status);
create index if not exists idx_recipe_videos_created on public.recipe_videos(created_at desc);

-- Indexes for video_comments
create index if not exists idx_video_comments_video on public.video_comments(video_id);
create index if not exists idx_video_comments_user on public.video_comments(user_id);
create index if not exists idx_video_comments_parent on public.video_comments(parent_id) where parent_id is not null;
create index if not exists idx_video_comments_created on public.video_comments(created_at desc);

-- Indexes for video_comment_likes
create index if not exists idx_video_comment_likes_comment on public.video_comment_likes(comment_id);
create index if not exists idx_video_comment_likes_user on public.video_comment_likes(user_id);
create index if not exists idx_video_comment_likes_created on public.video_comment_likes(created_at desc);

-- Indexes for recipe_video_views
create index if not exists idx_recipe_video_views_video on public.recipe_video_views(video_id);
create index if not exists idx_recipe_video_views_user on public.recipe_video_views(user_id);
create index if not exists idx_recipe_video_views_ip on public.recipe_video_views(ip_address);
create index if not exists idx_recipe_video_views_created on public.recipe_video_views(created_at desc);
create index if not exists idx_recipe_video_views_unique on public.recipe_video_views(video_id, user_id, ip_address) where user_id is not null;

-- Indexes for video_reactions
create index if not exists idx_video_reactions_video on public.video_reactions(video_id);
create index if not exists idx_video_reactions_user on public.video_reactions(user_id);
create index if not exists idx_video_reactions_type on public.video_reactions(reaction_type);

-- Recipe Favorites (users can favorite recipes)
create table if not exists public.recipe_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, recipe_id)
);

-- Indexes for recipe_favorites
create index if not exists idx_recipe_favorites_user on public.recipe_favorites(user_id);
create index if not exists idx_recipe_favorites_recipe on public.recipe_favorites(recipe_id);

-- Denormalized Search Tables (For Performance)

-- Enable RLS on recipe tables
alter table public.recipes enable row level security;
alter table public.recipes_ingredients enable row level security;
alter table public.recipe_instructions enable row level security;
alter table public.recipe_comments enable row level security;
alter table public.recipe_favorites enable row level security;

-- RLS Policies for Recipes
-- Recipes: public read, admin/supermarket write, users can create their own
create policy "recipes_public_read" on public.recipes for select using ((published = true) or (select private.is_admin()));

create policy "recipes_admin_write" on public.recipes for all
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "recipes_user_create" on public.recipes for insert
  with check (auth.uid() = author_id);

create policy "recipes_user_update_own" on public.recipes for update
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

create policy "recipes_user_delete_own" on public.recipes for delete
  using (auth.uid() = author_id);

-- Recipe-Ingredient Mapping: public read, admin write, recipe authors can manage their own
create policy "recipes_ingredients_public_read" on public.recipes_ingredients for select using (true);

create policy "recipes_ingredients_admin_write" on public.recipes_ingredients for all
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "recipes_ingredients_author_write" on public.recipes_ingredients for all
  using ((select private.is_admin()) or exists (select 1 from public.recipes where id = recipe_id and author_id = auth.uid()))
  with check ((select private.is_admin()) or exists (select 1 from public.recipes where id = recipe_id and author_id = auth.uid()));

-- Recipe Instructions: public read, admin write, recipe authors can manage their own
create policy "recipe_instructions_public_read" on public.recipe_instructions for select using (true);

create policy "recipe_instructions_admin_write" on public.recipe_instructions for all
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "recipe_instructions_author_write" on public.recipe_instructions for all
  using ((select private.is_admin()) or exists (select 1 from public.recipes where id = recipe_id and author_id = auth.uid()))
  with check ((select private.is_admin()) or exists (select 1 from public.recipes where id = recipe_id and author_id = auth.uid()));

-- Recipe Comments: public read, authenticated users can create, authors can delete their own
create policy "recipe_comments_public_read" on public.recipe_comments for select using (is_approved = true);

create policy "recipe_comments_create" on public.recipe_comments for insert
  with check (auth.uid() = author_id);

create policy "recipe_comments_delete_own" on public.recipe_comments for delete
  using (auth.uid() = author_id);

create policy "recipe_comments_admin_all" on public.recipe_comments for all
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- Recipe Favorites: users can manage their own
create policy "recipe_favorites_user_manage" on public.recipe_favorites for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Recipe Videos: RLS policies
alter table public.recipe_videos enable row level security;

-- Public can read approved videos
create policy "recipe_videos_public_read" on public.recipe_videos for select
  using (is_approved = true and status = 'approved');

-- Authenticated users can create videos
create policy "recipe_videos_create" on public.recipe_videos for insert
  with check (auth.uid() = user_id);

-- Users can delete their own videos
create policy "recipe_videos_delete_own" on public.recipe_videos for delete
  using (auth.uid() = user_id);

-- Users can update their own videos
create policy "recipe_videos_update_own" on public.recipe_videos for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Admins can manage all videos
create policy "recipe_videos_admin_all" on public.recipe_videos for all
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- Video Comments: RLS policies
alter table public.video_comments enable row level security;

-- Public can read approved video comments
create policy "video_comments_public_read" on public.video_comments for select
  using (is_approved = true);

-- Authenticated users can create video comments
create policy "video_comments_create" on public.video_comments for insert
  with check (auth.uid() = user_id);

-- Users can delete their own video comments
create policy "video_comments_delete_own" on public.video_comments for delete
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can update their own video comments
create policy "video_comments_update_own" on public.video_comments for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Admins can manage all video comments
create policy "video_comments_admin_all" on public.video_comments for all
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- Video Comment Likes: RLS policies
alter table public.video_comment_likes enable row level security;

-- Public can read comment likes (aggregated)
create policy "video_comment_likes_public_read" on public.video_comment_likes for select
  using (true);

-- Authenticated users can create their own comment likes
create policy "video_comment_likes_create" on public.video_comment_likes for insert
  with check (auth.uid() = user_id);

-- Users can delete their own comment likes
create policy "video_comment_likes_delete_own" on public.video_comment_likes for delete
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Admins can manage all comment likes
create policy "video_comment_likes_admin_all" on public.video_comment_likes for all
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- Video Views: RLS policies
alter table public.recipe_video_views enable row level security;

-- Admins can read all views
create policy "recipe_video_views_admin_all" on public.recipe_video_views for all
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- Public can insert views (for tracking)
create policy "recipe_video_views_public_insert" on public.recipe_video_views for insert
  with check (true);

-- Video Reactions: RLS policies
alter table public.video_reactions enable row level security;

-- Public can read reactions (aggregated)
create policy "video_reactions_public_read" on public.video_reactions for select
  using (true);

-- Authenticated users can create their own reactions
create policy "video_reactions_create" on public.video_reactions for insert
  with check (auth.uid() = user_id);

-- Users can update their own reactions (change reaction type)
create policy "video_reactions_update_own" on public.video_reactions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can delete their own reactions
create policy "video_reactions_delete_own" on public.video_reactions for delete
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Admins can manage all reactions
create policy "video_reactions_admin_all" on public.video_reactions for all
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- Trigger to update denormalized table when recipes_ingredients changes
create or replace function public.update_recipes_ingredients_denormalized()
returns trigger as $$
begin
  -- Handle INSERT or UPDATE
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    INSERT INTO public.recipes_ingredients_denormalized (
      recipe_id, ingredient_id, ingredient_canonical
    ) VALUES (
      NEW.recipe_id, NEW.ingredient_id, 
      (SELECT canonical_name FROM public.ingredients WHERE id = NEW.ingredient_id)
    )
    ON CONFLICT (recipe_id, ingredient_id) DO UPDATE
    SET ingredient_canonical = EXCLUDED.ingredient_canonical;
  
  -- Handle DELETE
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.recipes_ingredients_denormalized
    WHERE recipe_id = OLD.recipe_id AND ingredient_id = OLD.ingredient_id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_recipes_ingredients_denormalized ON public.recipes_ingredients;
CREATE TRIGGER trg_recipes_ingredients_denormalized
  AFTER INSERT OR UPDATE OR DELETE ON public.recipes_ingredients
  FOR EACH ROW EXECUTE FUNCTION public.update_recipes_ingredients_denormalized();

grant execute on function public.update_recipes_ingredients_denormalized() to service_role;

-- Function to find recipes by ingredients (Supercook-style search)
create or replace function public.find_recipes_by_ingredients(
  p_ingredient_names text[],
  p_min_match integer default 1,
  p_limit integer default 50
)
returns table (
  recipe_id uuid,
  title jsonb,
  slug text,
  image_url text,
  rating numeric(3,2),
  rating_count integer,
  view_count integer,
  favorite_count integer,
  prep_time_minutes integer,
  cook_time_minutes integer,
  servings integer,
  difficulty text,
  meal_type text,
  ingredient_match_count integer,
  total_ingredients integer,
  missing_ingredients_count integer
)
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  -- Return recipes that match the selected ingredients
  return query
  select 
    r.id as recipe_id,
    r.title,
    r.slug,
    r.image_url,
    r.rating,
    r.rating_count,
    r.view_count,
    r.favorite_count,
    r.prep_time_minutes,
    r.cook_time_minutes,
    r.servings,
    r.difficulty,
    r.meal_type,
    -- Count how many of the selected ingredients match this recipe
    (select count(*) 
     from public.recipes_ingredients_denormalized rid
     where rid.recipe_id = r.id 
     and rid.ingredient_canonical = any(p_ingredient_names)) as ingredient_match_count,
    -- Total ingredients in recipe
    (select count(*) from public.recipes_ingredients where recipe_id = r.id) as total_ingredients,
    -- Count missing ingredients (selected ingredients not in recipe)
    (select count(*) 
     from unnest(p_ingredient_names) as selected_ing
     where not exists (
       select 1 from public.recipes_ingredients_denormalized rid
       where rid.recipe_id = r.id and rid.ingredient_canonical = selected_ing
     )) as missing_ingredients_count
  from public.recipes r
  join public.recipes_ingredients_denormalized rid on r.id = rid.recipe_id
  where rid.ingredient_canonical = any(p_ingredient_names)
    and r.published = true
  group by r.id, r.title, r.slug, r.image_url, r.rating, r.rating_count, 
           r.view_count, r.favorite_count, r.prep_time_minutes, 
           r.cook_time_minutes, r.servings, r.difficulty, r.meal_type
  having count(*) >= p_min_match
  order by 
    ingredient_match_count desc,  -- Most matching ingredients first
    r.rating desc,                 -- Then by rating
    r.view_count desc,              -- Then by popularity
    r.favorite_count desc,          -- Then by favorites
    r.created_at desc               -- Finally by newest
  limit p_limit;
end;
$$;

-- Function to get ingredients for a recipe
create or replace function public.get_recipe_ingredients(p_recipe_id uuid)
returns table (
  ingredient_id uuid,
  canonical_name text,
  display_name jsonb,
  category text,
  quantity numeric(10,2),
  unit text,
  notes text,
  "position" integer
)
language sql
security invoker
set search_path = public, pg_temp
as $$
  select 
    i.id as ingredient_id,
    i.canonical_name,
    i.display_name,
    i.category,
    ri.quantity,
    ri.unit,
    ri.notes,
    ri."position"
  from public.recipes_ingredients ri
  join public.ingredients i on ri.ingredient_id = i.id
  where ri.recipe_id = p_recipe_id
  order by ri."position", i.canonical_name
$$;

-- Function to check ingredient availability at supermarkets
create or replace function public.check_ingredient_availability(
  p_ingredient_names text[],
  p_user_location geography(POINT, 4326) default null,
  p_max_distance_meters numeric default 50000  -- 50km default
)
returns table (
  supermarket_id uuid,
  supermarket_name jsonb,
  location_geometry geography(POINT, 4326),
  distance_meters numeric,
  ingredient_count integer,
  total_price numeric(10,2),
  available_ingredients jsonb,
  missing_ingredients jsonb
)
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  ingredient_name text;
  available_ings jsonb := '[]'::jsonb;
  missing_ings jsonb := '[]'::jsonb;
  supermarket_price numeric(10,2);
  supermarket_stock integer;
  supermarket_available boolean;
  total_price_val numeric(10,2) := 0;
  avail_count integer := 0;
begin
  -- Find supermarkets that have at least one of the selected ingredients
  for supermarket_record in
    select 
      p.id as supermarket_id,
      p.supermarket_name,
      p.location_geometry,
      p.id as profile_id
    from public.profiles p
    where p.is_supermarket = true 
      and p.location_geometry is not null
      and (p_user_location is null or 
           ST_DWithin(p.location_geometry, p_user_location, p_max_distance_meters))
    order by 
      case when p_user_location is not null then 
        ST_Distance(p.location_geometry, p_user_location) 
      else 0 end
  loop
    available_ings := '[]'::jsonb;
    missing_ings := '[]'::jsonb;
    total_price_val := 0;
    avail_count := 0;

    -- Check each ingredient
    for ingredient_name in select unnest(p_ingredient_names)
    loop
      -- Check if any supermarket product has this ingredient
      perform from public.supermarket_products_ingredients_denormalized spid
      join public.ingredients i on spid.ingredient_id = i.id
      where spid.supermarket_id = supermarket_record.supermarket_id
        and i.canonical_name = ingredient_name
        and spid.is_available = true
        and spid.stock > 0
      limit 1;

      if found then
        -- Get the cheapest available product for this ingredient
        select spid.price, spid.stock, spid.is_available 
        into supermarket_price, supermarket_stock, supermarket_available
        from public.supermarket_products_ingredients_denormalized spid
        join public.ingredients i on spid.ingredient_id = i.id
        where spid.supermarket_id = supermarket_record.supermarket_id
          and i.canonical_name = ingredient_name
          and spid.is_available = true
          and spid.stock > 0
        order by spid.price asc
        limit 1;

        if supermarket_available then
          available_ings := available_ings || jsonb_build_object(
            'ingredient', ingredient_name,
            'price', supermarket_price,
            'in_stock', supermarket_stock > 0
          );
          total_price_val := total_price_val + supermarket_price;
          avail_count := avail_count + 1;
        else
          missing_ings := missing_ings || jsonb_build_object('ingredient', ingredient_name);
        end if;
      else
        missing_ings := missing_ings || jsonb_build_object('ingredient', ingredient_name);
      end if;
    end loop;

    -- Only return supermarkets that have at least one matching ingredient
    if avail_count > 0 then
      return query
      select
        supermarket_record.supermarket_id,
        supermarket_record.supermarket_name,
        supermarket_record.location_geometry,
        case when p_user_location is not null then 
          ST_Distance(supermarket_record.location_geometry, p_user_location)::numeric
        else 0 end as distance_meters,
        avail_count as ingredient_count,
        total_price_val as total_price,
        available_ings,
        missing_ings;
    end if;
  end loop;
  
  return;
end;
$$;

-- Function to update recipe rating when a new comment with rating is added
create or replace function public.update_recipe_rating()
returns trigger as $$
begin
  if NEW.rating is not null and NEW.rating >= 1 and NEW.rating <= 5 then
    update public.recipes
    set 
      rating_count = rating_count + 1,
      rating = (rating * rating_count + NEW.rating) / (rating_count + 1)
    where id = NEW.recipe_id;
  end if;
  return NEW;
end;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_recipe_comment_rating ON public.recipe_comments;
CREATE TRIGGER trg_recipe_comment_rating
  AFTER INSERT ON public.recipe_comments
  FOR EACH ROW
  WHEN (NEW.rating is not null)
  EXECUTE FUNCTION public.update_recipe_rating();

-- Grant execute permissions for new functions
grant execute on function public.find_recipes_by_ingredients(text[], integer, integer) to authenticated, service_role;
grant execute on function public.get_recipe_ingredients(uuid) to authenticated, service_role;
grant execute on function public.check_ingredient_availability(text[], geography, numeric) to authenticated, service_role;
grant execute on function public.update_recipe_rating() to service_role;

-- Denormalized Search Tables (For Performance)

-- For fast recipe-ingredient searching
create table if not exists public.recipes_ingredients_denormalized (
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete cascade,
  ingredient_canonical text not null,
  primary key (recipe_id, ingredient_id)
);

-- For fast product-ingredient searching
create table if not exists public.products_ingredients_denormalized (
  product_id uuid not null references public.products(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete cascade,
  ingredient_canonical text not null,
  confidence numeric(3,2) not null,
  primary key (product_id, ingredient_id)
);

-- For fast supermarket product-ingredient searching
create table if not exists public.supermarket_products_ingredients_denormalized (
  supermarket_id uuid not null,
  product_id uuid not null,
  ingredient_id uuid not null,
  ingredient_canonical text not null,
  price numeric(10,2) not null,
  stock integer not null,
  is_available boolean not null,
  primary key (supermarket_id, product_id, ingredient_id)
);

-- Indexes for supermarket_products_ingredients_denormalized
create index if not exists idx_supermarket_products_ingredients_supermarket 
  on public.supermarket_products_ingredients_denormalized(supermarket_id);
create index if not exists idx_supermarket_products_ingredients_ingredient 
  on public.supermarket_products_ingredients_denormalized(ingredient_id);
create index if not exists idx_supermarket_products_ingredients_availability 
  on public.supermarket_products_ingredients_denormalized(supermarket_id, is_available) 
  where is_available = true;


-- ---------------------------------------------------------------------
-- MY RECETTE: Row Level Security for Ingredient Tables
-- ---------------------------------------------------------------------

-- Enable RLS on new tables
alter table public.ingredients enable row level security;
alter table public.ingredient_synonyms enable row level security;
alter table public.ingredient_patterns enable row level security;
alter table public.ingredient_relationships enable row level security;
alter table public.product_ingredients enable row level security;
alter table public.pending_ingredient_mappings enable row level security;
alter table public.recipes_ingredients_denormalized enable row level security;
alter table public.products_ingredients_denormalized enable row level security;
alter table public.supermarket_products_ingredients_denormalized enable row level security;

-- Ingredients: public read, admin write
create policy "ingredients_public_read" on public.ingredients for select using (true);
create policy "ingredients_admin_write" on public.ingredients 
  for all using ((select private.is_admin())) 
  with check ((select private.is_admin()));

-- Ingredient synonyms: public read, admin write
create policy "ingredient_synonyms_public_read" on public.ingredient_synonyms for select using (true);
create policy "ingredient_synonyms_admin_write" on public.ingredient_synonyms 
  for all using ((select private.is_admin())) 
  with check ((select private.is_admin()));

-- Ingredient patterns: public read, admin write
create policy "ingredient_patterns_public_read" on public.ingredient_patterns for select using (true);
create policy "ingredient_patterns_admin_write" on public.ingredient_patterns 
  for all using ((select private.is_admin())) 
  with check ((select private.is_admin()));

-- Ingredient relationships: public read, admin write
create policy "ingredient_relationships_public_read" on public.ingredient_relationships for select using (true);
create policy "ingredient_relationships_admin_write" on public.ingredient_relationships 
  for all using ((select private.is_admin())) 
  with check ((select private.is_admin()));

-- Product ingredients: public read, supermarket/admin write
create policy "product_ingredients_public_read" on public.product_ingredients for select using (true);
create policy "product_ingredients_admin_write" on public.product_ingredients 
  for all using ((select private.is_admin())) 
  with check ((select private.is_admin()));

-- Pending ingredient mappings: admin/supermarket read own, admin write
create policy "pending_mappings_admin_read" on public.pending_ingredient_mappings 
  for select using ((select private.is_admin()) or (auth.uid() = supermarket_id));
create policy "pending_mappings_admin_write" on public.pending_ingredient_mappings 
  for all using ((select private.is_admin())) 
  with check ((select private.is_admin()));

-- Denormalized tables: public read
create policy "recipes_ingredients_denormalized_public_read" on public.recipes_ingredients_denormalized for select using (true);
create policy "products_ingredients_denormalized_public_read" on public.products_ingredients_denormalized for select using (true);
create policy "supermarket_products_ingredients_denormalized_public_read" on public.supermarket_products_ingredients_denormalized for select using (true);


-- ---------------------------------------------------------------------
-- MY RECETTE: Helper Functions for Ingredient Matching
-- ---------------------------------------------------------------------

-- Function to normalize ingredient names
create or replace function public.normalize_ingredient_name(p_name text)
returns text
language sql
as $$
  select lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(p_name, '[^a-zA-Z0-9\s]', '', 'g'),
        '\b(lb|kg|g|oz|ml|l|piece|pack|box|can|each|ea|unit)\b', '', 'g'
      ),
      '\b(organic|fresh|natural|premium|brand|free[\- ]?range|extra|super|best|quality|grade|type|variety|style|cut|sliced|diced|chopped|whole|ground)\b', '', 'g'
    )
  )
$$;

-- Function to extract ingredients from product name
create or replace function public.extract_ingredients_from_product_name(
  p_product_name text,
  p_min_confidence numeric(3,2) default 0.5
)
returns table (
  ingredient_id uuid,
  canonical_name text,
  confidence numeric(3,2),
  match_type text
)
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  normalized_name text;
  ingredient_record record;
  synonym_record record;
  pattern_record record;
begin
  -- Normalize the product name
  normalized_name := public.normalize_ingredient_name(p_product_name);
  
  -- 1. Try exact match on canonical name
  for ingredient_record in 
    select id, canonical_name, 1.0 as confidence, 'exact' as match_type
    from public.ingredients
    where canonical_name = normalized_name
    order by is_common desc, canonical_name
  loop
    if ingredient_record.confidence >= p_min_confidence then
      return next ingredient_record;
    end if;
  end loop;
  
  -- 2. Try exact match on plural name
  for ingredient_record in 
    select i.id, i.canonical_name, 1.0 as confidence, 'exact_plural' as match_type
    from public.ingredients i
    where i.plural_name = normalized_name
    order by i.is_common desc, i.canonical_name
  loop
    if ingredient_record.confidence >= p_min_confidence then
      return next ingredient_record;
    end if;
  end loop;
  
  -- 3. Try synonyms
  for synonym_record in 
    select i.id, i.canonical_name, 0.95 as confidence, 'synonym' as match_type
    from public.ingredient_synonyms s
    join public.ingredients i on s.ingredient_id = i.id
    where s.synonym = normalized_name
    order by s.priority desc, i.is_common desc, i.canonical_name
  loop
    if synonym_record.confidence >= p_min_confidence then
      return next synonym_record;
    end if;
  end loop;
  
  -- 4. Try pattern matching (contains)
  for pattern_record in 
    select i.id, i.canonical_name, p.confidence * 0.9 as confidence, 'pattern_contains' as match_type
    from public.ingredient_patterns p
    join public.ingredients i on p.ingredient_id = i.id
    where p.pattern_type = 'contains'
      and (not p.case_sensitive or normalized_name ~ p.pattern)
      and normalized_name ~ ('(?i)' || p.pattern)
    order by p.confidence desc, i.is_common desc, i.canonical_name
  loop
    if pattern_record.confidence >= p_min_confidence then
      return next pattern_record;
    end if;
  end loop;
  
  -- 5. Try partial matching on words in product name
  -- Split normalized name into words and match against ingredient names
  perform from regexp_split_to_table(normalized_name, '\s+') as word
  where length(word) >= 3
  limit 10;
  
  -- For each word, find ingredients that contain it
  for ingredient_record in 
    select i.id, i.canonical_name, 
      0.7 * (length(word.value)::float / greatest(length(word.value), length(i.canonical_name))) as confidence,
      'partial' as match_type
    from regexp_split_to_table(normalized_name, '\s+') as word
    join public.ingredients i on i.canonical_name ~ ('(?i)' || word.value)
    where length(word.value) >= 3
      and length(i.canonical_name) >= 3
    order by confidence desc, i.is_common desc, i.canonical_name
    limit 20
  loop
    if ingredient_record.confidence >= p_min_confidence then
      return next ingredient_record;
    end if;
  end loop;
  
  -- 6. Try fuzzy matching using Levenshtein (for PostgreSQL with pg_trgm or similar)
  -- For now, use similarity on single-word ingredients
  for ingredient_record in 
    select i.id, i.canonical_name, 
      0.6 * similarity(normalized_name, i.canonical_name) as confidence,
      'fuzzy' as match_type
    from public.ingredients i
    where not contains(i.canonical_name, ' ')
      and similarity(normalized_name, i.canonical_name) > 0.6
    order by confidence desc, i.is_common desc, i.canonical_name
    limit 10
  loop
    if ingredient_record.confidence >= p_min_confidence then
      return next ingredient_record;
    end if;
  end loop;
end;
$$;

-- Function to process a single product and auto-link ingredients
create or replace function public.process_product_ingredient_mapping(
  p_product_id uuid,
  p_product_name text,
  p_supermarket_id uuid default null
)
returns table (
  ingredient_id uuid,
  ingredient_name text,
  confidence numeric(3,2),
  action text,
  needs_review boolean
)
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  candidate record;
  existing_mapping_count integer;
  total_created integer := 0;
begin
  -- Create a temporary table to collect results
  create temp table if not exists temp_mapping_results (
    ingredient_id uuid,
    ingredient_name text,
    confidence numeric(3,2),
    action text,
    needs_review boolean
  );
  
  -- Clear any previous results
  truncate temp_mapping_results;
  
  -- Extract ingredient candidates
  for candidate in 
    select * from public.extract_ingredients_from_product_name(p_product_name, 0.5)
    order by confidence desc
    limit 5
  loop
    -- Check if this mapping already exists
    select count(*) into existing_mapping_count
    from public.product_ingredients
    where product_id = p_product_id and ingredient_id = candidate.ingredient_id;
    
    if existing_mapping_count = 0 then
      -- Determine action based on confidence
      if candidate.confidence >= 0.9 then
        -- High confidence - auto-link
        insert into public.product_ingredients (
          product_id, ingredient_id, mapping_method, confidence, is_primary
        ) values (
          p_product_id, candidate.ingredient_id, 'auto_name', candidate.confidence,
          (total_created = 0)
        );
        
        total_created := total_created + 1;
        insert into temp_mapping_results values (
          candidate.ingredient_id, candidate.canonical_name, candidate.confidence, 'created', false
        );
        
      elsif candidate.confidence >= 0.7 then
        -- Medium confidence - auto-link primary, flag for review
        if total_created = 0 then
          insert into public.product_ingredients (
            product_id, ingredient_id, mapping_method, confidence, is_primary
          ) values (
            p_product_id, candidate.ingredient_id, 'auto_name', candidate.confidence, true
          );
          total_created := total_created + 1;
          insert into temp_mapping_results values (
            candidate.ingredient_id, candidate.canonical_name, candidate.confidence, 'created', false
          );
        else
          -- Flag for review
          insert into public.pending_ingredient_mappings (
            product_id, supermarket_id, suggested_ingredient_id, 
            suggested_ingredient_name, confidence
          ) values (
            p_product_id, p_supermarket_id, candidate.ingredient_id, 
            candidate.canonical_name, candidate.confidence
          );
          insert into temp_mapping_results values (
            candidate.ingredient_id, candidate.canonical_name, candidate.confidence, 'pending', true
          );
        end if;
        
      else
        -- Low confidence - flag for review
        insert into public.pending_ingredient_mappings (
          product_id, supermarket_id, suggested_ingredient_id, 
          suggested_ingredient_name, confidence
        ) values (
          p_product_id, p_supermarket_id, candidate.ingredient_id, 
          candidate.canonical_name, candidate.confidence
        );
        insert into temp_mapping_results values (
          candidate.ingredient_id, candidate.canonical_name, candidate.confidence, 'pending', true
        );
      end if;
    end if;
  end loop;
  
  -- Return all results
  return query select * from temp_mapping_results;
end;
$$;

-- Updated CSV batch processing function that includes ingredient extraction
create or replace function public.process_supermarket_csv_batch_with_ingredients(
  p_supermarket_id uuid,
  p_rows jsonb[]
)
returns table (
  row_index integer,
  product_id uuid,
  supermarket_product_id uuid,
  action text,
  status text,
  message text,
  ingredients_extracted integer,
  ingredients_needs_review boolean
)
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  row_record jsonb;
  row_index integer;
  matched_product_id uuid;
  matched_sku text;
  matched_barcode text;
  price_val numeric(10,2);
  stock_val integer;
  sku_val text;
  barcode_val text;
  name_val text;
  category_val text;
  description_val text;
  brand_val text;
  unit_val text;
  location_val text;
  ingredients_extracted_count integer := 0;
  ingredients_needs_review_flag boolean := false;
  ingredient_result record;
begin
  foreach row_record, row_index in array p_rows
  loop
    -- Extract values from JSON row
    price_val := coalesce((row_record->>'price')::numeric(10,2), 0);
    stock_val := coalesce((row_record->>'stock')::integer, 0);
    sku_val := coalesce(row_record->>'sku', '');
    barcode_val := coalesce(row_record->>'barcode', '');
    name_val := coalesce(row_record->>'name', '');
    category_val := coalesce(row_record->>'category', 'uncategorized');
    description_val := coalesce(row_record->>'description', '');
    brand_val := coalesce(row_record->>'brand', '');
    unit_val := coalesce(row_record->>'unit', '');
    location_val := coalesce(row_record->>'location_in_store', '');

    -- Validate required fields
    if price_val <= 0 or stock_val < 0 then
      return query select row_index, null, null, 'skip', 'error', 'Invalid price or stock value', 0, false;
      continue;
    end if;

    if sku_val = '' and barcode_val = '' and name_val = '' then
      return query select row_index, null, null, 'skip', 'error', 'Missing product identifier (sku, barcode, or name required)', 0, false;
      continue;
    end if;

    -- Try to find existing product by barcode -> SKU -> name
    select id, sku, barcode into matched_product_id, matched_sku, matched_barcode
    from public.find_product_by_identifier(barcode_val, sku_val, name_val)
    limit 1;

    if matched_product_id is not null then
      -- Product exists, create or update supermarket_products entry
      begin
        update public.supermarket_products
          set price = price_val,
              original_price = coalesce(original_price, price_val),
              stock = stock_val,
              is_available = (stock_val > 0),
              supermarket_sku = nullif(sku_val, ''),
              supermarket_barcode = nullif(barcode_val, ''),
              location_in_store = nullif(location_val, ''),
              updated_at = now()
        where supermarket_id = p_supermarket_id and product_id = matched_product_id
        returning id into matched_product_id;

        if matched_product_id is not null then
          -- Process ingredient extraction for existing product
          for ingredient_result in 
            select * from public.process_product_ingredient_mapping(matched_product_id, name_val, p_supermarket_id)
          loop
            ingredients_extracted_count := ingredients_extracted_count + 1;
            if ingredient_result.needs_review then
              ingredients_needs_review_flag := true;
            end if;
          end loop;
          
          return query select row_index, matched_product_id, matched_product_id, 'update', 'success', 'Updated existing supermarket product', ingredients_extracted_count, ingredients_needs_review_flag;
          continue;
        end if;
      exception when no_data_found then
        -- No existing supermarket_product, create new one
      end;

      -- Insert new supermarket_product
      insert into public.supermarket_products (
        supermarket_id, product_id, price, original_price, stock, 
        is_available, supermarket_sku, supermarket_barcode, location_in_store
      ) values (
        p_supermarket_id, matched_product_id, price_val, price_val, stock_val,
        (stock_val > 0), nullif(sku_val, ''), nullif(barcode_val, ''), nullif(location_val, '')
      ) returning id into matched_product_id;

      -- Process ingredient extraction
      for ingredient_result in 
        select * from public.process_product_ingredient_mapping(matched_product_id, name_val, p_supermarket_id)
      loop
        ingredients_extracted_count := ingredients_extracted_count + 1;
        if ingredient_result.needs_review then
          ingredients_needs_review_flag := true;
        end if;
      end loop;

      return query select row_index, matched_product_id, matched_product_id, 'insert', 'success', 'Created new supermarket product', ingredients_extracted_count, ingredients_needs_review_flag;
      continue;
    end if;

    -- No matching product found, create new product and supermarket_product
    begin
      insert into public.products (
        slug, name, description, price, original_price, category_slug, 
        image_url, stock, published, barcode, sku
      ) values (
        lower(replace(replace(name_val, ' ', '-'), '.', '')) || '-' || gen_random_uuid(),
        jsonb_build_object('en', name_val, 'es', name_val),
        jsonb_build_object('en', description_val, 'es', description_val),
        price_val, price_val, category_val, null, 0, true,
        nullif(barcode_val, ''), nullif(sku_val, '')
      ) returning id into matched_product_id;

      insert into public.supermarket_products (
        supermarket_id, product_id, price, original_price, stock,
        is_available, supermarket_sku, supermarket_barcode, location_in_store
      ) values (
        p_supermarket_id, matched_product_id, price_val, price_val, stock_val,
        (stock_val > 0), nullif(sku_val, ''), nullif(barcode_val, ''), nullif(location_val, '')
      ) returning id into matched_product_id;

      -- Process ingredient extraction for new product
      for ingredient_result in 
        select * from public.process_product_ingredient_mapping(matched_product_id, name_val, p_supermarket_id)
      loop
        ingredients_extracted_count := ingredients_extracted_count + 1;
        if ingredient_result.needs_review then
          ingredients_needs_review_flag := true;
        end if;
      end loop;

      return query select row_index, matched_product_id, matched_product_id, 'insert_new', 'success', 'Created new product and supermarket product', ingredients_extracted_count, ingredients_needs_review_flag;
      continue;
    exception when others then
      return query select row_index, null, null, 'skip', 'error', 'Error creating new product: ' || SQLERRM, 0, false;
      continue;
    end;
  end loop;
end;
$$;

grant execute on function public.extract_ingredients_from_product_name(text, numeric) to authenticated, service_role;
grant execute on function public.process_product_ingredient_mapping(uuid, text, uuid) to authenticated, service_role;
grant execute on function public.process_supermarket_csv_batch_with_ingredients(uuid, jsonb[]) to authenticated, service_role;
grant execute on function public.normalize_ingredient_name(text) to authenticated, service_role;


-- ---------------------------------------------------------------------
-- MY RECETTE: Helper Functions for Recipe Management
-- ---------------------------------------------------------------------

-- Function to increment recipe comment count
create or replace function public.increment_recipe_comment_count(
  recipe_id uuid
)
returns void
language plpgsql
security invoker
as $$
begin
  update public.recipes 
  set comment_count = comment_count + 1, updated_at = now()
  where id = increment_recipe_comment_count.recipe_id;
end;
$$;

grant execute on function public.increment_recipe_comment_count(uuid) to authenticated, service_role;

-- Function to decrement recipe video count
create or replace function public.decrement_video_count(
  recipe_id uuid
)
returns void
language plpgsql
security invoker
as $$
begin
  update public.recipes 
  set video_count = greatest(video_count - 1, 0), updated_at = now()
  where id = decrement_video_count.recipe_id;
end;
$$;

grant execute on function public.decrement_video_count(uuid) to authenticated, service_role;


-- ---------------------------------------------------------------------
-- MY RECETTE: Helper Functions for YouTube Video Processing
-- ---------------------------------------------------------------------

-- Function to extract YouTube video ID from URL
create or replace function public.extract_youtube_video_id(
  url_text text
)
returns text
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
  declare
    video_id text;
  begin
    -- Handle various YouTube URL formats
    -- Standard: https://www.youtube.com/watch?v=dQw4w9WgXcQ
    if url_text ~ 'youtube\.com/watch\?v=([^&]+)' then
      video_id := regexp_replace(url_text, '.*youtube\.com/watch\?v=([^&]+).*', '\1');
    -- Shortened: https://youtu.be/dQw4w9WgXcQ
    elsif url_text ~ 'youtu\.be/([^\?]+)' then
      video_id := regexp_replace(url_text, '.*youtu\.be/([^\?]+).*', '\1');
    -- Embed: https://www.youtube.com/embed/dQw4w9WgXcQ
    elsif url_text ~ 'youtube\.com/embed/([^\?]+)' then
      video_id := regexp_replace(url_text, '.*youtube\.com/embed/([^\?]+).*', '\1');
    -- Shorts: https://www.youtube.com/shorts/dQw4w9WgXcQ
    elsif url_text ~ 'youtube\.com/shorts/([^\?]+)' then
      video_id := regexp_replace(url_text, '.*youtube\.com/shorts/([^\?]+).*', '\1');
    -- Live: https://www.youtube.com/live/dQw4w9WgXcQ
    elsif url_text ~ 'youtube\.com/live/([^\?]+)' then
      video_id := regexp_replace(url_text, '.*youtube\.com/live/([^\?]+).*', '\1');
    else
      video_id := null;
    end if;

    return video_id;
  end;
$$;

grant execute on function public.extract_youtube_video_id(text) to authenticated, service_role;

-- Function to get YouTube thumbnail URL from video ID
create or replace function public.get_youtube_thumbnail(
  video_id text
)
returns text
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if video_id is null then
    return null;
  end if;
  -- Return max resolution thumbnail (1920x1080)
  return 'https://img.youtube.com/vi/' || video_id || '/maxresdefault.jpg';
end;
$$;

grant execute on function public.get_youtube_thumbnail(text) to authenticated, service_role;


-- =====================================================================
-- MY RECETTE: Additional Missing Tables
-- =====================================================================

-- Recipe Ratings (1-5 star ratings for recipes)
create table if not exists public.recipe_ratings (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  value integer not null check (value >= 1 and value <= 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.recipe_ratings
  add constraint unique_recipe_user_rating unique (recipe_id, user_id);

-- Indexes for recipe_ratings
create index if not exists idx_recipe_ratings_recipe 
  on public.recipe_ratings(recipe_id);
create index if not exists idx_recipe_ratings_user 
  on public.recipe_ratings(user_id);
create index if not exists idx_recipe_ratings_value 
  on public.recipe_ratings(value);

-- Shopping Lists
create table if not exists public.shopping_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  is_public boolean default false,
  share_token text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for shopping_lists
create index if not exists idx_shopping_lists_user 
  on public.shopping_lists(user_id);
create index if not exists idx_shopping_lists_created 
  on public.shopping_lists(created_at desc);

-- Shopping List Items
create table if not exists public.shopping_list_items (
  id uuid primary key default gen_random_uuid(),
  shopping_list_id uuid not null references public.shopping_lists(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  ingredient_id uuid references public.ingredients(id) on delete set null,
  custom_name text,
  quantity numeric(10,2),
  unit text,
  notes text,
  is_checked boolean default false,
  "position" integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for shopping_list_items
create index if not exists idx_shopping_list_items_list 
  on public.shopping_list_items(shopping_list_id);
create index if not exists idx_shopping_list_items_product 
  on public.shopping_list_items(product_id);
create index if not exists idx_shopping_list_items_ingredient 
  on public.shopping_list_items(ingredient_id);

-- Subscriptions (for supermarket monetization - 50 EUR/month)
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  supermarket_id uuid not null references public.profiles(id) on delete cascade,
  stripe_subscription_id text unique,
  stripe_customer_id text unique,
  status text not null check (status in ('inactive', 'active', 'trialing', 'past_due', 'canceled')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  monthly_fee numeric(10,2) not null default 50.00,
  currency text not null default 'EUR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for subscriptions
create index if not exists idx_subscriptions_supermarket 
  on public.subscriptions(supermarket_id);
create index if not exists idx_subscriptions_status 
  on public.subscriptions(status);
create index if not exists idx_subscriptions_stripe_id 
  on public.subscriptions(stripe_subscription_id) where stripe_subscription_id is not null;

-- Subscription History
create table if not exists public.subscription_history (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  stripe_event_id text unique,
  event_type text not null,
  old_status text,
  new_status text,
  data jsonb,
  created_at timestamptz not null default now()
);

-- Indexes for subscription_history
create index if not exists idx_subscription_history_subscription 
  on public.subscription_history(subscription_id);
create index if not exists idx_subscription_history_event_type 
  on public.subscription_history(event_type);
create index if not exists idx_subscription_history_created 
  on public.subscription_history(created_at desc);


-- =====================================================================
-- MY RECETTE: RLS Policies for New Tables
-- =====================================================================

-- Recipe Ratings RLS
alter table public.recipe_ratings enable row level security;

create policy "recipe_ratings_public_read" on public.recipe_ratings
  for select using (true);

create policy "recipe_ratings_create" on public.recipe_ratings
  for insert with check (auth.uid() = user_id);

create policy "recipe_ratings_update_own" on public.recipe_ratings
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Shopping Lists RLS
alter table public.shopping_lists enable row level security;

create policy "shopping_lists_user_read" on public.shopping_lists
  for select using (auth.uid() = user_id);

create policy "shopping_lists_user_create" on public.shopping_lists
  for insert with check (auth.uid() = user_id);

create policy "shopping_lists_user_update_own" on public.shopping_lists
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "shopping_lists_user_delete_own" on public.shopping_lists
  for delete using (auth.uid() = user_id);

-- Shopping List Items RLS
alter table public.shopping_list_items enable row level security;

create policy "shopping_list_items_user_read" on public.shopping_list_items
  for select using (
    auth.uid() = (select user_id from public.shopping_lists where id = shopping_list_id)
  );

create policy "shopping_list_items_user_create" on public.shopping_list_items
  for insert with check (
    auth.uid() = (select user_id from public.shopping_lists where id = shopping_list_id)
  );

create policy "shopping_list_items_user_update_own" on public.shopping_list_items
  for update using (
    auth.uid() = (select user_id from public.shopping_lists where id = shopping_list_id)
  )
  with check (
    auth.uid() = (select user_id from public.shopping_lists where id = shopping_list_id)
  );

create policy "shopping_list_items_user_delete_own" on public.shopping_list_items
  for delete using (
    auth.uid() = (select user_id from public.shopping_lists where id = shopping_list_id)
  );

-- Subscriptions RLS
alter table public.subscriptions enable row level security;

create policy "subscriptions_admin_all" on public.subscriptions
  for all using ((select private.is_admin()));

create policy "subscriptions_supermarket_own" on public.subscriptions
  for select using (
    (auth.uid() = supermarket_id) or (select private.is_admin())
  );

-- Subscription History RLS
alter table public.subscription_history enable row level security;

create policy "subscription_history_admin_all" on public.subscription_history
  for all using ((select private.is_admin()));

create policy "subscription_history_supermarket_own" on public.subscription_history
  for select using (
    (auth.uid() = (select supermarket_id from public.subscriptions where id = subscription_id)) or
    (select private.is_admin())
  );


-- =====================================================================
-- Done. Future schema changes should edit THIS file and re-run it
-- rather than adding new incremental migration files.
-- =====================================================================
