-- =====================================================================
-- Customer accounts + product publishing (draft mode) + wishlist sync
-- =====================================================================
-- Adds:
--   * products.published boolean              -> admin draft / publish toggle
--   * wishlists table                         -> account-synced wishlist
--   * orders SELECT policy for customers      -> users see their own orders
-- Idempotent: safe to re-run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Draft mode flag on products
-- ---------------------------------------------------------------------
alter table public.products
  add column if not exists published boolean not null default true;

create index if not exists products_published_idx on public.products (published);

-- Tighten the public read policy: anonymous / customer users only see
-- published rows. Admins keep full visibility through the admin policy.
drop policy if exists "products public read" on public.products;
create policy "products public read" on public.products
  for select using (published = true or public.is_admin());

-- ---------------------------------------------------------------------
-- 2. Wishlists (per-user)
-- ---------------------------------------------------------------------
create table if not exists public.wishlists (
  user_id    uuid not null references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

alter table public.wishlists enable row level security;

drop policy if exists "wishlists read own" on public.wishlists;
create policy "wishlists read own" on public.wishlists
  for select using (auth.uid() = user_id);

drop policy if exists "wishlists insert own" on public.wishlists;
create policy "wishlists insert own" on public.wishlists
  for insert with check (auth.uid() = user_id);

drop policy if exists "wishlists delete own" on public.wishlists;
create policy "wishlists delete own" on public.wishlists
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 3. Allow signed-in customers to read their own orders by email match.
--    The Stripe webhook (service role) and admins are unaffected.
-- ---------------------------------------------------------------------
drop policy if exists "orders user read own" on public.orders;
create policy "orders user read own" on public.orders
  for select using (
    customer_email is not null
    and customer_email = (select email from auth.users where id = auth.uid())
  );
