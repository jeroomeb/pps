import { ChecklistTemplateForm } from '@/components/ChecklistTemplateForm'
import { PageHeader } from '@/components/ui/PageHeader'

export default function NewChecklistPage() {
  return (
    <div className="max-w-3xl">
      <PageHeader eyebrow="Checklists" title="New Checklist Type" />
      <ChecklistTemplateForm />
    </div>
  )
}
