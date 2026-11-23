import type {
  GrowthLead,
  EmailTemplateStep,
  OutreachPerformanceMetrics,
  SpecialistCandidate,
} from '@/types/growth-leads'

/**
 * 4–5 Dedicated Secondary Sending Domains
 * Protects amenityops.app primary domain reputation
 */
export const SECONDARY_SENDING_DOMAINS = [
  'getamenityops.com',
  'amenityopshq.com',
  'useamenityops.com',
  'tryamenityops.com',
  'amenityops.co',
]

/**
 * The 4-Touch Automated B2B Sales Sequence Cadence (Tue-Thu mid-morning delivery)
 */
export const B2B_SEQUENCE_TEMPLATES: EmailTemplateStep[] = [
  {
    step: 1,
    dayInterval: 1,
    focus: 'Overnight Uncertainty & Morning Visibility',
    subjectTemplate: 'Quick question regarding overnight operations at {{propertyName}}',
    bodyTemplate: `Hi {{contactFirstName}},

Noticed your team manages {{propertyName}} in {{municipality}}. 

Most property operators we speak with face the same off-hours uncertainty: relying on handwritten log books, manual keys, or hoping nothing critical went unmonitored overnight until morning staff arrives to a surprise.

Amenity Op's is a modern digital operations checklist system built specifically for overnight shifts. Your on-site staff completes geo-verified walkthroughs on their phone, automatically generating a verified morning hand-off report delivered to your inbox before your first cup of coffee.

Would you be open to a 5-minute self-paced demo video showing how other {{communityType}} properties in {{county}} County are using this?

Best regards,
The Amenity Op's Team`,
  },
  {
    step: 2,
    dayInterval: 4,
    focus: 'Eliminating the Morning Surprise',
    subjectTemplate: 'Re: overnight operations at {{propertyName}}',
    bodyTemplate: `Hi {{contactFirstName}},

Following up on my note regarding {{propertyName}}.

The primary reason operators switch to Amenity Op's is eliminating the "morning surprise"—whether that's an unlatched security gate, unmonitored night noise, or a trash room violation that could lead to municipal fines.

With our mobile app, your existing team audits every key amenity checklist item, with photo proof and timestamp telemetry.

If you'd like to see a brief 5-minute preview of the morning hand-off report, just reply "demo" and I'll send the link right over.

Best,
The Amenity Op's Team`,
  },
  {
    step: 3,
    dayInterval: 8,
    focus: 'In-House Staff Empowerment (No 3rd-Party Guard Markup)',
    subjectTemplate: 'Empowering {{propertyName}}\'s on-site team without outside vendor markups',
    bodyTemplate: `Hi {{contactFirstName}},

One common concern we hear from property leaders is whether digital overnight auditing requires contracting expensive outside third-party security vendors.

The short answer is no. Amenity Op's is designed to empower your *existing* staff—night auditors, front desk closers, or facilities walkthrough staff—with an intuitive mobile checklist that guarantees accountability without adding outside payroll overhead.

If you have 5 minutes this week, I'd love to share our self-paced walkthrough video.

Best regards,
The Amenity Op's Team`,
  },
  {
    step: 4,
    dayInterval: 14,
    focus: 'Polite Break-Up & Reference Link',
    subjectTemplate: 'Final thought for {{propertyName}}',
    bodyTemplate: `Hi {{contactFirstName}},

I know you have a busy operational schedule managing {{propertyName}}, so I won't continue cluttering your inbox.

If overnight accountability, automated morning handoff reports, or reducing off-hours liability ever becomes a priority down the road, you can review our self-paced demo anytime here:
https://getamenityops.com/demo

Wishing you and the {{propertyName}} team a smooth week ahead.

Sincerely,
The Amenity Op's Team`,
  },
]

/**
 * 2-Touch Operations Specialist Recruitment Cadence
 */
export const SPECIALIST_RECRUITMENT_TEMPLATES: EmailTemplateStep[] = [
  {
    step: 1,
    dayInterval: 1,
    focus: 'Technology-Enabled Operations Inspection Role',
    subjectTemplate: 'Independent Operations Continuity Specialist opportunity (Off-Hours)',
    bodyTemplate: `Hi {{candidateFirstName}},

Came across your strong track record in facilities, building walkthroughs, and off-hours operations in {{location}}.

Amenity Op's is expanding our network of Operations Continuity Specialists. This is an autonomous, technology-enabled inspection role—not a traditional stationary security post.

Specialists perform scheduled, smartphone-guided amenity walkthroughs (verifying access doors, life-safety equipment, and morning readiness) with clear digital checklists and tiered compensation per completed audit.

Are you currently open to flexible, high-trust off-hours inspection assignments in {{location}}?

Best regards,
Specialist Operations | Amenity Op's`,
  },
  {
    step: 2,
    dayInterval: 5,
    focus: 'Availability & Onboarding Follow-Up',
    subjectTemplate: 'Re: Operations Specialist opportunity in {{location}}',
    bodyTemplate: `Hi {{candidateFirstName}},

Reaching back out to see if you had a chance to review my previous message regarding the Operations Continuity Specialist role in {{location}}.

We are finalizing our active specialist roster for the upcoming month. If you are interested in seeing our app walkthrough and tiered compensation matrix, reply with your current availability and we'll send the onboarding overview.

Best,
Specialist Operations | Amenity Op's`,
  },
]

/**
 * Renders an email template with prospect variables
 */
export function renderEmailTemplate(
  template: string,
  lead: GrowthLead
): string {
  const contactName = lead.target_gatekeeper_name?.trim() || 'Property Team'
  const firstName = contactName.split(' ')[0] || 'Property Team'

  return template
    .replace(/{{contactFirstName}}/g, firstName)
    .replace(/{{contactName}}/g, contactName)
    .replace(/{{propertyName}}/g, lead.property_name)
    .replace(/{{municipality}}/g, lead.municipality_town)
    .replace(/{{county}}/g, lead.county)
    .replace(/{{communityType}}/g, lead.community_type.replace(/_/g, ' '))
}

/**
 * Validates whether the current moment falls within the optimal sending window:
 * Tuesday through Thursday between 9:30 AM and 11:30 AM (local time)
 */
export function isSendingWindowOpen(now: Date = new Date()): {
  isOpen: boolean
  dayName: string
  windowStatus: string
} {
  const day = now.getDay() // 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat
  const hour = now.getHours()
  const minute = now.getMinutes()
  const totalMinutes = hour * 60 + minute

  const isTueThu = day >= 2 && day <= 4 // Tue, Wed, Thu
  const isMidMorning = totalMinutes >= 9 * 60 + 30 && totalMinutes <= 11 * 60 + 30

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const dayName = dayNames[day]

  if (!isTueThu) {
    return {
      isOpen: false,
      dayName,
      windowStatus: `Paused (Outbound schedules run Tue–Thu mid-morning; today is ${dayName})`,
    }
  }

  if (!isMidMorning) {
    return {
      isOpen: false,
      dayName,
      windowStatus: 'Paused (Queued for 9:30 AM – 11:30 AM mid-morning window)',
    }
  }

  return {
    isOpen: true,
    dayName,
    windowStatus: 'Active Sending Window (Tuesday–Thursday mid-morning delivery)',
  }
}

/**
 * Calculates next touch date based on step day interval
 */
export function getNextTouchDate(step: number, baseDate: Date = new Date()): Date {
  const template = B2B_SEQUENCE_TEMPLATES.find((t) => t.step === step)
  const daysToAdd = template ? template.dayInterval : 3
  const target = new Date(baseDate.getTime() + daysToAdd * 86400000)

  // Ensure next touch falls on Tue, Wed, or Thu
  const day = target.getDay()
  if (day === 5) target.setDate(target.getDate() + 4) // Friday -> Tuesday
  else if (day === 6) target.setDate(target.getDate() + 3) // Saturday -> Tuesday
  else if (day === 0) target.setDate(target.getDate() + 2) // Sunday -> Tuesday
  else if (day === 1) target.setDate(target.getDate() + 1) // Monday -> Tuesday

  return target
}

/**
 * Returns mock performance metrics for the sequencing engine
 */
export function getOutreachMetricsSnapshot(): OutreachPerformanceMetrics {
  return {
    activeInboxes: 10,
    dailyQuotaPerInbox: 50,
    dailyTotalSent: 48,
    openRatePercent: 44.8,
    replyRatePercent: 12.4,
    autoHaltsCount: 6,
    secondaryDomains: SECONDARY_SENDING_DOMAINS,
  }
}

/**
 * Default seeded Operations Specialist candidates for Phase 3 recruitment pipeline
 */
export const SEED_SPECIALIST_CANDIDATES: SpecialistCandidate[] = [
  {
    id: 'cand-001',
    full_name: 'Darius Thorne',
    location: 'New Brunswick / Middlesex County, NJ',
    target_role: 'Operations Continuity Specialist',
    experience_years: 4,
    autonomous_off_hours_tenure: true,
    checklist_literacy: true,
    recruitment_step: 1,
    status: 'touch_1_sent',
    email: 'darius.thorne.ops@outlook.com',
    phone: '(732) 555-0891',
    notes: 'Ex-facilities lead at logistics center; documented 3 years overnight walkthrough tenure.',
  },
  {
    id: 'cand-002',
    full_name: 'Elena Rostova',
    location: 'Jersey City / Hudson County, NJ',
    target_role: 'Operations Continuity Specialist',
    experience_years: 5,
    autonomous_off_hours_tenure: true,
    checklist_literacy: true,
    recruitment_step: 2,
    status: 'touch_2_sent',
    email: 'elena.rostova.compliance@gmail.com',
    phone: '(201) 555-0342',
    notes: 'Prior property tech auditor; familiar with high-rise life safety checklists and key log audits.',
  },
  {
    id: 'cand-003',
    full_name: 'Marcus Sterling',
    location: 'Toms River / Ocean County, NJ',
    target_role: 'Senior Inspection Specialist',
    experience_years: 6,
    autonomous_off_hours_tenure: true,
    checklist_literacy: true,
    recruitment_step: 0,
    status: 'sourced',
    email: 'm.sterling.ops@gmail.com',
    phone: '(732) 555-0619',
    notes: 'Sourced from LinkedIn Boolean search; extensive night audit and perimeter check background.',
  },
  {
    id: 'cand-004',
    full_name: 'Aisha Washington',
    location: 'Newark / Essex County, NJ',
    target_role: 'Operations Continuity Specialist',
    experience_years: 3,
    autonomous_off_hours_tenure: true,
    checklist_literacy: true,
    recruitment_step: 2,
    status: 'interview_scheduled',
    email: 'awashington.audits@yahoo.com',
    phone: '(973) 555-0177',
    notes: 'Responded to Touch 2 asking for onboarding walkthrough link. Scheduled for verification review.',
  },
]

