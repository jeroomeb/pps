import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  Pencil,
  ClipboardList,
  MapPin,
  Mail,
  Phone,
  CalendarDays,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Landmark,
  Shield,
  Navigation,
  CircleDollarSign,
  Pencil as PencilIcon,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { NewInspectionForm } from '@/components/NewInspectionForm'
import { StatusBadge } from '@/components/StatusBadge'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { ConfirmDeleteButton } from '@/components/ConfirmDeleteButton'
import { CancelInspectionButton } from '@/components/CancelInspectionButton'
import { PropertyRosterManager, type AssignedSpecialist, type CandidateSpecialist } from '@/components/PropertyRosterManager'
import { deleteProperty } from '@/lib/actions/properties'
import { parseSchedule, scheduleEntryLabel, dueLabel } from '@/lib/schedule'
import { zonedDate, formatDate, timeZoneAbbreviation } from '@/lib/timezone'

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [
    { data: property },
    { data: templates },
    { data: allProfiles },
    { data: inspections },
    { data: assignments },
  ] = await Promise.all([
    supabase.from('properties').select('*').eq('id', id).single(),
    supabase.from('checklist_templates').select('id, name').order('name'),
    supabase
      .from('profiles')
      .select('id, full_name, role, state, zip, county, human_id, is_contractor, email, phone, status')
      .order('full_name'),
    supabase
      .from('inspections')
      .select(
        'id, status, created_at, completed_at, scheduled_for, checklist_templates(name), profiles!inspections_inspector_id_fkey(full_name)'
      )
      .eq('property_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('property_specialist_assignments')
      .select('id, specialist_id, role, created_at')
      .eq('property_id', id)
      .order('created_at', { ascending: true }),
  ])

  if (!property) {
    notFound()
  }

  const profileMap = new Map((allProfiles ?? []).map((p) => [p.id, p]))

  const assignedSpecialists: AssignedSpecialist[] = (assignments ?? []).map((a) => {
    const prof = profileMap.get(a.specialist_id)
    return {
      id: a.id,
      specialistId: a.specialist_id,
      fullName: prof?.full_name ?? 'Unknown Specialist',
      email: prof?.email ?? null,
      phone: prof?.phone ?? null,
      humanId: prof?.human_id ?? null,
      role: a.role,
      isContractor: prof?.is_contractor ?? false,
      assignedAt: a.created_at,
    }
  })

  const availableCandidates: CandidateSpecialist[] = (allProfiles ?? [])
    .filter((ins) => ins.status !== 'inactive')
    .map((ins) => ({
      id: ins.id,
      fullName: ins.full_name,
      humanId: ins.human_id,
      role: ins.role,
      isContractor: ins.is_contractor ?? false,
    }))

  const activeInspectors = (allProfiles ?? []).filter((ins) => ins.status !== 'inactive')

  const completedCount = (inspections ?? []).filter((i) => i.status === 'completed').length
  // "In Progress" here previously counted pending + in_progress together
  // (labeled activeCount), which disagreed with the dashboard's In Progress
  // card (status === 'in_progress' only) for the same data.
  const inProgressCount = (inspections ?? []).filter((i) => i.status === 'in_progress').length

  const deletePropertyWithId = deleteProperty.bind(null, id)

  // Failure counts live at the inspection/report level only — not on the
  // property overview (per client request).
  const stats = [
    { label: 'Total Inspections', value: inspections?.length ?? 0, icon: ClipboardList },
    { label: 'In Progress', value: inProgressCount, icon: Clock },
    { label: 'Completed', value: completedCount, icon: ClipboardCheck },
  ]

  return (
    <div>
      <PageHeader
        eyebrow="Property"
        title={property.name}
        backHref="/admin/properties"
        backLabel="Properties"
        subtitle={
          <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {property.human_id && (
              <span className="font-mono font-semibold">{property.human_id}</span>
            )}
            <span className="flex items-center gap-1">
              <MapPin size={13} /> {property.address}
            </span>
            {property.county && (
              <span className="flex items-center gap-1">
                <Landmark size={13} /> {property.county} County
              </span>
            )}
            <span className="flex items-center gap-1">
              <Mail size={13} /> {property.email}
            </span>
            {property.phone && (
              <span className="flex items-center gap-1">
                <Phone size={13} /> {property.phone}
              </span>
            )}
            <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold ${
              property.require_id_photo !== false
                ? 'bg-primary-container/40 text-on-surface'
                : 'bg-surface-container-highest text-on-surface-variant'
            }`}>
              <Shield size={12} className={property.require_id_photo !== false ? 'text-primary' : ''} />
              {property.require_id_photo !== false ? 'Photo ID Required' : 'Photo ID Exempt'}
            </span>
            <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold ${
              property.enable_gps_geofencing !== false
                ? 'bg-emerald-100 text-emerald-950'
                : 'bg-surface-container-highest text-on-surface-variant'
            }`}>
              <Navigation size={12} className={property.enable_gps_geofencing !== false ? 'text-emerald-700' : ''} />
              {property.enable_gps_geofencing !== false
                ? `GPS Geofenced (${property.geofence_radius_meters ?? 100}m)`
                : 'GPS Tracking Exempt'}
            </span>
            <span className="inline-flex items-center gap-1 rounded bg-surface-container-highest px-2 py-0.5 text-[11px] font-semibold text-on-surface">
              <CircleDollarSign size={12} className="text-primary" />
              {property.payout_tier === 'tier_1'
                ? 'Tier 1 (Baseline)'
                : property.payout_tier === 'tier_3'
                  ? 'Tier 3 (Sovereign)'
                  : property.payout_tier === 'custom' && property.custom_payout_rate
                    ? `$${Number(property.custom_payout_rate).toFixed(2)} Custom Rate`
                    : 'Tier 2 (Premier)'}
            </span>
          </span>
        }
        action={
          <>
            <Link
              href={`/admin/properties/${id}/edit`}
              className="flex min-h-10 items-center gap-1.5 rounded-lg border border-outline-variant px-3 text-xs font-semibold uppercase tracking-wide hover:bg-surface-container"
            >
              <Pencil size={14} />
              Edit
            </Link>
            <ConfirmDeleteButton
              action={deletePropertyWithId}
              confirmMessage="Delete this property and ALL of its inspections — including completed, already-emailed reports and every photo? This cannot be undone."
              redirectTo="/admin/properties"
            />
          </>
        }
      />

      {(() => {
        const schedule = parseSchedule(property.required_schedule)
        if (!schedule.length && !property.notes) return null
        return (
          <Card className="mb-8 flex flex-col gap-3">
            {schedule.length > 0 && (
              <div>
                <p className="label-tracked mb-1.5 flex items-center gap-1.5 text-on-surface-variant">
                  <CalendarDays size={13} /> Required Inspection Days
                </p>
                <div className="flex flex-wrap gap-2">
                  {schedule.map((entry) => (
                    <span
                      key={`${entry.ordinal}-${entry.weekday}`}
                      className="rounded-full bg-primary-container px-3 py-1 text-xs font-semibold text-on-primary-container"
                    >
                      {scheduleEntryLabel(entry)}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {property.notes && (
              <div>
                <p className="label-tracked mb-1 text-on-surface-variant">Notes</p>
                <p className="text-sm">{property.notes}</p>
              </div>
            )}
          </Card>
        )
      })()}

      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="flex items-center justify-between">
              <div>
                <p className="label-tracked text-on-surface-variant">{stat.label}</p>
                <p className="font-headline text-2xl font-bold">{stat.value}</p>
              </div>
              <Icon size={24} className="text-primary" />
            </Card>
          )
        })}
      </div>

      {/* Property Staff Roster Manager */}
      <div className="mb-8">
        <PropertyRosterManager
          propertyId={id}
          assignedSpecialists={assignedSpecialists}
          availableCandidates={availableCandidates}
          requireIdPhotoInitial={property.require_id_photo ?? true}
        />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.4fr]">
        <section>
          <h2 className="mb-3 font-headline text-lg font-semibold">New Inspection</h2>
          <NewInspectionForm
            propertyId={id}
            // Passed so the specialist list can rank by proximity to this property.
            properties={[
              {
                id,
                name: property.name,
                state: property.state,
                zip: property.zip,
                county: property.county,
              },
            ]}
            templates={templates ?? []}
            inspectors={activeInspectors.map((ins) => {
              const rosterMatch = assignedSpecialists.find((a) => a.specialistId === ins.id)
              return {
                id: ins.id,
                full_name: ins.full_name,
                role: ins.role,
                state: ins.state,
                zip: ins.zip,
                county: ins.county,
                rosterRole: rosterMatch?.role ?? null,
              }
            })}
            timeZoneLabel={timeZoneAbbreviation()}
          />
        </section>

        <section>
          <h2 className="mb-3 font-headline text-lg font-semibold">Inspections</h2>
          {inspections?.length ? (
            <Card padded={false}>
              <div className="flex flex-col divide-y divide-outline-variant">
                {inspections.map((inspection) => {
                  const template = inspection.checklist_templates as unknown as {
                    name: string
                  } | null
                  const inspector = inspection.profiles as unknown as {
                    full_name: string
                  } | null
                  const isCompleted = inspection.status === 'completed'
                  const isCancelled = inspection.status === 'cancelled'
                  // Cancelled → the record (with Restore), never the checklist.
                  const href = isCompleted
                    ? `/admin/reports/${inspection.id}`
                    : isCancelled
                      ? `/admin/inspections/${inspection.id}/edit`
                      : `/inspector/inspections/${inspection.id}`
                  const dateLabel = formatDate(inspection.completed_at ?? inspection.created_at)
                  const dateKind = inspection.completed_at ? 'Completed' : 'Created'
                  // A cancelled inspection has no live due date — showing one
                  // would read as still-outstanding work.
                  const due =
                    inspection.scheduled_for && !isCompleted && !isCancelled
                      ? dueLabel(zonedDate(new Date(inspection.scheduled_for)))
                      : null
                  return (
                    <div
                      key={inspection.id}
                      className="group flex items-center justify-between gap-3 transition hover:bg-surface-container-low"
                    >
                      <Link href={href} className="min-w-0 flex-1 py-4 pl-4">
                        <p className="truncate font-semibold">{template?.name ?? 'Checklist'}</p>
                        <p className="truncate text-sm text-on-surface-variant">
                          {inspector?.full_name ?? 'Unassigned'} · {dateKind} {dateLabel}
                        </p>
                        {due && (
                          <p
                            className={`truncate text-xs font-semibold ${
                              due.tone === 'overdue'
                                ? 'text-error'
                                : due.tone === 'today'
                                  ? 'text-primary'
                                  : 'text-on-surface-variant'
                            }`}
                          >
                            {due.text}
                          </p>
                        )}
                      </Link>
                      <div className="flex shrink-0 items-center gap-2 py-4 pr-4">
                        <StatusBadge status={inspection.status} />
                        {/* Completed and cancelled inspections are frozen — no
                            edit path. Cancel is offered on open rows only. */}
                        {!isCompleted && !isCancelled && (
                          <>
                            <Link
                              href={`/admin/inspections/${inspection.id}/edit`}
                              aria-label="Edit inspection"
                              title="Edit schedule or specialist"
                              className="rounded-full p-1.5 text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                            >
                              <PencilIcon size={14} />
                            </Link>
                            <CancelInspectionButton inspectionId={inspection.id} iconOnly />
                          </>
                        )}
                        <ChevronRight
                          size={16}
                          className="text-on-surface-variant transition group-hover:translate-x-0.5"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          ) : (
            <EmptyState
              icon={ClipboardList}
              title="No inspections yet"
              description="Create one using the form to the left."
            />
          )}
        </section>
      </div>
    </div>
  )
}
