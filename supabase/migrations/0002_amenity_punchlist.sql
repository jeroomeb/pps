-- 0002_amenity_punchlist.sql
-- Amenity Op's rebrand + client punch list #8.
-- Apply AFTER 0001_security_hardening.sql on the live (existing) database.
-- schema.sql has been updated to match for fresh installs.

-- ============================================================
-- Properties: human-readable ID, phone, admin notes, schedule
-- ============================================================
alter table properties add column if not exists human_id text unique;
alter table properties add column if not exists phone text;
alter table properties add column if not exists notes text;
-- Monthly nth-weekday schedule: [{"ordinal":1,"weekday":1}, ...]
--   ordinal 1..4 = first..fourth, 5 = last; weekday 0=Sun..6=Sat
alter table properties add column if not exists required_schedule jsonb not null default '[]'::jsonb;

-- ============================================================
-- Inspections: scheduled date/time (can't start before this)
-- ============================================================
alter table inspections add column if not exists scheduled_for timestamptz;

-- ============================================================
-- Profiles (specialists): contact info, OCS ID, ID document paths
-- ============================================================
alter table profiles add column if not exists human_id text unique;
alter table profiles add column if not exists phone text;
alter table profiles add column if not exists address text;
alter table profiles add column if not exists email text;
alter table profiles add column if not exists id_front_path text;
alter table profiles add column if not exists id_back_path text;

-- Backfill human-readable IDs and emails for existing rows.
update properties
  set human_id = 'PROP-' || upper(substr(md5(random()::text || id::text), 1, 6))
  where human_id is null;

update profiles
  set human_id = 'OCS-' || lpad(((floor(random() * 9000) + 1000)::int)::text, 4, '0')
  where human_id is null;

update profiles p
  set email = u.email
  from auth.users u
  where u.id = p.id and p.email is null;

-- ============================================================
-- handle_new_user: also copy the email onto the profile row
-- (still always 'inspector' — never trust client-supplied role)
-- ============================================================
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, full_name, role, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    'inspector',
    new.email
  );
  return new;
end;
$$;

-- ============================================================
-- Let specialists edit their OWN profile (address/phone/ID docs),
-- but never their role / human_id / email (guarded below).
-- ============================================================
drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own" on profiles
  for update using (id = auth.uid())
  with check (id = auth.uid());

create or replace function guard_profile_self_update()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Admins may change anything; a self-update by a non-admin cannot touch
  -- privileged columns (prevents self role-escalation via the own-row policy).
  if not current_role_is_admin() then
    new.role := old.role;
    new.human_id := old.human_id;
    new.email := old.email;
    new.id := old.id;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_self_update on profiles;
create trigger profiles_guard_self_update
  before update on profiles
  for each row execute function guard_profile_self_update();

-- ============================================================
-- documents bucket: specialists' driver's-license uploads
-- (owner-or-admin read; owner writes under their own `${uid}/` folder)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

drop policy if exists "documents_read" on storage.objects;
create policy "documents_read" on storage.objects
  for select using (
    bucket_id = 'documents'
    and (current_role_is_admin() or (storage.foldername(name))[1] = auth.uid()::text)
  );

drop policy if exists "documents_write" on storage.objects;
create policy "documents_write" on storage.objects
  for insert with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "documents_update" on storage.objects;
create policy "documents_update" on storage.objects
  for update using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create index if not exists inspections_scheduled_for_idx on inspections (scheduled_for);
