-- 0009_forced_password_reset.sql
-- Mandatory Password Reset on First Login
-- Idempotent — safe to re-run on existing databases.

-- ============================================================
-- 1. Add must_reset_password Column to profiles
-- ============================================================

alter table public.profiles
  add column if not exists must_reset_password boolean not null default true;

-- Backfill existing profiles so current active users are not locked out
update public.profiles
set must_reset_password = false
where must_reset_password is true
  and (created_at < now() - interval '1 minute');

-- ============================================================
-- 2. Update handle_new_user Trigger
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role, email, must_reset_password)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    'inspector',
    new.email,
    true
  );
  return new;
end;
$$;

-- ============================================================
-- 3. Update guard_profile_self_update Trigger
-- ============================================================
-- Ensures users cannot update must_reset_password to false on their own
-- via direct PostgREST client updates without going through verified actions.

create or replace function public.guard_profile_self_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(current_setting('request.jwt.claims', true)::jsonb->>'role', '') = 'service_role' then
    return new;
  end if;

  if not public.current_role_is_admin() then
    new.role := old.role;
    new.human_id := old.human_id;
    new.email := old.email;
    new.id := old.id;
    new.tenant_id := old.tenant_id;
    new.is_global_admin := old.is_global_admin;
    new.is_contractor := old.is_contractor;
    new.status := old.status;
    -- Regular specialists cannot flip must_reset_password directly via client API
    new.must_reset_password := old.must_reset_password;
  elsif not public.current_user_is_global_admin() then
    new.is_global_admin := old.is_global_admin;
    new.tenant_id := old.tenant_id;
  end if;
  return new;
end;
$$;
