import type { GrowthLead, CommunityType } from '@/types/growth-leads'
import { calculateIntentTier } from './intent-scorer'
import { sanitizePhoneNumber, suggestGatekeeperTitle, normalizePropertyKey } from './contact-enricher'

export interface ScraperDiscoveryPoolItem {
  property_name: string
  community_type: CommunityType
  address: string
  municipality_town: string
  county: string
  key_amenities_notes: string
  target_gatekeeper_name: string
  target_gatekeeper_title: string
  phone: string
  email: string
  source: string
}

/**
 * High-fidelity catalog of realistic target properties matching the 5 asset classes
 * across key regional corridors (Rutgers/Rowan student hubs, Shoreline motels, Gold Coast towers)
 */
export const DISCOVERY_CATALOG: ScraperDiscoveryPoolItem[] = [
  // 1. Off-Campus Student Housing
  {
    property_name: 'The Standard At New Brunswick',
    community_type: 'student_housing',
    address: '90 New Street',
    municipality_town: 'New Brunswick',
    county: 'Middlesex',
    key_amenities_notes:
      '21-story student high-rise near Rutgers campus. Rooftop pool, 24/7 computer lounge, clubhouse. Google reviews highlight night noise, broken garage gate, and unmonitored night hours.',
    target_gatekeeper_name: 'Marcus Brody',
    target_gatekeeper_title: 'Community Director',
    phone: '(732) 555-0182',
    email: 'mbrody@standardnb.com',
    source: 'student_portal',
  },
  {
    property_name: 'Rowan Boulevard Student Commons',
    community_type: 'student_housing',
    address: '220 Rowan Boulevard',
    municipality_town: 'Glassboro',
    county: 'Gloucester',
    key_amenities_notes:
      '560-bed off-campus apartment community. Active hiring posting on Indeed for Weekend Night Resident Advisor / Front Desk Closer.',
    target_gatekeeper_name: 'Alicia Ramos',
    target_gatekeeper_title: 'General Manager',
    phone: '(856) 555-0371',
    email: 'aramos@rowancommons.com',
    source: 'indeed_ziprecruiter',
  },
  {
    property_name: 'Montclair Station Student Lofts',
    community_type: 'student_housing',
    address: '350 Valley Road',
    municipality_town: 'Montclair',
    county: 'Essex',
    key_amenities_notes:
      'Student lofts adjacent to Montclair State. Study pods, fitness suite. Recent resident complaints regarding morning trash piled up in corridors.',
    target_gatekeeper_name: 'Derek Chen',
    target_gatekeeper_title: 'Property Director',
    phone: '(973) 555-0429',
    email: 'dchen@montclairlofts.com',
    source: 'google_reviews',
  },

  // 2. Motels & Boutique Hospitality
  {
    property_name: 'Atlantic Sands Motor Inn',
    community_type: 'motel',
    address: '1105 Ocean Avenue',
    municipality_town: 'Point Pleasant Beach',
    county: 'Ocean',
    key_amenities_notes:
      '52-room independent motel with exterior corridors, unattended night lobby, and outdoor pool. Active Indeed post for Night Auditor 11pm-7am.',
    target_gatekeeper_name: 'Sanjay Gupta',
    target_gatekeeper_title: 'Owner & Managing Operator',
    phone: '(732) 555-0914',
    email: 'sgupta@atlanticsandsinn.com',
    source: 'indeed_ziprecruiter',
  },
  {
    property_name: 'Seaside Driftwood Motel',
    community_type: 'motel',
    address: '614 Boulevard',
    municipality_town: 'Seaside Heights',
    county: 'Ocean',
    key_amenities_notes:
      '40-room seasonal and extended-stay motel. Notice from borough code enforcement regarding exterior lighting compliance 60 days ago.',
    target_gatekeeper_name: 'Karen Miller',
    target_gatekeeper_title: 'General Manager',
    phone: '(732) 555-0633',
    email: 'kmiller@driftwoodseaside.com',
    source: 'municipal_code_enforcement',
  },
  {
    property_name: 'Route 1 Travelers Lodge',
    community_type: 'motel',
    address: '2800 US Highway 1',
    municipality_town: 'Lawrenceville',
    county: 'Mercer',
    key_amenities_notes:
      'Highway commercial motel with 68 rooms. Unmonitored night hours, frequent front desk turnover, manual night log books.',
    target_gatekeeper_name: 'Amitabh Sharma',
    target_gatekeeper_title: 'Managing Partner',
    phone: '(609) 555-0275',
    email: 'asharma@route1travelers.com',
    source: 'hospitality_registry',
  },

  // 3. 55+ Active Adult & Senior Living
  {
    property_name: 'Clearbrook Active Adult Village',
    community_type: 'active_adult_55_plus',
    address: '1 Clearbrook Drive',
    municipality_town: 'Monroe Township',
    county: 'Middlesex',
    key_amenities_notes:
      'Gated senior community with 2,000+ homes, 25,000 sq ft cultural center, medical clinic, 2 pools. High overnight emergency route and exterior gate audit requirements.',
    target_gatekeeper_name: 'Raymond Douglas',
    target_gatekeeper_title: 'HOA Executive Director',
    phone: '(609) 555-0844',
    email: 'rdouglas@clearbrookhoa.org',
    source: 'senior_housing_registry',
  },
  {
    property_name: 'Renaissance At Manchester',
    community_type: 'active_adult_55_plus',
    address: '100 Renaissance Boulevard',
    municipality_town: 'Manchester',
    county: 'Ocean',
    key_amenities_notes:
      'Gated 55+ active community with 18-hole golf course, indoor pool, gatehouse. Looking to replace physical guard patrol with digital verified reporting.',
    target_gatekeeper_name: 'Patricia Flynn',
    target_gatekeeper_title: 'Community General Manager',
    phone: '(732) 555-0551',
    email: 'pflynn@renaissancemanchester.com',
    source: 'senior_housing_registry',
  },

  // 4. Luxury Multi-Family High-Rises
  {
    property_name: 'The Ellipse Luxury High-Rise',
    community_type: 'luxury_multifamily',
    address: '25 14th Street',
    municipality_town: 'Jersey City',
    county: 'Hudson',
    key_amenities_notes:
      '43-story waterfront tower with 381 ultra-luxury apartments, multi-level garage, pool deck, wine vault. Class A morning hand-off audit required.',
    target_gatekeeper_name: 'Julian Henderson',
    target_gatekeeper_title: 'Director of Property Operations',
    phone: '(201) 555-0762',
    email: 'jhenderson@ellipsejc.com',
    source: 'luxury_cre_directory',
  },
  {
    property_name: 'Harbor 1500 Luxury Waterfront',
    community_type: 'luxury_multifamily',
    address: '1500 Harbor Boulevard',
    municipality_town: 'Weehawken',
    county: 'Hudson',
    key_amenities_notes:
      'Waterfront luxury pier complex. Infinity pool, rooftop screening cinema, 24/7 concierge. Reviews cite broken parking arm gate after hours.',
    target_gatekeeper_name: 'Valerie Cross',
    target_gatekeeper_title: 'General Manager',
    phone: '(201) 555-0193',
    email: 'vcross@harbor1500.com',
    source: 'google_reviews',
  },

  // 5. Commercial Multi-Tenant Office Plazas
  {
    property_name: 'Woodbridge Corporate Center',
    community_type: 'commercial_multitenant',
    address: '581 Main Street',
    municipality_town: 'Woodbridge',
    county: 'Middlesex',
    key_amenities_notes:
      '300,000 sq ft multi-tenant corporate office building with 12 corporate tenants. After-hours compliance audits for lighting, HVAC, and fire door security.',
    target_gatekeeper_name: 'Leonard Hayes',
    target_gatekeeper_title: 'Facilities & Asset Director',
    phone: '(732) 555-0839',
    email: 'lhayes@woodbridgecorp.com',
    source: 'commercial_cre_directory',
  },
  {
    property_name: 'Mack-Cali Business Park',
    community_type: 'commercial_multitenant',
    address: '100 Campus Drive',
    municipality_town: 'Florham Park',
    county: 'Morris',
    key_amenities_notes:
      'Class A suburban office park with 4 buildings. Reviewing nighttime mechanical and lock-up vendor agreements.',
    target_gatekeeper_name: 'Robert Thorne',
    target_gatekeeper_title: 'Director of Facilities Management',
    phone: '(973) 555-0922',
    email: 'rthorne@mackcalibiz.com',
    source: 'commercial_cre_directory',
  },
]

/**
 * Runs the scraper discovery simulation, scoring each candidate with the Intent Engine
 * and deduplicating against currently existing leads.
 */
export function discoverPropertiesFromCatalog(
  existingLeads: GrowthLead[],
  filters?: { communityType?: CommunityType; county?: string; limit?: number }
): { newLeads: GrowthLead[]; duplicateCount: number } {
  const existingKeys = new Set(
    existingLeads.map((l) => normalizePropertyKey(l.property_name, l.address))
  )

  let candidates = [...DISCOVERY_CATALOG]

  if (filters?.communityType && filters.communityType !== ('all' as unknown)) {
    candidates = candidates.filter((c) => c.community_type === filters.communityType)
  }
  if (filters?.county && filters.county !== 'all') {
    candidates = candidates.filter((c) =>
      c.county.toLowerCase().includes(filters.county!.toLowerCase())
    )
  }

  const newLeads: GrowthLead[] = []
  let duplicateCount = 0

  for (const item of candidates) {
    const key = normalizePropertyKey(item.property_name, item.address)
    if (existingKeys.has(key)) {
      duplicateCount++
      continue
    }

    // Run 5-Tier Intent Scorer
    const scored = calculateIntentTier(item.community_type, item.key_amenities_notes)

    // Sanitize contact info
    const cleanPhone = sanitizePhoneNumber(item.phone)
    const suggestedTitle = suggestGatekeeperTitle(item.community_type, item.target_gatekeeper_title)

    const nowIso = new Date().toISOString()
    const lead: GrowthLead = {
      id: `discovered-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      property_name: item.property_name,
      community_type: item.community_type,
      address: item.address,
      municipality_town: item.municipality_town,
      county: item.county,
      key_amenities_notes: item.key_amenities_notes,
      target_gatekeeper_name: item.target_gatekeeper_name,
      target_gatekeeper_title: suggestedTitle,
      phone: cleanPhone,
      email: item.email,
      intent_tier: scored.tier,
      intent_signals: scored.signals,
      outreach_status: 'new',
      current_sequence_step: 0,
      last_contacted_at: null,
      next_touch_due_at: null,
      source: item.source,
      metadata: { intentScore: scored.intentScore },
      created_at: nowIso,
      updated_at: nowIso,
    }

    newLeads.push(lead)
    existingKeys.add(key)

    if (filters?.limit && newLeads.length >= filters.limit) {
      break
    }
  }

  return { newLeads, duplicateCount }
}

