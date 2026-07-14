import { ChecklistTemplateForm } from '@/components/ChecklistTemplateForm'

export default function NewChecklistPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
        Checklists
      </p>
      <h1 className="mb-6 font-headline text-2xl font-bold">New Checklist Type</h1>
      <ChecklistTemplateForm />
    </div>
  )
}
