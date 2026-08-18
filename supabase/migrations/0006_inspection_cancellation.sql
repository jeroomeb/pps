-- 0006_inspection_cancellation.sql
-- Admins can now CANCEL a scheduled/in-progress inspection instead of only
-- deleting a completed report. Cancelling is a soft state change, not a
-- delete: inspections are an audit record, so who cancelled it, when, and why
-- all survive. Apply AFTER 0005 on the live (existing) database.
-- schema.sql has been updated to match for fresh installs.
-- Idempotent — safe to re-run.

-- ============================================================
-- 'cancelled' status + the cancellation audit columns
-- ============================================================
alter table inspections drop constraint if exists inspections_status_check;
alter table inspections add constraint inspections_status_check
  check (status in ('pending', 'in_progress', 'completed', 'cancelled'));

alter table inspections add column if not exists cancelled_at timestamptz;
alter table inspections add column if not exists cancelled_by uuid
  references profiles (id) on delete set null;
alter table inspections add column if not exists cancellation_reason text;

-- ============================================================
-- inspections_update: allow the transition INTO 'cancelled', then freeze.
--
-- ⚠️ The obvious version of this is wrong. 0004 correctly made `with check`
-- carry the same guard as `using`, but `with check` is evaluated against the
-- NEW row — so a blanket `status not in ('completed','cancelled')` would
-- reject the cancel write itself (it is, by definition, producing a cancelled
-- row) and the status would silently never change. The guard has to be
-- role-aware instead:
--
--   using       (OLD row) — a cancelled inspection is editable only by an
--                           admin, which is what makes "restore" possible;
--                           the assigned specialist is locked out.
--   with check  (NEW row) — only an admin can produce a cancelled row.
--
-- `status <> 'completed'` stays absolute on both sides: completed inspections
-- are frozen for everyone, and nothing may move INTO completed through the
-- user-scoped client (the submit pipeline runs on the service role and
-- bypasses RLS entirely, so it is unaffected).
-- ============================================================
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

-- ============================================================
-- inspection_items: a cancelled inspection's answers freeze exactly like a
-- completed one's. No `with check` trap here — these policies test the PARENT
-- inspection's status, which an item write never changes.
-- ============================================================
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
-- photos bucket: no new evidence may be written to a cancelled inspection
-- (0004 scoped these to the owning inspection's inspector-or-admin and
-- guarded on completed; cancelled gets the same treatment). Reads are left
-- as they are so an admin can still review what was captured before the
-- cancellation.
-- ============================================================
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

create index if not exists inspections_status_idx on inspections (status);
