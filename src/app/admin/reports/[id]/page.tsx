import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Download, AlertTriangle } from 'lucide-react'
import Image from 'next/image'
import { createAdminClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/dal'
import { Card } from '@/components/ui/Card'
import { ResendEmailButton } from '@/components/ResendEmailButton'
import { ZoomableImage } from '@/components/ZoomableImage'
import { InspectionGeoTelemetryCard, type GeoLogEntry } from '@/components/InspectionGeoTelemetryCard'
import { formatDateTime } from '@/lib/timezone'

export default async function ReportViewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // This page queries with the service-role client, so it must enforce its
  // own auth — the layout's requireRole is not a guaranteed boundary.
  await requireRole('admin')
  const { id } = await params
  const admin = createAdminClient()

  const { data: inspection } = await admin
    .from('inspections')
    .select(
      'id, status, created_at, completed_at, scheduled_for, email_status, email_error, arrived_at, departed_at, dwell_time_seconds, geofence_status, properties(name, address, email, phone, human_id, enable_gps_geofencing, latitude, longitude, geofence_radius_meters), checklist_templates(name), profiles!inspections_inspector_id_fkey(full_name)'
    )
    .eq('id', id)
    .single()

  if (!inspection || inspection.status !== 'completed') {
    notFound()
  }

  const [{ data: items }, { data: geoLogs }] = await Promise.all([
    admin
      .from('inspection_items')
      .select('id, service_category, item_name, description, status, comment, photo_path, sort_order')
      .eq('inspection_id', id)
      .order('sort_order'),
    admin
      .from('inspection_geo_logs')
      .select('*')
      .eq('inspection_id', id)
      .order('logged_at', { ascending: true }),
  ])

  const itemsWithUrls = await Promise.all(
    (items ?? []).map(async (item) => {
      let photoUrl: string | null = null
      if (item.photo_path) {
        const { data } = await admin.storage.from('photos').createSignedUrl(item.photo_path, 3600)
        photoUrl = data?.signedUrl ?? null
      }
      return { ...item, photoUrl }
    })
  )

  const property = inspection.properties as unknown as {
    name: string
    address: string
    email: string
    phone: string | null
    human_id: string | null
    enable_gps_geofencing: boolean
    latitude: number | null
    longitude: number | null
    geofence_radius_meters: number
  }
  const template = inspection.checklist_templates as unknown as { name: string }
  const inspector = inspection.profiles as unknown as { full_name: string }
  const failures = itemsWithUrls.filter((item) => item.status === 'fail')
  const passOrNa = itemsWithUrls.filter((item) => item.status !== 'fail')

  const completedAtLabel = formatDateTime(inspection.completed_at)

  const grouped = new Map<string, typeof passOrNa>()
  for (const item of passOrNa) {
    if (!grouped.has(item.service_category)) grouped.set(item.service_category, [])
    grouped.get(item.service_category)!.push(item)
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/admin/reports"
          className="flex items-center gap-1.5 text-sm font-semibold text-on-surface-variant hover:text-on-surface"
        >
          <ArrowLeft size={16} />
          Back to Reports
        </Link>
        <div className="flex gap-2">
          <a
            href={`/api/inspections/${id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-10 items-center gap-1.5 rounded-lg border border-outline-variant px-3 text-xs font-semibold uppercase tracking-wide hover:bg-surface-container"
          >
            <Download size={14} />
            Download PDF
          </a>
          <ResendEmailButton inspectionId={id} />
        </div>
      </div>

      <Card padded={false} className="p-6 lg:p-10">
        <div className="mb-6 flex items-start justify-between border-b border-outline-variant pb-6">
          <div className="flex items-center gap-3">
            <Image src="/logo-sm.png" alt="" width={40} height={40} className="rounded" />
            <div>
              <p className="font-headline text-lg font-bold">Amenity Op&apos;s</p>
              <p className="text-sm text-on-surface-variant">Operations, Asset and Logistics Report</p>
            </div>
          </div>
          <p className="text-xs text-on-surface-variant">
            Report ID: #{property.human_id ?? id.slice(0, 8).toUpperCase()}
          </p>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4 rounded-lg bg-surface-container-low p-4 sm:grid-cols-4">
          <div>
            <p className="label-tracked text-on-surface-variant">Property</p>
            <p className="text-sm font-semibold">{property.name}</p>
          </div>
          <div>
            <p className="label-tracked text-on-surface-variant">Address</p>
            <p className="text-sm font-semibold">{property.address}</p>
          </div>
          {property.phone && (
            <div>
              <p className="label-tracked text-on-surface-variant">Phone</p>
              <p className="text-sm font-semibold">{property.phone}</p>
            </div>
          )}
          <div>
            <p className="label-tracked text-on-surface-variant">Checklist</p>
            <p className="text-sm font-semibold">{template.name}</p>
          </div>
          <div>
            <p className="label-tracked text-on-surface-variant">Specialist</p>
            <p className="text-sm font-semibold">{inspector.full_name}</p>
          </div>
          <div>
            <p className="label-tracked text-on-surface-variant">Completed</p>
            <p className="text-sm font-semibold">{completedAtLabel}</p>
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

        {/* Task 6: Audit On-Site Presence & Telemetry Verification */}
        <InspectionGeoTelemetryCard
          arrivedAt={inspection.arrived_at}
          departedAt={inspection.departed_at || inspection.completed_at}
          dwellTimeSeconds={inspection.dwell_time_seconds}
          geofenceStatus={inspection.geofence_status}
          geofenceRadiusMeters={property.geofence_radius_meters ?? 100}
          propertyLatitude={property.latitude}
          propertyLongitude={property.longitude}
          geoLogs={(geoLogs as GeoLogEntry[]) ?? []}
        />

        {failures.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 flex items-center gap-2 font-headline text-lg font-bold text-error">
              <AlertTriangle size={18} />
              Failures ({failures.length})
            </h2>
            <div className="flex flex-col gap-3">
              {failures.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-error/40 bg-error-container/20 p-4"
                >
                  <div className="flex flex-col gap-4 sm:flex-row">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <p className="font-semibold">{item.item_name}</p>
                        <span className="shrink-0 rounded-full bg-error px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                          Fail
                        </span>
                      </div>
                      <p className="mb-2 text-xs uppercase tracking-wide text-on-surface-variant">
                        {item.service_category}
                      </p>
                      {item.comment && (
                        <p className="text-sm">
                          <span className="font-semibold">Specialist comments: </span>
                          {item.comment}
                        </p>
                      )}
                    </div>
                    {item.photoUrl ? (
                      <ZoomableImage
                        src={item.photoUrl}
                        alt={`Photo evidence for ${item.item_name}`}
                        thumbClassName="h-40 w-full sm:h-28 sm:w-40 sm:shrink-0"
                      />
                    ) : item.photo_path ? (
                      <p className="text-xs text-on-surface-variant sm:self-center">
                        Photo attached — preview unavailable.
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-3 font-headline text-lg font-semibold">
            {failures.length ? 'All Other Items' : 'Inspection Items'}
          </h2>
          <div className="flex flex-col gap-4">
            {[...grouped.entries()].map(([category, categoryItems]) => (
              <div key={category}>
                <p className="label-tracked mb-2 text-on-surface-variant">{category}</p>
                <div className="flex flex-col divide-y divide-outline-variant rounded-lg border border-outline-variant">
                  {categoryItems.map((item) => (
                    <div key={item.id} className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium">{item.item_name}</span>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide sm:hidden ${
                              item.status === 'pass'
                                ? 'bg-success-container text-on-success-container'
                                : 'bg-na-container text-on-na-container'
                            }`}
                          >
                            {item.status ?? 'N/A'}
                          </span>
                        </div>
                        {item.description && (
                          <p className="mt-0.5 text-xs text-on-surface-variant">{item.description}</p>
                        )}
                        {item.comment && (
                          <p className="mt-1 text-sm">
                            <span className="font-semibold">Specialist comments: </span>
                            {item.comment}
                          </p>
                        )}
                        {item.photoUrl ? (
                          <div className="mt-2">
                            <ZoomableImage
                              src={item.photoUrl}
                              alt={`Photo for ${item.item_name}`}
                              thumbClassName="h-32 w-full max-w-xs"
                            />
                          </div>
                        ) : item.photo_path ? (
                          <p className="mt-2 text-xs text-on-surface-variant">
                            Photo attached — preview unavailable.
                          </p>
                        ) : null}
                      </div>
                      <span
                        className={`hidden shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide sm:inline-block ${
                          item.status === 'pass'
                            ? 'bg-success-container text-on-success-container'
                            : 'bg-na-container text-on-na-container'
                        }`}
                      >
                        {item.status ?? 'N/A'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-10 border-t border-outline-variant pt-4 text-xs text-on-surface-variant">
          {inspection.email_status === 'failed' ? (
            <span className="flex items-center gap-1.5 font-semibold text-error">
              <AlertTriangle size={13} />
              Certified inspection report generated by Amenity Op&apos;s — the email to{' '}
              {property.email} failed to send. Use Resend Email above to retry.
            </span>
          ) : (
            <>Certified inspection report generated by Amenity Op&apos;s. Sent to {property.email}.</>
          )}
        </div>
      </Card>
    </div>
  )
}
