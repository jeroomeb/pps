import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import {
  parseRecurringItems,
  parseRiskFlags,
  scorePropertyRisk,
  type RecurringItem,
  type RiskFlag,
} from '@/lib/risk-score'
import { createAdminClient } from '@/lib/supabase/server'
import { isHolidayWeekend } from '@/lib/us-holidays'
import { eveningRainForecast } from '@/lib/weather'
import {
  localDateString,
  localHour,
  propertyTimezoneOrDefault,
} from '@/lib/property-timezones'

type AdminClient = SupabaseClient<Database>

export async function refreshDueRiskScores(now: Date = new Date()): Promise<{
  scored: number
  skipped: number
}> {
  const admin = createAdminClient()
  const { data: properties, error } = await admin
    .from('properties')
    .select('id, timezone, latitude, longitude, is_active, enable_predictive_scoring')
    .eq('is_active', true)

  if (error || !properties) {
    console.error('[risk-score] Could not load properties:', error)
    return { scored: 0, skipped: 0 }
  }

  let scored = 0
  let skipped = 0
  for (const property of properties) {
    // Point 3: Respect per-property predictive scoring toggle
    if (property.enable_predictive_scoring === false) {
      skipped += 1
      continue
    }

    const timezone = propertyTimezoneOrDefault(property.timezone)
    if (localHour(now, timezone) < 16) {
      skipped += 1
      continue
    }
    const localDate = localDateString(now, timezone)
    const { data: existing } = await admin
      .from('property_risk_scores')
      .select('id')
      .eq('property_id', property.id)
      .eq('local_date', localDate)
      .maybeSingle()
    if (existing) {
      skipped += 1
      continue
    }

    const wrote = await writeScoreForProperty(admin, {
      propertyId: property.id,
      timezone,
      latitude: property.latitude,
      longitude: property.longitude,
      localDate,
    })
    if (wrote) scored += 1
    else skipped += 1
  }

  return { scored, skipped }
}

async function writeScoreForProperty(
  admin: AdminClient,
  input: {
    propertyId: string
    timezone: string
    latitude: number | null
    longitude: number | null
    localDate: string
  }
): Promise<boolean> {
  const { data: inspections, error } = await admin
    .from('inspections')
    .select('id, completed_at, checklist_templates(enable_predictive_scoring)')
    .eq('property_id', input.propertyId)
    .eq('status', 'completed')
    .not('completed_at', 'is', null)

  if (error || !inspections?.length) return false

  // Point 7: Exclude checklist templates where enable_predictive_scoring === false
  const validInspections = inspections.filter((row) => {
    const template = row.checklist_templates as unknown as { enable_predictive_scoring?: boolean } | null
    return template?.enable_predictive_scoring !== false
  })

  if (!validInspections.length) return false

  const completedAt = new Map(
    validInspections.flatMap((row) => (row.completed_at ? [[row.id, row.completed_at] as const] : []))
  )
  const { data: items } = await admin
    .from('inspection_items')
    .select('inspection_id, risk_domain, status, item_name')
    .in('inspection_id', [...completedAt.keys()])

  const raining = (await eveningRainForecast(input.latitude, input.longitude, input.localDate)) === true
  const result = scorePropertyRisk({
    timezone: input.timezone,
    localDate: input.localDate,
    raining,
    holidayWeekend: isHolidayWeekend(input.localDate),
    items: (items ?? []).flatMap((item) => {
      const completed = completedAt.get(item.inspection_id)
      if (!completed) return []
      return [
        {
          riskDomain: item.risk_domain,
          status: item.status,
          completedAt: completed,
          itemName: item.item_name,
        },
      ]
    }),
  })
  if (!result) return false

  const { error: insertError } = await admin.from('property_risk_scores').insert({
    property_id: input.propertyId,
    local_date: input.localDate,
    score: result.score,
    flags: result.flags,
    recurring_items: result.recurringItems,
    summary: result.summary,
    weather: raining ? 'rain' : input.latitude == null ? 'unavailable' : 'dry',
  })
  if (insertError && insertError.code !== '23505') {
    console.error('[risk-score] Could not store score:', insertError)
    return false
  }
  return !insertError
}

export type FrozenPrediction = {
  score: number
  flags: RiskFlag[]
  recurringItems: RecurringItem[]
  summary: string
}

/**
 * Copies today's property score onto an open inspection the first time it is
 * opened. Later score runs do not overwrite it.
 */
export async function freezeEveningScore(
  supabase: AdminClient,
  inspection: {
    id: string
    status: string
    propertyId: string
    timezone: string | null
    predictedScore: number | null
    predictedFlags: unknown
    predictedRecurringItems?: unknown
    predictedSummary: string | null
  }
): Promise<FrozenPrediction | null> {
  if (inspection.predictedScore != null && inspection.predictedSummary) {
    return {
      score: inspection.predictedScore,
      flags: parseRiskFlags(inspection.predictedFlags),
      recurringItems: parseRecurringItems(inspection.predictedRecurringItems),
      summary: inspection.predictedSummary,
    }
  }
  if (inspection.status !== 'pending' && inspection.status !== 'in_progress') return null

  const timezone = propertyTimezoneOrDefault(inspection.timezone)
  const localDate = localDateString(new Date(), timezone)
  const { data: score } = await supabase
    .from('property_risk_scores')
    .select('score, flags, recurring_items, summary')
    .eq('property_id', inspection.propertyId)
    .eq('local_date', localDate)
    .maybeSingle()

  if (!score) return null

  const recurringItems = parseRecurringItems(score.recurring_items)

  await supabase
    .from('inspections')
    .update({
      predicted_score: score.score,
      predicted_flags: score.flags,
      predicted_recurring_items: recurringItems,
      predicted_summary: score.summary,
      predicted_local_date: localDate,
    })
    .eq('id', inspection.id)
    .is('predicted_score', null)

  return {
    score: score.score,
    flags: parseRiskFlags(score.flags),
    recurringItems,
    summary: score.summary,
  }
}

