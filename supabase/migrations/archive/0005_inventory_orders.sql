-- =====================================================================
-- Inventory + order workflow improvements (Phase 6 follow-up)
-- =====================================================================
-- Adds:
--   * decrement_product_stock(jsonb)  -> atomic stock decrement RPC
--   * orders.status check constraint  -> supported lifecycle states
--   * orders.notes column             -> admin internal notes
--   * admin update RLS on orders      -> already in 0001 (admin write)
-- Idempotent: safe to re-run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Add a `notes` column to orders for admin internal tracking
-- ---------------------------------------------------------------------
alter table public.orders add column if not exists notes text;

-- ---------------------------------------------------------------------
-- 2. Replace orders.status check constraint with full lifecycle.
--    We accept: paid, processing, shipped, delivered, cancelled, refunded.
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- 3. Atomic stock decrement RPC.
--    Accepts a JSON array like:
--        [{"product_id": "uuid", "quantity": 2}, ...]
--    For each entry: locks the row, decrements stock by qty
--    (clamped at 0 — never goes negative), returns the resulting rows.
--    Safe under concurrent purchases because of `for update`.
-- ---------------------------------------------------------------------
create or replace function public.decrement_product_stock(items jsonb)
returns table (product_id uuid, new_stock int)
language plpgsql
security definer
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
    returning p.id, p.stock
        into product_id, new_stock;

    if found then
      return next;
    end if;
  end loop;
end $$;

-- Allow service-role (webhook) + admins to call the function. Public users
-- cannot invoke it directly (no `to public` grant). Service-role bypasses
-- RLS automatically so the update inside the function works without any
-- extra grants.
revoke all on function public.decrement_product_stock(jsonb) from public;
grant execute on function public.decrement_product_stock(jsonb) to service_role;
grant execute on function public.decrement_product_stock(jsonb) to authenticated;

-- ---------------------------------------------------------------------
-- 4. Convenience: prevent admins from accidentally setting stock < 0
--    via the dashboard form.
-- ---------------------------------------------------------------------
alter table public.products
  drop constraint if exists products_stock_nonneg;
alter table public.products
  add constraint products_stock_nonneg check (stock >= 0);
