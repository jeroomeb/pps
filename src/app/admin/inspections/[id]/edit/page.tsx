import { notFound, redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { EditInspectionForm } from '@/components/EditInspectionForm'
import { PageHeader } from '@/components/ui/PageHeader'

/** `datetime-local` wants local wall-clock time, not a UTC ISO string. */
function toDateTimeLocal(iso: string | null): string | undefined {
  if (!iso) return undefined
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return undefined
  const pad = (n: number) => `${n}`.padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default async function EditInspectionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  await requireRole('admin')
  const supabase = await createClient()

  const [{ data: inspection }, { data: inspectors }] = await Promise.all([
    supabase
      .from('inspections')
      .select(
        'id, status, inspector_id, scheduled_for, property_id, properties(id, name, state, zip, county), checklist_templates(name)'
      )
      .eq('id', id)
      .single(),
    supabase
      .from('profiles')
      .select('id, full_name, role, state, zip, county')
      .order('full_name'),
  ])

  if (!inspection) {
    notFound()
  }

  // Completed inspections are frozen — send the admin to the report instead.
  if (inspection.status === 'completed') {
    redirect(`/admin/reports/${id}`)
  }

  const property = inspection.properties as unknown as {
    id: string
    name: string
    state: string | null
    zip: string | null
    county: string | null
  }
  const template = inspection.checklist_templates as unknown as { name: string } | null

  return (
    <div className="max-w-2xl">
      <PageHeader
        eyebrow="Inspections"
        title="Edit Inspection"
        backHref={`/admin/properties/${inspection.property_id}`}
        backLabel="Property"
      />
      <EditInspectionForm
        inspectionId={id}
        property={property}
        checklistName={template?.name ?? 'Checklist'}
        inspectors={inspectors ?? []}
        defaultInspectorId={inspection.inspector_id}
        defaultScheduledFor={toDateTimeLocal(inspection.scheduled_for)}
      />
    </div>
  )
}
