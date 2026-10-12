-- Nightly risk score. Idempotent.
-- Tags checklist questions, stores one score per property per local evening,
-- and freezes that score on the inspection when the visit is opened.

alter table public.checklist_template_items
  add column if not exists risk_domain text
    check (risk_domain in ('life_safety', 'appearance', 'asset_protection'));

alter table public.inspection_items
  add column if not exists risk_domain text
    check (risk_domain in ('life_safety', 'appearance', 'asset_protection'));

alter table public.properties
  add column if not exists timezone text not null default 'America/New_York';

alter table public.inspections
  add column if not exists predicted_score integer
    check (predicted_score is null or predicted_score between 1 and 100),
  add column if not exists predicted_flags jsonb,
  add column if not exists predicted_summary text,
  add column if not exists predicted_local_date date;

create table if not exists public.property_risk_scores (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  local_date date not null,
  score integer not null check (score between 1 and 100),
  flags jsonb not null default '[]'::jsonb,
  summary text not null default '',
  weather text,
  calculated_at timestamptz not null default now(),
  unique (property_id, local_date)
);

create index if not exists property_risk_scores_property_date_idx
  on public.property_risk_scores (property_id, local_date desc);

-- Keyword backfill. Life-safety wins when a question matches more than one area.
update public.checklist_template_items
set risk_domain = case
  when item_name ilike any (array['%gate%','%fire%','%egress%','%exit%','%lock%','%latch%','%alarm%','%sprinkler%','%extinguisher%','%smoke%'])
    or coalesce(description, '') ilike any (array['%gate%','%fire%','%egress%','%exit%','%lock%','%latch%','%alarm%','%sprinkler%','%extinguisher%','%smoke%'])
    or service_category ilike any (array['%gate%','%fire%','%egress%','%exit%','%lock%','%latch%','%alarm%','%sprinkler%','%extinguisher%','%smoke%'])
  then 'life_safety'
  when item_name ilike any (array['%trash%','%waste%','%dumpster%','%curb%','%litter%','%debris%','%landscap%'])
    or coalesce(description, '') ilike any (array['%trash%','%waste%','%dumpster%','%curb%','%litter%','%debris%','%landscap%'])
    or service_category ilike any (array['%trash%','%waste%','%dumpster%','%curb%','%litter%','%debris%','%landscap%'])
  then 'appearance'
  when item_name ilike any (array['%valve%','%leak%','%pipe%','%parcel%','%temperature%','%thermal%','%hvac%','%water%'])
    or coalesce(description, '') ilike any (array['%valve%','%leak%','%pipe%','%parcel%','%temperature%','%thermal%','%hvac%','%water%'])
    or service_category ilike any (array['%valve%','%leak%','%pipe%','%parcel%','%temperature%','%thermal%','%hvac%','%water%'])
  then 'asset_protection'
  else risk_domain
end
where risk_domain is null;

update public.inspection_items ii
set risk_domain = ti.risk_domain
from public.checklist_template_items ti
where ii.template_item_id = ti.id
  and ii.risk_domain is null
  and ti.risk_domain is not null;

alter table public.property_risk_scores enable row level security;

drop policy if exists "property_risk_scores_select" on public.property_risk_scores;
create policy "property_risk_scores_select" on public.property_risk_scores
  for select using (
    exists (
      select 1 from public.properties p
      where p.id = property_risk_scores.property_id
        and (
          current_user_is_global_admin()
          or (
            p.tenant_id = current_user_tenant_id()
            and (
              current_role_is_admin()
              or exists (
                select 1 from public.property_specialist_assignments psa
                where psa.property_id = p.id and psa.specialist_id = auth.uid()
              )
              or exists (
                select 1 from public.inspections i
                where i.property_id = p.id and i.inspector_id = auth.uid()
              )
            )
          )
        )
    )
  );
