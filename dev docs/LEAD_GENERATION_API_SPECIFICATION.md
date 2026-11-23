# Lead Generation Engine — API & Data Architecture Specification

**Service Name:** Amenity Op's Growth & Outreach Subsystem  
**Security Classification:** Confidential / Admin-Only / Isolated Schema  
**Target Environments:** Local Development / Hostinger VPS Coolify Production  
**Date:** November 2026  

---

## 1. Architectural Principles

1. **Strict Production Isolation:**
   - Growth tables are prefixed with `growth_` (`growth_leads`, `growth_outreach_logs`, `growth_ai_drafts`).
   - Tables do not foreign-key into core `properties`, `inspections`, or `checklists` to eliminate cascade risks or transaction contention.
2. **Strict RLS Security:**
   - Only authenticated users with role `admin` or `is_global_admin = true` may query or mutate `growth_*` tables.
   - Anonymous access is strictly prohibited.
3. **Data Immutability & Auditing:**
   - Every lead update increments `updated_at`.
   - All email outreach events are logged immutably in `growth_outreach_logs`.

---

## 2. Database Schema (PostgreSQL / Supabase)

### 2.1 Table: `growth_leads`
Stores qualifying properties, decision-maker contacts, intent signals, and sequence status.

```sql
create table if not exists public.growth_leads (
  id uuid primary key default gen_random_uuid(),
  
  -- The 9 Standard Client Fields
  property_name text not null,
  community_type text not null, -- 'motel' | 'student_housing' | 'luxury_multifamily' | 'active_adult_55_plus' | 'commercial_multitenant' | 'regional_portfolio' | 'other'
  address text not null,
  municipality_town text not null,
  county text not null,
  key_amenities_notes text,
  target_gatekeeper_name text,
  target_gatekeeper_title text,
  phone text,
  email text,
  
  -- Intent Scoring & Prioritization
  intent_tier integer not null default 3 check (intent_tier between 1 and 5),
  intent_signals jsonb not null default '[]'::jsonb, -- e.g. [{"source": "indeed", "type": "job_post", "signal": "Night Manager hiring"}]
  
  -- Lifecycle & Outreach Status
  outreach_status text not null default 'new' check (
    outreach_status in ('new', 'enriched', 'in_sequence', 'replied', 'demo_scheduled', 'disqualified', 'opt_out')
  ),
  current_sequence_step integer not null default 0 check (current_sequence_step between 0 and 4),
  last_contacted_at timestamptz,
  next_touch_due_at timestamptz,
  
  -- Metadata & Auditing
  source text not null default 'manual', -- 'manual' | 'indeed_scraper' | 'municipal_violation' | 'student_portal' | 'csv_import'
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Optimized Performance Indexes
create index if not exists growth_leads_intent_tier_idx on public.growth_leads (intent_tier);
create index if not exists growth_leads_community_type_idx on public.growth_leads (community_type);
create index if not exists growth_leads_outreach_status_idx on public.growth_leads (outreach_status);
create index if not exists growth_leads_county_idx on public.growth_leads (county);
create index if not exists growth_leads_created_at_idx on public.growth_leads (created_at desc);
```

### 2.2 Table: `growth_outreach_logs`
Tracks each dispatched communication and sequence event.

```sql
create table if not exists public.growth_outreach_logs (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.growth_leads(id) on delete cascade,
  sequence_step integer not null check (sequence_step between 1 and 4),
  channel text not null default 'email', -- 'email' | 'phone' | 'linkedin'
  sender_inbox text not null,
  recipient_email text not null,
  subject text not null,
  message_preview text,
  status text not null default 'sent', -- 'sent' | 'delivered' | 'opened' | 'clicked' | 'replied' | 'bounced' | 'failed'
  sent_at timestamptz not null default now()
);

create index if not exists growth_outreach_logs_lead_id_idx on public.growth_outreach_logs (lead_id);
create index if not exists growth_outreach_logs_sent_at_idx on public.growth_outreach_logs (sent_at desc);
```

### 2.3 Table: `growth_ai_drafts`
Stores inbound prospect replies and AI-generated draft responses awaiting human operator approval.

```sql
create table if not exists public.growth_ai_drafts (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.growth_leads(id) on delete cascade,
  inbound_email text not null,
  inbound_subject text not null,
  inbound_body text not null,
  classified_intent text not null, -- 'wants_demo' | 'pricing_request' | 'how_it_works' | 'referral' | 'not_interested' | 'opt_out' | 'unknown'
  suggested_draft_reply text not null,
  status text not null default 'pending_review', -- 'pending_review' | 'approved' | 'rejected' | 'dispatched'
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists growth_ai_drafts_status_idx on public.growth_ai_drafts (status);
```

---

## 3. Server Actions & Services API

### 3.1 `getGrowthLeads(filters: LeadFilterParams): Promise<LeadQueryResult>`
Queries leads with server-side pagination, sorting, and multi-faceted filtering.

```typescript
export interface LeadFilterParams {
  search?: string
  communityType?: CommunityType | 'all'
  intentTier?: number | 'all'
  outreachStatus?: OutreachStatus | 'all'
  county?: string
  page?: number
  pageSize?: number
  sortBy?: 'created_at' | 'intent_tier' | 'property_name'
  sortDirection?: 'asc' | 'desc'
}
```

### 3.2 `getGrowthLeadStats(): Promise<LeadStatsSummary>`
Returns aggregate metrics for dashboard stat cards:
* `totalLeads`: Total count of discovered properties.
* `tier1ActivePain`: Count of Tier 1 properties with high overnight operational pain.
* `verifiedContacts`: Count of leads with both email and direct phone.
* `inSequence`: Leads currently active in the 4-touch cadence.
* `demoScheduled`: Converted prospects.

### 3.3 `exportGrowthLeads(format: 'xlsx' | 'csv', filters?: LeadFilterParams): Promise<Buffer>`
Generates a downloadable buffer in Excel (`.xlsx`) or Comma-Separated (`.csv`) format with auto-formatted column headers, sanitized cell values, and standard MIME types.

---

## 4. HTTP API Endpoints

### 4.1 Export Stream: `GET /api/admin/leads/export`
* **Query Parameters:**
  * `format`: `'xlsx'` | `'csv'` (default: `'xlsx'`)
  * `communityType`: Optional filter
  * `intentTier`: Optional filter
  * `outreachStatus`: Optional filter
  * `search`: Optional search query
* **Response Headers:**
  * `Content-Type`: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (for xlsx) or `text/csv; charset=utf-8` (for csv)
  * `Content-Disposition`: `attachment; filename="amenityops-leads-2026-11-22.xlsx"`
* **Security:** Verifies Admin/Global Admin session cookie via Supabase SSR. Unauthenticated requests return `401 Unauthorized`.

---

## 5. Standard Scraped 9-Field Mapping Guide

| Column # | Internal Key | Display Header | CSV Header | Example Data |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `property_name` | Property Name | Property Name | "The Grandview At Bayonne" |
| 2 | `community_type` | Community / Property Type | Community Type | "Luxury Multi-Family" |
| 3 | `address` | Street Address | Address | "1200 Avenue E" |
| 4 | `municipality_town` | Municipality / Town | Municipality | "Bayonne" |
| 5 | `county` | County | County | "Hudson" |
| 6 | `key_amenities_notes` | Key Amenities / Notes | Key Amenities / Notes | "Gated garage, 24/7 fitness, rooftop pool. Recent night noise complaints." |
| 7 | `target_gatekeeper_name` / `target_gatekeeper_title` | Decision Maker | Target Contact | "Marcus Vance (General Manager)" |
| 8 | `phone` | Phone Number | Phone | "(201) 555-0199" |
| 9 | `email` | Email Address | Email | "mvance@grandviewnj.com" |

---

## 6. Phase 2 Scraper Ingestion & Intent Engine Modules

### 6.1 `calculateIntentTier(propertyType, notes, rawSignals): ScoredIntentResult`
* Evaluates keyword dictionaries for active hiring (`Night Manager`, `Auditor`, `Closer`), negative review pain triggers (`broken gate`, `morning trash`, `unattended desk`), and municipal code violations.
* Assigns Intent Priority Tier 1 through 5, generates structured `intent_signals: IntentSignal[]`, and calculates normalized `intentScore` (100–500).

### 6.2 `sanitizePhoneNumber(phone: string): string | null`
* Normalizes US phone numbers into clean `(XXX) XXX-XXXX` format, stripping extraneous characters and leading trunk prefixes.

### 6.3 `validateEmail(email: string): { isValid, isCorporate, domain }`
* Validates RFC regex syntax and checks domain against free consumer webmail providers (`gmail`, `yahoo`, `hotmail`, `outlook`, etc.) to flag corporate decision-maker domains.

### 6.4 `suggestGatekeeperTitle(communityType: CommunityType, currentTitle?: string): string`
* Maps standard operational decision-maker titles matching the asset class:
  * Student Housing $\rightarrow$ *Community Director*
  * Motel $\rightarrow$ *Owner & Managing Operator*
  * Luxury Multi-Family $\rightarrow$ *Director of Property Management*
  * 55+ Active Adult $\rightarrow$ *HOA General Manager*
  * Commercial Multi-Tenant $\rightarrow$ *Facilities & Asset Director*

### 6.5 `batchImportLeads(records: RawLeadCsvRow[]): Promise<{ importedCount, duplicateCount, leads }>`
* Deduplicates against existing leads using composite key `normalizePropertyKey(property_name, address)`.
* Runs Intent Scorer and contact sanitizers on incoming rows.
* Persists to `growth_leads` and revalidates `/admin/leads`.

### 6.6 `runScraperPipeline(params: { communityType?, county?, limit? }): Promise<{ newLeads, duplicateCount }>`
* Simulates automated multi-source scraping for target counties and classes.
* Enriches candidates and inserts newly qualified assets into the lead database.

---

## 7. Phase 3 Outbound Sequencer & Recruitment Pipeline

### 7.1 Cadence Schedule & Auto-Halt Architecture
* **Sending Window:** Strictly enforced Tuesday through Thursday between 9:30 AM and 11:30 AM local time.
* **Volume Throttling:** 50 emails/day maximum per sending inbox across 5 isolated secondary domains (`getamenityops.com`, `amenityopshq.com`, etc.).
* **Auto-Halt Guarantee:** Inbound replies, demo requests, or unsubscribe requests immediately and irreversibly transition the lead to `replied` or `opt_out`, halting all subsequent cadence steps.

### 7.2 4-Touch B2B Email Cadence
* **Touch 1 (Day 1):** *Overnight Uncertainty* — Asks permission to share a 5-minute self-paced demo video.
* **Touch 2 (Day 4):** *Morning Handoff Reports* — Focuses on eliminating the "morning surprise" via morning reports before coffee; invites reply "demo".
* **Touch 3 (Day 8):** *In-House Staff Empowerment* — Explains mobile checklists for existing on-site staff without contracting expensive third-party security vendors.
* **Touch 4 (Day 14):** *Polite Break-Up* — Closes the proactive sequence gracefully, leaving the demo video link for future reference.

### 7.3 Operations Specialist Recruitment Pipeline
* Sourced from LinkedIn Boolean and Indeed Operations pools.
* Positioned strictly as **Technology-Enabled Operations Inspections** (never as stationary security guards).
* 2-touch recruitment sequence evaluating off-hours tenure and checklist literacy.



