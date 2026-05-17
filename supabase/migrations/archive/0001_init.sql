-- =====================================================================
-- Red Barn Western Market — Initial Supabase schema
-- Run this in the SQL editor of your Supabase project, or via
--   supabase db push   (if you use the Supabase CLI)
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Profiles (linked to auth.users)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
    id          uuid primary key references auth.users(id) on delete cascade,
    email       text,
    role        text not null default 'user' check (role in ('user', 'admin')),
    created_at  timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
    insert into public.profiles (id, email)
    values (new.id, new.email)
    on conflict (id) do nothing;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------
-- Categories  (translatable name via JSONB)
-- ---------------------------------------------------------------------
create table if not exists public.categories (
    id          uuid primary key default gen_random_uuid(),
    slug        text unique not null,
    name        jsonb not null,   -- { "en": "Lumber", "es": "Madera" }
    parent_id   uuid references public.categories(id) on delete set null,
    image_url   text,
    icon        text,
    item_count  int,
    created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Products  (translatable name / description / discount_text via JSONB)
-- ---------------------------------------------------------------------
create table if not exists public.products (
    id              uuid primary key default gen_random_uuid(),
    slug            text unique not null,
    name            jsonb not null,
    description     jsonb not null default '{"en":"","es":""}'::jsonb,
    price           numeric(10,2) not null,
    original_price  numeric(10,2),
    image_url       text,
    category_slug   text not null,
    discount        boolean not null default false,
    discount_text   jsonb,
    new_arrival     boolean not null default false,
    stock           int not null default 0,
    featured        boolean not null default false,
    best_seller     boolean not null default false,
    free_shipping   boolean not null default false,
    created_at      timestamptz not null default now()
);

create index if not exists products_category_idx on public.products(category_slug);
create index if not exists products_featured_idx on public.products(featured) where featured = true;
create index if not exists products_discount_idx on public.products(discount) where discount = true;

-- ---------------------------------------------------------------------
-- Messages (contact form submissions)
-- ---------------------------------------------------------------------
create table if not exists public.messages (
    id          uuid primary key default gen_random_uuid(),
    name        text not null,
    email       text not null,
    message     text not null,
    read        boolean not null default false,
    created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Bulk quote requests (contractor inquiries)
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- Orders (populated by Stripe webhook)
-- ---------------------------------------------------------------------
create table if not exists public.orders (
    id                  uuid primary key default gen_random_uuid(),
    stripe_session_id   text unique not null,
    customer_email      text,
    total_amount        numeric(10,2) not null,
    line_items          jsonb not null default '[]'::jsonb,
    status              text not null default 'paid',
    created_at          timestamptz not null default now()
);

-- =====================================================================
-- Row Level Security
-- =====================================================================

alter table public.profiles    enable row level security;
alter table public.categories  enable row level security;
alter table public.products    enable row level security;
alter table public.messages    enable row level security;
alter table public.bulk_quotes enable row level security;
alter table public.orders      enable row level security;

-- Helper: is current user an admin?
create or replace function public.is_admin() returns boolean
language sql stable security definer as $$
  select coalesce(
    (select role = 'admin' from public.profiles where id = auth.uid()),
    false
  );
$$;

-- Profiles: users can read & update only their own row; admins read all.
drop policy if exists "profiles read own" on public.profiles;
create policy "profiles read own" on public.profiles for select
    using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles for update
    using (auth.uid() = id) with check (auth.uid() = id);

-- Public read for catalog; admin-only writes
drop policy if exists "categories public read" on public.categories;
create policy "categories public read" on public.categories for select using (true);

drop policy if exists "categories admin write" on public.categories;
create policy "categories admin write" on public.categories
    for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "products public read" on public.products;
create policy "products public read" on public.products for select using (true);

drop policy if exists "products admin write" on public.products;
create policy "products admin write" on public.products
    for all using (public.is_admin()) with check (public.is_admin());

-- Messages: anyone can insert; only admins can read / update / delete
drop policy if exists "messages anyone insert" on public.messages;
create policy "messages anyone insert" on public.messages for insert with check (true);

drop policy if exists "messages admin read" on public.messages;
create policy "messages admin read" on public.messages for select using (public.is_admin());

drop policy if exists "messages admin write" on public.messages;
create policy "messages admin write" on public.messages
    for all using (public.is_admin()) with check (public.is_admin());

-- Bulk quotes: anyone can insert; only admins can read / update / delete
drop policy if exists "bulk_quotes anyone insert" on public.bulk_quotes;
create policy "bulk_quotes anyone insert" on public.bulk_quotes for insert with check (true);

drop policy if exists "bulk_quotes admin read" on public.bulk_quotes;
create policy "bulk_quotes admin read" on public.bulk_quotes for select using (public.is_admin());

drop policy if exists "bulk_quotes admin write" on public.bulk_quotes;
create policy "bulk_quotes admin write" on public.bulk_quotes
    for all using (public.is_admin()) with check (public.is_admin());

-- Orders: only admins read / write; webhook uses the service-role key
-- which automatically bypasses RLS so the insert continues to work.
drop policy if exists "orders admin read" on public.orders;
create policy "orders admin read" on public.orders for select using (public.is_admin());

drop policy if exists "orders admin write" on public.orders;
create policy "orders admin write" on public.orders
    for all using (public.is_admin()) with check (public.is_admin());
