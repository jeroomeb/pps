-- Migration: 0020_dynamic_property_types.sql
-- Enables Platform Owner / Super Admin to dynamically create, edit, and manage Property Types.
-- Replaces static building_category check constraint with a dynamic property_types catalog.

-- 1. Create property_types catalog table
create table if not exists public.property_types (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  description text,
  payout_matrix_key text not null default 'luxury_condo',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists property_types_active_sort_idx on public.property_types (is_active, sort_order);

-- 2. Seed existing default property types idempotently
insert into public.property_types (key, label, description, payout_matrix_key, is_active, sort_order)
values
  ('luxury', 'Luxury Condominium', 'High-rise luxury residential & condo buildings', 'luxury_condo', true, 1),
  ('adult', '55+ Active Adult Community', 'Senior & active adult gated communities', 'adult_community', true, 2),
  ('commercial', 'Commercial Multi-Tenant', 'Office towers & commercial multi-tenant plazas', 'commercial_multi', true, 3)
on conflict (key) do nothing;

-- 3. Safely drop legacy hardcoded check constraint on properties.building_category
alter table public.properties drop constraint if exists properties_building_category_check;

-- 4. Enable Row Level Security (RLS)
alter table public.property_types enable row level security;

-- 5. Policies
drop policy if exists "Authenticated users can read property types" on public.property_types;
create policy "Authenticated users can read property types"
  on public.property_types
  for select
  to authenticated
  using (true);

drop policy if exists "Super Admins can insert property types" on public.property_types;
create policy "Super Admins can insert property types"
  on public.property_types
  for insert
  to authenticated
  with check (public.current_user_is_global_admin());

drop policy if exists "Super Admins can update property types" on public.property_types;
create policy "Super Admins can update property types"
  on public.property_types
  for update
  to authenticated
  using (public.current_user_is_global_admin())
  with check (public.current_user_is_global_admin());

drop policy if exists "Super Admins can delete property types" on public.property_types;
create policy "Super Admins can delete property types"
  on public.property_types
  for delete
  to authenticated
  using (public.current_user_is_global_admin());
