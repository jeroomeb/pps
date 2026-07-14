import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function ChecklistsPage() {
  const supabase = await createClient()
  const { data: templates } = await supabase
    .from('checklist_templates')
    .select('id, name, checklist_template_items(count)')
    .order('name')

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
            Checklist Types
          </p>
          <h1 className="font-headline text-2xl font-bold">Checklists</h1>
        </div>
        <Link
          href="/admin/checklists/new"
          className="min-h-12 rounded bg-primary-container px-4 flex items-center font-headline text-sm font-semibold uppercase tracking-wide text-on-primary-container"
        >
          + New Checklist
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        {templates?.length ? (
          templates.map((template) => (
            <Link
              key={template.id}
              href={`/admin/checklists/${template.id}`}
              className="rounded border border-outline-variant bg-surface-container-lowest p-4 hover:border-outline"
            >
              <p className="font-headline text-lg font-semibold">{template.name}</p>
              <p className="text-sm text-on-surface-variant">
                {(template.checklist_template_items as unknown as { count: number }[])[0]
                  ?.count ?? 0}{' '}
                items
              </p>
            </Link>
          ))
        ) : (
          <p className="text-sm text-on-surface-variant">No checklist types yet.</p>
        )}
      </div>
    </div>
  )
}
