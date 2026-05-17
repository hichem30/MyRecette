-- Red Barn — orders addressing + subscriber-export migration.
-- Adds order_number / shipping address / customer phone to public.orders
-- and updates admin_subscriber_emails() to also return subscribed_at.
--
-- Run once in Supabase SQL editor.  Idempotent — safe to re-run.
-- (This migration is also bundled inside the main supabase/schema.sql so a
-- full re-apply of that file is equivalent.)

-- ---------------------------------------------------------------------
-- Orders: order number + shipping address + phone
-- ---------------------------------------------------------------------

alter table public.orders
  add column if not exists order_number    text,
  add column if not exists shipping_name   text,
  add column if not exists shipping_address jsonb,
  add column if not exists customer_phone  text;

create unique index if not exists orders_order_number_uniq
  on public.orders (order_number);

create or replace function private.generate_order_number()
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  -- 32-char alphabet, no 0/O/1/I/L → unambiguous when read over the phone.
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

-- Backfill: every pre-existing order gets a number.
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
-- Subscriber export: include subscribed_at for EmailOctopus / Mailchimp
-- ---------------------------------------------------------------------

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
