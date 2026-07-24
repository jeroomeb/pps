-- PPS Inspections schema
-- Run this once in the Supabase SQL editor (or via `supabase db push`).

create extension if not exists "pgcrypto";

-- ============================================================
-- Tables
-- ============================================================

create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('admin', 'inspector')) default 'inspector',
  created_at timestamptz not null default now(),
  human_id text unique,
  phone text,
  address text,
  email text,
  id_front_path text,
  id_back_path text
);

create table if not exists checklist_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists checklist_template_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references checklist_templates (id) on delete cascade,
  service_category text not null,
  item_name text not null,
  description text,
  sort_order int not null default 0
);

create table if not exists properties (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  email text not null,
  created_at timestamptz not null default now(),
  human_id text unique,
  phone text,
  notes text,
  -- Monthly nth-weekday schedule: [{"ordinal":1,"weekday":1}, ...]
  required_schedule jsonb not null default '[]'::jsonb
);

create table if not exists inspections (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties (id) on delete cascade,
  template_id uuid not null references checklist_templates (id),
  inspector_id uuid not null references profiles (id),
  status text not null check (status in ('pending', 'in_progress', 'completed')) default 'pending',
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  pdf_path text,
  scheduled_for timestamptz
);

create table if not exists inspection_items (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references inspections (id) on delete cascade,
  template_item_id uuid not null references checklist_template_items (id),
  service_category text not null,
  item_name text not null,
  description text,
  sort_order int not null default 0,
  status text check (status in ('pass', 'fail', 'na')),
  comment text,
  photo_path text,
  unique (inspection_id, template_item_id)
);

create index if not exists inspections_property_id_idx on inspections (property_id);
create index if not exists inspections_inspector_id_idx on inspections (inspector_id);
create index if not exists inspection_items_inspection_id_idx on inspection_items (inspection_id);
create index if not exists checklist_template_items_template_id_idx on checklist_template_items (template_id);
create index if not exists inspections_template_id_idx on inspections (template_id);
create index if not exists inspection_items_template_item_id_idx on inspection_items (template_item_id);

-- ============================================================
-- Helper function: current user's role (avoids RLS recursion)
-- ============================================================

create or replace function current_role_is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- ============================================================
-- Row Level Security
-- ============================================================

alter table profiles enable row level security;
alter table checklist_templates enable row level security;
alter table checklist_template_items enable row level security;
alter table properties enable row level security;
alter table inspections enable row level security;
alter table inspection_items enable row level security;

-- profiles: everyone can read their own row; admins can read/write all
drop policy if exists "profiles_select_own_or_admin" on profiles;
create policy "profiles_select_own_or_admin" on profiles
  for select using (id = auth.uid() or current_role_is_admin());

drop policy if exists "profiles_admin_write" on profiles;
create policy "profiles_admin_write" on profiles
  for all using (current_role_is_admin()) with check (current_role_is_admin());

-- checklist_templates: readable by any authenticated user, writable by admins
drop policy if exists "templates_select_all" on checklist_templates;
create policy "templates_select_all" on checklist_templates
  for select using (auth.uid() is not null);

drop policy if exists "templates_admin_write" on checklist_templates;
create policy "templates_admin_write" on checklist_templates
  for all using (current_role_is_admin()) with check (current_role_is_admin());

drop policy if exists "template_items_select_all" on checklist_template_items;
create policy "template_items_select_all" on checklist_template_items
  for select using (auth.uid() is not null);

drop policy if exists "template_items_admin_write" on checklist_template_items;
create policy "template_items_admin_write" on checklist_template_items
  for all using (current_role_is_admin()) with check (current_role_is_admin());

-- properties: readable by any authenticated user (inspectors need it via inspections join),
-- writable by admins only
drop policy if exists "properties_select_all" on properties;
create policy "properties_select_all" on properties
  for select using (auth.uid() is not null);

drop policy if exists "properties_admin_write" on properties;
create policy "properties_admin_write" on properties
  for all using (current_role_is_admin()) with check (current_role_is_admin());

-- inspections: admins see/manage all; inspectors see/update only their own
drop policy if exists "inspections_select" on inspections;
create policy "inspections_select" on inspections
  for select using (inspector_id = auth.uid() or current_role_is_admin());

drop policy if exists "inspections_admin_insert" on inspections;
create policy "inspections_admin_insert" on inspections
  for insert with check (current_role_is_admin());

drop policy if exists "inspections_admin_delete" on inspections;
create policy "inspections_admin_delete" on inspections
  for delete using (current_role_is_admin());

-- Completed inspections are frozen: the emailed report is the record of
-- truth, so nobody edits them through the app's user-scoped client.
-- (The submit pipeline itself runs on the service role and is unaffected.)
drop policy if exists "inspections_update" on inspections;
create policy "inspections_update" on inspections
  for update using (
    (inspector_id = auth.uid() or current_role_is_admin())
    and status <> 'completed'
  )
  with check (inspector_id = auth.uid() or current_role_is_admin());

-- inspection_items: visible/editable only through owning inspection
drop policy if exists "inspection_items_select" on inspection_items;
create policy "inspection_items_select" on inspection_items
  for select using (
    exists (
      select 1 from inspections i
      where i.id = inspection_items.inspection_id
        and (i.inspector_id = auth.uid() or current_role_is_admin())
    )
  );

drop policy if exists "inspection_items_admin_insert" on inspection_items;
create policy "inspection_items_admin_insert" on inspection_items
  for insert with check (
    exists (
      select 1 from inspections i
      where i.id = inspection_items.inspection_id
        and (i.inspector_id = auth.uid() or current_role_is_admin())
    )
  );

drop policy if exists "inspection_items_update" on inspection_items;
create policy "inspection_items_update" on inspection_items
  for update using (
    exists (
      select 1 from inspections i
      where i.id = inspection_items.inspection_id
        and (i.inspector_id = auth.uid() or current_role_is_admin())
        and i.status <> 'completed'
    )
  ) with check (
    exists (
      select 1 from inspections i
      where i.id = inspection_items.inspection_id
        and (i.inspector_id = auth.uid() or current_role_is_admin())
        and i.status <> 'completed'
    )
  );

-- ============================================================
-- New auth user -> profile row (defaults to inspector; promote admins manually)
-- ============================================================

-- SECURITY: always 'inspector'. Never trust raw_user_meta_data for the role —
-- it is client-supplied at signup, so honoring it would let anyone who can
-- reach the public signup endpoint mint themselves an admin account.
-- Admin-created team members are promoted explicitly by the createTeamMember
-- server action (service role) after the user is created.
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Specialists may edit their OWN profile (address/phone/ID docs) but not their
-- role/human_id/email — those privileged columns are reset for non-admins by
-- the guard trigger, so the own-row policy can't be used to self-escalate.
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
-- Storage buckets
-- ============================================================

insert into storage.buckets (id, name, public)
values ('photos', 'photos', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('reports', 'reports', false)
on conflict (id) do nothing;

drop policy if exists "photos_read" on storage.objects;
create policy "photos_read" on storage.objects
  for select using (bucket_id = 'photos' and auth.uid() is not null);

drop policy if exists "photos_write" on storage.objects;
create policy "photos_write" on storage.objects
  for insert with check (bucket_id = 'photos' and auth.uid() is not null);

drop policy if exists "photos_update" on storage.objects;
create policy "photos_update" on storage.objects
  for update using (bucket_id = 'photos' and auth.uid() is not null);

drop policy if exists "reports_read" on storage.objects;
create policy "reports_read" on storage.objects
  for select using (bucket_id = 'reports' and auth.uid() is not null);

drop policy if exists "reports_write" on storage.objects;
create policy "reports_write" on storage.objects
  for all using (bucket_id = 'reports' and current_role_is_admin())
  with check (bucket_id = 'reports' and current_role_is_admin());

-- documents: specialists' ID/driver's-license uploads. Owner-or-admin read;
-- owner writes under their own `${uid}/` folder.
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
