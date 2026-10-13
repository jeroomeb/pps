import Link from 'next/link'
import { FileText, ChevronRight, AlertTriangle, Building, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ResendEmailButton } from '@/components/ResendEmailButton'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { AddressFilterBar } from '@/components/AddressFilterBar'
import { ConfirmDeleteButton } from '@/components/ConfirmDeleteButton'
import { deleteInspection } from '@/lib/actions/inspections'
import { formatDateTime } from '@/lib/timezone'
import { getAdminScope } from '@/lib/auth/tenant-view'
import { getProfile } from '@/lib/auth/dal'

export default async function ReportsPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; tenant?: string }>
}) {
  const { q, tenant } = (await searchParams) ?? {}
  const supabase = await createClient()
  const scope = await getAdminScope()
  const profile = await getProfile()

  let reportsQuery = supabase
    .from('inspections')
    .select(
      'id, tenant_id, completed_at, email_status, email_error, properties(name, human_id), checklist_templates(name), profiles!inspections_inspector_id_fkey(full_name), tenants(id, name)'
    )
    .eq('status', 'completed')
    .order('completed_at', { ascending: false, nullsFirst: false })

  if (scope.tenantId) {
    reportsQuery = reportsQuery.eq('tenant_id', scope.tenantId)
  } else if (tenant === 'hq') {
    reportsQuery = reportsQuery.is('tenant_id', null)
  } else if (tenant && tenant !== 'all') {
    reportsQuery = reportsQuery.eq('tenant_id', tenant)
  } else {
    // Default: "all" or undefined -> Overall platform completed reports across all organizations
  }

  const [{ data: rawInspections }, { data: allTenants }] = await Promise.all([
    reportsQuery,
    profile.is_global_admin && !scope.tenantId
      ? supabase.from('tenants').select('id, name').order('name')
      : Promise.resolve({ data: null }),
  ])

  let inspections = rawInspections ?? []
  if (q && q.trim()) {
    const queryLower = q.trim().toLowerCase()
    inspections = inspections.filter((inspection) => {
      const prop = inspection.properties as unknown as { name?: string; human_id?: string | null } | null
      const template = inspection.checklist_templates as unknown as { name?: string } | null
      const inspector = inspection.profiles as unknown as { full_name?: string } | null
      const tenantObj = inspection.tenants as unknown as { name?: string } | null

      return Boolean(
        (prop?.name && prop.name.toLowerCase().includes(queryLower)) ||
        (prop?.human_id && prop.human_id.toLowerCase().includes(queryLower)) ||
        (template?.name && template.name.toLowerCase().includes(queryLower)) ||
        (inspector?.full_name && inspector.full_name.toLowerCase().includes(queryLower)) ||
        (tenantObj?.name && tenantObj.name.toLowerCase().includes(queryLower))
      )
    })
  }

  const isViewingAll = !scope.tenantId && (!tenant || tenant === 'all')

  return (
    <div>
      <PageHeader eyebrow="Completed Inspections" title="Reports" />

      <AddressFilterBar
        action="/admin/reports"
        values={{ q, tenant: tenant ?? 'all' }}
        organizations={
          profile.is_global_admin && !scope.tenantId
            ? (allTenants ?? []).map((t) => ({ id: t.id, name: t.name }))
            : undefined
        }
        defaultTenant="all"
        searchPlaceholder="Search by property, ID, checklist, or specialist…"
      />

      {inspections.length ? (
        <Card padded={false}>
          <div className="flex flex-col divide-y divide-outline-variant">
            {inspections.map((inspection) => {
              const property = inspection.properties as unknown as {
                name: string
                human_id: string | null
              }
              const template = inspection.checklist_templates as unknown as { name: string }
              const inspector = inspection.profiles as unknown as { full_name: string }
              const tenantObj = inspection.tenants as unknown as { name: string } | null
              return (
                <div
                  key={inspection.id}
                  className="flex items-center gap-3 p-4 transition hover:bg-surface-container-low"
                >
                  <Link
                    href={`/admin/reports/${inspection.id}`}
                    className="group flex min-w-0 flex-1 items-center gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="truncate font-headline text-lg font-semibold">
                          {property.name}
                        </p>
                        {property.human_id && (
                          <span className="font-mono text-xs font-normal text-on-surface-variant">
                            {property.human_id}
                          </span>
                        )}
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
                        {template.name} — {inspector.full_name}
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        Completed {formatDateTime(inspection.completed_at)}
                      </p>
                      {inspection.email_status === 'failed' && (
                        <p
                          className="mt-1 flex items-center gap-1 text-xs font-semibold text-error"
                          title={inspection.email_error ?? undefined}
                        >
                          <AlertTriangle size={12} />
                          Report email failed to send
                        </p>
                      )}
                    </div>
                    <ChevronRight
                      size={16}
                      className="shrink-0 text-on-surface-variant transition group-hover:translate-x-0.5"
                    />
                  </Link>
                  <div className="flex shrink-0 gap-2">
                    <ResendEmailButton inspectionId={inspection.id} />
                    <ConfirmDeleteButton
                      action={deleteInspection.bind(null, inspection.id)}
                      confirmMessage="Permanently delete this completed, already-emailed report and every photo in it? This cannot be undone."
                      iconOnly
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      ) : (
        <EmptyState
          icon={FileText}
          title={q || (tenant && tenant !== 'all') ? 'No matching reports found' : 'No completed inspections yet'}
          description={
            q || (tenant && tenant !== 'all')
              ? 'Try adjusting your search query or organization filter.'
              : undefined
          }
        />
      )}
    </div>
  )
}
