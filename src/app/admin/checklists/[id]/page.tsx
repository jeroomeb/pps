import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AddChecklistItemForm } from '@/components/AddChecklistItemForm'
import { ChecklistItemReorder } from '@/components/ChecklistItemReorder'
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

  // Keyed on the item id set (not identity/order) so the client component's
  // internal reorder state only resets when items are actually added or
  // removed — a pure reorder revalidation keeps the key stable.
  const itemsKey = (items ?? [])
    .map((item) => item.id)
    .sort()
    .join('|')

  return (
    <div className="max-w-3xl">
      <PageHeader
        eyebrow="Checklists"
        title={template.name}
        backHref="/admin/checklists"
        backLabel="Checklists"
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
        <ChecklistItemReorder key={itemsKey} templateId={id} items={items ?? []} />
      </section>
    </div>
  )
}
