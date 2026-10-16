import { notFound } from 'next/navigation'
import { Shield } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { AddChecklistItemForm } from '@/components/AddChecklistItemForm'
import { ChecklistItemReorder } from '@/components/ChecklistItemReorder'
import { PageHeader } from '@/components/ui/PageHeader'
import { RenameTemplateForm } from '@/components/RenameTemplateForm'
import { ConfirmDeleteButton } from '@/components/ConfirmDeleteButton'
import { CloneChecklistButton } from '@/components/CloneChecklistButton'
import { ChecklistScoringToggle } from '@/components/ChecklistScoringToggle'
import { deleteTemplate } from '@/lib/actions/checklists'
import { getAdminScope } from '@/lib/auth/tenant-view'

export default async function ChecklistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: template }, { data: items }, scope] = await Promise.all([
    supabase
      .from('checklist_templates')
      .select('id, name, enable_predictive_scoring')
      .eq('id', id)
      .single(),
    supabase
      .from('checklist_template_items')
      .select('id, service_category, item_name, description, risk_domain')
      .eq('template_id', id)
      .order('sort_order'),
    getAdminScope(),
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

  const existingCategories = Array.from(
    new Set(
      (items ?? [])
        .map((item) => item.service_category?.trim())
        .filter((cat): cat is string => Boolean(cat))
    )
  )

  return (
    <div className="max-w-3xl">
      <PageHeader
        eyebrow="Checklists"
        title={template.name}
        backHref="/admin/checklists"
        backLabel="Checklists"
        action={
          scope.isGlobalAdmin ? (
            <div className="flex flex-wrap items-center gap-2">
              <CloneChecklistButton templateId={id} templateName={template.name} />
              <RenameTemplateForm templateId={id} currentName={template.name} />
              <ConfirmDeleteButton
                action={deleteTemplate.bind(null, id)}
                confirmMessage="Delete this checklist type?"
                redirectTo="/admin/checklists"
              />
            </div>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-surface-container px-3 py-1.5 text-xs font-semibold text-on-surface-variant">
              <Shield size={14} /> Managed by Super Admin (Read-Only)
            </span>
          )
        }
      />

      {/* Predictive Scoring Toggle Banner */}
      <div className="mb-6">
        <ChecklistScoringToggle
          templateId={id}
          initialEnabled={template.enable_predictive_scoring !== false}
          disabled={!scope.isGlobalAdmin}
        />
      </div>

      {scope.isGlobalAdmin && (
        <section className="mb-8">
          <h2 className="mb-3 font-headline text-lg font-semibold">Add Item</h2>
          <AddChecklistItemForm templateId={id} existingCategories={existingCategories} />
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="font-headline text-lg font-semibold">
          Checklist Items ({items?.length ?? 0})
        </h2>
        <ChecklistItemReorder
          key={itemsKey}
          templateId={id}
          items={items ?? []}
          readOnly={!scope.isGlobalAdmin}
        />
      </section>
    </div>
  )
}
