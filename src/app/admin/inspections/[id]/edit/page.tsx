import { notFound, redirect } from 'next/navigation'
import { Ban } from 'lucide-react'
import { requireRole } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { EditInspectionForm } from '@/components/EditInspectionForm'
import { CancelInspectionButton } from '@/components/CancelInspectionButton'
import { RestoreInspectionButton } from '@/components/RestoreInspectionButton'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import {
  formatZonedDateTimeLocal,
  formatDateTimeLong,
  timeZoneAbbreviation,
} from '@/lib/timezone'

/** `datetime-local` wants local wall-clock time in APP_TIMEZONE, not a UTC ISO string. */
function toDateTimeLocal(iso: string | null): string | undefined {
  if (!iso) return undefined
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return undefined
  return formatZonedDateTimeLocal(d)
}

export default async function EditInspectionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  await requireRole('admin')
  const supabase = await createClient()

  const { data: inspection } = await supabase
    .from('inspections')
    .select(
      'id, status, inspector_id, scheduled_for, property_id, cancelled_at, cancelled_by, cancellation_reason, properties(id, name, state, zip, county), checklist_templates(name)'
    )
    .eq('id', id)
    .single()

  if (!inspection) {
    notFound()
  }

  const [{ data: inspectors }, { data: assignments }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, role, state, zip, county, status')
      .order('full_name'),
    supabase
      .from('property_specialist_assignments')
      .select('specialist_id, role')
      .eq('property_id', inspection.property_id),
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
  const isCancelled = inspection.status === 'cancelled'

  // Who cancelled it. Fetched separately rather than as a second embedded
  // `profiles` join — `inspector_id` already joins that table, so a second one
  // would need disambiguated hint syntax for no real benefit here.
  let cancelledByName: string | null = null
  if (isCancelled && inspection.cancelled_by) {
    const { data: canceller } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', inspection.cancelled_by)
      .single()
    cancelledByName = canceller?.full_name ?? null
  }

  // Build lookup of property roster for ranking/badges
  const rosterLookup = new Map((assignments ?? []).map((a) => [a.specialist_id, a.role]))

  const enhancedInspectors = (inspectors ?? [])
    .filter((ins) => ins.status !== 'inactive' || ins.id === inspection.inspector_id)
    .map((ins) => ({
      id: ins.id,
      full_name: ins.full_name,
      role: ins.role,
      state: ins.state,
      zip: ins.zip,
      county: ins.county,
      rosterRole: (rosterLookup.get(ins.id) as 'primary' | 'backup' | 'staff') || null,
    }))

  return (
    <div className="max-w-2xl">
      <PageHeader
        eyebrow="Inspections"
        title={isCancelled ? 'Cancelled Inspection' : 'Edit Inspection'}
        backHref={`/admin/properties/${inspection.property_id}`}
        backLabel="Property"
      />

      {isCancelled ? (
        // Cancelled inspections are frozen like completed ones, so the edit
        // form is replaced rather than disabled — there is nothing here to
        // submit until it's restored.
        <Card className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <Ban size={20} className="mt-0.5 shrink-0 text-on-surface-variant" />
            <div>
              <h2 className="font-headline text-lg font-semibold">This inspection was cancelled</h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                {property.name} — {template?.name ?? 'Checklist'}
              </p>
            </div>
          </div>

          <dl className="flex flex-col gap-2 border-t border-outline-variant pt-4 text-sm">
            {inspection.cancelled_at && (
              <div className="flex flex-wrap justify-between gap-2">
                <dt className="text-on-surface-variant">Cancelled</dt>
                <dd className="font-semibold">{formatDateTimeLong(inspection.cancelled_at)}</dd>
              </div>
            )}
            {cancelledByName && (
              <div className="flex flex-wrap justify-between gap-2">
                <dt className="text-on-surface-variant">Cancelled by</dt>
                <dd className="font-semibold">{cancelledByName}</dd>
              </div>
            )}
            <div className="flex flex-col gap-1">
              <dt className="text-on-surface-variant">Reason</dt>
              <dd className="font-semibold">
                {inspection.cancellation_reason || (
                  <span className="font-normal italic text-on-surface-variant">
                    No reason recorded
                  </span>
                )}
              </dd>
            </div>
          </dl>

          <div className="flex flex-wrap items-center gap-3 border-t border-outline-variant pt-4">
            <RestoreInspectionButton inspectionId={id} />
            <p className="text-xs text-on-surface-variant">
              Restoring returns it to Pending and puts it back on the specialist&apos;s
              assignments.
            </p>
          </div>

          <p className="border-t border-outline-variant pt-4 text-xs text-on-surface-variant">
            Any answers and photos captured before the cancellation are kept, and will still be
            there if it is restored.
          </p>
        </Card>
      ) : (
        <>
          <EditInspectionForm
            inspectionId={id}
            property={property}
            checklistName={template?.name ?? 'Checklist'}
            inspectors={enhancedInspectors}
            defaultInspectorId={inspection.inspector_id}
            defaultScheduledFor={toDateTimeLocal(inspection.scheduled_for)}
            timeZoneLabel={timeZoneAbbreviation()}
          />

          <Card className="mt-6">
            <h2 className="mb-1 font-headline text-base font-semibold">Cancel this inspection</h2>
            <p className="mb-3 text-sm text-on-surface-variant">
              Use this when the visit isn&apos;t happening. The inspection is removed from the
              specialist&apos;s assignments and stops counting as pending, but the record is kept
              and can be restored.
            </p>
            <CancelInspectionButton inspectionId={id} />
          </Card>
        </>
      )}
    </div>
  )
}
