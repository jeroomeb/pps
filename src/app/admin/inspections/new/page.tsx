import { createClient } from '@/lib/supabase/server'
import { NewInspectionForm } from '@/components/NewInspectionForm'
import { PageHeader } from '@/components/ui/PageHeader'

/** `datetime-local` wants local wall-clock time, not a UTC ISO string. */
function toDateTimeLocal(value: string | undefined): string | undefined {
  if (!value) return undefined
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return undefined
  const pad = (n: number) => `${n}`.padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default async function NewInspectionPage({
  searchParams,
}: {
  // The dashboard's "Schedule" action deep-links here with the due property
  // and date already chosen.
  searchParams: Promise<{ property?: string; date?: string }>
}) {
  const { property, date } = await searchParams
  const supabase = await createClient()

  const [{ data: properties }, { data: templates }, { data: inspectors }] = await Promise.all([
    supabase.from('properties').select('id, name, state, zip, county').order('name'),
    supabase.from('checklist_templates').select('id, name').order('name'),
    supabase.from('profiles').select('id, full_name, role, state, zip, county').order('full_name'),
  ])

  return (
    <div className="max-w-2xl">
      <PageHeader
        eyebrow="Inspections"
        title="Start Inspection"
        subtitle="Pick a property, choose the checklist, and assign a specialist."
        backHref="/admin"
        backLabel="Dashboard"
      />
      <NewInspectionForm
        properties={properties ?? []}
        templates={templates ?? []}
        inspectors={inspectors ?? []}
        defaultPropertyId={property}
        defaultScheduledFor={toDateTimeLocal(date)}
      />
    </div>
  )
}
