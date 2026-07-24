import Link from 'next/link'
import { ClipboardList, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/StatusBadge'

// Filtered inspection list backing the clickable dashboard stats. `?status=`
// accepts a single DB status (pending / in_progress / completed) or the
// aggregate `open` (pending + in_progress). No param = all inspections.
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
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const filter = parseFilter(status)
  const supabase = await createClient()

  let query = supabase
    .from('inspections')
    .select(
      'id, status, created_at, completed_at, property_id, properties(name), checklist_templates(name), profiles(full_name)'
    )
    .order('created_at', { ascending: false })

  if (filter === 'open') {
    query = query.in('status', ['pending', 'in_progress'])
  } else if (filter !== 'all') {
    query = query.eq('status', filter)
  }

  const { data: inspections } = await query

  return (
    <div>
      <PageHeader eyebrow="Inspections" title={FILTER_TITLES[filter]} />

      <p className="mb-4 text-xs text-on-surface-variant">
        Pending = assigned but not started · In Progress = started, not yet finished ·
        Resolved &amp; Closed = completed.
      </p>

      {inspections?.length ? (
        <Card padded={false}>
          <div className="flex flex-col divide-y divide-outline-variant">
            {inspections.map((inspection) => {
              const property = inspection.properties as unknown as { name: string } | null
              const template = inspection.checklist_templates as unknown as { name: string } | null
              const specialist = inspection.profiles as unknown as { full_name: string } | null
              // Completed → full report; open → the property's detail page,
              // which lists its inspections (admins can't open the inspector-
              // scoped active checklist directly).
              const href =
                inspection.status === 'completed'
                  ? `/admin/reports/${inspection.id}`
                  : `/admin/properties/${inspection.property_id}`
              const dateLabel = new Date(inspection.created_at).toLocaleDateString('en-US', {
                dateStyle: 'medium',
              })
              return (
                <Link
                  key={inspection.id}
                  href={href}
                  className="group flex items-center gap-3 p-4 transition hover:bg-surface-container-low"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-headline text-lg font-semibold">
                      {property?.name ?? 'Unknown property'}
                    </p>
                    <p className="truncate text-sm text-on-surface-variant">
                      {template?.name ?? '—'} — {specialist?.full_name ?? 'Unassigned'}
                    </p>
                    <p className="text-xs text-on-surface-variant">Created {dateLabel}</p>
                  </div>
                  <StatusBadge status={inspection.status} />
                  <ChevronRight
                    size={16}
                    className="shrink-0 text-on-surface-variant transition group-hover:translate-x-0.5"
                  />
                </Link>
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
