import { ChecklistTemplateForm } from '@/components/ChecklistTemplateForm'
import { PageHeader } from '@/components/ui/PageHeader'
import { requireChecklistManagementPermission } from '@/lib/auth/checklist-permissions'
import { createClient } from '@/lib/supabase/server'

export default async function NewChecklistPage() {
  const { isSuperAdmin } = await requireChecklistManagementPermission()

  const supabase = await createClient()
  const { data: categoryRows } = await supabase
    .from('checklist_template_items')
    .select('service_category')
    .order('service_category')

  const existingCategories = Array.from(
    new Set((categoryRows ?? []).map((r) => r.service_category?.trim()).filter(Boolean))
  ) as string[]

  return (
    <div className="max-w-3xl">
      <PageHeader
        eyebrow="Checklists"
        title="New Checklist Type"
        backHref="/admin/checklists"
        backLabel="Checklists"
      />
      <ChecklistTemplateForm
        isSuperAdmin={isSuperAdmin}
        existingCategories={existingCategories}
      />
    </div>
  )
}
