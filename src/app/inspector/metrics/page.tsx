import { getProfile } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { SpecialistScorecard } from '@/components/SpecialistScorecard'
import { computeOperationalAnalytics } from '@/lib/analytics'

export const dynamic = 'force-dynamic'

export default async function SpecialistMetricsPage() {
  const profile = await getProfile()
  if (!profile) return null

  const supabase = await createClient()

  const { data: inspections } = await supabase
    .from('inspections')
    .select(
      'id, status, created_at, completed_at, scheduled_for, arrived_at, dwell_time_seconds, template_id, inspector_id, property_id, properties(name, human_id), checklist_templates(name), profiles!inspections_inspector_id_fkey(full_name, human_id, email)'
    )
    .eq('inspector_id', profile.id)
    .order('created_at', { ascending: false })

  const rawInspections = (inspections as any[]) ?? []
  const inspectionIds = rawInspections.map((i) => i.id)

  let itemsQuery = supabase
    .from('inspection_items')
    .select('inspection_id, status, photo_path')

  if (inspectionIds.length > 0) {
    itemsQuery = itemsQuery.in('inspection_id', inspectionIds)
  }

  const { data: items } = await itemsQuery
  const rawItems = (items as any[]) ?? []

  const summary = computeOperationalAnalytics(rawInspections, rawItems, 'all')
  const scorecard = summary.specialistLeaderboard.find((s) => s.specialistId === profile.id) || {
    specialistId: profile.id,
    fullName: profile.full_name,
    humanId: profile.human_id,
    email: profile.email,
    completedCount: 0,
    inProgressCount: 0,
    onTimeRate: 100,
    onTimeCount: 0,
    scheduledCount: 0,
    avgDurationMinutes: 0,
    avgDwellMinutes: 0,
    failureDiscoveryRate: 0,
    failuresFlagged: 0,
    totalItemsChecked: 0,
    photoComplianceRate: 100,
  }

  return (
    <div className="max-w-4xl">
      <PageHeader
        eyebrow="Specialist Portal"
        title="My Performance Scorecard"
        subtitle="Track your audit velocity, on-time punctuality, photo compliance, and operational achievements"
      />

      <SpecialistScorecard
        scorecard={scorecard}
        templateBreakdown={summary.templateBreakdown}
        isSelfView={true}
      />
    </div>
  )
}
