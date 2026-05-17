-- =====================================================================
-- Tighten security on helper views/functions.
-- =====================================================================
-- Recreates public.product_sales with security_invoker so it respects
-- the caller's RLS rather than the creator's.
-- =====================================================================

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
