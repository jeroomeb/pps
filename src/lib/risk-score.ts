import {
  RISK_DOMAINS,
  RISK_DOMAIN_LABELS,
  RISK_DOMAIN_WEIGHT,
  type RiskDomain,
} from './risk-domain'
import {
  WEEKDAY_NAMES,
  addCalendarDays,
  calendarDaysBetween,
  localDateString,
  weekdayIndex,
} from './property-timezones'

export type RiskFlag = {
  domain: RiskDomain
  label: string
  rate: number
}

export type RecurringItem = {
  itemName: string
  domain: RiskDomain
  count: number
}

export type RiskTierId = 1 | 2 | 3 | 4

export type RiskTierInfo = {
  tier: RiskTierId
  name: string
  label: string
  range: [number, number]
  colorHex: string
  textColorHex: string
  bgClass: string
  textClass: string
  borderClass: string
  meaning: string
}

export const RISK_TIERS: Record<RiskTierId, RiskTierInfo> = {
  1: {
    tier: 1,
    name: 'Low Risk',
    label: 'Standard Operations',
    range: [0, 25],
    colorHex: '#10b981',
    textColorHex: '#065f46',
    bgClass: 'bg-emerald-500',
    textClass: 'text-emerald-700 dark:text-emerald-300',
    borderClass: 'border-emerald-500/30',
    meaning:
      'The property has clean compliance logs, great weather conditions, minimal recent asset anomalies, and low occupancy stress.',
  },
  2: {
    tier: 2,
    name: 'Moderate Risk',
    label: 'Elevated Monitoring',
    range: [26, 50],
    colorHex: '#f59e0b',
    textColorHex: '#92400e',
    bgClass: 'bg-amber-500',
    textClass: 'text-amber-700 dark:text-amber-300',
    borderClass: 'border-amber-500/30',
    meaning:
      'Minor predictive anomalies detected. This is typically triggered by a combination of early-stage asset friction.',
  },
  3: {
    tier: 3,
    name: 'High Risk',
    label: 'Targeted Pre-Shift Mitigation',
    range: [51, 75],
    colorHex: '#f97316',
    textColorHex: '#9a3412',
    bgClass: 'bg-orange-500',
    textClass: 'text-orange-700 dark:text-orange-300',
    borderClass: 'border-orange-500/30',
    meaning:
      'The model identifies a high probability of an asset failure or municipal citation. Driven by compounding historical signals.',
  },
  4: {
    tier: 4,
    name: 'Critical Risk',
    label: 'Immediate Intervention Required',
    range: [76, 100],
    colorHex: '#ef4444',
    textColorHex: '#991b1b',
    bgClass: 'bg-red-500',
    textClass: 'text-red-700 dark:text-red-300',
    borderClass: 'border-red-500/30',
    meaning:
      'A severe operational, safety, or legal liability breakdown is highly imminent during the graveyard shift.',
  },
}

export function getRiskTier(score: number): RiskTierInfo {
  if (score <= 25) return RISK_TIERS[1]
  if (score <= 50) return RISK_TIERS[2]
  if (score <= 75) return RISK_TIERS[3]
  return RISK_TIERS[4]
}

export type ScoreResult = {
  score: number
  flags: RiskFlag[]
  summary: string
  tier: RiskTierInfo
  recurringItems: RecurringItem[]
}

export type ScoreHistoryItem = {
  riskDomain: RiskDomain | null
  status: 'pass' | 'fail' | 'na' | null
  completedAt: string
  itemName?: string | null
}

const MIN_SPAN_DAYS = 30
const LOOKBACK_DAYS = 90
const WEEKDAY_SAMPLE = 2
const RAIN_ASSET_MULTIPLIER = 1.25

export function scorePropertyRisk(input: {
  items: ScoreHistoryItem[]
  timezone: string
  localDate: string
  raining: boolean
  holidayWeekend: boolean
}): ScoreResult | null {
  const windowStart = addCalendarDays(input.localDate, -LOOKBACK_DAYS)
  const rows = input.items.flatMap((item) => {
    if (!item.riskDomain || (item.status !== 'pass' && item.status !== 'fail')) return []
    const completedOn = localDateString(new Date(item.completedAt), input.timezone)
    if (completedOn < windowStart || completedOn > input.localDate) return []
    return [
      {
        riskDomain: item.riskDomain,
        status: item.status,
        completedOn,
        weekday: weekdayIndex(completedOn),
        itemName: item.itemName?.trim() || null,
      },
    ]
  })

  if (!rows.length) return null
  const dates = rows.map((row) => row.completedOn).sort()
  if (calendarDaysBetween(dates[0], dates[dates.length - 1]) < MIN_SPAN_DAYS) return null

  const targetWeekday = weekdayIndex(input.localDate)
  const rates = new Map<RiskDomain, number>()

  for (const domain of RISK_DOMAINS) {
    const domainRows = rows.filter((row) => row.riskDomain === domain)
    if (!domainRows.length) continue

    const sameWeekday = domainRows.filter((row) => row.weekday === targetWeekday)
    const sample = sameWeekday.length >= WEEKDAY_SAMPLE ? sameWeekday : domainRows
    let rate = failRate(sample)

    if (input.holidayWeekend) {
      const weekend = domainRows.filter((row) => row.weekday === 0 || row.weekday === 6)
      if (weekend.length >= WEEKDAY_SAMPLE) {
        const weekendRate = failRate(weekend)
        if (weekendRate > rate) rate = rate * 0.7 + weekendRate * 0.3
      }
    }

    if (input.raining && domain === 'asset_protection') {
      rate = Math.min(1, rate * RAIN_ASSET_MULTIPLIER)
    }

    rates.set(domain, rate)
  }

  if (!rates.size) return null

  let weightedFails = 0
  let weightedAnswers = 0
  for (const domain of RISK_DOMAINS) {
    const domainRows = rows.filter((row) => row.riskDomain === domain)
    if (!domainRows.length) continue
    const weight = RISK_DOMAIN_WEIGHT[domain]
    const fails = domainRows.filter((row) => row.status === 'fail').length
    let failWeight = fails * weight
    if (input.raining && domain === 'asset_protection') {
      failWeight = Math.min(domainRows.length * weight, failWeight * RAIN_ASSET_MULTIPLIER)
    }
    weightedFails += failWeight
    weightedAnswers += domainRows.length * weight
  }

  const raw = weightedAnswers === 0 ? 0 : weightedFails / weightedAnswers
  const score = clamp(Math.round(1 + raw * 99), 1, 100)

  const flags = [...rates.entries()]
    .filter(([, rate]) => rate > 0)
    .sort((a, b) => RISK_DOMAIN_WEIGHT[b[0]] * b[1] - RISK_DOMAIN_WEIGHT[a[0]] * a[1])
    .slice(0, 3)
    .map(([domain, rate]) => ({
      domain,
      label: RISK_DOMAIN_LABELS[domain],
      rate: Math.round(rate * 100) / 100,
    }))

  // Point 2: Track recurring failing items by item title
  const failItemCounts = new Map<string, { domain: RiskDomain; count: number }>()
  for (const row of rows) {
    if (row.status === 'fail' && row.itemName) {
      const current = failItemCounts.get(row.itemName) ?? { domain: row.riskDomain, count: 0 }
      current.count += 1
      failItemCounts.set(row.itemName, current)
    }
  }

  const recurringItems: RecurringItem[] = [...failItemCounts.entries()]
    .map(([itemName, data]) => ({
      itemName,
      domain: data.domain,
      count: data.count,
    }))
    .sort((a, b) => b.count - a.count || a.itemName.localeCompare(b.itemName))
    .slice(0, 5)

  return {
    score,
    flags,
    summary: summaryFor(flags, input.localDate, input.raining),
    tier: getRiskTier(score),
    recurringItems,
  }
}

export function parseRiskFlags(value: unknown): RiskFlag[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return []
    const flag = entry as { domain?: unknown; label?: unknown; rate?: unknown }
    if (
      flag.domain !== 'life_safety' &&
      flag.domain !== 'appearance' &&
      flag.domain !== 'asset_protection'
    ) {
      return []
    }
    return [
      {
        domain: flag.domain,
        label: typeof flag.label === 'string' ? flag.label : RISK_DOMAIN_LABELS[flag.domain],
        rate: typeof flag.rate === 'number' ? flag.rate : 0,
      },
    ]
  })
}

export function parseRecurringItems(value: unknown): RecurringItem[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return []
    const item = entry as { itemName?: unknown; domain?: unknown; count?: unknown }
    if (
      typeof item.itemName !== 'string' ||
      !item.itemName.trim() ||
      (item.domain !== 'life_safety' &&
        item.domain !== 'appearance' &&
        item.domain !== 'asset_protection')
    ) {
      return []
    }
    return [
      {
        itemName: item.itemName.trim(),
        domain: item.domain,
        count: typeof item.count === 'number' ? item.count : 1,
      },
    ]
  })
}

export function outcomeCounts(
  items: { riskDomain: RiskDomain | null; status: 'pass' | 'fail' | 'na' | null }[],
  domain: RiskDomain
): { passed: number; failed: number; na: number } {
  const matching = items.filter((item) => item.riskDomain === domain)
  return {
    passed: matching.filter((item) => item.status === 'pass').length,
    failed: matching.filter((item) => item.status === 'fail').length,
    na: matching.filter((item) => item.status === 'na').length,
  }
}

function failRate(rows: { status: 'pass' | 'fail' }[]): number {
  if (!rows.length) return 0
  return rows.filter((row) => row.status === 'fail').length / rows.length
}

function summaryFor(flags: RiskFlag[], localDate: string, raining: boolean): string {
  if (!flags.length) return 'Recent checklists at this property have been clean.'
  const top = flags[0]
  const weekday = WEEKDAY_NAMES[weekdayIndex(localDate)]
  if (raining && top.domain === 'asset_protection') {
    return 'Rain tonight, and asset-protection items have failed here recently.'
  }
  const lead = `${top.label} items fail here on ${weekday} evenings.`
  if (raining && flags.some((flag) => flag.domain === 'asset_protection')) {
    return `${lead} Rain tonight, and asset-protection items have failed here recently.`
  }
  return lead
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
