import { getEffectiveProfile } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { AssignmentsBoard, type AssignmentRow } from '@/components/AssignmentsBoard'
import { dueLabel } from '@/lib/schedule'
import { zonedDate, formatDate, formatDateTime } from '@/lib/timezone'

export default async function InspectorDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ viewAs?: string }>
}) {
  const { profile, isImpersonating, adminProfile } = await getEffectiveProfile()
  const supabase = await createClient()

  // Support Admin / Super-Admin viewing as a specific specialist via URL query fallback as well
  const params = searchParams ? await searchParams : {}
  const targetSpecialistId =
    !isImpersonating && adminProfile?.role === 'admin' && params.viewAs ? params.viewAs : profile.id

  let targetSpecialistName = profile.full_name
  if (targetSpecialistId !== profile.id) {
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('full_name, human_id')
      .eq('id', targetSpecialistId)
      .single()
    if (targetProfile) {
      targetSpecialistName = targetProfile.full_name
    }
  }

  const { data: inspections } = await supabase
    .from('inspections')
    .select(
      'id, status, created_at, completed_at, scheduled_for, properties(name, address, phone), checklist_templates(name)'
    )
    .eq('inspector_id', targetSpecialistId)
    // A cancelled inspection is not the specialist's problem any more — it
    // leaves their board completely. Admins still see it under Inspections.
    .neq('status', 'cancelled')
    .order('created_at', { ascending: false })

  // Flatten to plain, serializable rows for the client board (no lucide
  // components or Date objects cross the RSC boundary — see CLAUDE.md).
  // Due wording is computed here so client and server agree on "today".
  const now = zonedDate()
  const rows: AssignmentRow[] = (inspections ?? []).map((i) => {
    const property = i.properties as unknown as {
      name: string
      address: string
      phone: string | null
    } | null
    const template = i.checklist_templates as unknown as { name: string } | null
    const scheduled = i.scheduled_for ? zonedDate(new Date(i.scheduled_for)) : null
    const due = scheduled && i.status !== 'completed' ? dueLabel(scheduled, now) : null
    return {
      id: i.id,
      status: i.status,
      created_at: i.created_at,
      completed_at: i.completed_at,
      propertyName: property?.name ?? 'Unknown property',
      propertyAddress: property?.address ?? '',
      propertyPhone: property?.phone ?? null,
      templateName: template?.name ?? '—',
      dueText: due?.text ?? null,
      dueTone: due?.tone ?? null,
      scheduledLabel: i.scheduled_for ? formatDateTime(i.scheduled_for) : null,
      completedLabel: i.completed_at ? formatDate(i.completed_at) : null,
    }
  })

  const isSimulatedView = isImpersonating || targetSpecialistId !== profile.id

  return (
    <div>
      <PageHeader
        eyebrow={isSimulatedView ? `${targetSpecialistName}'s Schedule` : "Today's Schedule"}
        title={isSimulatedView ? `${targetSpecialistName}'s Assignments` : 'My Assignments'}
      />
      <AssignmentsBoard inspections={rows} isAdmin={adminProfile?.role === 'admin' || profile.role === 'admin'} />
    </div>
  )
}
