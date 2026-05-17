-- =====================================================================
-- Time-limited discounts, bundles, promo codes, delivery zones.
-- =====================================================================
-- Idempotent: safe to re-run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Time-limited discounts on products
-- ---------------------------------------------------------------------
alter table public.products
  add column if not exists discount_starts_at timestamptz,
  add column if not exists discount_ends_at timestamptz;

-- ---------------------------------------------------------------------
-- 2. Category-wide time-limited discounts
-- ---------------------------------------------------------------------
alter table public.categories
  add column if not exists discount_percent integer not null default 0
    check (discount_percent >= 0 and discount_percent <= 90),
  add column if not exists discount_starts_at timestamptz,
  add column if not exists discount_ends_at timestamptz;

-- ---------------------------------------------------------------------
-- 3. Bundles
-- ---------------------------------------------------------------------
create table if not exists public.bundles (
  id uuid primary key default gen_random_uuid(),
  name jsonb not null default '{"en":"","es":""}'::jsonb,
  description jsonb not null default '{"en":"","es":""}'::jsonb,
  bundle_price numeric(10, 2) not null check (bundle_price >= 0),
  image_url text,
  product_ids uuid[] not null default '{}',
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists bundles_updated_at on public.bundles;
create trigger bundles_updated_at before update on public.bundles
  for each row execute procedure public.touch_updated_at();

alter table public.bundles enable row level security;

drop policy if exists "bundles_public_read" on public.bundles;
create policy "bundles_public_read" on public.bundles
  for select using (active = true);

drop policy if exists "bundles_admin_all" on public.bundles;
create policy "bundles_admin_all" on public.bundles
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
-- 4. Promo codes
-- ---------------------------------------------------------------------
create table if not exists public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  description text,
  discount_type text not null check (discount_type in ('percent', 'amount')),
  discount_value numeric(10, 2) not null check (discount_value > 0),
  max_uses integer,
  uses_count integer not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.promo_codes enable row level security;

drop policy if exists "promo_codes_admin_all" on public.promo_codes;
create policy "promo_codes_admin_all" on public.promo_codes
  for all using (public.is_admin()) with check (public.is_admin());

-- Public RPC: validate code, return discount info without exposing the table.
create or replace function public.validate_promo_code(p_code text)
returns table (
  code text,
  discount_type text,
  discount_value numeric(10, 2),
  valid boolean,
  reason text
)
language plpgsql security invoker as $$
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

-- Used by the checkout API (service role) to atomically bump uses_count.
create or replace function public.consume_promo_code(p_code text)
returns boolean
language plpgsql security invoker as $$
declare
  rec public.promo_codes%rowtype;
begin
  select * into rec from public.promo_codes
    where lower(promo_codes.code) = lower(trim(p_code))
    for update;
  if not found or not rec.active then return false; end if;
  if rec.ends_at is not null and rec.ends_at < now() then return false; end if;
  if rec.starts_at is not null and rec.starts_at > now() then return false; end if;
  if rec.max_uses is not null and rec.uses_count >= rec.max_uses then return false; end if;
  update public.promo_codes set uses_count = uses_count + 1 where id = rec.id;
  return true;
end;
$$;

-- ---------------------------------------------------------------------
-- 5. Delivery zones (which US states / cities we ship to)
-- ---------------------------------------------------------------------
create table if not exists public.delivery_zones (
  id uuid primary key default gen_random_uuid(),
  state_code text not null check (length(state_code) = 2),
  city text,
  notes text,
  created_at timestamptz not null default now()
);

create unique index if not exists delivery_zones_state_city_uniq
  on public.delivery_zones (state_code, coalesce(city, ''));

alter table public.delivery_zones enable row level security;

drop policy if exists "delivery_zones_public_read" on public.delivery_zones;
create policy "delivery_zones_public_read" on public.delivery_zones
  for select using (true);

drop policy if exists "delivery_zones_admin_all" on public.delivery_zones;
create policy "delivery_zones_admin_all" on public.delivery_zones
  for all using (public.is_admin()) with check (public.is_admin());
