import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { Clock, ArrowLeft, MapPin, Phone } from 'lucide-react'
import { getProfile } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { ActiveInspectionChecklist } from '@/components/ActiveInspectionChecklist'
import { ReadOnlyInspectionView } from '@/components/ReadOnlyInspectionView'
import {
  formatDate,
  formatDateTime,
  formatDateTimeLong,
  formatRelativeToNow,
} from '@/lib/timezone'

export default async function InspectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const profile = await getProfile()
  const supabase = await createClient()

  const { data: inspection } = await supabase
    .from('inspections')
    .select(
      'id, status, inspector_id, created_at, completed_at, scheduled_for, properties(name, address, phone), checklist_templates(name), profiles(full_name)'
    )
    .eq('id', id)
    .single()

  if (!inspection) {
    notFound()
  }

  if (profile.role !== 'admin' && inspection.inspector_id !== profile.id) {
    redirect('/inspector')
  }

  // Admins get the full report (download/resend/email). Inspectors can still
  // *see* their own completed inspection below — just read-only, since it's
  // frozen once submitted.
  if (inspection.status === 'completed' && profile.role === 'admin') {
    redirect(`/admin/reports/${id}`)
  }

  const { data: items } = await supabase
    .from('inspection_items')
    .select('id, service_category, item_name, description, status, comment, photo_path')
    .eq('inspection_id', id)
    .order('sort_order')

  const itemsWithUrls = await Promise.all(
    (items ?? []).map(async (item) => {
      let photoUrl: string | null = null
      if (item.photo_path) {
        const { data } = await supabase.storage
          .from('photos')
          .createSignedUrl(item.photo_path, 3600)
        photoUrl = data?.signedUrl ?? null
      }
      return { ...item, photoUrl }
    })
  )

  const property = inspection.properties as unknown as {
    name: string
    address: string | null
    phone: string | null
  }
  const template = inspection.checklist_templates as unknown as { name: string }
  const inspector = inspection.profiles as unknown as { full_name: string }

  if (inspection.status === 'completed') {
    return (
      <ReadOnlyInspectionView
        inspectionId={id}
        propertyName={property.name}
        propertyAddress={property.address}
        propertyPhone={property.phone}
        checklistName={template.name}
        inspectorName={inspector.full_name}
        completedAt={inspection.completed_at}
        items={itemsWithUrls}
      />
    )
  }

  // Minute-precise gate, as the client specified. Comparing real instants is
  // correct here — only the *label* was wrong before (it rendered in the
  // server's UTC zone, so a 1:45 PM ET job read as "5:45 PM").
  const scheduledAt = inspection.scheduled_for ? new Date(inspection.scheduled_for) : null
  const isScheduledAhead = !!scheduledAt && scheduledAt > new Date()
  const scheduledLabel = scheduledAt ? formatDateTimeLong(scheduledAt) : null

  // Scheduled for the future → specialists must wait. Admins own the schedule,
  // so they can proceed early (with a banner) and can edit the date instead.
  if (isScheduledAhead && profile.role !== 'admin') {
    return (
      <div className="max-w-lg">
        {/* Previously this screen was a dead end — no back link, so on mobile
            the only escape was the browser back button. */}
        <Link
          href="/inspector"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-on-surface-variant hover:text-on-surface"
        >
          <ArrowLeft size={16} />
          Back to My Assignments
        </Link>
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 text-center">
          <Clock size={40} className="mx-auto mb-4 text-primary" />
          <h1 className="font-headline text-2xl font-bold">{property.name}</h1>
          <p className="mt-1 text-on-surface-variant">{template.name}</p>

          <p className="mt-6 rounded-lg bg-surface-container-low px-4 py-3 text-sm">
            This inspection is scheduled for{' '}
            <span className="font-semibold">{scheduledLabel}</span>.
            <br />
            You can start it{' '}
            <span className="font-semibold">{formatRelativeToNow(scheduledAt!)}</span>.
          </p>

          {(property.address || property.phone) && (
            <div className="mt-4 flex flex-col items-center gap-1.5 border-t border-outline-variant pt-4 text-sm text-on-surface-variant">
              {property.address && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} className="shrink-0 text-primary" />
                  {property.address}
                </span>
              )}
              {property.phone && (
                <a
                  href={`tel:${property.phone}`}
                  className="flex items-center gap-1.5 font-semibold text-on-surface hover:underline"
                >
                  <Phone size={14} className="shrink-0 text-primary" />
                  {property.phone}
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      {isScheduledAhead && (
        <div className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-primary-container bg-primary-container/25 px-4 py-3 text-sm">
          <Clock size={16} className="shrink-0 text-primary" />
          <span>
            Scheduled for <span className="font-semibold">{scheduledLabel}</span>. The assigned
            specialist can&apos;t start until then — you can, as an admin.
          </span>
          <Link
            href={`/admin/inspections/${id}/edit`}
            className="font-semibold text-primary underline"
          >
            Edit schedule
          </Link>
        </div>
      )}
      <ActiveInspectionChecklist
        inspectionId={id}
        propertyName={property.name}
        propertyAddress={property.address}
        propertyPhone={property.phone}
        checklistName={template.name}
        inspectorName={inspector.full_name}
        // Labels are preformatted on the server: ActiveInspectionChecklist is a
        // client component, so a raw timestamp would render in the *browser's*
        // timezone — a third different answer for the same field.
        startedLabel={formatDate(inspection.created_at)}
        scheduledLabel={scheduledAt ? formatDateTime(scheduledAt) : null}
        initialItems={itemsWithUrls}
      />
    </>
  )
}
