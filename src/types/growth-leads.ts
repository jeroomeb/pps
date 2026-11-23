import { z } from 'zod'

export type CommunityType =
  | 'student_housing'
  | 'motel'
  | 'luxury_multifamily'
  | 'active_adult_55_plus'
  | 'commercial_multitenant'
  | 'regional_portfolio'
  | 'other'

export type IntentTier = 1 | 2 | 3 | 4 | 5

export type OutreachStatus =
  | 'new'
  | 'enriched'
  | 'in_sequence'
  | 'replied'
  | 'demo_scheduled'
  | 'disqualified'
  | 'opt_out'

export interface IntentSignal {
  source: string
  type: string
  note: string
  detected_at?: string
}

export interface GrowthLead {
  id: string
  // 9 Standard Fields
  property_name: string
  community_type: CommunityType
  address: string
  municipality_town: string
  county: string
  key_amenities_notes: string | null
  target_gatekeeper_name: string | null
  target_gatekeeper_title: string | null
  phone: string | null
  email: string | null

  // Intent & Scoring
  intent_tier: IntentTier
  intent_signals: IntentSignal[]

  // Lifecycle
  outreach_status: OutreachStatus
  current_sequence_step: number
  last_contacted_at: string | null
  next_touch_due_at: string | null

  // Metadata
  source: string
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface GrowthOutreachLog {
  id: string
  lead_id: string
  sequence_step: number
  channel: 'email' | 'phone' | 'linkedin'
  sender_inbox: string
  recipient_email: string
  subject: string
  message_preview: string | null
  status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'replied' | 'bounced' | 'failed'
  sent_at: string
}

export interface GrowthAiDraft {
  id: string
  lead_id: string
  inbound_email: string
  inbound_subject: string
  inbound_body: string
  classified_intent: string
  suggested_draft_reply: string
  status: 'pending_review' | 'approved' | 'rejected' | 'dispatched'
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}

export interface GrowthLeadStats {
  totalLeads: number
  tier1ActivePain: number
  verifiedContacts: number
  inSequence: number
  demoScheduled: number
  motelsCount: number
  studentHousingCount: number
}

export interface LeadFilterState {
  search: string
  communityType: CommunityType | 'all'
  intentTier: IntentTier | 'all'
  outreachStatus: OutreachStatus | 'all'
  county: string | 'all'
  page: number
  pageSize: number
}

// Visual and Semantic Dictionaries
export const COMMUNITY_TYPE_CONFIG: Record<
  CommunityType,
  { label: string; badgeClass: string; description: string }
> = {
  student_housing: {
    label: 'Student Housing',
    badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
    description: 'Off-campus high-density student complexes',
  },
  motel: {
    label: 'Motel & Hospitality',
    badgeClass: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20',
    description: 'Boutique motels & extended-stay properties',
  },
  luxury_multifamily: {
    label: 'Luxury Multi-Family',
    badgeClass: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
    description: 'High-rise residential towers & condominiums',
  },
  active_adult_55_plus: {
    label: '55+ Active Adult',
    badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
    description: 'Senior living and gated adult communities',
  },
  commercial_multitenant: {
    label: 'Commercial Multi-Tenant',
    badgeClass: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/20',
    description: 'Corporate office plazas & multi-tenant complexes',
  },
  regional_portfolio: {
    label: 'Regional Portfolio',
    badgeClass: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20',
    description: 'Multi-asset corporate management firm',
  },
  other: {
    label: 'Other Commercial',
    badgeClass: 'bg-gray-500/10 text-gray-700 dark:text-gray-300 border-gray-500/20',
    description: 'Specialized commercial facility',
  },
}

export const INTENT_TIER_CONFIG: Record<
  IntentTier,
  { label: string; badgeClass: string; description: string }
> = {
  1: {
    label: 'Tier 1 — Active Pain',
    badgeClass: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30 font-semibold',
    description: 'Hiring night managers, repeated overnight complaints/violations',
  },
  2: {
    label: 'Tier 2 — High Risk',
    badgeClass: 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30',
    description: 'Recent municipal code citations or lighting/safety notices',
  },
  3: {
    label: 'Tier 3 — Targeted Portal',
    badgeClass: 'bg-yellow-500/15 text-yellow-800 dark:text-yellow-400 border-yellow-500/30',
    description: 'Direct student housing, motel, or luxury aggregator listing',
  },
  4: {
    label: 'Tier 4 — Enterprise Portfolio',
    badgeClass: 'bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30',
    description: 'Regional Greystar, Lincoln, CBRE, JLL portfolio asset',
  },
  5: {
    label: 'Tier 5 — CRE Verified',
    badgeClass: 'bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-500/30',
    description: 'CoStar / SOS verified structural records and deed transitions',
  },
}

export const OUTREACH_STATUS_CONFIG: Record<
  OutreachStatus,
  { label: string; badgeClass: string }
> = {
  new: {
    label: 'New Discovery',
    badgeClass: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-400/20',
  },
  enriched: {
    label: 'Enriched Contact',
    badgeClass: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-400/20',
  },
  in_sequence: {
    label: 'In 4-Touch Cadence',
    badgeClass: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-400/20',
  },
  replied: {
    label: 'Prospect Replied',
    badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-400/20 font-semibold',
  },
  demo_scheduled: {
    label: 'Demo Scheduled',
    badgeClass: 'bg-green-600/15 text-green-700 dark:text-green-300 border-green-500/30 font-bold',
  },
  disqualified: {
    label: 'Disqualified',
    badgeClass: 'bg-gray-500/10 text-gray-500 border-gray-400/20',
  },
  opt_out: {
    label: 'Opted Out / Unsub',
    badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-400/20',
  },
}

// Zod Validation Schema for Manual Input & Import
export const growthLeadSchema = z.object({
  property_name: z.string().min(2, 'Property name is required'),
  community_type: z.enum([
    'student_housing',
    'motel',
    'luxury_multifamily',
    'active_adult_55_plus',
    'commercial_multitenant',
    'regional_portfolio',
    'other',
  ]),
  address: z.string().min(3, 'Address is required'),
  municipality_town: z.string().min(2, 'City / Municipality is required'),
  county: z.string().min(2, 'County is required'),
  key_amenities_notes: z.string().optional().nullable(),
  target_gatekeeper_name: z.string().optional().nullable(),
  target_gatekeeper_title: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')).nullable(),
  intent_tier: z.number().int().min(1).max(5).default(3),
  outreach_status: z
    .enum(['new', 'enriched', 'in_sequence', 'replied', 'demo_scheduled', 'disqualified', 'opt_out'])
    .default('new'),
})

export type GrowthLeadInput = z.infer<typeof growthLeadSchema>

// Phase 3: Outbound Sequence & Candidate Models
export interface EmailTemplateStep {
  step: number
  dayInterval: number
  focus: string
  subjectTemplate: string
  bodyTemplate: string
}

export interface OutreachPerformanceMetrics {
  activeInboxes: number
  dailyQuotaPerInbox: number
  dailyTotalSent: number
  openRatePercent: number
  replyRatePercent: number
  autoHaltsCount: number
  secondaryDomains: string[]
}

export interface SpecialistCandidate {
  id: string
  full_name: string
  location: string
  target_role: string
  experience_years: number
  autonomous_off_hours_tenure: boolean
  checklist_literacy: boolean
  recruitment_step: number // 0: sourced, 1: touch 1, 2: touch 2
  status: 'sourced' | 'touch_1_sent' | 'touch_2_sent' | 'interview_scheduled' | 'opt_out'
  email: string
  phone: string
  notes: string
}

