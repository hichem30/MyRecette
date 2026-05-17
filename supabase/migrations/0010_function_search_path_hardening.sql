-- =====================================================================
-- Function search-path hardening
-- =====================================================================
-- Clears Supabase advisor warnings of type
-- `function_search_path_mutable`. Every function below is recreated
-- with an explicit `set search_path = public, pg_temp` so that an
-- attacker who can manipulate the calling session's search_path can't
-- shadow `public.<name>` with their own schema's function/table.
--
-- Idempotent: safe to re-run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- handle_new_user  (signup trigger; auto-grants admin to the owner email)
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
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

-- ---------------------------------------------------------------------
-- is_admin  (auth helper used in row-level security policies)
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
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

-- ---------------------------------------------------------------------
-- decrement_product_stock  (atomic stock decrement at checkout)
-- ---------------------------------------------------------------------
create or replace function public.decrement_product_stock(items jsonb)
returns table (product_id uuid, new_stock int)
language plpgsql
security definer
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
    return next;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------
-- touch_updated_at  (updated_at trigger for products, bundles, etc.)
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- admin_list_users  (already had search_path; recreated for completeness)
-- ---------------------------------------------------------------------
create or replace function public.admin_list_users()
returns table (
  id uuid,
  email text,
  role text,
  marketing_optin boolean,
  created_at timestamptz
)
language sql
security definer
set search_path = public, pg_temp
as $$
  select p.id, p.email, p.role, p.marketing_optin, p.created_at
  from public.profiles p
  where public.is_admin()
  order by p.created_at desc;
$$;

-- ---------------------------------------------------------------------
-- admin_subscriber_emails  (campaigns page; already had search_path)
-- ---------------------------------------------------------------------
create or replace function public.admin_subscriber_emails()
returns table (email text)
language sql
security definer
set search_path = public, pg_temp
as $$
  select p.email
  from public.profiles p
  where public.is_admin()
    and p.marketing_optin = true
    and p.email is not null;
$$;

-- ---------------------------------------------------------------------
-- validate_promo_code  (storefront promo-code lookup at checkout)
-- ---------------------------------------------------------------------
create or replace function public.validate_promo_code(p_code text)
returns table (
  code text,
  discount_type text,
  discount_value numeric(10, 2),
  valid boolean,
  reason text
)
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
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

-- ---------------------------------------------------------------------
-- consume_promo_code  (atomic increment of uses_count after checkout)
-- ---------------------------------------------------------------------
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
  if rec.ends_at is not null and rec.ends_at < now() then return false; end if;
  if rec.starts_at is not null and rec.starts_at > now() then return false; end if;
  if rec.max_uses is not null and rec.uses_count >= rec.max_uses then return false; end if;
  update public.promo_codes set uses_count = uses_count + 1 where id = rec.id;
  return true;
end;
$$;
