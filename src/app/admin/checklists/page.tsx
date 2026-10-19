import Link from 'next/link'
import { ClipboardList, ChevronRight, Plus, Sparkles, Shield } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { getAdminScope } from '@/lib/auth/tenant-view'
import { canManageChecklists } from '@/lib/auth/checklist-permissions'
import { CloneChecklistButton } from '@/components/CloneChecklistButton'

export default async function ChecklistsPage() {
  const supabase = await createClient()
  const [scope, { allowed: canManage }] = await Promise.all([
    getAdminScope(),
    canManageChecklists(),
  ])

  let templatesQuery = supabase
    .from('checklist_templates')
    .select('id, name, enable_predictive_scoring, checklist_template_items(count)')
    .order('name')

  if (scope.tenantId) {
    const { data: access } = await supabase
      .from('tenant_checklist_access')
      .select('template_id')
      .eq('tenant_id', scope.tenantId)
    const ids = (access ?? []).map((row) => row.template_id)
    templatesQuery = ids.length
      ? templatesQuery.in('id', ids)
      : templatesQuery.eq('id', '00000000-0000-0000-0000-000000000000')
  }

  const { data: templates } = await templatesQuery

  return (
    <div>
      <PageHeader
        eyebrow="Checklist Types"
        title="Checklists"
        action={
          canManage ? (
            <Link
              href="/admin/checklists/new"
              className="flex min-h-11 items-center gap-1.5 rounded-lg bg-primary-container px-4 font-headline text-sm font-semibold uppercase tracking-wide text-on-primary-container hover:brightness-95"
            >
              <Plus size={16} />
              New Checklist
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-on-surface-variant bg-surface-container px-2.5 py-1.5 rounded-md">
              <Shield size={13} /> Managed by Super Admin (Read-Only)
            </span>
          )
        }
      />

      {templates?.length ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <div key={template.id} className="group relative">
              <Link href={`/admin/checklists/${template.id}`} className="block h-full">
                <Card className="flex h-full flex-col justify-between hover:border-outline transition-colors p-4">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-headline text-lg font-semibold text-on-surface line-clamp-1">
                        {template.name}
                      </p>
                      <ChevronRight size={18} className="text-on-surface-variant shrink-0 mt-0.5" />
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="text-xs text-on-surface-variant font-medium">
                        {(template.checklist_template_items as unknown as { count: number }[])[0]
                          ?.count ?? 0}{' '}
                        items
                      </span>

                      {template.enable_predictive_scoring !== false ? (
                        <span className="inline-flex items-center gap-1 rounded bg-secondary-container/60 px-1.5 py-0.5 text-[10px] font-medium text-on-surface">
                          <Sparkles size={11} className="text-primary" /> Risk Scoring On
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded bg-surface-container px-1.5 py-0.5 text-[10px] text-on-surface-variant">
                          Scoring Off
                        </span>
                      )}
                    </div>
                  </div>

                  {canManage && (
                    <div className="mt-3 border-t border-outline-variant/50 pt-2 flex justify-end">
                      <CloneChecklistButton
                        templateId={template.id}
                        templateName={template.name}
                        compact
                      />
                    </div>
                  )}
                </Card>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={ClipboardList} title="No checklist types yet" />
      )}
    </div>
  )
}
