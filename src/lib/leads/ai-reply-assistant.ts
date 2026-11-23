import type { GrowthLead, GrowthAiDraft } from '@/types/growth-leads'

export type ClassifiedIntent =
  | 'wants_demo'
  | 'pricing_request'
  | 'how_it_works'
  | 'referral'
  | 'not_interested'
  | 'opt_out'
  | 'specialist_applicant'
  | 'noise_filtered'

export interface IntentAnalysisResult {
  intent: ClassifiedIntent
  confidence: number
  isNoise: boolean // true for OOO, bounce, autoresponder
  summary: string
  suggestedDraft: string
}

/**
 * Noise filter triggers for bounces, out-of-office (OOO), and spam
 */
const NOISE_PATTERNS = [
  'out of office',
  'automatic reply',
  'auto-reply',
  'autoreply',
  'away from the office',
  'delivery status notification',
  'mail delivery failed',
  'mailer-daemon',
  'undeliverable',
  'vacation notice',
  'i am currently out',
]

/**
 * High-precision keyword classifiers for prospect intent
 */
const INTENT_RULES: Array<{
  intent: ClassifiedIntent
  keywords: string[]
  draftTemplate: (lead: GrowthLead, inboundText: string) => string
}> = [
  {
    intent: 'wants_demo',
    keywords: [
      'demo',
      'send the video',
      'send video',
      'send demo',
      'send link',
      'show me',
      'interested in seeing',
      'send me more info',
      'love to see',
      'share the link',
    ],
    draftTemplate: (lead) => {
      const name = lead.target_gatekeeper_name?.split(' ')[0] || 'there'
      return `Hi ${name},

Thanks for getting back to me! 

Here is the 5-minute self-paced demo video showing how our overnight checklist and automated morning hand-off reports work:
https://getamenityops.com/demo

It walks through the mobile auditor interface, photo verification, and how other ${lead.community_type.replace(/_/g, ' ')} properties in ${lead.county} County use it to eliminate morning surprises.

Take a look when convenient, and let me know if any questions pop up.

Best regards,
The Amenity Op's Team`
    },
  },
  {
    intent: 'pricing_request',
    keywords: ['cost', 'pricing', 'price', 'rate', 'how much', 'quote', 'subscription', 'monthly fee'],
    draftTemplate: (lead) => {
      const name = lead.target_gatekeeper_name?.split(' ')[0] || 'there'
      return `Hi ${name},

Thanks for asking! Our pricing is structured simply on a per-property monthly basis, with no outside hardware requirements—your team uses their existing mobile devices.

For a property like ${lead.property_name}, plans typically range depending on audit frequency and checklist customization. 

Would you have 10 minutes next Tuesday or Wednesday for a quick look at your specific checklist needs so I can give you an exact monthly figure?

Best,
The Amenity Op's Team`
    },
  },
  {
    intent: 'how_it_works',
    keywords: [
      'how does it work',
      'app require',
      'hardware',
      'devices',
      'smartphones',
      'on-site',
      'existing staff',
      'gps',
      'training',
    ],
    draftTemplate: (lead) => {
      const name = lead.target_gatekeeper_name?.split(' ')[0] || 'there'
      return `Hi ${name},

Great question. Amenity Op's works directly on any standard iOS or Android smartphone—no specialized beacons, scanners, or hardware needed.

Your existing overnight team (night auditors, front desk closers, or facilities staff) opens the app, follows the step-by-step audit walkthrough, and captures required photo proof with GPS timestamp telemetry. As soon as the walkthrough is completed, an executive morning handoff report is automatically formatted and delivered to your inbox.

Would you like to see a sample morning report for ${lead.property_name}?

Best regards,
The Amenity Op's Team`
    },
  },
  {
    intent: 'referral',
    keywords: [
      'reach out to',
      'speak with',
      'talk to',
      'contact my colleague',
      'forwarding to',
      'best person is',
      'handles this',
    ],
    draftTemplate: (lead) => {
      const name = lead.target_gatekeeper_name?.split(' ')[0] || 'there'
      return `Hi ${name},

Thank you very much for connecting me with the right contact for ${lead.property_name}!

I will reach out to them directly and reference that you recommended we connect. 

Appreciate your assistance.

Best regards,
The Amenity Op's Team`
    },
  },
  {
    intent: 'opt_out',
    keywords: ['unsubscribe', 'remove me', 'stop', 'take me off', 'do not contact', 'unsub', 'remove'],
    draftTemplate: (lead) => {
      const name = lead.target_gatekeeper_name?.split(' ')[0] || 'there'
      return `Hi ${name},

Understood. You have been completely removed from our list and will not receive any further communications regarding ${lead.property_name}.

Thank you for your time.

Best regards,
The Amenity Op's Team`
    },
  },
  {
    intent: 'not_interested',
    keywords: ['not interested', 'no thanks', 'not right now', 'pass', 'all set', 'we already have'],
    draftTemplate: (lead) => {
      const name = lead.target_gatekeeper_name?.split(' ')[0] || 'there'
      return `Hi ${name},

Totally understand. Thanks for letting me know!

I'll close your file on our end so we don't bother you. If anything changes down the road with overnight visibility at ${lead.property_name}, feel free to reach back out anytime.

Best,
The Amenity Op's Team`
    },
  },
]

/**
 * Classifies an inbound email body and generates a tailored, policy-compliant draft
 */
export function analyzeInboundEmail(
  inboundText: string,
  lead: GrowthLead
): IntentAnalysisResult {
  const lower = inboundText.toLowerCase()

  // 1. Noise check (OOO / Bounces)
  for (const pattern of NOISE_PATTERNS) {
    if (lower.includes(pattern)) {
      return {
        intent: 'noise_filtered',
        confidence: 0.98,
        isNoise: true,
        summary: 'Out-of-office autoreply or bounce notification filtered out.',
        suggestedDraft: '',
      }
    }
  }

  // 2. Rule-based intent matching
  for (const rule of INTENT_RULES) {
    for (const kw of rule.keywords) {
      if (lower.includes(kw)) {
        return {
          intent: rule.intent,
          confidence: 0.92,
          isNoise: false,
          summary: `Prospect expressed intent: "${rule.intent.replace(/_/g, ' ')}" (Trigger: "${kw}")`,
          suggestedDraft: rule.draftTemplate(lead, inboundText),
        }
      }
    }
  }

  // 3. Fallback general response
  const name = lead.target_gatekeeper_name?.split(' ')[0] || 'there'
  return {
    intent: 'wants_demo',
    confidence: 0.75,
    isNoise: false,
    summary: 'General prospect reply requiring review.',
    suggestedDraft: `Hi ${name},

Thanks for following up! 

Would you like me to share a 5-minute self-paced demo video showing how our overnight checklist platform works for ${lead.property_name}?

Best regards,
The Amenity Op's Team`,
  }
}

/**
 * Default seeded AI drafts for Phase 4 human-in-the-loop review queue
 */
export const SEED_AI_DRAFTS: GrowthAiDraft[] = [
  {
    id: 'draft-seed-001',
    lead_id: 'seed-lead-001',
    inbound_email: 'jmatthews@thecollegiatenb.com',
    inbound_subject: 'Re: Quick question regarding overnight operations at The Collegiate At Rutgers',
    inbound_body:
      'Hey, saw your note about the overnight reports. We actually had some gate issues last weekend. Can you send over that 5-minute demo video you mentioned?',
    classified_intent: 'wants_demo',
    suggested_draft_reply: `Hi Jordan,

Thanks for getting back to me! 

Here is the 5-minute self-paced demo video showing how our overnight checklist and automated morning hand-off reports work:
https://getamenityops.com/demo

It specifically shows how student housing properties verify exterior security gates and common areas, with instant morning photos.

Take a look when you have a free moment, and let me know if any questions pop up.

Best regards,
The Amenity Op's Team`,
    status: 'pending_review',
    reviewed_by: null,
    reviewed_at: null,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'draft-seed-002',
    lead_id: 'seed-lead-005',
    inbound_email: 'sjenkins@metrocplaza.com',
    inbound_subject: 'Re: Empowering Metropolitan Corporate Plaza\'s on-site team without outside vendor markups',
    inbound_body:
      'We are currently looking at our off-hours mechanical and security contracts. What does pricing look like for an office complex of 240,000 sq ft?',
    classified_intent: 'pricing_request',
    suggested_draft_reply: `Hi Sandra,

Thanks for reaching out! Our pricing is structured simply on a per-property monthly basis, with no outside hardware or security patrol markups—your team conducts the audits using their mobile phones.

For a 240,000 sq. ft. multi-tenant asset like Metropolitan Corporate Plaza, monthly plans depend on checklist audit scope and tenant handoff frequency.

Would you have 10 minutes next Tuesday or Wednesday for a quick discussion so I can provide an exact monthly figure?

Best,
The Amenity Op's Team`,
    status: 'pending_review',
    reviewed_by: null,
    reviewed_at: null,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
]

