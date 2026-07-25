-- 0004_email_status_and_rls_hardening.sql
-- Client-audit fixes: track report-email delivery so a Resend failure is
-- visible instead of a 5-second toast, and close several RLS/storage gaps
-- found in an internal security review. Apply AFTER 0003 on the live
-- (existing) database. schema.sql has been updated to match for fresh installs.
-- Idempotent — safe to re-run.

-- ============================================================
-- Email delivery status — surfaced on the Reports list instead of only a
-- toast the specialist may have already dismissed.
-- ============================================================
alter table inspections add column if not exists email_status text
  check (email_status in ('sent', 'failed'));
alter table inspections add column if not exists email_error text;

-- ============================================================
-- inspections_update: the `with check` was weaker than `using`, so an
-- inspector could UPDATE their own row (e.g. via a direct PostgREST call)
-- into `status = 'completed'` with none of the app's validation, or rewrite
-- `pdf_path`/`scheduled_for`/`property_id` on a still-open inspection. Both
-- clauses must carry the same guard.
-- ============================================================
drop policy if exists "inspections_update" on inspections;
create policy "inspections_update" on inspections
  for update using (
    (inspector_id = auth.uid() or current_role_is_admin())
    and status <> 'completed'
  )
  with check (
    (inspector_id = auth.uid() or current_role_is_admin())
    and status <> 'completed'
  );

-- ============================================================
-- inspection_items insert: despite its name, "inspection_items_admin_insert"
-- granted insert to the assigned inspector too, with no completed-status
-- guard — so an inspector could insert forged rows into their own inspection,
-- including one already completed. Only createInspection (an admin-only
-- server action, run on the user-scoped client) ever inserts items, so this
-- can be tightened to admin-only without touching app code.
-- ============================================================
drop policy if exists "inspection_items_admin_insert" on inspection_items;
drop policy if exists "inspection_items_insert" on inspection_items;
create policy "inspection_items_insert" on inspection_items
  for insert with check (
    current_role_is_admin()
    and exists (
      select 1 from inspections i
      where i.id = inspection_items.inspection_id and i.status <> 'completed'
    )
  );

-- ============================================================
-- properties_select_all let any authenticated specialist read every
-- property's email/phone/notes, not just the ones they're assigned to.
-- ============================================================
drop policy if exists "properties_select_all" on properties;
create policy "properties_select_all" on properties
  for select using (
    current_role_is_admin()
    or exists (
      select 1 from inspections i
      where i.property_id = properties.id and i.inspector_id = auth.uid()
    )
  );

-- ============================================================
-- Storage: photos and reports were readable/writable by ANY authenticated
-- user, not just the owning inspection's assignee. Scope both to the
-- inspection's inspector-or-admin, matching the `documents` bucket's
-- already-correct per-owner scoping.
-- ============================================================
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
        and i.status <> 'completed'
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
        and i.status <> 'completed'
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

-- ============================================================
-- Pin search_path on every SECURITY DEFINER function so a session-local
-- temp relation can never shadow `profiles` inside them (Supabase's
-- `function_search_path_mutable` lint). Not exploitable today (PostgREST
-- exposes no DDL to callers), but cheap to close.
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

-- Also exempts the service role: this trigger previously fired for
-- `createTeamMember`'s admin-client writes too (triggers always run,
-- regardless of the connection's role), and since a service-role request has
-- no `auth.uid()`, `current_role_is_admin()` evaluated false — silently
-- reverting the `role`/`human_id` that action was setting on new admin
-- accounts. Service-role writes are already fully trusted (they run our own
-- server code, gated by requireRole('admin') before this ever runs).
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
