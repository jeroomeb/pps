'use server'

import { createClient } from '@/lib/supabase/server'
import { getProfile, requireRole } from '@/lib/auth/dal'
import {
  computeOperationalAnalytics,
  type TimeRange,
  type OperationalAnalyticsSummary,
  type SpecialistPerformanceMetric,
} from '@/lib/analytics'

/**
 * Fetches tenant-wide or global operational analytics data.
 */
export async function getTenantOperationalAnalytics(
  timeRange: TimeRange = '30d'
): Promise<{ summary: OperationalAnalyticsSummary | null; error: string | null }> {
  const profile = await requireRole('admin')
  const supabase = await createClient()

  let inspectionsQuery = supabase
    .from('inspections')
    .select(
      'id, status, created_at, completed_at, scheduled_for, arrived_at, dwell_time_seconds, template_id, inspector_id, property_id, properties(name, human_id), checklist_templates(name), profiles!inspections_inspector_id_fkey(full_name, human_id, email)'
    )
    .order('created_at', { ascending: false })

  if (profile.tenant_id && !profile.is_global_admin) {
    inspectionsQuery = inspectionsQuery.eq('tenant_id', profile.tenant_id)
  }

  const { data: inspections, error: insError } = await inspectionsQuery

  if (insError || !inspections) {
    return { summary: null, error: insError?.message || 'Failed to fetch inspections' }
  }

  const inspectionIds = inspections.map((i) => i.id)

  let itemsQuery = supabase
    .from('inspection_items')
    .select('inspection_id, status, photo_path')

  if (inspectionIds.length > 0) {
    itemsQuery = itemsQuery.in('inspection_id', inspectionIds)
  }

  const { data: items } = await itemsQuery

  const summary = computeOperationalAnalytics(
    inspections as any,
    items || [],
    timeRange
  )

  return { summary, error: null }
}

/**
 * Fetches personal performance analytics for a specific specialist.
 */
export async function getSpecialistPersonalScorecard(
  specialistId?: string,
  timeRange: TimeRange = 'all'
): Promise<{
  scorecard: SpecialistPerformanceMetric | null
  summary: OperationalAnalyticsSummary | null
  error: string | null
}> {
  const profile = await getProfile()
  if (!profile) {
    return { scorecard: null, summary: null, error: 'Unauthorized' }
  }

  const targetId = specialistId || profile.id

  // If viewing someone else, verify admin role
  if (targetId !== profile.id && profile.role !== 'admin') {
    return { scorecard: null, summary: null, error: 'Unauthorized to view specialist scorecard' }
  }

  const supabase = await createClient()

  const { data: inspections, error: insError } = await supabase
    .from('inspections')
    .select(
      'id, status, created_at, completed_at, scheduled_for, arrived_at, dwell_time_seconds, template_id, inspector_id, property_id, properties(name, human_id), checklist_templates(name), profiles!inspections_inspector_id_fkey(full_name, human_id, email)'
    )
    .eq('inspector_id', targetId)
    .order('created_at', { ascending: false })

  if (insError || !inspections) {
    return { scorecard: null, summary: null, error: insError?.message || 'Failed to fetch inspections' }
  }

  const inspectionIds = inspections.map((i) => i.id)

  let itemsQuery = supabase
    .from('inspection_items')
    .select('inspection_id, status, photo_path')

  if (inspectionIds.length > 0) {
    itemsQuery = itemsQuery.in('inspection_id', inspectionIds)
  }

  const { data: items } = await itemsQuery

  const summary = computeOperationalAnalytics(
    inspections as any,
    items || [],
    timeRange
  )

  const scorecard =
    summary.specialistLeaderboard.find((s) => s.specialistId === targetId) || null

  return { scorecard, summary, error: null }
}
