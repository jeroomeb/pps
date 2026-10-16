import assert from 'node:assert/strict'
import test from 'node:test'
import {
  scorePropertyRisk,
  getRiskTier,
  RISK_TIERS,
  type ScoreHistoryItem,
} from './risk-score'

const ZONE = 'America/New_York'

function item(
  domain: ScoreHistoryItem['riskDomain'],
  status: 'pass' | 'fail',
  completedAt: string
): ScoreHistoryItem {
  return { riskDomain: domain, status, completedAt }
}

function series(
  domain: ScoreHistoryItem['riskDomain'],
  status: 'pass' | 'fail',
  dates: string[]
): ScoreHistoryItem[] {
  return dates.map((date) => item(domain, status, `${date}T18:00:00.000Z`))
}

test('no score when history spans fewer than 30 days', () => {
  const result = scorePropertyRisk({
    timezone: ZONE,
    localDate: '2026-02-05',
    raining: false,
    holidayWeekend: false,
    items: series('appearance', 'fail', ['2026-01-20', '2026-01-27', '2026-02-03']),
  })
  assert.equal(result, null)
})

test('Thursday waste failures flag appearance on Thursday and not on Monday', () => {
  const thursdays = ['2026-01-08', '2026-01-15', '2026-01-22', '2026-01-29', '2026-02-05', '2026-02-12']
  const mondays = ['2026-01-05', '2026-01-12', '2026-01-19', '2026-01-26', '2026-02-02', '2026-02-09']
  const items = [
    ...series('appearance', 'fail', thursdays),
    ...series('appearance', 'pass', mondays),
    ...series('life_safety', 'pass', [...thursdays, ...mondays]),
  ]

  const thursday = scorePropertyRisk({
    timezone: ZONE,
    localDate: '2026-03-05',
    raining: false,
    holidayWeekend: false,
    items,
  })
  const monday = scorePropertyRisk({
    timezone: ZONE,
    localDate: '2026-03-02',
    raining: false,
    holidayWeekend: false,
    items,
  })

  assert.ok(thursday)
  assert.equal(thursday.flags[0]?.domain, 'appearance')
  assert.match(thursday.summary, /Thursday/)
  assert.ok(monday)
  assert.equal(
    monday.flags.some((flag) => flag.domain === 'appearance'),
    false
  )
})

test('one life-safety failure outranks many appearance failures', () => {
  const dates = ['2026-01-05', '2026-01-12', '2026-01-19', '2026-01-26', '2026-02-02', '2026-02-09', '2026-02-16', '2026-02-23']
  const result = scorePropertyRisk({
    timezone: ZONE,
    localDate: '2026-03-02',
    raining: false,
    holidayWeekend: false,
    items: [
      ...series('appearance', 'fail', dates.slice(0, 4)),
      ...series('appearance', 'pass', dates.slice(4)),
      ...series('life_safety', 'fail', dates.slice(0, 4)),
      ...series('life_safety', 'pass', dates.slice(4)),
    ],
  })
  assert.ok(result)
  assert.equal(result.flags[0]?.domain, 'life_safety')
})

test('rain raises asset protection and leaves life-safety unchanged', () => {
  const dates = ['2026-01-06', '2026-01-13', '2026-01-20', '2026-01-27', '2026-02-03', '2026-02-10', '2026-02-17', '2026-02-24']
  const items = [
    ...series('asset_protection', 'fail', dates.slice(0, 2)),
    ...series('asset_protection', 'pass', dates.slice(2)),
    ...series('life_safety', 'pass', dates),
  ]
  const dry = scorePropertyRisk({
    timezone: ZONE,
    localDate: '2026-03-03',
    raining: false,
    holidayWeekend: false,
    items,
  })
  const wet = scorePropertyRisk({
    timezone: ZONE,
    localDate: '2026-03-03',
    raining: true,
    holidayWeekend: false,
    items,
  })
  assert.ok(dry && wet)
  const dryAsset = dry.flags.find((flag) => flag.domain === 'asset_protection')
  const wetAsset = wet.flags.find((flag) => flag.domain === 'asset_protection')
  assert.ok(dryAsset && wetAsset)
  assert.ok(wetAsset.rate > dryAsset.rate)
  assert.equal(
    wet.flags.some((flag) => flag.domain === 'life_safety'),
    false
  )
  assert.match(wet.summary, /Rain tonight/)
})

test('the score stays inside 1 to 100', () => {
  const dates = ['2026-01-06', '2026-01-20', '2026-02-03', '2026-02-17', '2026-03-03']
  const allFail = scorePropertyRisk({
    timezone: ZONE,
    localDate: '2026-03-17',
    raining: true,
    holidayWeekend: true,
    items: [
      ...series('life_safety', 'fail', dates),
      ...series('appearance', 'fail', dates),
      ...series('asset_protection', 'fail', dates),
    ],
  })
  const allPass = scorePropertyRisk({
    timezone: ZONE,
    localDate: '2026-03-17',
    raining: false,
    holidayWeekend: false,
    items: series('life_safety', 'pass', dates),
  })
  assert.ok(allFail && allPass)
  assert.ok(allFail.score >= 1 && allFail.score <= 100)
  assert.ok(allPass.score >= 1 && allPass.score <= 100)
  assert.equal(allPass.flags.length, 0)
})

test('a single failing area is not padded with empty flags', () => {
  const dates = ['2026-01-08', '2026-01-22', '2026-02-05', '2026-02-19', '2026-03-05']
  const result = scorePropertyRisk({
    timezone: ZONE,
    localDate: '2026-03-19',
    raining: false,
    holidayWeekend: false,
    items: series('appearance', 'fail', dates),
  })
  assert.ok(result)
  assert.equal(result.flags.length, 1)
  assert.equal(result.flags[0]?.domain, 'appearance')
})

test('correctly maps 4-tier risk intervals and operational meanings', () => {
  assert.equal(getRiskTier(1).tier, 1)
  assert.equal(getRiskTier(25).tier, 1)
  assert.equal(getRiskTier(26).tier, 2)
  assert.equal(getRiskTier(50).tier, 2)
  assert.equal(getRiskTier(51).tier, 3)
  assert.equal(getRiskTier(75).tier, 3)
  assert.equal(getRiskTier(76).tier, 4)
  assert.equal(getRiskTier(100).tier, 4)

  assert.equal(RISK_TIERS[1].name, 'Low Risk')
  assert.equal(RISK_TIERS[2].name, 'Moderate Risk')
  assert.equal(RISK_TIERS[3].name, 'High Risk')
  assert.equal(RISK_TIERS[4].name, 'Critical Risk')
  assert.match(RISK_TIERS[4].meaning, /graveyard shift/)
})

test('identifies recurring failed question titles in historical window', () => {
  const dates = ['2026-01-08', '2026-01-22', '2026-02-05', '2026-02-19', '2026-03-05']
  const items: ScoreHistoryItem[] = [
    ...dates.map((d) => ({
      riskDomain: 'life_safety' as const,
      status: 'fail' as const,
      completedAt: `${d}T18:00:00.000Z`,
      itemName: 'Pool Gate Self-Latch',
    })),
    ...dates.slice(0, 3).map((d) => ({
      riskDomain: 'life_safety' as const,
      status: 'fail' as const,
      completedAt: `${d}T18:00:00.000Z`,
      itemName: 'Exit Sign Illumination',
    })),
    ...dates.slice(0, 1).map((d) => ({
      riskDomain: 'appearance' as const,
      status: 'fail' as const,
      completedAt: `${d}T18:00:00.000Z`,
      itemName: 'Litter in Breezeway',
    })),
  ]

  const result = scorePropertyRisk({
    timezone: ZONE,
    localDate: '2026-03-19',
    raining: false,
    holidayWeekend: false,
    items,
  })

  assert.ok(result)
  assert.ok(result.recurringItems.length >= 2)
  assert.equal(result.recurringItems[0].itemName, 'Pool Gate Self-Latch')
  assert.equal(result.recurringItems[0].count, 5)
  assert.equal(result.recurringItems[1].itemName, 'Exit Sign Illumination')
  assert.equal(result.recurringItems[1].count, 3)
  assert.ok(result.tier.tier >= 1)
})
