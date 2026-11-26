-- Migration: 0021_lead_generation_engine.sql
-- Description: Isolated Autonomous Growth, Lead Discovery, and Outreach Database Schema
-- Modules: B2B Lead Gen (9 Fields), Intent Scoring (Tiers 1-5), Outreach Logs, AI Reply Drafts

-- ============================================================================
-- 1. Table: growth_leads
-- Isolated store for discovered commercial, hospitality, and residential leads
-- ============================================================================
create table if not exists public.growth_leads (
  id uuid primary key default gen_random_uuid(),
  
  -- The 9 Standard Fields requested by client
  property_name text not null,
  community_type text not null default 'luxury_multifamily', -- 'motel', 'student_housing', 'luxury_multifamily', 'active_adult_55_plus', 'commercial_multitenant', 'regional_portfolio'
  address text not null,
  municipality_town text not null,
  state text not null default 'NJ',
  county text not null,
  key_amenities_notes text,
  target_gatekeeper_name text,
  target_gatekeeper_title text,
  phone text,
  email text,
  
  -- Intent Scoring & Prioritization
  intent_tier integer not null default 3 check (intent_tier between 1 and 5),
  intent_signals jsonb not null default '[]'::jsonb,
  
  -- Cadence & Outreach Lifecycle
  outreach_status text not null default 'new' check (
    outreach_status in ('new', 'enriched', 'in_sequence', 'replied', 'demo_scheduled', 'disqualified', 'opt_out')
  ),
  current_sequence_step integer not null default 0 check (current_sequence_step between 0 and 4),
  last_contacted_at timestamptz,
  next_touch_due_at timestamptz,
  
  -- Metadata & Auditing
  source text not null default 'manual',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Safe patch for existing tables: ensure 'state' column exists
alter table if exists public.growth_leads add column if not exists state text not null default 'NJ';

-- High-performance query indexes
create index if not exists growth_leads_intent_tier_idx on public.growth_leads (intent_tier);
create index if not exists growth_leads_community_type_idx on public.growth_leads (community_type);
create index if not exists growth_leads_outreach_status_idx on public.growth_leads (outreach_status);
create index if not exists growth_leads_county_idx on public.growth_leads (county);
create index if not exists growth_leads_created_at_idx on public.growth_leads (created_at desc);

-- ============================================================================
-- 2. Table: growth_outreach_logs
-- Immutable log of all outbound emails, calls, and sequence status changes
-- ============================================================================
create table if not exists public.growth_outreach_logs (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.growth_leads(id) on delete cascade,
  sequence_step integer not null check (sequence_step between 1 and 4),
  channel text not null default 'email',
  sender_inbox text not null,
  recipient_email text not null,
  subject text not null,
  message_preview text,
  status text not null default 'sent' check (
    status in ('sent', 'delivered', 'opened', 'clicked', 'replied', 'bounced', 'failed')
  ),
  sent_at timestamptz not null default now()
);

create index if not exists growth_outreach_logs_lead_id_idx on public.growth_outreach_logs (lead_id);
create index if not exists growth_outreach_logs_sent_at_idx on public.growth_outreach_logs (sent_at desc);

-- ============================================================================
-- 3. Table: growth_ai_drafts
-- Inbound prospect replies & AI-generated contextual draft replies (Human-in-the-Loop)
-- ============================================================================
create table if not exists public.growth_ai_drafts (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.growth_leads(id) on delete cascade,
  inbound_email text not null,
  inbound_subject text not null,
  inbound_body text not null,
  classified_intent text not null default 'unknown',
  suggested_draft_reply text not null,
  status text not null default 'pending_review' check (
    status in ('pending_review', 'approved', 'rejected', 'dispatched')
  ),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists growth_ai_drafts_status_idx on public.growth_ai_drafts (status);
create index if not exists growth_ai_drafts_created_at_idx on public.growth_ai_drafts (created_at desc);

-- ============================================================================
-- 4. Automatic updated_at Trigger
-- ============================================================================
create or replace function public.set_growth_leads_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_growth_leads_updated_at_trigger on public.growth_leads;
create trigger set_growth_leads_updated_at_trigger
  before update on public.growth_leads
  for each row
  execute function public.set_growth_leads_updated_at();

-- ============================================================================
-- 5. Row Level Security (RLS) Policies
-- Strictly locked to Authenticated Admins & Global Admins
-- ============================================================================
alter table public.growth_leads enable row level security;
alter table public.growth_outreach_logs enable row level security;
alter table public.growth_ai_drafts enable row level security;

-- Leads policies
drop policy if exists "Admins can view growth leads" on public.growth_leads;
create policy "Admins can view growth leads"
  on public.growth_leads
  for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and (profiles.role = 'admin' or profiles.is_global_admin = true)
    )
  );

drop policy if exists "Admins can insert growth leads" on public.growth_leads;
create policy "Admins can insert growth leads"
  on public.growth_leads
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and (profiles.role = 'admin' or profiles.is_global_admin = true)
    )
  );

drop policy if exists "Admins can update growth leads" on public.growth_leads;
create policy "Admins can update growth leads"
  on public.growth_leads
  for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and (profiles.role = 'admin' or profiles.is_global_admin = true)
    )
  );

drop policy if exists "Admins can delete growth leads" on public.growth_leads;
create policy "Admins can delete growth leads"
  on public.growth_leads
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and (profiles.role = 'admin' or profiles.is_global_admin = true)
    )
  );

-- Outreach logs policies
drop policy if exists "Admins can manage growth outreach logs" on public.growth_outreach_logs;
create policy "Admins can manage growth outreach logs"
  on public.growth_outreach_logs
  for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and (profiles.role = 'admin' or profiles.is_global_admin = true)
    )
  );

-- AI drafts policies
drop policy if exists "Admins can manage growth ai drafts" on public.growth_ai_drafts;
create policy "Admins can manage growth ai drafts"
  on public.growth_ai_drafts
  for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and (profiles.role = 'admin' or profiles.is_global_admin = true)
    )
  );

-- ============================================================================
-- 6. High-Quality Seed Data (Across all 5 property types including Motels & Student Housing)
-- ============================================================================
insert into public.growth_leads (
  property_name,
  community_type,
  address,
  municipality_town,
  state,
  county,
  key_amenities_notes,
  target_gatekeeper_name,
  target_gatekeeper_title,
  phone,
  email,
  intent_tier,
  intent_signals,
  outreach_status,
  current_sequence_step,
  source
)
values
  (
    'The Collegiate At Rutgers',
    'student_housing',
    '15 College Avenue',
    'New Brunswick',
    'NJ',
    'Middlesex',
    '6-story student complex with rooftop lounge, study rooms, secure bike storage. Active pain: 4 negative Google reviews about night noise and broken security gate; active Indeed listing for Weekend Night Auditor.',
    'Jordan Matthews',
    'Community Director',
    '(732) 555-0142',
    'jmatthews@thecollegiatenb.com',
    1,
    '[{"source": "indeed", "type": "job_opening", "note": "Hiring Night Closer / Security liaison"}, {"source": "google_reviews", "type": "complaint", "note": "Repeated noise complaints and rear fire door left ajar"}]'::jsonb,
    'in_sequence',
    1,
    'student_portal'
  ),
  (
    'Horizon Park Manor (55+ Active Adult)',
    'active_adult_55_plus',
    '4400 Horizon Boulevard',
    'Toms River',
    'NJ',
    'Ocean',
    'Gated 55+ community with 380 homes, central clubhouse, indoor heated pool, tennis courts. High off-hours compliance and emergency access audit requirements.',
    'Eleanor Vance',
    'HOA General Manager',
    '(732) 555-0819',
    'evance@horizonparkhoa.org',
    2,
    '[{"source": "municipal_records", "type": "lighting_audit", "note": "Township exterior lighting compliance notice received 45 days ago"}]'::jsonb,
    'enriched',
    0,
    'senior_housing_registry'
  ),
  (
    'Oceanview Motor Lodge & Suites',
    'motel',
    '910 Ocean Avenue',
    'Asbury Park',
    'NJ',
    'Monmouth',
    '48-room boutique extended-stay motel with exterior corridors, unmonitored night hours, commercial ice machines. Frequent turnover of front desk night clerks.',
    'Rajiv Patel',
    'Owner & Managing Operator',
    '(732) 555-0311',
    'rpatel@oceanviewmotelnj.com',
    1,
    '[{"source": "indeed", "type": "job_opening", "note": "Hiring Night Front Desk Auditor 11pm-7am with immediate start"}]'::jsonb,
    'new',
    0,
    'hospitality_registry'
  ),
  (
    'The Sovereign Luxury Tower',
    'luxury_multifamily',
    '77 Hudson Street',
    'Jersey City',
    'NJ',
    'Hudson',
    '48-story luxury high-rise condominium. 24/7 concierge, underground multi-level parking garage, infinity pool, fitness center, cold storage room.',
    'Christopher Sterling',
    'Director of Property Management',
    '(201) 555-0988',
    'csterling@sovereignjc.com',
    3,
    '[{"source": "apartments_com", "type": "profile", "note": "Class A luxury asset requiring strict overnight common-area walkthroughs"}]'::jsonb,
    'replied',
    2,
    'luxury_cre_directory'
  ),
  (
    'Metropolitan Corporate Plaza',
    'commercial_multitenant',
    '200 Metro Center Boulevard',
    'Edison',
    'NJ',
    'Middlesex',
    '240,000 sq. ft. Class A office complex with 8 corporate tenants. Strict after-hours HVAC checks, lighting shutoffs, and exterior door lock verification.',
    'Sandra Jenkins',
    'Facilities & Asset Director',
    '(732) 555-0624',
    'sjenkins@metrocplaza.com',
    2,
    '[{"source": "linkedin", "type": "org_change", "note": "Promoted new facilities lead; reviewing vendor SLAs"}]'::jsonb,
    'demo_scheduled',
    3,
    'commercial_cre_directory'
  )
on conflict do nothing;

