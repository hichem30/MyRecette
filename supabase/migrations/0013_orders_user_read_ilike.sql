-- =====================================================================
-- 0013 — Make customer self-read of orders case-insensitive
-- =====================================================================
-- The `orders user read own` policy compared customer_email = email with
-- a case-sensitive `=`. Stripe normalises emails but the customer's
-- Supabase auth email may have been signed up with a different case,
-- which made the order vanish from /account/orders.
--
-- Switch the comparison to lower(...) on both sides so customer history
-- matches regardless of how either email was entered.
-- =====================================================================

drop policy if exists "orders user read own" on public.orders;
create policy "orders user read own" on public.orders
  for select using (
    customer_email is not null
    and lower(customer_email) = (
      select lower(email) from auth.users where id = (select auth.uid())
    )
  );
