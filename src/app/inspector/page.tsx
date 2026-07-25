import { getProfile } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { AssignmentsBoard, type AssignmentRow } from '@/components/AssignmentsBoard'
import { dueLabel } from '@/lib/schedule'

export default async function InspectorDashboardPage() {
  const profile = await getProfile()
  const supabase = await createClient()

  const { data: inspections } = await supabase
    .from('inspections')
    .select(
      'id, status, created_at, completed_at, scheduled_for, properties(name, address), checklist_templates(name)'
    )
    .eq('inspector_id', profile.id)
    .order('created_at', { ascending: false })

  // Flatten to plain, serializable rows for the client board (no lucide
  // components or Date objects cross the RSC boundary — see CLAUDE.md).
  // Due wording is computed here so client and server agree on "today".
  const now = new Date()
  const rows: AssignmentRow[] = (inspections ?? []).map((i) => {
    const property = i.properties as unknown as { name: string; address: string } | null
    const template = i.checklist_templates as unknown as { name: string } | null
    const scheduled = i.scheduled_for ? new Date(i.scheduled_for) : null
    const due = scheduled ? dueLabel(scheduled, now) : null
    return {
      id: i.id,
      status: i.status,
      created_at: i.created_at,
      completed_at: i.completed_at,
      propertyName: property?.name ?? 'Unknown property',
      propertyAddress: property?.address ?? '',
      templateName: template?.name ?? '—',
      dueText: due?.text ?? null,
      dueTone: due?.tone ?? null,
      scheduledLabel: scheduled
        ? scheduled.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
        : null,
    }
  })

  return (
    <div>
      <PageHeader eyebrow="Today's Schedule" title="My Assignments" />
      <AssignmentsBoard inspections={rows} isAdmin={profile.role === 'admin'} />
    </div>
  )
}
