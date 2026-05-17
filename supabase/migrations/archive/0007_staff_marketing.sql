-- =====================================================================
-- Staff invites, sales analytics & marketing opt-in
-- =====================================================================
-- Adds:
--   * products.updated_at + trigger      -> admin sort by recent edits
--   * product_sales view                 -> admin sort by best-seller
--   * profiles.marketing_optin           -> customer-controlled
--   * profiles list-by-email helper      -> admin staff page
-- Idempotent: safe to re-run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. products.updated_at + auto-touching trigger
-- ---------------------------------------------------------------------
alter table public.products
  add column if not exists updated_at timestamptz not null default now();

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at
  before update on public.products
  for each row execute procedure public.touch_updated_at();

create index if not exists products_updated_at_idx on public.products (updated_at desc);

-- ---------------------------------------------------------------------
-- 2. product_sales view  (sum of qty across all paid orders)
-- ---------------------------------------------------------------------
create or replace view public.product_sales as
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
-- 3. profiles.marketing_optin  +  permissive update column policy
-- ---------------------------------------------------------------------
alter table public.profiles
  add column if not exists marketing_optin boolean not null default false;

-- Profiles update policy already restricts to (auth.uid() = id). The
-- existing column-level grants apply, so a logged-in user can toggle
-- marketing_optin on their own row. No new policy needed.

-- ---------------------------------------------------------------------
-- 4. admin_list_users()  -> returns (id, email, role, marketing_optin,
--    created_at) for admin staff page. Security-definer so admins can
--    read every profile's email even though base RLS only allows own-row.
-- ---------------------------------------------------------------------
create or replace function public.admin_list_users()
returns table (
  id uuid,
  email text,
  role text,
  marketing_optin boolean,
  created_at timestamptz
)
language sql security definer set search_path = public as $$
  select p.id, p.email, p.role, p.marketing_optin, p.created_at
  from public.profiles p
  where public.is_admin()
  order by p.created_at desc;
$$;

grant execute on function public.admin_list_users() to authenticated;

-- ---------------------------------------------------------------------
-- 5. admin_subscriber_emails()  -> just the opted-in emails. Convenience
--    for the campaigns page (avoids leaking the full profile list to
--    the browser when only emails are needed).
-- ---------------------------------------------------------------------
create or replace function public.admin_subscriber_emails()
returns table (email text)
language sql security definer set search_path = public as $$
  select p.email
  from public.profiles p
  where public.is_admin()
    and p.marketing_optin = true
    and p.email is not null;
$$;

grant execute on function public.admin_subscriber_emails() to authenticated;
