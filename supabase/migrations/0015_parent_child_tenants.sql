-- Migration: 0015_parent_child_tenants.sql
-- Description: Add parent_organization_id to tenants table for parent-child multi-tenancy hierarchy.

-- 1. Add parent_organization_id column to tenants
alter table public.tenants
  add column if not exists parent_organization_id uuid references public.tenants(id) on delete set null;

-- 2. Create index for fast child tenant lookups
create index if not exists tenants_parent_org_idx on public.tenants (parent_organization_id);

-- 3. Helper function: Get all accessible tenant IDs for the current user (includes own tenant + child tenants)
create or replace function public.get_user_accessible_tenant_ids()
returns table (accessible_tenant_id uuid)
language sql
security definer
set search_path = ''
stable
as $$
  with user_profile as (
    select tenant_id, is_global_admin, role
    from public.profiles
    where id = auth.uid()
  )
  select t.id as accessible_tenant_id
  from public.tenants t
  where exists (select 1 from user_profile where is_global_admin = true)
     or t.id in (select tenant_id from user_profile where tenant_id is not null)
     or t.parent_organization_id in (select tenant_id from user_profile where tenant_id is not null);
$$;
