import { ChecklistTemplateForm } from '@/components/ChecklistTemplateForm'
import { PageHeader } from '@/components/ui/PageHeader'
import { requireChecklistManagementPermission } from '@/lib/auth/checklist-permissions'

export default async function NewChecklistPage() {
  const { isSuperAdmin } = await requireChecklistManagementPermission()

  return (
    <div className="max-w-3xl">
      <PageHeader
        eyebrow="Checklists"
        title="New Checklist Type"
        backHref="/admin/checklists"
        backLabel="Checklists"
      />
      <ChecklistTemplateForm isSuperAdmin={isSuperAdmin} />
    </div>
  )
}
