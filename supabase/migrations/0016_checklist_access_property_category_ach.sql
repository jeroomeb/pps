-- Checklist access follows the property assignment, not a one-off inspection.
-- A tenant is granted checklist types. A property enables a subset of those,
-- and can keep them pending 24/7 after each completion.
-- Properties also record a building category so payouts use category × tier.
-- Specialists can store optional ACH details on their own profile.

alter table properties
  add column if not exists building_category text
  check (building_category in ('luxury', 'adult', 'commercial'));

alter table properties
  add column if not exists checklist_always_available boolean not null default false;

alter table profiles
  add column if not exists ach_enabled boolean not null default false;

alter table profiles
  add column if not exists bank_name text;

alter table profiles
  add column if not exists bank_account_number text;

alter table profiles
  add column if not exists bank_routing_number text;

create table if not exists tenant_checklist_access (
  tenant_id uuid not null references tenants (id) on delete cascade,
  template_id uuid not null references checklist_templates (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (tenant_id, template_id)
);

create table if not exists property_checklist_access (
  property_id uuid not null references properties (id) on delete cascade,
  template_id uuid not null references checklist_templates (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (property_id, template_id)
);

create index if not exists tenant_checklist_access_template_idx
  on tenant_checklist_access (template_id);

create index if not exists property_checklist_access_template_idx
  on property_checklist_access (template_id);

-- Existing organizations keep the checklists they already use. New tenants
-- start with an explicit selection from the provisioning form.
insert into tenant_checklist_access (tenant_id, template_id)
select t.id, ct.id
from tenants t
cross join checklist_templates ct
where ct.tenant_id is null or ct.tenant_id = t.id
on conflict do nothing;

alter table tenant_checklist_access enable row level security;
alter table property_checklist_access enable row level security;

drop policy if exists "tenant_checklist_access_select" on tenant_checklist_access;
create policy "tenant_checklist_access_select" on tenant_checklist_access
  for select using (
    current_user_is_global_admin()
    or tenant_id = current_user_tenant_id()
    or tenant_id in (
      select id from public.tenants where parent_organization_id = current_user_tenant_id()
    )
  );

drop policy if exists "tenant_checklist_access_write" on tenant_checklist_access;
create policy "tenant_checklist_access_write" on tenant_checklist_access
  for all using (current_user_is_global_admin())
  with check (current_user_is_global_admin());

drop policy if exists "property_checklist_access_select" on property_checklist_access;
create policy "property_checklist_access_select" on property_checklist_access
  for select using (
    current_user_is_global_admin()
    or exists (
      select 1 from public.properties p
      where p.id = property_id
        and (
          (current_role_is_admin() and p.tenant_id = current_user_tenant_id())
          or exists (
            select 1 from public.property_specialist_assignments a
            where a.property_id = p.id and a.specialist_id = auth.uid()
          )
        )
    )
  );

drop policy if exists "property_checklist_access_write" on property_checklist_access;
create policy "property_checklist_access_write" on property_checklist_access
  for all using (
    current_user_is_global_admin()
    or exists (
      select 1 from public.properties p
      where p.id = property_id
        and current_role_is_admin()
        and p.tenant_id = current_user_tenant_id()
    )
  )
  with check (
    current_user_is_global_admin()
    or exists (
      select 1 from public.properties p
      where p.id = property_id
        and current_role_is_admin()
        and p.tenant_id = current_user_tenant_id()
    )
  );
