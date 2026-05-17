-- =====================================================================
-- Red Barn Western Market — Owner admin assignment
-- Run this AFTER 0001_init.sql and 0002_seed.sql.
--
-- This migration:
--   1. Hard-codes the owner email so future sign-ups with that email
--      automatically receive role='admin'.
--   2. Promotes the existing profile row (if any) to admin so the owner
--      doesn't have to wait or run any extra SQL.
--
-- If the owner email ever changes, edit the constant below AND run:
--   update public.profiles set role = 'admin' where email = '<new>';
--   update public.profiles set role = 'user'  where email = '<old>';
-- =====================================================================

-- ---------------------------------------------------------------------
-- Updated signup trigger: auto-grant admin to the owner email
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
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
-- Promote the existing owner account (idempotent)
-- ---------------------------------------------------------------------
update public.profiles
set role = 'admin'
where lower(email) = lower('redbarnmarket@protonmail.com');
