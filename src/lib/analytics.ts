/**
 * Operational Tracking & Specialist Performance Analytics Computation Engine
 */

export type TimeRange = '7d' | '30d' | '90d' | 'all'

export type TemplateDistribution = {
  templateId: string
  templateName: string
  count: number
  percentage: number
}

export type SpecialistPerformanceMetric = {
  specialistId: string
  fullName: string
  humanId: string | null
  email: string | null
  completedCount: number
  inProgressCount: number
  onTimeRate: number // 0 - 100%
  onTimeCount: number
  scheduledCount: number
  avgDurationMinutes: number
  avgDwellMinutes: number
  failureDiscoveryRate: number // 0 - 100%
  failuresFlagged: number
  totalItemsChecked: number
  photoComplianceRate: number // 0 - 100%
}

export type PropertyAuditMetric = {
  propertyId: string
  propertyName: string
  humanId: string | null
  completedCount: number
  failureCount: number
  latestAuditDate: string | null
}

export type OperationalAnalyticsSummary = {
  timeRange: TimeRange
  totalCompleted: number
  totalPending: number
  totalInProgress: number
  totalCancelled: number
  completionRate: number // 0 - 100%
  onTimeRate: number // 0 - 100%
  onTimeCount: number
  scheduledTotalCount: number
  avgDurationMinutes: number
  avgDwellMinutes: number
  totalFailures: number
  totalItemsChecked: number
  failureDiscoveryRate: number // 0 - 100%
  photoComplianceRate: number // 0 - 100%
  templateBreakdown: TemplateDistribution[]
  specialistLeaderboard: SpecialistPerformanceMetric[]
  propertyBreakdown: PropertyAuditMetric[]
}

export type RawInspectionForAnalytics = {
  id: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  created_at: string
  completed_at: string | null
  scheduled_for: string | null
  arrived_at: string | null
  dwell_time_seconds: number | null
  template_id: string
  inspector_id: string
  property_id: string
  properties?: { name: string; human_id: string | null } | null
  checklist_templates?: { name: string } | null
  profiles?: { full_name: string; human_id: string | null; email: string } | null
}

export type RawItemForAnalytics = {
  inspection_id: string
  status: 'pass' | 'fail' | 'na' | null
  photo_path: string | null
}

/**
 * Filter inspections based on selected time window.
 */
export function filterInspectionsByTimeRange(
  inspections: RawInspectionForAnalytics[],
  range: TimeRange
): RawInspectionForAnalytics[] {
  if (range === 'all') return inspections

  const now = new Date().getTime()
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
  const cutoff = now - days * 24 * 60 * 60 * 1000

  return inspections.filter((i) => {
    const timestamp = new Date(i.completed_at || i.created_at).getTime()
    return timestamp >= cutoff
  })
}

/**
 * Computes end-to-end performance metrics and analytical distributions.
 */
export function computeOperationalAnalytics(
  allInspections: RawInspectionForAnalytics[],
  allItems: RawItemForAnalytics[],
  timeRange: TimeRange = '30d'
): OperationalAnalyticsSummary {
  const inspections = filterInspectionsByTimeRange(allInspections, timeRange)

  // 1. Volumes
  let totalCompleted = 0
  let totalPending = 0
  let totalInProgress = 0
  let totalCancelled = 0

  let scheduledTotalCount = 0
  let onTimeCount = 0

  let totalDurationMinutes = 0
  let completedWithDurationCount = 0

  let totalDwellSeconds = 0
  let dwellRecordedCount = 0

  const templateCounts = new Map<string, { name: string; count: number }>()
  const propertyCounts = new Map<
    string,
    { name: string; humanId: string | null; completed: number; failures: number; latestDate: string | null }
  >()
  const specialistMap = new Map<
    string,
    {
      fullName: string
      humanId: string | null
      email: string | null
      completed: number
      inProgress: number
      scheduledCount: number
      onTimeCount: number
      totalDurationMinutes: number
      durationCount: number
      totalDwellSeconds: number
      dwellCount: number
    }
  >()

  const completedInspectionIds = new Set<string>()

  for (const ins of inspections) {
    if (ins.status === 'completed') {
      totalCompleted++
      completedInspectionIds.add(ins.id)

      // Duration
      if (ins.completed_at && ins.created_at) {
        const start = new Date(ins.created_at).getTime()
        const end = new Date(ins.completed_at).getTime()
        const durationMins = Math.max(1, Math.round((end - start) / (1000 * 60)))
        totalDurationMinutes += durationMins
        completedWithDurationCount++

        // Record for specialist
        const spec = specialistMap.get(ins.inspector_id)
        if (spec) {
          spec.totalDurationMinutes += durationMins
          spec.durationCount++
        }
      }

      // Dwell Time
      if (typeof ins.dwell_time_seconds === 'number' && ins.dwell_time_seconds > 0) {
        totalDwellSeconds += ins.dwell_time_seconds
        dwellRecordedCount++

        const spec = specialistMap.get(ins.inspector_id)
        if (spec) {
          spec.totalDwellSeconds += ins.dwell_time_seconds
          spec.dwellCount++
        }
      }

      // Punctuality check
      if (ins.scheduled_for) {
        scheduledTotalCount++
        const scheduledTime = new Date(ins.scheduled_for).getTime()
        const arrivalTime = ins.arrived_at
          ? new Date(ins.arrived_at).getTime()
          : ins.completed_at
          ? new Date(ins.completed_at).getTime()
          : null

        let isOnTime = false
        if (arrivalTime) {
          // Considered on time if arrived within 15 minutes of scheduled time
          const deltaMins = (arrivalTime - scheduledTime) / (1000 * 60)
          if (deltaMins <= 15) {
            onTimeCount++
            isOnTime = true
          }
        }

        const spec = specialistMap.get(ins.inspector_id)
        if (spec) {
          spec.scheduledCount++
          if (isOnTime) spec.onTimeCount++
        }
      }

      // Template breakdown
      const tName = ins.checklist_templates?.name || 'Standard Checklist'
      const tEntry = templateCounts.get(ins.template_id) || { name: tName, count: 0 }
      tEntry.count++
      templateCounts.set(ins.template_id, tEntry)

      // Property breakdown
      const pName = ins.properties?.name || 'Property'
      const pHumanId = ins.properties?.human_id || null
      const pEntry = propertyCounts.get(ins.property_id) || {
        name: pName,
        humanId: pHumanId,
        completed: 0,
        failures: 0,
        latestDate: null,
      }
      pEntry.completed++
      if (!pEntry.latestDate || (ins.completed_at && ins.completed_at > pEntry.latestDate)) {
        pEntry.latestDate = ins.completed_at
      }
      propertyCounts.set(ins.property_id, pEntry)
    } else if (ins.status === 'in_progress') {
      totalInProgress++
    } else if (ins.status === 'pending') {
      totalPending++
    } else if (ins.status === 'cancelled') {
      totalCancelled++
    }

    // Initialize specialist tracking
    if (!specialistMap.has(ins.inspector_id)) {
      specialistMap.set(ins.inspector_id, {
        fullName: ins.profiles?.full_name || 'Specialist',
        humanId: ins.profiles?.human_id || null,
        email: ins.profiles?.email || null,
        completed: 0,
        inProgress: 0,
        scheduledCount: 0,
        onTimeCount: 0,
        totalDurationMinutes: 0,
        durationCount: 0,
        totalDwellSeconds: 0,
        dwellCount: 0,
      })
    }

    const spec = specialistMap.get(ins.inspector_id)!
    if (ins.status === 'completed') {
      spec.completed++
    } else if (ins.status === 'in_progress') {
      spec.inProgress++
    }
  }

  // 2. Aggregate Items for Quality / Failures / Photo Compliance
  let totalItemsChecked = 0
  let totalFailures = 0
  let itemsRequiringPhotos = 0
  let itemsWithPhotos = 0

  const specialistItemsMap = new Map<
    string,
    { total: number; failures: number; reqPhotos: number; withPhotos: number }
  >()
  const propertyFailuresMap = new Map<string, number>()

  // Map inspection_id to inspector_id & property_id
  const insMetadataMap = new Map<string, { inspectorId: string; propertyId: string }>()
  for (const ins of inspections) {
    insMetadataMap.set(ins.id, { inspectorId: ins.inspector_id, propertyId: ins.property_id })
  }

  for (const item of allItems) {
    if (!completedInspectionIds.has(item.inspection_id)) continue

    const meta = insMetadataMap.get(item.inspection_id)
    if (!meta) continue

    totalItemsChecked++
    if (item.status === 'fail') {
      totalFailures++
      propertyFailuresMap.set(meta.propertyId, (propertyFailuresMap.get(meta.propertyId) || 0) + 1)
    }

    if (item.status === 'pass' || item.status === 'fail') {
      itemsRequiringPhotos++
      if (item.photo_path) {
        itemsWithPhotos++
      }
    }

    const sItem = specialistItemsMap.get(meta.inspectorId) || {
      total: 0,
      failures: 0,
      reqPhotos: 0,
      withPhotos: 0,
    }
    sItem.total++
    if (item.status === 'fail') sItem.failures++
    if (item.status === 'pass' || item.status === 'fail') {
      sItem.reqPhotos++
      if (item.photo_path) sItem.withPhotos++
    }
    specialistItemsMap.set(meta.inspectorId, sItem)
  }

  // 3. Compute Summary Ratios
  const totalAuditsAll = totalCompleted + totalInProgress + totalPending
  const completionRate = totalAuditsAll > 0 ? Math.round((totalCompleted / totalAuditsAll) * 100) : 0
  const onTimeRate = scheduledTotalCount > 0 ? Math.round((onTimeCount / scheduledTotalCount) * 100) : 100
  const avgDurationMinutes =
    completedWithDurationCount > 0 ? Math.round(totalDurationMinutes / completedWithDurationCount) : 0
  const avgDwellMinutes =
    dwellRecordedCount > 0 ? Math.round(totalDwellSeconds / dwellRecordedCount / 60) : 0
  const failureDiscoveryRate =
    totalItemsChecked > 0 ? Math.round((totalFailures / totalItemsChecked) * 1000) / 10 : 0
  const photoComplianceRate =
    itemsRequiringPhotos > 0 ? Math.round((itemsWithPhotos / itemsRequiringPhotos) * 100) : 100

  // 4. Template distribution list
  const templateBreakdown: TemplateDistribution[] = Array.from(templateCounts.entries())
    .map(([templateId, data]) => ({
      templateId,
      templateName: data.name,
      count: data.count,
      percentage: totalCompleted > 0 ? Math.round((data.count / totalCompleted) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)

  // 5. Specialist Leaderboard
  const specialistLeaderboard: SpecialistPerformanceMetric[] = Array.from(specialistMap.entries())
    .map(([specialistId, data]) => {
      const itemData = specialistItemsMap.get(specialistId) || {
        total: 0,
        failures: 0,
        reqPhotos: 0,
        withPhotos: 0,
      }
      return {
        specialistId,
        fullName: data.fullName,
        humanId: data.humanId,
        email: data.email,
        completedCount: data.completed,
        inProgressCount: data.inProgress,
        onTimeRate: data.scheduledCount > 0 ? Math.round((data.onTimeCount / data.scheduledCount) * 100) : 100,
        onTimeCount: data.onTimeCount,
        scheduledCount: data.scheduledCount,
        avgDurationMinutes:
          data.durationCount > 0 ? Math.round(data.totalDurationMinutes / data.durationCount) : 0,
        avgDwellMinutes:
          data.dwellCount > 0 ? Math.round(data.totalDwellSeconds / data.dwellCount / 60) : 0,
        failureDiscoveryRate:
          itemData.total > 0 ? Math.round((itemData.failures / itemData.total) * 1000) / 10 : 0,
        failuresFlagged: itemData.failures,
        totalItemsChecked: itemData.total,
        photoComplianceRate:
          itemData.reqPhotos > 0 ? Math.round((itemData.withPhotos / itemData.reqPhotos) * 100) : 100,
      }
    })
    .sort((a, b) => b.completedCount - a.completedCount)

  // 6. Property breakdown list
  const propertyBreakdown: PropertyAuditMetric[] = Array.from(propertyCounts.entries())
    .map(([propertyId, data]) => ({
      propertyId,
      propertyName: data.name,
      humanId: data.humanId,
      completedCount: data.completed,
      failureCount: propertyFailuresMap.get(propertyId) || 0,
      latestAuditDate: data.latestDate,
    }))
    .sort((a, b) => b.completedCount - a.completedCount)

  return {
    timeRange,
    totalCompleted,
    totalPending,
    totalInProgress,
    totalCancelled,
    completionRate,
    onTimeRate,
    onTimeCount,
    scheduledTotalCount,
    avgDurationMinutes,
    avgDwellMinutes,
    totalFailures,
    totalItemsChecked,
    failureDiscoveryRate,
    photoComplianceRate,
    templateBreakdown,
    specialistLeaderboard,
    propertyBreakdown,
  }
}
