import { createClient } from '@/lib/supabase/server'
import { NewInspectionForm } from '@/components/NewInspectionForm'
import { PageHeader } from '@/components/ui/PageHeader'

export default async function NewInspectionPage() {
  const supabase = await createClient()

  const [{ data: properties }, { data: templates }, { data: inspectors }] = await Promise.all([
    supabase.from('properties').select('id, name').order('name'),
    supabase.from('checklist_templates').select('id, name').order('name'),
    supabase.from('profiles').select('id, full_name, role').order('full_name'),
  ])

  return (
    <div className="max-w-2xl">
      <PageHeader
        eyebrow="Inspections"
        title="Start Inspection"
        subtitle="Pick a property, choose the checklist, and assign an inspector."
      />
      <NewInspectionForm
        properties={properties ?? []}
        templates={templates ?? []}
        inspectors={inspectors ?? []}
      />
    </div>
  )
}
