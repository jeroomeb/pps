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
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { NewInspectionForm } from '@/components/NewInspectionForm'
import { StatusBadge } from '@/components/StatusBadge'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { ConfirmDeleteButton } from '@/components/ConfirmDeleteButton'
import { deleteProperty } from '@/lib/actions/properties'
import { parseSchedule, scheduleEntryLabel } from '@/lib/schedule'

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: property }, { data: templates }, { data: inspectors }, { data: inspections }] =
    await Promise.all([
      supabase.from('properties').select('*').eq('id', id).single(),
      supabase.from('checklist_templates').select('id, name').order('name'),
      supabase
        .from('profiles')
        .select('id, full_name, role')
        .order('full_name'),
      supabase
        .from('inspections')
        .select(
          'id, status, created_at, completed_at, checklist_templates(name), profiles(full_name)'
        )
        .eq('property_id', id)
        .order('created_at', { ascending: false }),
    ])

  if (!property) {
    notFound()
  }

  const completedCount = (inspections ?? []).filter((i) => i.status === 'completed').length
  const activeCount = (inspections ?? []).length - completedCount

  const deletePropertyWithId = deleteProperty.bind(null, id)

  // Failure counts live at the inspection/report level only — not on the
  // property overview (per client request).
  const stats = [
    { label: 'Total Inspections', value: inspections?.length ?? 0, icon: ClipboardList, tone: '' },
    { label: 'In Progress', value: activeCount, icon: Clock, tone: '' },
    { label: 'Completed', value: completedCount, icon: ClipboardCheck, tone: '' },
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
            <span className="flex items-center gap-1">
              <Mail size={13} /> {property.email}
            </span>
            {property.phone && (
              <span className="flex items-center gap-1">
                <Phone size={13} /> {property.phone}
              </span>
            )}
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
              confirmMessage="Delete this property and all of its inspections?"
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
          const isError = stat.tone === 'error'
          return (
            <Card
              key={stat.label}
              className={`flex items-center justify-between ${isError ? 'border-error/40 bg-error-container/30' : ''}`}
            >
              <div>
                <p className={`label-tracked ${isError ? 'text-on-error-container' : 'text-on-surface-variant'}`}>
                  {stat.label}
                </p>
                <p className={`font-headline text-2xl font-bold ${isError ? 'text-on-error-container' : ''}`}>
                  {stat.value}
                </p>
              </div>
              <Icon size={24} className={isError ? 'text-error' : 'text-primary'} />
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.4fr]">
        <section>
          <h2 className="mb-3 font-headline text-lg font-semibold">New Inspection</h2>
          <NewInspectionForm
            propertyId={id}
            templates={templates ?? []}
            inspectors={inspectors ?? []}
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
                  const href =
                    inspection.status === 'completed'
                      ? `/admin/reports/${inspection.id}`
                      : `/inspector/inspections/${inspection.id}`
                  const dateLabel = new Date(
                    inspection.completed_at ?? inspection.created_at
                  ).toLocaleDateString('en-US', { dateStyle: 'medium' })
                  return (
                    <Link
                      key={inspection.id}
                      href={href}
                      className="group flex items-center justify-between gap-3 p-4 transition hover:bg-surface-container-low"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{template?.name ?? 'Checklist'}</p>
                        <p className="truncate text-sm text-on-surface-variant">
                          {inspector?.full_name ?? 'Unassigned'} · {dateLabel}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <StatusBadge status={inspection.status} />
                        <ChevronRight
                          size={16}
                          className="text-on-surface-variant transition group-hover:translate-x-0.5"
                        />
                      </div>
                    </Link>
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
