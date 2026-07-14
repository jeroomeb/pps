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
  created_at timestamptz not null default now()
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
  created_at timestamptz not null default now()
);

create table if not exists inspections (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties (id) on delete cascade,
  template_id uuid not null references checklist_templates (id),
  inspector_id uuid not null references profiles (id),
  status text not null check (status in ('pending', 'in_progress', 'completed')) default 'pending',
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  pdf_path text
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
  photo_path text
);

create index if not exists inspections_property_id_idx on inspections (property_id);
create index if not exists inspections_inspector_id_idx on inspections (inspector_id);
create index if not exists inspection_items_inspection_id_idx on inspection_items (inspection_id);
create index if not exists checklist_template_items_template_id_idx on checklist_template_items (template_id);

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

drop policy if exists "inspections_update" on inspections;
create policy "inspections_update" on inspections
  for update using (inspector_id = auth.uid() or current_role_is_admin())
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
    )
  ) with check (
    exists (
      select 1 from inspections i
      where i.id = inspection_items.inspection_id
        and (i.inspector_id = auth.uid() or current_role_is_admin())
    )
  );

-- ============================================================
-- New auth user -> profile row (defaults to inspector; promote admins manually)
-- ============================================================

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'inspector')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

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
