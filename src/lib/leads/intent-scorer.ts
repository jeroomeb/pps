import type { CommunityType, IntentTier, IntentSignal } from '@/types/growth-leads'

/**
 * Keyword dictionaries calibrated for active overnight operational pain
 */
const NIGHT_HIRING_TRIGGERS = [
  'night manager',
  'night auditor',
  'overnight operations',
  'front desk closer',
  'night clerk',
  'overnight resident specialist',
  'graveyard shift',
  'night audit',
  '3rd shift',
  'overnight coverage',
]

const NEGATIVE_REVIEW_TRIGGERS = [
  'broken gate',
  'gate broken',
  'unattended desk',
  'unattended lobby',
  'morning trash',
  'trash piled up',
  'night noise',
  'loud partying',
  'exterior door unlocked',
  'dark parking',
  'no security',
  'unresponsive at night',
  'pool open after hours',
]

const MUNICIPAL_VIOLATION_TRIGGERS = [
  'lighting citation',
  'code violation',
  'fire door obstruction',
  'trash storage penalty',
  'exterior corridor fine',
  'township notice',
  'building department violation',
]

export interface ScoredIntentResult {
  tier: IntentTier
  signals: IntentSignal[]
  intentScore: number // 100 to 500 scale
  primaryTrigger: string
}

/**
 * Evaluates raw property notes, scraped reviews, and hiring posts to determine
 * the 5-Tier Intent Priority and extract structured intent signals.
 */
export function calculateIntentTier(
  propertyType: CommunityType,
  notes: string = '',
  rawSignals: Array<{ source: string; text: string }> = []
): ScoredIntentResult {
  const combinedText = (
    notes +
    ' ' +
    rawSignals.map((s) => s.text).join(' ')
  ).toLowerCase()

  const detectedSignals: IntentSignal[] = []
  let score = 200 // baseline Tier 3

  // 1. Scan for Tier 1: Active Pain (Hiring posts or negative off-hours reviews)
  let foundTier1 = false
  for (const trigger of NIGHT_HIRING_TRIGGERS) {
    if (combinedText.includes(trigger)) {
      foundTier1 = true
      score = Math.max(score, 450)
      detectedSignals.push({
        source: 'indeed_ziprecruiter',
        type: 'job_opening',
        note: `Active hiring posting detected for "${trigger}"`,
        detected_at: new Date().toISOString(),
      })
      break
    }
  }

  for (const trigger of NEGATIVE_REVIEW_TRIGGERS) {
    if (combinedText.includes(trigger)) {
      foundTier1 = true
      score = Math.max(score, 480)
      detectedSignals.push({
        source: 'google_reviews',
        type: 'complaint_signal',
        note: `Repeated tenant/guest complaint citing "${trigger}"`,
        detected_at: new Date().toISOString(),
      })
      break
    }
  }

  // 2. Scan for Tier 2: Municipal Violations / Code Enforcement
  let foundTier2 = false
  for (const trigger of MUNICIPAL_VIOLATION_TRIGGERS) {
    if (combinedText.includes(trigger)) {
      foundTier2 = true
      score = Math.max(score, 380)
      detectedSignals.push({
        source: 'municipal_code_enforcement',
        type: 'citation',
        note: `Official municipal notice or citation: "${trigger}"`,
        detected_at: new Date().toISOString(),
      })
      break
    }
  }

  // 3. Category-specific baseline calibrations
  if (!foundTier1 && !foundTier2) {
    if (propertyType === 'student_housing' || propertyType === 'motel') {
      score = 300
      detectedSignals.push({
        source: 'targeted_portal',
        type: 'asset_profile',
        note: `High off-hours risk inherent to ${propertyType.replace('_', ' ')} operations`,
        detected_at: new Date().toISOString(),
      })
    } else if (propertyType === 'regional_portfolio' || propertyType === 'commercial_multitenant') {
      score = 250
      detectedSignals.push({
        source: 'commercial_cre_registry',
        type: 'portfolio_asset',
        note: 'Multi-tenant commercial asset requiring centralized operations handoff',
        detected_at: new Date().toISOString(),
      })
    } else {
      score = 200
    }
  }

  // Resolve final tier from score
  let tier: IntentTier = 3
  if (score >= 400 || foundTier1) {
    tier = 1
  } else if (score >= 350 || foundTier2) {
    tier = 2
  } else if (score >= 280) {
    tier = 3
  } else if (score >= 230) {
    tier = 4
  } else {
    tier = 5
  }

  const primaryTrigger =
    detectedSignals.length > 0 ? detectedSignals[0].note : 'General asset category qualification'

  return {
    tier,
    signals: detectedSignals,
    intentScore: score,
    primaryTrigger,
  }
}

