import { notFound } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { AddChecklistItemForm } from '@/components/AddChecklistItemForm'
import { DeleteItemButton } from '@/components/DeleteItemButton'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { RenameTemplateForm } from '@/components/RenameTemplateForm'
import { ConfirmDeleteButton } from '@/components/ConfirmDeleteButton'
import { deleteTemplate } from '@/lib/actions/checklists'

export default async function ChecklistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: template }, { data: items }] = await Promise.all([
    supabase.from('checklist_templates').select('id, name').eq('id', id).single(),
    supabase
      .from('checklist_template_items')
      .select('id, service_category, item_name, description')
      .eq('template_id', id)
      .order('sort_order'),
  ])

  if (!template) {
    notFound()
  }

  const grouped = new Map<string, typeof items>()
  for (const item of items ?? []) {
    if (!grouped.has(item.service_category)) grouped.set(item.service_category, [])
    grouped.get(item.service_category)!.push(item)
  }

  return (
    <div className="max-w-3xl">
      <PageHeader
        eyebrow="Checklists"
        title={template.name}
        action={
          <>
            <RenameTemplateForm templateId={id} currentName={template.name} />
            <ConfirmDeleteButton
              action={deleteTemplate.bind(null, id)}
              confirmMessage="Delete this checklist type?"
              redirectTo="/admin/checklists"
            />
          </>
        }
      />

      <section className="mb-8">
        <h2 className="mb-3 font-headline text-lg font-semibold">Add Item</h2>
        <AddChecklistItemForm templateId={id} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-headline text-lg font-semibold">
          Checklist Items ({items?.length ?? 0})
        </h2>
        {[...grouped.entries()].map(([category, categoryItems]) => (
          <details key={category} className="group" open={grouped.size <= 3}>
            <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3">
              <span className="label-tracked">
                {category} ({categoryItems!.length})
              </span>
              <ChevronDown size={16} className="transition group-open:rotate-180" />
            </summary>
            <div className="flex flex-col gap-2 py-3">
              {categoryItems!.map((item) => (
                <Card key={item.id} className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{item.item_name}</p>
                    {item.description && (
                      <p className="text-sm text-on-surface-variant">{item.description}</p>
                    )}
                  </div>
                  <DeleteItemButton itemId={item.id} templateId={id} />
                </Card>
              ))}
            </div>
          </details>
        ))}
        {!items?.length && (
          <p className="text-sm text-on-surface-variant">No items yet — add the first one above.</p>
        )}
      </section>
    </div>
  )
}
