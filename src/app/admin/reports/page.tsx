import Link from 'next/link'
import { FileText, ChevronRight, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ResendEmailButton } from '@/components/ResendEmailButton'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { ConfirmDeleteButton } from '@/components/ConfirmDeleteButton'
import { deleteInspection } from '@/lib/actions/inspections'
import { formatDateTime } from '@/lib/timezone'

export default async function ReportsPage() {
  const supabase = await createClient()

  const { data: inspections } = await supabase
    .from('inspections')
    .select(
      'id, completed_at, email_status, email_error, properties(name, human_id), checklist_templates(name), profiles(full_name)'
    )
    .eq('status', 'completed')
    .order('completed_at', { ascending: false, nullsFirst: false })

  return (
    <div>
      <PageHeader eyebrow="Completed Inspections" title="Reports" />

      {inspections?.length ? (
        <Card padded={false}>
          <div className="flex flex-col divide-y divide-outline-variant">
            {inspections.map((inspection) => {
              const property = inspection.properties as unknown as {
                name: string
                human_id: string | null
              }
              const template = inspection.checklist_templates as unknown as { name: string }
              const inspector = inspection.profiles as unknown as { full_name: string }
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
                      <p className="truncate font-headline text-lg font-semibold">
                        {property.name}
                        {property.human_id && (
                          <span className="ml-2 font-mono text-xs font-normal text-on-surface-variant">
                            {property.human_id}
                          </span>
                        )}
                      </p>
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
        <EmptyState icon={FileText} title="No completed inspections yet" />
      )}
    </div>
  )
}
