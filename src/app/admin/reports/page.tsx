import Link from 'next/link'
import { FileText, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ResendEmailButton } from '@/components/ResendEmailButton'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { ConfirmDeleteButton } from '@/components/ConfirmDeleteButton'
import { deleteInspection } from '@/lib/actions/inspections'

export default async function ReportsPage() {
  const supabase = await createClient()

  const { data: inspections } = await supabase
    .from('inspections')
    .select(
      'id, completed_at, properties(name), checklist_templates(name), profiles(full_name)'
    )
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })

  return (
    <div>
      <PageHeader eyebrow="Completed Inspections" title="Reports" />

      {inspections?.length ? (
        <Card padded={false}>
          <div className="flex flex-col divide-y divide-outline-variant">
            {inspections.map((inspection) => {
              const property = inspection.properties as unknown as { name: string }
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
                      </p>
                      <p className="truncate text-sm text-on-surface-variant">
                        {template.name} — {inspector.full_name}
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        Completed{' '}
                        {inspection.completed_at
                          ? new Date(inspection.completed_at).toLocaleString('en-US', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })
                          : ''}
                      </p>
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
                      confirmMessage="Delete this inspection and its report?"
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
