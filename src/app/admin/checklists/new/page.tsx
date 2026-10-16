import { ChecklistTemplateForm } from '@/components/ChecklistTemplateForm'
import { PageHeader } from '@/components/ui/PageHeader'
import { requireGlobalAdmin } from '@/lib/auth/dal'

export default async function NewChecklistPage() {
  await requireGlobalAdmin()

  return (
    <div className="max-w-3xl">
      <PageHeader
        eyebrow="Checklists"
        title="New Checklist Type"
        backHref="/admin/checklists"
        backLabel="Checklists"
      />
      <ChecklistTemplateForm />
    </div>
  )
}
