-- 0008_property_staff_assignment.sql
-- Property-Centric Staff Assignment, Multi-Inspector Roster & ID Verification Toggle
-- Idempotent — safe to re-run on existing databases.

-- ============================================================
-- 1. Property-Specialist Assignment Junction Table
-- ============================================================

create table if not exists property_specialist_assignments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  property_id uuid not null,
  specialist_id uuid not null,
  role text not null default 'primary' check (role in ('primary', 'backup', 'staff')),
  created_at timestamptz not null default now(),
  constraint property_specialist_assignments_tenant_id_fkey foreign key (tenant_id) references tenants (id) on delete cascade,
  constraint property_specialist_assignments_property_id_fkey foreign key (property_id) references properties (id) on delete cascade,
  constraint property_specialist_assignments_specialist_id_fkey foreign key (specialist_id) references profiles (id) on delete cascade,
  constraint property_specialist_assignments_unique_pair unique (property_id, specialist_id)
);

create index if not exists prop_assign_property_id_idx on property_specialist_assignments (property_id);
create index if not exists prop_assign_specialist_id_idx on property_specialist_assignments (specialist_id);
create index if not exists prop_assign_tenant_id_idx on property_specialist_assignments (tenant_id);

-- ============================================================
-- 2. Photo ID Verification Toggle on Properties and Tenants
-- ============================================================

alter table tenants add column if not exists require_id_photo boolean not null default true;
alter table properties add column if not exists require_id_photo boolean not null default true;

-- ============================================================
-- 3. Row Level Security on Assignments
-- ============================================================

alter table property_specialist_assignments enable row level security;

drop policy if exists "prop_assign_select" on property_specialist_assignments;
create policy "prop_assign_select" on property_specialist_assignments
  for select using (
    current_user_is_global_admin()
    or specialist_id = auth.uid()
    or (current_role_is_admin() and tenant_id = current_user_tenant_id())
  );

drop policy if exists "prop_assign_admin_write" on property_specialist_assignments;
create policy "prop_assign_admin_write" on property_specialist_assignments
  for all using (
    current_user_is_global_admin()
    or (current_role_is_admin() and tenant_id = current_user_tenant_id())
  ) with check (
    current_user_is_global_admin()
    or (current_role_is_admin() and tenant_id = current_user_tenant_id())
  );

-- ============================================================
-- 4. Strict Property Access Scoping (Updated Policy)
-- ============================================================

drop policy if exists "properties_select_all" on properties;
create policy "properties_select_all" on properties
  for select using (
    current_user_is_global_admin()
    or (
      tenant_id = current_user_tenant_id()
      and (
        current_role_is_admin()
        or exists (
          select 1 from property_specialist_assignments psa
          where psa.property_id = properties.id and psa.specialist_id = auth.uid()
        )
        or exists (
          select 1 from inspections i
          where i.property_id = properties.id and i.inspector_id = auth.uid()
        )
      )
    )
    or exists (
      select 1 from property_specialist_assignments psa
      where psa.property_id = properties.id and psa.specialist_id = auth.uid()
    )
    or exists (
      select 1 from inspections i
      where i.property_id = properties.id and i.inspector_id = auth.uid()
    )
  );
