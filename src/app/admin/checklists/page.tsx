import Link from 'next/link'
import { ClipboardList, ChevronRight, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { getAdminScope } from '@/lib/auth/tenant-view'

export default async function ChecklistsPage() {
  const supabase = await createClient()
  const scope = await getAdminScope()

  let templatesQuery = supabase
    .from('checklist_templates')
    .select('id, name, checklist_template_items(count)')
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
          <Link
            href="/admin/checklists/new"
            className="flex min-h-11 items-center gap-1.5 rounded-lg bg-primary-container px-4 font-headline text-sm font-semibold uppercase tracking-wide text-on-primary-container hover:brightness-95"
          >
            <Plus size={16} />
            New Checklist
          </Link>
        }
      />

      {templates?.length ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Link key={template.id} href={`/admin/checklists/${template.id}`}>
              <Card className="flex items-center justify-between hover:border-outline">
                <div>
                  <p className="font-headline text-lg font-semibold">{template.name}</p>
                  <p className="text-sm text-on-surface-variant">
                    {(template.checklist_template_items as unknown as { count: number }[])[0]
                      ?.count ?? 0}{' '}
                    items
                  </p>
                </div>
                <ChevronRight size={18} className="text-on-surface-variant" />
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState icon={ClipboardList} title="No checklist types yet" />
      )}
    </div>
  )
}
