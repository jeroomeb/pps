import Link from 'next/link'
import { ClipboardList, ChevronRight, Pencil } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/StatusBadge'
import { AddressFilterBar, distinctValues } from '@/components/AddressFilterBar'
import { dueLabel } from '@/lib/schedule'
import { zonedDate, formatDate } from '@/lib/timezone'

// Filtered inspection list backing the clickable dashboard stats. `?status=`
// accepts a single DB status (pending / in_progress / completed) or the
// aggregate `open` (pending + in_progress). No param = all inspections.
// `?state=` / `?county=` narrow by the joined property's location.
type Filter = 'pending' | 'in_progress' | 'completed' | 'open' | 'all'

const FILTER_TITLES: Record<Filter, string> = {
  pending: 'Pending Inspections',
  in_progress: 'In-Progress Inspections',
  completed: 'Resolved & Closed Inspections',
  open: 'Open Inspections',
  all: 'All Inspections',
}

function parseFilter(value: string | undefined): Filter {
  if (value === 'pending' || value === 'in_progress' || value === 'completed' || value === 'open') {
    return value
  }
  return 'all'
}

export default async function AdminInspectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; state?: string; county?: string }>
}) {
  const { status, state, county } = await searchParams
  const filter = parseFilter(status)
  const supabase = await createClient()

  const { data: allProperties } = await supabase.from('properties').select('state, county')

  let query = supabase
    .from('inspections')
    .select(
      'id, status, created_at, completed_at, scheduled_for, property_id, properties!inner(name, state, county), checklist_templates(name), profiles(full_name)'
    )
    .order('created_at', { ascending: false })

  if (filter === 'open') {
    query = query.in('status', ['pending', 'in_progress'])
  } else if (filter !== 'all') {
    query = query.eq('status', filter)
  }
  // Filter on the joined property — `!inner` above makes this a real inner join.
  if (state) query = query.eq('properties.state', state)
  if (county) query = query.eq('properties.county', county)

  const { data: inspections } = await query

  return (
    <div>
      <PageHeader eyebrow="Inspections" title={FILTER_TITLES[filter]} />

      <p className="mb-4 text-xs text-on-surface-variant">
        Pending = assigned but not started · In Progress = started, not yet finished ·
        Resolved &amp; Closed = completed.
      </p>

      <AddressFilterBar
        action="/admin/inspections"
        values={{ state, county }}
        states={distinctValues(allProperties ?? [], 'state')}
        counties={distinctValues(allProperties ?? [], 'county')}
        hidden={{ status }}
      />

      {inspections?.length ? (
        <Card padded={false}>
          <div className="flex flex-col divide-y divide-outline-variant">
            {inspections.map((inspection) => {
              const property = inspection.properties as unknown as { name: string } | null
              const template = inspection.checklist_templates as unknown as { name: string } | null
              const specialist = inspection.profiles as unknown as { full_name: string } | null
              const isCompleted = inspection.status === 'completed'
              // Completed → full report; open → straight into the checklist
              // (admins can view/complete any inspection, see inspector/layout.tsx).
              const href = isCompleted
                ? `/admin/reports/${inspection.id}`
                : `/inspector/inspections/${inspection.id}`
              const dateLabel = formatDate(inspection.created_at)
              const due =
                inspection.scheduled_for && !isCompleted
                  ? dueLabel(zonedDate(new Date(inspection.scheduled_for)))
                  : null
              return (
                <div
                  key={inspection.id}
                  className="group flex items-center gap-3 transition hover:bg-surface-container-low"
                >
                  <Link href={href} className="min-w-0 flex-1 py-4 pl-4">
                    <p className="truncate font-headline text-lg font-semibold">
                      {property?.name ?? 'Unknown property'}
                    </p>
                    <p className="truncate text-sm text-on-surface-variant">
                      {template?.name ?? '—'} — {specialist?.full_name ?? 'Unassigned'}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      Created {dateLabel}
                      {due && (
                        <>
                          {' · '}
                          <span
                            className={`font-semibold ${
                              due.tone === 'overdue'
                                ? 'text-error'
                                : due.tone === 'today'
                                  ? 'text-primary'
                                  : 'text-on-surface-variant'
                            }`}
                          >
                            {due.text}
                          </span>
                        </>
                      )}
                    </p>
                  </Link>
                  <div className="flex shrink-0 items-center gap-2 py-4 pr-4">
                    <StatusBadge status={inspection.status} />
                    {/* Completed inspections are frozen — no edit path. */}
                    {!isCompleted && (
                      <Link
                        href={`/admin/inspections/${inspection.id}/edit`}
                        aria-label="Edit inspection"
                        title="Edit schedule or specialist"
                        className="rounded-full p-1.5 text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                      >
                        <Pencil size={14} />
                      </Link>
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
        <EmptyState icon={ClipboardList} title="No inspections match this filter" />
      )}
    </div>
  )
}
