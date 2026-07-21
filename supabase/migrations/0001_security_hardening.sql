-- Migration 0001 — security hardening (2026-07-17 audit)
-- Run once in the Supabase SQL editor on the EXISTING project.
-- (Fresh installs get all of this from schema.sql; this file only exists
-- because `create table if not exists` in schema.sql won't alter live tables.)
--
-- ALSO REQUIRED, in the Supabase dashboard (not SQL):
--   Authentication → Sign In / Up → disable "Allow new users to sign up".
--   Team members are created from /admin/team via the Auth Admin API, which
--   still works with public signups disabled.

-- 1) Never trust client-supplied signup metadata for the role.
--    Previously anyone could sign up with user_metadata { role: 'admin' }.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    'inspector'
  );
  return new;
end;
$$;

-- 2) Freeze completed inspections: the emailed report is the record of truth.
drop policy if exists "inspections_update" on inspections;
create policy "inspections_update" on inspections
  for update using (
    (inspector_id = auth.uid() or current_role_is_admin())
    and status <> 'completed'
  )
  with check (inspector_id = auth.uid() or current_role_is_admin());

drop policy if exists "inspection_items_update" on inspection_items;
create policy "inspection_items_update" on inspection_items
  for update using (
    exists (
      select 1 from inspections i
      where i.id = inspection_items.inspection_id
        and (i.inspector_id = auth.uid() or current_role_is_admin())
        and i.status <> 'completed'
    )
  ) with check (
    exists (
      select 1 from inspections i
      where i.id = inspection_items.inspection_id
        and (i.inspector_id = auth.uid() or current_role_is_admin())
        and i.status <> 'completed'
    )
  );

-- 3) A checklist item can only exist once per inspection.
alter table inspection_items
  add constraint inspection_items_inspection_template_item_key
  unique (inspection_id, template_item_id);

-- 4) Missing FK indexes.
create index if not exists inspections_template_id_idx on inspections (template_id);
create index if not exists inspection_items_template_item_id_idx on inspection_items (template_item_id);
