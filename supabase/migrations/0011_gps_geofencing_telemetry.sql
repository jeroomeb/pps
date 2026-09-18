-- 0011_gps_geofencing_telemetry.sql
-- GPS Tracking, Geofencing, On-Site Dwell Time, and Field Telemetry Logs
-- Idempotent — safe to re-run on existing databases.

-- ============================================================
-- 1. Add GPS & Geofencing Configuration to properties
-- ============================================================

alter table public.properties
  add column if not exists enable_gps_geofencing boolean not null default true,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists geofence_radius_meters integer not null default 100;

-- ============================================================
-- 2. Add Arrival, Departure, Dwell Time & Status to inspections
-- ============================================================

alter table public.inspections
  add column if not exists arrived_at timestamptz,
  add column if not exists departed_at timestamptz,
  add column if not exists dwell_time_seconds integer,
  add column if not exists geofence_status text not null default 'pending'
    check (geofence_status in ('pending', 'verified', 'outside', 'exempt'));

-- ============================================================
-- 3. Inspection Geo-Telemetry Breadcrumb Logs Table
-- ============================================================

create table if not exists public.inspection_geo_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants (id) on delete cascade,
  inspection_id uuid not null references public.inspections (id) on delete cascade,
  specialist_id uuid not null references public.profiles (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  latitude double precision not null,
  longitude double precision not null,
  speed_meters_per_sec double precision,
  accuracy_meters double precision,
  distance_to_center_meters double precision,
  is_inside_geofence boolean not null default false,
  logged_at timestamptz not null default now()
);

create index if not exists geo_logs_inspection_id_idx on public.inspection_geo_logs (inspection_id);
create index if not exists geo_logs_specialist_id_idx on public.inspection_geo_logs (specialist_id);
create index if not exists geo_logs_property_id_idx on public.inspection_geo_logs (property_id);
create index if not exists geo_logs_tenant_id_idx on public.inspection_geo_logs (tenant_id);
create index if not exists geo_logs_logged_at_idx on public.inspection_geo_logs (logged_at);

-- ============================================================
-- 4. Row Level Security on inspection_geo_logs
-- ============================================================

alter table public.inspection_geo_logs enable row level security;

drop policy if exists "geo_logs_select" on public.inspection_geo_logs;
create policy "geo_logs_select" on public.inspection_geo_logs
  for select using (
    current_user_is_global_admin()
    or specialist_id = auth.uid()
    or (current_role_is_admin() and tenant_id = current_user_tenant_id())
  );

drop policy if exists "geo_logs_insert" on public.inspection_geo_logs;
create policy "geo_logs_insert" on public.inspection_geo_logs
  for insert with check (
    current_user_is_global_admin()
    or specialist_id = auth.uid()
    or (current_role_is_admin() and tenant_id = current_user_tenant_id())
  );
