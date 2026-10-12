export const RISK_DOMAINS = ['life_safety', 'appearance', 'asset_protection'] as const

export type RiskDomain = (typeof RISK_DOMAINS)[number]

export const RISK_DOMAIN_LABELS: Record<RiskDomain, string> = {
  life_safety: 'Life-safety and liability',
  appearance: 'Appearance and city rules',
  asset_protection: 'Asset protection',
}

export const RISK_DOMAIN_WEIGHT: Record<RiskDomain, number> = {
  life_safety: 3,
  appearance: 1,
  asset_protection: 2,
}

const LIFE_SAFETY = /\b(gate|fire|egress|exit|lock|latch|alarm|sprinkler|extinguisher|smoke)\b/i
const APPEARANCE = /\b(trash|waste|dumpster|curb|litter|debris|landscap)/i
const ASSET = /\b(valve|leak|pipe|parcel|temperature|thermal|hvac|water)\b/i

export function isRiskDomain(value: unknown): value is RiskDomain {
  return typeof value === 'string' && (RISK_DOMAINS as readonly string[]).includes(value)
}

/** Life-safety wins when the text matches more than one area. Null means "not scored". */
export function inferRiskDomain(...parts: (string | null | undefined)[]): RiskDomain | null {
  const text = parts.filter((part): part is string => Boolean(part && part.trim())).join(' ')
  if (!text) return null
  if (LIFE_SAFETY.test(text)) return 'life_safety'
  if (APPEARANCE.test(text)) return 'appearance'
  if (ASSET.test(text)) return 'asset_protection'
  return null
}
