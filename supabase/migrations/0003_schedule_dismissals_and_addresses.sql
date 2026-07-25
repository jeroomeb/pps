-- 0003_schedule_dismissals_and_addresses.sql
-- Session 9 punch list: overdue-schedule dismissals + structured addresses.
-- Apply AFTER 0002_amenity_punchlist.sql on the live (existing) database.
-- schema.sql has been updated to match for fresh installs.
-- Idempotent — safe to re-run.

-- ============================================================
-- Structured addresses on properties AND profiles.
--
-- `address` is KEPT and becomes a DERIVED single-line display value
-- composed from street/city/state/zip on every write (see
-- src/lib/address.ts composeAddress). The PDF, report screen and both
-- email templates all read `address`, so they keep working untouched.
-- `county` is deliberately NOT part of the composed line — it is routing
-- metadata used for proximity matching and filtering only.
-- ============================================================
alter table properties add column if not exists street text;
alter table properties add column if not exists city text;
alter table properties add column if not exists state text;
alter table properties add column if not exists zip text;
alter table properties add column if not exists county text;

alter table profiles add column if not exists street text;
alter table profiles add column if not exists city text;
alter table profiles add column if not exists state text;
alter table profiles add column if not exists zip text;
alter table profiles add column if not exists county text;

-- Backfill: preserve whatever free-text address already exists by moving it
-- into `street`. Admins refine it into the proper parts from the UI.
update properties
  set street = address
  where street is null and address is not null and address <> '';

update profiles
  set street = address
  where street is null and address is not null and address <> '';

-- Filter/matching indexes.
create index if not exists properties_state_idx on properties (state);
create index if not exists properties_county_idx on properties (county);
create index if not exists properties_zip_idx on properties (zip);
create index if not exists profiles_state_idx on profiles (state);
create index if not exists profiles_county_idx on profiles (county);
create index if not exists profiles_zip_idx on profiles (zip);

-- ============================================================
-- schedule_dismissals: an admin can dismiss a missed/overdue required
-- inspection day so it stops surfacing on the dashboard. One row per
-- (property, calendar day) — deleting the row restores the reminder.
-- ============================================================
create table if not exists schedule_dismissals (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties (id) on delete cascade,
  occurrence_date date not null,
  dismissed_by uuid references profiles (id) on delete set null,
  dismissed_at timestamptz not null default now(),
  unique (property_id, occurrence_date)
);

create index if not exists schedule_dismissals_property_id_idx
  on schedule_dismissals (property_id);

alter table schedule_dismissals enable row level security;

-- Readable by any authenticated user (the dashboard query runs as the
-- signed-in admin); only admins may create or clear a dismissal.
drop policy if exists "schedule_dismissals_select" on schedule_dismissals;
create policy "schedule_dismissals_select" on schedule_dismissals
  for select using (auth.uid() is not null);

drop policy if exists "schedule_dismissals_admin_write" on schedule_dismissals;
create policy "schedule_dismissals_admin_write" on schedule_dismissals
  for all using (current_role_is_admin()) with check (current_role_is_admin());

-- ============================================================
-- guard_profile_self_update (from 0002) must also protect the new
-- address columns? No — specialists SHOULD be able to edit their own
-- address parts (that's the point of the self-service profile page).
-- The existing guard only pins role/human_id/email/id, which is still
-- correct, so it is intentionally left unchanged here.
-- ============================================================
