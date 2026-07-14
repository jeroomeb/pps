import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AddChecklistItemForm } from '@/components/AddChecklistItemForm'
import { DeleteItemButton } from '@/components/DeleteItemButton'

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
    <div className="mx-auto max-w-2xl px-4 py-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
        Checklists
      </p>
      <h1 className="mb-6 font-headline text-2xl font-bold">{template.name}</h1>

      <section className="mb-8 flex flex-col gap-4">
        {[...grouped.entries()].map(([category, categoryItems]) => (
          <div key={category}>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-on-surface-variant">
              {category}
            </h2>
            <div className="flex flex-col gap-2">
              {categoryItems!.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between rounded border border-outline-variant bg-surface-container-lowest p-3"
                >
                  <div>
                    <p className="font-semibold">{item.item_name}</p>
                    {item.description && (
                      <p className="text-sm text-on-surface-variant">{item.description}</p>
                    )}
                  </div>
                  <DeleteItemButton itemId={item.id} templateId={id} />
                </div>
              ))}
            </div>
          </div>
        ))}
        {!items?.length && (
          <p className="text-sm text-on-surface-variant">No items yet — add the first one below.</p>
        )}
      </section>

      <AddChecklistItemForm templateId={id} />
    </div>
  )
}
