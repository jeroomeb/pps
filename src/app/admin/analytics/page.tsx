import { requireRole } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { AdminAnalyticsDashboard } from '@/components/AdminAnalyticsDashboard'
import { computeOperationalAnalytics } from '@/lib/analytics'

export const dynamic = 'force-dynamic'

export default async function AdminAnalyticsPage() {
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

  const initialSummary = computeOperationalAnalytics(rawInspections, rawItems, '30d')

  return (
    <div>
      <PageHeader
        eyebrow="Intelligence & Operations"
        title="Specialist Performance & Operational Metrics"
        subtitle="Throughput, punctuality, audit quality, and checklist distribution analytics across the organization"
      />

      <AdminAnalyticsDashboard
        initialSummary={initialSummary}
        rawInspections={rawInspections}
        rawItems={rawItems}
      />
    </div>
  )
}
