import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Lock, MapPin, Phone, Download } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { ZoomableImage } from '@/components/ZoomableImage'
import { InspectionGeoTelemetryCard, type GeoLogEntry } from '@/components/InspectionGeoTelemetryCard'
import { formatDateTime } from '@/lib/timezone'

type ReadOnlyItem = {
  id: string
  service_category: string
  item_name: string
  status: 'pass' | 'fail' | 'na' | null
  comment: string | null
  photo_path: string | null
  photoUrl: string | null
}

function statusChip(status: ReadOnlyItem['status']) {
  if (status === 'fail')
    return { label: 'Fail', className: 'bg-error text-white' }
  if (status === 'pass')
    return { label: 'Pass', className: 'bg-success-container text-on-success-container' }
  return { label: 'N/A', className: 'bg-na-container text-on-surface' }
}

/**
 * Read-only render of a *completed* inspection, shown to the inspector who
 * filled it in. Completed inspections are frozen (RLS blocks updates and the
 * save action rejects them), so this view intentionally has no inputs — it
 * lets inspectors review what they submitted without being able to change it.
 */
export function ReadOnlyInspectionView({
  inspectionId,
  propertyName,
  propertyAddress,
  propertyPhone,
  propertyNotes,
  inspectionDays,
  checklistName,
  inspectorName,
  completedAt,
  items,
  arrivedAt = null,
  departedAt = null,
  dwellTimeSeconds = null,
  geofenceStatus = 'pending',
  geofenceRadiusMeters = 100,
  propertyLatitude = null,
  propertyLongitude = null,
  geoLogs = [],
}: {
  inspectionId: string
  propertyName: string
  propertyAddress?: string | null
  propertyPhone?: string | null
  propertyNotes?: string | null
  /** Weekday labels only (e.g. "Monday") — reference info, not a scheduler. */
  inspectionDays?: string[]
  checklistName: string
  inspectorName: string
  completedAt: string | null
  items: ReadOnlyItem[]
  arrivedAt?: string | null
  departedAt?: string | null
  dwellTimeSeconds?: number | null
  geofenceStatus?: 'pending' | 'verified' | 'outside' | 'exempt'
  geofenceRadiusMeters?: number
  propertyLatitude?: number | null
  propertyLongitude?: number | null
  geoLogs?: GeoLogEntry[]
}) {
  const failures = items.filter((item) => item.status === 'fail')
  const grouped = new Map<string, ReadOnlyItem[]>()
  for (const item of items) {
    if (!grouped.has(item.service_category)) grouped.set(item.service_category, [])
    grouped.get(item.service_category)!.push(item)
  }

  const completedLabel = formatDateTime(completedAt)

  return (
    <div className="max-w-3xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link
          href="/inspector"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-on-surface-variant hover:text-on-surface"
        >
          <ArrowLeft size={16} />
          Back to My Inspections
        </Link>
        <a
          href={`/api/inspections/${inspectionId}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-10 items-center gap-1.5 rounded-lg border border-outline-variant px-3 text-xs font-semibold uppercase tracking-wide hover:bg-surface-container"
        >
          <Download size={14} />
          Download PDF
        </a>
      </div>
      <Card className="mb-6">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="label-tracked text-on-surface-variant">{propertyName}</p>
            <h1 className="font-headline text-xl font-bold lg:text-2xl">{checklistName}</h1>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-success-container px-3 py-1 text-xs font-semibold uppercase tracking-wide text-on-success-container">
            <CheckCircle2 size={13} />
            Resolved &amp; Closed
          </span>
        </div>
        {(propertyAddress || propertyPhone) && (
          <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-outline-variant pt-3 text-sm text-on-surface-variant">
            {propertyAddress && (
              <span className="flex items-center gap-1.5">
                <MapPin size={14} className="shrink-0 text-primary" />
                {propertyAddress}
              </span>
            )}
            {propertyPhone && (
              <a
                href={`tel:${propertyPhone}`}
                className="flex items-center gap-1.5 font-semibold text-on-surface hover:underline"
              >
                <Phone size={14} className="shrink-0 text-primary" />
                {propertyPhone}
              </a>
            )}
          </div>
        )}

        {((inspectionDays && inspectionDays.length > 0) || propertyNotes) && (
          <div className="mb-3 flex flex-col gap-2 border-t border-outline-variant pt-3">
            {inspectionDays && inspectionDays.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {inspectionDays.map((day) => (
                  <span
                    key={day}
                    className="rounded-full bg-primary-container px-3 py-1 text-xs font-semibold text-on-primary-container"
                  >
                    {day}
                  </span>
                ))}
              </div>
            )}
            {propertyNotes && (
              <p className="text-sm text-on-surface-variant">
                <span className="font-semibold text-on-surface">Notes: </span>
                {propertyNotes}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 border-t border-outline-variant pt-3 sm:grid-cols-3">
          <div>
            <p className="label-tracked text-on-surface-variant">Specialist</p>
            <p className="text-sm font-semibold">{inspectorName}</p>
          </div>
          <div>
            <p className="label-tracked text-on-surface-variant">Completed</p>
            <p className="text-sm font-semibold">{completedLabel}</p>
          </div>
          <div>
            <p className="label-tracked text-on-surface-variant">Result</p>
            <p className="text-sm font-semibold">
              {failures.length
                ? `${failures.length} failure${failures.length === 1 ? '' : 's'}`
                : 'No failures'}
            </p>
          </div>
        </div>
        <p className="mt-3 flex items-center gap-1.5 border-t border-outline-variant pt-3 text-xs text-on-surface-variant">
          <Lock size={12} />
          This inspection has been submitted and can no longer be edited.
        </p>
      </Card>

      {/* Task 6: Audit On-Site Presence & Telemetry Verification */}
      <InspectionGeoTelemetryCard
        arrivedAt={arrivedAt}
        departedAt={departedAt || completedAt}
        dwellTimeSeconds={dwellTimeSeconds}
        geofenceStatus={geofenceStatus}
        geofenceRadiusMeters={geofenceRadiusMeters}
        propertyLatitude={propertyLatitude}
        propertyLongitude={propertyLongitude}
        geoLogs={geoLogs}
      />

      <div className="flex flex-col gap-6">
        {[...grouped.entries()].map(([category, categoryItems]) => (
          <section key={category}>
            <h2 className="label-tracked mb-2 text-on-surface-variant">{category}</h2>
            <Card padded={false}>
              <div className="flex flex-col divide-y divide-outline-variant">
                {categoryItems.map((item) => {
                  const chip = statusChip(item.status)
                  return (
                    <div key={item.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-semibold">{item.item_name}</p>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${chip.className}`}
                        >
                          {chip.label}
                        </span>
                      </div>
                      {item.comment && (
                        <p className="mt-1 text-sm text-on-surface-variant">
                          <span className="font-semibold">Comments: </span>
                          {item.comment}
                        </p>
                      )}
                      {item.photoUrl ? (
                        <div className="mt-2">
                          <ZoomableImage
                            src={item.photoUrl}
                            alt={`Photo for ${item.item_name}`}
                            thumbClassName="h-40 w-full max-w-xs"
                          />
                        </div>
                      ) : item.photo_path ? (
                        <p className="mt-2 text-xs text-on-surface-variant">
                          Photo attached — preview unavailable.
                        </p>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </Card>
          </section>
        ))}
      </div>
    </div>
  )
}
