import Link from 'next/link'
import { ClipboardList, ChevronRight, Pencil, Building, ShieldCheck } from 'lucide-react'
import { CancelInspectionButton } from '@/components/CancelInspectionButton'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/StatusBadge'
import { AddressFilterBar } from '@/components/AddressFilterBar'
import { distinctValues } from '@/lib/distinct-values'
import { dueLabel } from '@/lib/schedule'
import { zonedDate, formatDate } from '@/lib/timezone'
import { getAdminScope } from '@/lib/auth/tenant-view'
import { getProfile } from '@/lib/auth/dal'

// Filtered inspection list backing the clickable dashboard stats. `?status=`
// accepts a single DB status (pending / in_progress / completed) or the
// aggregate `open` (pending + in_progress). No param = all inspections.
// `?state=` / `?county=` narrow by the joined property's location.
type Filter = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'open' | 'all'

const FILTER_TITLES: Record<Filter, string> = {
  pending: 'Pending Inspections',
  in_progress: 'In-Progress Inspections',
  completed: 'Resolved & Closed Inspections',
  cancelled: 'Cancelled Inspections',
  open: 'Open Inspections',
  all: 'All Inspections',
}

const EXPLICIT_FILTERS: Filter[] = ['pending', 'in_progress', 'completed', 'cancelled', 'open']

function parseFilter(value: string | undefined): Filter {
  if (EXPLICIT_FILTERS.includes(value as Filter)) {
    return value as Filter
  }
  return 'all'
}

export default async function AdminInspectionsPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string; state?: string; county?: string; tenant?: string }>
}) {
  const { status, state, county, tenant } = (await searchParams) ?? {}
  const filter = parseFilter(status)
  const supabase = await createClient()
  const [scope, profile] = await Promise.all([getAdminScope(), getProfile()])

  let locationQuery = supabase.from('properties').select('state, county')
  let query = supabase
    .from('inspections')
    .select(
      'id, tenant_id, status, created_at, completed_at, scheduled_for, property_id, properties!inner(name, state, county, checklist_always_available), checklist_templates(name), profiles!inspections_inspector_id_fkey(full_name), tenants(id, name)'
    )
    .order('created_at', { ascending: false })

  if (scope.tenantId) {
    locationQuery = locationQuery.eq('tenant_id', scope.tenantId)
    query = query.eq('tenant_id', scope.tenantId)
  } else if (tenant === 'hq') {
    locationQuery = locationQuery.is('tenant_id', null)
    query = query.is('tenant_id', null)
  } else if (tenant && tenant !== 'all') {
    locationQuery = locationQuery.eq('tenant_id', tenant)
    query = query.eq('tenant_id', tenant)
  }

  if (filter === 'open') {
    query = query.in('status', ['pending', 'in_progress'])
  } else if (filter !== 'all') {
    query = query.eq('status', filter)
  }
  // Filter on the joined property — `!inner` above makes this a real inner join.
  if (state) query = query.eq('properties.state', state)
  if (county) query = query.eq('properties.county', county)

  const [{ data: allProperties }, { data: inspections }, { data: allTenants }] = await Promise.all([
    locationQuery,
    query,
    profile.is_global_admin && !scope.tenantId
      ? supabase.from('tenants').select('id, name').order('name')
      : Promise.resolve({ data: null }),
  ])

  const isViewingAll = !scope.tenantId && (!tenant || tenant === 'all')

  return (
    <div>
      <PageHeader eyebrow="Inspections" title={FILTER_TITLES[filter]} />

      <p className="mb-4 text-xs text-on-surface-variant">
        Pending = assigned but not started · In Progress = started, not yet finished ·
        Resolved &amp; Closed = completed · Cancelled = called off, kept for the record.
      </p>

      <AddressFilterBar
        action="/admin/inspections"
        values={{ state, county, tenant: tenant ?? 'all' }}
        states={distinctValues(allProperties ?? [], 'state')}
        counties={distinctValues(allProperties ?? [], 'county')}
        organizations={
          profile.is_global_admin && !scope.tenantId
            ? (allTenants ?? []).map((t) => ({ id: t.id, name: t.name }))
            : undefined
        }
        defaultTenant="all"
        hidden={{ status }}
        showFilterLabel={false}
        showApplyButton={false}
        autoSubmit
      />

      {inspections?.length ? (
        <Card padded={false}>
          <div className="flex flex-col divide-y divide-outline-variant">
            {inspections.map((inspection) => {
              const property = inspection.properties as unknown as { name: string } | null
              const template = inspection.checklist_templates as unknown as { name: string } | null
              const specialist = inspection.profiles as unknown as { full_name: string } | null
              const tenantObj = inspection.tenants as unknown as { name: string } | null
              const isCompleted = inspection.status === 'completed'
              const isCancelled = inspection.status === 'cancelled'
              // Completed → full report; cancelled → the record (with Restore),
              // never the checklist; open → straight into the checklist (admins
              // can view/complete any inspection, see inspector/layout.tsx).
              const href = isCompleted
                ? `/admin/reports/${inspection.id}`
                : isCancelled
                  ? `/admin/inspections/${inspection.id}/edit`
                  : `/inspector/inspections/${inspection.id}`
              const dateLabel = formatDate(inspection.created_at)
              // A cancelled inspection has no live due date — showing one would
              // read as still-outstanding work.
              const due =
                inspection.scheduled_for && !isCompleted && !isCancelled
                  ? dueLabel(
                      zonedDate(new Date(inspection.scheduled_for)),
                      undefined,
                      (property as unknown as { checklist_always_available?: boolean })?.checklist_always_available
                    )
                  : null
              return (
                <div
                  key={inspection.id}
                  className="group flex items-center gap-3 transition hover:bg-surface-container-low"
                >
                  <Link href={href} className="min-w-0 flex-1 py-4 pl-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-headline text-lg font-semibold">
                        {property?.name ?? 'Unknown property'}
                      </p>
                      {isViewingAll && (
                        tenantObj?.name ? (
                          <span className="inline-flex items-center gap-1 rounded bg-surface-container-high px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                            <Building size={10} className="shrink-0" />
                            {tenantObj.name}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded bg-secondary-container px-1.5 py-0.5 text-[10px] font-semibold text-on-secondary-container">
                            <ShieldCheck size={10} className="shrink-0" />
                            HQ
                          </span>
                        )
                      )}
                    </div>
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
                    {/* Completed and cancelled inspections are frozen — no edit
                        path. Cancel is offered inline on open rows only. */}
                    {!isCompleted && !isCancelled && (
                      <>
                        <Link
                          href={`/admin/inspections/${inspection.id}/edit`}
                          aria-label="Edit inspection"
                          title="Edit schedule or specialist"
                          className="rounded-full p-1.5 text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                        >
                          <Pencil size={14} />
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
        <EmptyState icon={ClipboardList} title="No inspections match this filter" />
      )}
    </div>
  )
}
