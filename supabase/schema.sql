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
  required_schedule jsonb not null default '[]'::jsonb
);

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
  email_error text
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
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
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
alter table schedule_dismissals enable row level security;

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

-- properties: readable by admins, or by inspectors assigned an inspection at
-- that property (not every property — that leaked every property's private
-- email/phone/notes to every specialist). Writable by admins only.
drop policy if exists "properties_select_all" on properties;
create policy "properties_select_all" on properties
  for select using (
    current_role_is_admin()
    or exists (
      select 1 from inspections i
      where i.property_id = properties.id and i.inspector_id = auth.uid()
    )
  );

drop policy if exists "properties_admin_write" on properties;
create policy "properties_admin_write" on properties
  for all using (current_role_is_admin()) with check (current_role_is_admin());

-- schedule_dismissals: readable by any authenticated user, admin-managed
drop policy if exists "schedule_dismissals_select" on schedule_dismissals;
create policy "schedule_dismissals_select" on schedule_dismissals
  for select using (auth.uid() is not null);

drop policy if exists "schedule_dismissals_admin_write" on schedule_dismissals;
create policy "schedule_dismissals_admin_write" on schedule_dismissals
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
-- `with check` carries the same `status <> 'completed'` guard as `using` —
-- omitting it let a row be updated INTO `completed` with none of the app's
-- validation via a direct PostgREST call.
--
-- ⚠️ The cancelled guard is deliberately role-aware, not a blanket
-- `status not in ('completed','cancelled')`. `with check` is evaluated
-- against the NEW row, so a blanket guard would reject the cancel write
-- itself (it is by definition producing a cancelled row) and the status
-- would silently never change. Instead:
--   using      (OLD row) — a cancelled inspection is editable only by an
--                          admin, which is what makes "restore" possible.
--   with check (NEW row) — only an admin can produce a cancelled row.
drop policy if exists "inspections_update" on inspections;
create policy "inspections_update" on inspections
  for update using (
    (inspector_id = auth.uid() or current_role_is_admin())
    and status <> 'completed'
    and (status <> 'cancelled' or current_role_is_admin())
  )
  with check (
    (inspector_id = auth.uid() or current_role_is_admin())
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
        and (i.inspector_id = auth.uid() or current_role_is_admin())
    )
  );

-- Insert is admin-only (despite the old policy's name, it also granted the
-- assigned inspector insert with no completed-status guard — forged rows
-- could be added to a completed inspection). Only createInspection ever
-- inserts items, and it's an admin-only server action on the user-scoped
-- client, so this doesn't touch app behavior.
drop policy if exists "inspection_items_admin_insert" on inspection_items;
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
        and (i.inspector_id = auth.uid() or current_role_is_admin())
        and i.status not in ('completed', 'cancelled')
    )
  ) with check (
    exists (
      select 1 from inspections i
      where i.id = inspection_items.inspection_id
        and (i.inspector_id = auth.uid() or current_role_is_admin())
        and i.status not in ('completed', 'cancelled')
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
set search_path = ''
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

-- Exempts the service role: triggers always fire regardless of the calling
-- role, and a service-role request has no auth.uid(), so
-- current_role_is_admin() reads false for it — this trigger was silently
-- reverting the role/human_id that createTeamMember's admin-client writes
-- set on new admin accounts. Service-role writes are already fully trusted
-- (they run our own server code, gated by requireRole('admin') beforehand).
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
  -- Explicitly schema-qualified: this function's own `search_path = ''`
  -- means an unqualified call here would fail to resolve.
  if not public.current_role_is_admin() then
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

-- Photo objects live under `${inspectionId}/...` — scope read/write to the
-- owning inspection's assigned inspector (or an admin), not every
-- authenticated user, so one specialist can't read or overwrite another's
-- evidence photos (including on a completed/frozen inspection).
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

-- Report objects are named `${inspectionId}.pdf` (no folder) — scope reads to
-- the same inspector-or-admin rule instead of every authenticated user.
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
