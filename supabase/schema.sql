-- Amenity Op's schema (Multi-Tenant Architecture & Logical Isolation)
-- Run this once in the Supabase SQL editor (or via `supabase db push`).

create extension if not exists "pgcrypto";

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
  require_id_photo boolean not null default true,
  enable_payouts boolean not null default false,
  default_payout_rate numeric(10, 2) not null default 75.00,
  payout_tier_1_rate numeric(10, 2) not null default 50.00,
  payout_tier_2_rate numeric(10, 2) not null default 75.00,
  payout_tier_3_rate numeric(10, 2) not null default 100.00,
  payout_matrix jsonb not null default '{"luxury_condo":{"tier_1":50.00,"tier_2":75.00,"tier_3":100.00},"adult_community":{"tier_1":55.00,"tier_2":80.00,"tier_3":110.00},"commercial_multi":{"tier_1":65.00,"tier_2":95.00,"tier_3":130.00}}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tenants_slug_idx on tenants (slug);
create index if not exists tenants_status_idx on tenants (status);

-- ============================================================
-- 2. Core Tables
-- ============================================================

create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('admin', 'inspector')) default 'inspector',
  created_at timestamptz not null default now(),
  human_id text unique,
  phone text,
  -- `address` is a DERIVED single-line value composed from the parts below
  -- on every write (src/lib/address.ts). PDFs/emails/reports read it directly.
  address text,
  street text,
  city text,
  state text,
  zip text,
  county text,
  email text,
  id_front_path text,
  id_back_path text,
  tenant_id uuid references tenants (id) on delete set null,
  is_global_admin boolean not null default false,
  is_contractor boolean not null default false,
  status text not null default 'active' check (status in ('active', 'inactive', 'suspended')),
  must_reset_password boolean not null default true
);

create table if not exists checklist_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now(),
  tenant_id uuid references tenants (id) on delete cascade
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
  -- `address` is a DERIVED single-line value composed from the parts below
  -- on every write (src/lib/address.ts). PDFs/emails/reports read it directly.
  address text not null,
  street text,
  city text,
  state text,
  zip text,
  county text,
  email text not null,
  created_at timestamptz not null default now(),
  human_id text unique,
  phone text,
  notes text,
  -- Monthly first-weekday schedule: [{"ordinal":1,"weekday":1}, ...]
  -- ordinal is always 1 ("first <weekday> of the month"); weekday 0=Sun..6=Sat
  required_schedule jsonb not null default '[]'::jsonb,
  tenant_id uuid references tenants (id) on delete cascade,
  is_active boolean not null default true,
  require_id_photo boolean not null default true,
  custom_payout_rate numeric(10, 2),
  payout_tier text not null default 'tier_2' check (payout_tier in ('tier_1', 'tier_2', 'tier_3', 'custom')),
  enable_gps_geofencing boolean not null default true,
  latitude double precision,
  longitude double precision,
  geofence_radius_meters integer not null default 100
);

create table if not exists property_specialist_assignments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants (id) on delete cascade,
  property_id uuid not null references properties (id) on delete cascade,
  specialist_id uuid not null references profiles (id) on delete cascade,
  role text not null default 'primary' check (role in ('primary', 'backup', 'staff')),
  created_at timestamptz not null default now(),
  unique (property_id, specialist_id)
);

create index if not exists prop_assign_property_id_idx on property_specialist_assignments (property_id);
create index if not exists prop_assign_specialist_id_idx on property_specialist_assignments (specialist_id);
create index if not exists prop_assign_tenant_id_idx on property_specialist_assignments (tenant_id);

-- An admin-dismissed required-inspection day (stops it surfacing as overdue).
create table if not exists schedule_dismissals (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties (id) on delete cascade,
  occurrence_date date not null,
  dismissed_by uuid references profiles (id) on delete set null,
  dismissed_at timestamptz not null default now(),
  unique (property_id, occurrence_date)
);

create table if not exists inspections (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties (id) on delete cascade,
  template_id uuid not null references checklist_templates (id),
  inspector_id uuid not null references profiles (id),
  status text not null check (status in ('pending', 'in_progress', 'completed', 'cancelled')) default 'pending',
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  pdf_path text,
  scheduled_for timestamptz,
  -- An admin can cancel a scheduled/in-progress inspection. It is a soft state
  -- change, not a delete — inspections are an audit record, so who cancelled
  -- it, when, and why all survive.
  cancelled_at timestamptz,
  cancelled_by uuid references profiles (id) on delete set null,
  cancellation_reason text,
  -- Whether the report email actually sent — surfaced on the Reports list
  -- instead of only a toast the specialist may have already dismissed.
  email_status text check (email_status in ('sent', 'failed')),
  email_error text,
  tenant_id uuid references tenants (id) on delete cascade,
  -- GPS Geofencing, On-Site Arrival/Departure timestamps & Dwell Time
  arrived_at timestamptz,
  departed_at timestamptz,
  dwell_time_seconds integer,
  geofence_status text not null default 'pending' check (geofence_status in ('pending', 'verified', 'outside', 'exempt'))
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
create index if not exists inspections_tenant_id_idx on inspections (tenant_id);
create index if not exists properties_tenant_id_idx on properties (tenant_id);
create index if not exists profiles_tenant_id_idx on profiles (tenant_id);
create index if not exists inspection_items_inspection_id_idx on inspection_items (inspection_id);
create index if not exists checklist_template_items_template_id_idx on checklist_template_items (template_id);
create index if not exists checklist_templates_tenant_id_idx on checklist_templates (tenant_id);
create index if not exists inspections_template_id_idx on inspections (template_id);
create index if not exists inspection_items_template_item_id_idx on inspection_items (template_item_id);
create index if not exists inspections_analytics_completed_idx on inspections (tenant_id, status, completed_at);
create index if not exists inspections_specialist_perf_idx on inspections (inspector_id, status, completed_at);
create index if not exists inspection_items_status_analytics_idx on inspection_items (inspection_id, status);

-- Specialist Payouts Ledger
create table if not exists specialist_payouts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants (id) on delete cascade,
  inspection_id uuid not null references inspections (id) on delete cascade,
  specialist_id uuid not null references profiles (id) on delete cascade,
  property_id uuid not null references properties (id) on delete cascade,
  amount numeric(10, 2) not null default 0.00,
  status text not null default 'pending' check (status in ('pending', 'approved', 'paid', 'cancelled')),
  approved_at timestamptz,
  approved_by uuid references profiles (id) on delete set null,
  paid_at timestamptz,
  payment_reference text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint specialist_payouts_inspection_id_unique unique (inspection_id)
);

create index if not exists specialist_payouts_tenant_id_idx on specialist_payouts (tenant_id);
create index if not exists specialist_payouts_specialist_id_idx on specialist_payouts (specialist_id);
create index if not exists specialist_payouts_property_id_idx on specialist_payouts (property_id);
create index if not exists specialist_payouts_status_idx on specialist_payouts (status);

-- Inspection Geo-Telemetry Breadcrumb Logs
create table if not exists inspection_geo_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants (id) on delete cascade,
  inspection_id uuid not null references inspections (id) on delete cascade,
  specialist_id uuid not null references profiles (id) on delete cascade,
  property_id uuid not null references properties (id) on delete cascade,
  latitude double precision not null,
  longitude double precision not null,
  speed_meters_per_sec double precision,
  accuracy_meters double precision,
  distance_to_center_meters double precision,
  is_inside_geofence boolean not null default false,
  logged_at timestamptz not null default now()
);

create index if not exists geo_logs_inspection_id_idx on inspection_geo_logs (inspection_id);
create index if not exists geo_logs_specialist_id_idx on inspection_geo_logs (specialist_id);
create index if not exists geo_logs_property_id_idx on inspection_geo_logs (property_id);
create index if not exists geo_logs_tenant_id_idx on inspection_geo_logs (tenant_id);
create index if not exists geo_logs_logged_at_idx on inspection_geo_logs (logged_at);

-- Default Tenant for initial setup
insert into tenants (id, name, slug, license_tier, max_property_licenses, status)
values ('00000000-0000-0000-0000-000000000001', 'Amenity Op''s HQ', 'amenityops-hq', 'enterprise', 100, 'active')
on conflict (id) do nothing;

-- ============================================================
-- Helper functions for RLS
-- ============================================================

create or replace function current_role_is_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function current_user_is_global_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and is_global_admin = true
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

-- ============================================================
-- Row Level Security
-- ============================================================

alter table tenants enable row level security;
alter table profiles enable row level security;
alter table checklist_templates enable row level security;
alter table checklist_template_items enable row level security;
alter table properties enable row level security;
alter table property_specialist_assignments enable row level security;
alter table inspections enable row level security;
alter table inspection_items enable row level security;
alter table schedule_dismissals enable row level security;
alter table specialist_payouts enable row level security;
alter table inspection_geo_logs enable row level security;

-- inspection_geo_logs
drop policy if exists "geo_logs_select" on inspection_geo_logs;
create policy "geo_logs_select" on inspection_geo_logs
  for select using (
    current_user_is_global_admin()
    or specialist_id = auth.uid()
    or (current_role_is_admin() and tenant_id = current_user_tenant_id())
  );

drop policy if exists "geo_logs_insert" on inspection_geo_logs;
create policy "geo_logs_insert" on inspection_geo_logs
  for insert with check (
    current_user_is_global_admin()
    or specialist_id = auth.uid()
    or (current_role_is_admin() and tenant_id = current_user_tenant_id())
  );

-- specialist_payouts
drop policy if exists "payouts_select" on specialist_payouts;
create policy "payouts_select" on specialist_payouts
  for select using (
    current_user_is_global_admin()
    or specialist_id = auth.uid()
    or (current_role_is_admin() and tenant_id = current_user_tenant_id())
  );

drop policy if exists "payouts_admin_write" on specialist_payouts;
create policy "payouts_admin_write" on specialist_payouts
  for all using (
    current_user_is_global_admin()
    or (current_role_is_admin() and tenant_id = current_user_tenant_id())
  ) with check (
    current_user_is_global_admin()
    or (current_role_is_admin() and tenant_id = current_user_tenant_id())
  );

-- tenants
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

-- profiles: everyone can read their own row; admins can read/write their tenant's rows; global admins see all
drop policy if exists "profiles_select_own_or_admin" on profiles;
create policy "profiles_select_own_or_admin" on profiles
  for select using (
    id = auth.uid()
    or current_user_is_global_admin()
    or (
      current_role_is_admin()
      and (
        tenant_id = current_user_tenant_id()
        or is_contractor = true
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

-- checklist_templates: readable by any authenticated user (global or within tenant)
drop policy if exists "templates_select_all" on checklist_templates;
create policy "templates_select_all" on checklist_templates
  for select using (
    auth.uid() is not null
    and (
      tenant_id is null
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

drop policy if exists "template_items_select_all" on checklist_template_items;
create policy "template_items_select_all" on checklist_template_items
  for select using (auth.uid() is not null);

drop policy if exists "template_items_admin_write" on checklist_template_items;
create policy "template_items_admin_write" on checklist_template_items
  for all using (current_role_is_admin()) with check (current_role_is_admin());

-- properties: scoped to tenant admin, global admin, or assigned specialist
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

drop policy if exists "properties_admin_write" on properties;
create policy "properties_admin_write" on properties
  for all using (
    current_user_is_global_admin()
    or (current_role_is_admin() and tenant_id = current_user_tenant_id())
  ) with check (
    current_user_is_global_admin()
    or (current_role_is_admin() and tenant_id = current_user_tenant_id())
  );

-- property_specialist_assignments
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

-- schedule_dismissals: readable by any authenticated user, admin-managed
drop policy if exists "schedule_dismissals_select" on schedule_dismissals;
create policy "schedule_dismissals_select" on schedule_dismissals
  for select using (auth.uid() is not null);

drop policy if exists "schedule_dismissals_admin_write" on schedule_dismissals;
create policy "schedule_dismissals_admin_write" on schedule_dismissals
  for all using (current_role_is_admin()) with check (current_role_is_admin());

-- inspections: admins see/manage tenant's all; global admin sees all; inspectors see/update only their own
drop policy if exists "inspections_select" on inspections;
create policy "inspections_select" on inspections
  for select using (
    inspector_id = auth.uid()
    or current_user_is_global_admin()
    or (current_role_is_admin() and tenant_id = current_user_tenant_id())
  );

drop policy if exists "inspections_admin_insert" on inspections;
create policy "inspections_admin_insert" on inspections
  for insert with check (
    current_user_is_global_admin()
    or (current_role_is_admin() and tenant_id = current_user_tenant_id())
  );

drop policy if exists "inspections_admin_delete" on inspections;
create policy "inspections_admin_delete" on inspections
  for delete using (
    current_user_is_global_admin()
    or (current_role_is_admin() and tenant_id = current_user_tenant_id())
  );

drop policy if exists "inspections_update" on inspections;
create policy "inspections_update" on inspections
  for update using (
    (
      inspector_id = auth.uid()
      or current_user_is_global_admin()
      or (current_role_is_admin() and tenant_id = current_user_tenant_id())
    )
    and status <> 'completed'
    and (status <> 'cancelled' or current_role_is_admin())
  )
  with check (
    (
      inspector_id = auth.uid()
      or current_user_is_global_admin()
      or (current_role_is_admin() and tenant_id = current_user_tenant_id())
    )
    and status <> 'completed'
    and (status <> 'cancelled' or current_role_is_admin())
  );

-- inspection_items: visible/editable only through owning inspection
drop policy if exists "inspection_items_select" on inspection_items;
create policy "inspection_items_select" on inspection_items
  for select using (
    exists (
      select 1 from inspections i
      where i.id = inspection_items.inspection_id
        and (
          i.inspector_id = auth.uid()
          or current_user_is_global_admin()
          or (current_role_is_admin() and i.tenant_id = current_user_tenant_id())
        )
    )
  );

drop policy if exists "inspection_items_insert" on inspection_items;
create policy "inspection_items_insert" on inspection_items
  for insert with check (
    current_role_is_admin()
    and exists (
      select 1 from inspections i
      where i.id = inspection_items.inspection_id
        and i.status not in ('completed', 'cancelled')
    )
  );

drop policy if exists "inspection_items_update" on inspection_items;
create policy "inspection_items_update" on inspection_items
  for update using (
    exists (
      select 1 from inspections i
      where i.id = inspection_items.inspection_id
        and (
          i.inspector_id = auth.uid()
          or current_user_is_global_admin()
          or (current_role_is_admin() and i.tenant_id = current_user_tenant_id())
        )
        and i.status not in ('completed', 'cancelled')
    )
  ) with check (
    exists (
      select 1 from inspections i
      where i.id = inspection_items.inspection_id
        and (
          i.inspector_id = auth.uid()
          or current_user_is_global_admin()
          or (current_role_is_admin() and i.tenant_id = current_user_tenant_id())
        )
        and i.status not in ('completed', 'cancelled')
    )
  );

-- ============================================================
-- New auth user -> profile row (defaults to inspector; promote admins manually)
-- ============================================================

create or replace function handle_new_user()
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Specialists may edit their OWN profile (address/phone/ID docs) but not their
-- role/human_id/email/tenant_id — those privileged columns are reset for non-admins by
-- the guard trigger, so the own-row policy can't be used to self-escalate.
drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own" on profiles
  for update using (id = auth.uid())
  with check (id = auth.uid());

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

  if not public.current_role_is_admin() then
    new.role := old.role;
    new.human_id := old.human_id;
    new.email := old.email;
    new.id := old.id;
    new.tenant_id := old.tenant_id;
    new.is_global_admin := old.is_global_admin;
    new.is_contractor := old.is_contractor;
    new.status := old.status;
    new.must_reset_password := old.must_reset_password;
  elsif not public.current_user_is_global_admin() then
    new.is_global_admin := old.is_global_admin;
    new.tenant_id := old.tenant_id;
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

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

drop policy if exists "photos_read" on storage.objects;
create policy "photos_read" on storage.objects
  for select using (
    bucket_id = 'photos'
    and (
      current_role_is_admin()
      or exists (
        select 1 from inspections i
        where i.id::text = (storage.foldername(name))[1]
          and i.inspector_id = auth.uid()
      )
    )
  );

drop policy if exists "photos_write" on storage.objects;
create policy "photos_write" on storage.objects
  for insert with check (
    bucket_id = 'photos'
    and exists (
      select 1 from inspections i
      where i.id::text = (storage.foldername(name))[1]
        and (i.inspector_id = auth.uid() or current_role_is_admin())
        and i.status not in ('completed', 'cancelled')
    )
  );

drop policy if exists "photos_update" on storage.objects;
create policy "photos_update" on storage.objects
  for update using (
    bucket_id = 'photos'
    and exists (
      select 1 from inspections i
      where i.id::text = (storage.foldername(name))[1]
        and (i.inspector_id = auth.uid() or current_role_is_admin())
        and i.status not in ('completed', 'cancelled')
    )
  );

drop policy if exists "reports_read" on storage.objects;
create policy "reports_read" on storage.objects
  for select using (
    bucket_id = 'reports'
    and (
      current_role_is_admin()
      or exists (
        select 1 from inspections i
        where i.id::text = split_part(storage.objects.name, '.', 1)
          and i.inspector_id = auth.uid()
      )
    )
  );

drop policy if exists "reports_write" on storage.objects;
create policy "reports_write" on storage.objects
  for all using (bucket_id = 'reports' and current_role_is_admin())
  with check (bucket_id = 'reports' and current_role_is_admin());

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

-- ============================================================
-- 7. Specialist RAG Knowledge Base & Embeddings
-- ============================================================

create extension if not exists vector;

create table if not exists specialist_knowledge_base (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  question text not null unique,
  content text not null,
  keywords text[] not null default '{}'::text[],
  embedding vector(1536),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists specialist_knowledge_base_embedding_idx 
  on specialist_knowledge_base 
  using hnsw (embedding vector_cosine_ops);

create index if not exists specialist_knowledge_base_category_idx 
  on specialist_knowledge_base (category);

alter table specialist_knowledge_base enable row level security;

drop policy if exists "specialist_knowledge_base_select_all" on specialist_knowledge_base;
create policy "specialist_knowledge_base_select_all"
  on specialist_knowledge_base
  for select
  to authenticated
  using (true);

drop policy if exists "specialist_knowledge_base_admin_write" on specialist_knowledge_base;
create policy "specialist_knowledge_base_admin_write"
  on specialist_knowledge_base
  for all
  to authenticated
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  );

create or replace function match_knowledge_base (
  query_embedding vector(1536),
  match_threshold float default 0.35,
  match_count int default 4
)
returns table (
  id uuid,
  category text,
  question text,
  content text,
  similarity float
)
language sql stable
as $$
  select
    id,
    category,
    question,
    content,
    1 - (specialist_knowledge_base.embedding <=> query_embedding) as similarity
  from specialist_knowledge_base
  where specialist_knowledge_base.embedding is not null
    and 1 - (specialist_knowledge_base.embedding <=> query_embedding) > match_threshold
  order by specialist_knowledge_base.embedding <=> query_embedding
  limit match_count;
$$;
