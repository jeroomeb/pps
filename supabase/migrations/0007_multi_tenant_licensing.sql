-- 0007_multi_tenant_licensing.sql
-- Multi-Tenant Architecture & License-Based Access (Shared DB, Shared Schema)
-- Introduces tenants (corporate subscribers), property licenses (building SKU limits),
-- tenant-scoping for profiles/properties/inspections, and the apex Global Admin role.
-- Idempotent — safe to re-run on existing databases.

-- ============================================================
-- 1. Tenants Table (Corporate Accounts & Licenses)
-- ============================================================

create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  license_tier text not null default 'standard' check (license_tier in ('starter', 'standard', 'pro', 'enterprise')),
  max_property_licenses int not null default 5,
  status text not null default 'active' check (status in ('active', 'suspended', 'trial')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tenants_slug_idx on tenants (slug);
create index if not exists tenants_status_idx on tenants (status);

-- ============================================================
-- 2. Alter Existing Tables to Support Multi-Tenancy
-- ============================================================

-- profiles: tenant assignment, global admin apex flag, contractor pool flag, status
alter table profiles add column if not exists tenant_id uuid references tenants (id) on delete set null;
alter table profiles add column if not exists is_global_admin boolean not null default false;
alter table profiles add column if not exists is_contractor boolean not null default false;
alter table profiles add column if not exists status text not null default 'active' check (status in ('active', 'inactive', 'suspended'));

-- properties: tenant ownership & active status
alter table properties add column if not exists tenant_id uuid references tenants (id) on delete cascade;
alter table properties add column if not exists is_active boolean not null default true;

-- inspections: tenant ownership for direct partitioning
alter table inspections add column if not exists tenant_id uuid references tenants (id) on delete cascade;

-- checklist_templates: nullable tenant_id (NULL = global system templates, non-null = custom tenant templates)
alter table checklist_templates add column if not exists tenant_id uuid references tenants (id) on delete cascade;

create index if not exists profiles_tenant_id_idx on profiles (tenant_id);
create index if not exists properties_tenant_id_idx on properties (tenant_id);
create index if not exists inspections_tenant_id_idx on inspections (tenant_id);
create index if not exists checklist_templates_tenant_id_idx on checklist_templates (tenant_id);

-- ============================================================
-- 3. Default Tenant Backfill (Preserves Existing Live Data)
-- ============================================================

insert into tenants (id, name, slug, license_tier, max_property_licenses, status)
values (
  '00000000-0000-0000-0000-000000000001',
  'Amenity Op''s HQ',
  'amenityops-hq',
  'enterprise',
  100,
  'active'
)
on conflict (id) do nothing;

-- Backfill existing properties into the primary tenant if not assigned
update properties
set tenant_id = '00000000-0000-0000-0000-000000000001'
where tenant_id is null;

-- Backfill existing inspections
update inspections
set tenant_id = '00000000-0000-0000-0000-000000000001'
where tenant_id is null;

-- Backfill existing admin profiles as Global Admins and associate with default tenant
update profiles
set is_global_admin = true
where role = 'admin';

update profiles
set tenant_id = '00000000-0000-0000-0000-000000000001'
where tenant_id is null;

-- ============================================================
-- 4. Helper Functions for RLS
-- ============================================================

create or replace function current_user_is_global_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_global_admin = true
  );
$$;

create or replace function current_user_tenant_id()
returns uuid
language sql
security definer
stable
set search_path = ''
as $$
  select tenant_id from public.profiles where id = auth.uid();
$$;

-- Update the guard trigger to protect tenant_id, is_global_admin, and status
create or replace function guard_profile_self_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(current_setting('request.jwt.claims', true)::jsonb->>'role', '') = 'service_role' then
    return new;
  end if;

  -- Global admins can update any fields via client; tenant admins can update non-global fields.
  -- Non-admins cannot alter privileged columns.
  if not public.current_role_is_admin() then
    new.role := old.role;
    new.human_id := old.human_id;
    new.email := old.email;
    new.id := old.id;
    new.tenant_id := old.tenant_id;
    new.is_global_admin := old.is_global_admin;
    new.is_contractor := old.is_contractor;
    new.status := old.status;
  elsif not public.current_user_is_global_admin() then
    -- Tenant admin cannot make themselves a global admin or change their own tenant
    new.is_global_admin := old.is_global_admin;
    new.tenant_id := old.tenant_id;
  end if;

  return new;
end;
$$;

-- ============================================================
-- 5. Row Level Security Policies
-- ============================================================

alter table tenants enable row level security;

-- tenants policies
drop policy if exists "tenants_select" on tenants;
create policy "tenants_select" on tenants
  for select using (
    current_user_is_global_admin()
    or id = current_user_tenant_id()
  );

drop policy if exists "tenants_global_admin_write" on tenants;
create policy "tenants_global_admin_write" on tenants
  for all using (current_user_is_global_admin())
  with check (current_user_is_global_admin());

-- properties policies updated with tenant scoping
drop policy if exists "properties_select_all" on properties;
create policy "properties_select_all" on properties
  for select using (
    current_user_is_global_admin()
    or (
      tenant_id = current_user_tenant_id()
      and (
        current_role_is_admin()
        or exists (
          select 1 from inspections i
          where i.property_id = properties.id and i.inspector_id = auth.uid()
        )
      )
    )
    or exists (
      -- External marketplace contractors assigned to an inspection at this property
      select 1 from inspections i
      where i.property_id = properties.id and i.inspector_id = auth.uid()
    )
  );

drop policy if exists "properties_admin_write" on properties;
create policy "properties_admin_write" on properties
  for all using (
    current_user_is_global_admin()
    or (current_role_is_admin() and tenant_id = current_user_tenant_id())
  ) with check (
    current_user_is_global_admin()
    or (current_role_is_admin() and tenant_id = current_user_tenant_id())
  );

-- profiles policies updated with tenant scoping
drop policy if exists "profiles_select_own_or_admin" on profiles;
create policy "profiles_select_own_or_admin" on profiles
  for select using (
    id = auth.uid()
    or current_user_is_global_admin()
    or (
      current_role_is_admin()
      and (
        tenant_id = current_user_tenant_id()
        or is_contractor = true -- Global contractor pool accessible to admins for assignment
      )
    )
  );

drop policy if exists "profiles_admin_write" on profiles;
create policy "profiles_admin_write" on profiles
  for all using (
    current_user_is_global_admin()
    or (current_role_is_admin() and tenant_id = current_user_tenant_id())
  ) with check (
    current_user_is_global_admin()
    or (current_role_is_admin() and tenant_id = current_user_tenant_id())
  );

-- checklist_templates policies (supports both global and tenant-specific templates)
drop policy if exists "templates_select_all" on checklist_templates;
create policy "templates_select_all" on checklist_templates
  for select using (
    auth.uid() is not null
    and (
      tenant_id is null -- Global platform template
      or tenant_id = current_user_tenant_id()
      or current_user_is_global_admin()
    )
  );

drop policy if exists "templates_admin_write" on checklist_templates;
create policy "templates_admin_write" on checklist_templates
  for all using (
    current_user_is_global_admin()
    or (current_role_is_admin() and tenant_id = current_user_tenant_id())
  ) with check (
    current_user_is_global_admin()
    or (current_role_is_admin() and tenant_id = current_user_tenant_id())
  );
