import { createClient } from '@/lib/supabase/server'
import { NewInspectionForm } from '@/components/NewInspectionForm'
import { PageHeader } from '@/components/ui/PageHeader'
import { formatZonedDateTimeLocal, timeZoneAbbreviation } from '@/lib/timezone'

/**
 * `datetime-local` wants local wall-clock time, not a UTC ISO string —
 * "local" here means APP_TIMEZONE, not the server's own timezone (see
 * src/lib/timezone.ts). `date` deep-links in as a date-only key
 * ("2026-08-03"); treat that as a bare calendar date rather than parsing it
 * as a UTC instant, so it isn't shifted a day by the zone conversion.
 */
function toDateTimeLocal(value: string | undefined): string | undefined {
  if (!value) return undefined
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${value}T09:00`
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return undefined
  return formatZonedDateTimeLocal(d)
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
        timeZoneLabel={timeZoneAbbreviation()}
      />
    </div>
  )
}
