-- =====================================================================
-- RLS performance: wrap auth.uid() and is_admin() in (select ...)
-- =====================================================================
-- Postgres re-executes `auth.uid()` and `is_admin()` once per row when
-- they appear bare in a USING / WITH CHECK clause. Wrapping them in
-- `(select ...)` turns the call into an initplan that runs exactly once
-- per statement, no matter how many rows are scanned. This is the
-- standard Supabase advisor fix for the "auth_rls_initplan" warning
-- and typically delivers a 5-50x speedup on protected reads.
--
-- Idempotent: safe to re-run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------
drop policy if exists "profiles read own" on public.profiles;
create policy "profiles read own" on public.profiles for select
  using ((select auth.uid()) = id or (select public.is_admin()));

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles for update
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- ---------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------
drop policy if exists "categories public read" on public.categories;
create policy "categories public read" on public.categories
  for select using (true);

drop policy if exists "categories admin write" on public.categories;
create policy "categories admin write" on public.categories
  for all
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ---------------------------------------------------------------------
-- products  (published filter for customers; admin sees all)
-- ---------------------------------------------------------------------
drop policy if exists "products public read" on public.products;
create policy "products public read" on public.products
  for select using (published = true or (select public.is_admin()));

drop policy if exists "products admin write" on public.products;
create policy "products admin write" on public.products
  for all
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ---------------------------------------------------------------------
-- messages  (contact form)
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- bulk_quotes
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- orders  (admin full access + customer self-read)
-- ---------------------------------------------------------------------
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
    and customer_email = (
      select email from auth.users where id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------
-- wishlists  (per-user)
-- ---------------------------------------------------------------------
drop policy if exists "wishlists read own" on public.wishlists;
create policy "wishlists read own" on public.wishlists
  for select using ((select auth.uid()) = user_id);

drop policy if exists "wishlists insert own" on public.wishlists;
create policy "wishlists insert own" on public.wishlists
  for insert with check ((select auth.uid()) = user_id);

drop policy if exists "wishlists delete own" on public.wishlists;
create policy "wishlists delete own" on public.wishlists
  for delete using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------
-- bundles, promo_codes, delivery_zones (from 0009)
-- ---------------------------------------------------------------------
drop policy if exists "bundles_public_read" on public.bundles;
create policy "bundles_public_read" on public.bundles
  for select using (active = true);

drop policy if exists "bundles_admin_all" on public.bundles;
create policy "bundles_admin_all" on public.bundles
  for all
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "promo_codes_admin_all" on public.promo_codes;
create policy "promo_codes_admin_all" on public.promo_codes
  for all
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "delivery_zones_public_read" on public.delivery_zones;
create policy "delivery_zones_public_read" on public.delivery_zones
  for select using (true);

drop policy if exists "delivery_zones_admin_all" on public.delivery_zones;
create policy "delivery_zones_admin_all" on public.delivery_zones
  for all
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ---------------------------------------------------------------------
-- Helpful indexes for the per-row checks (cover the common WHERE/USING)
-- ---------------------------------------------------------------------
create index if not exists profiles_id_idx       on public.profiles (id);
create index if not exists orders_email_idx      on public.orders (customer_email);
create index if not exists wishlists_user_idx    on public.wishlists (user_id);
