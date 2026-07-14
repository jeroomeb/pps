import Link from 'next/link'
import { getProfile } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { StatusBadge } from '@/components/StatusBadge'

export default async function InspectorDashboardPage() {
  const profile = await getProfile()
  const supabase = await createClient()

  const { data: inspections } = await supabase
    .from('inspections')
    .select(
      'id, status, created_at, properties(name, address), checklist_templates(name)'
    )
    .eq('inspector_id', profile.id)
    .order('created_at', { ascending: false })

  const pending = inspections?.filter((i) => i.status !== 'completed') ?? []
  const completed = inspections?.filter((i) => i.status === 'completed') ?? []

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
        Today&apos;s Schedule
      </p>
      <h1 className="mb-2 font-headline text-2xl font-bold">My Assignments</h1>

      <div className="mb-6 grid grid-cols-2 gap-3">
        <div className="rounded border border-outline-variant bg-surface-container-lowest p-4">
          <p className="text-sm text-on-surface-variant">Pending</p>
          <p className="font-headline text-2xl font-bold text-primary">
            {pending.length.toString().padStart(2, '0')}
          </p>
        </div>
        <div className="rounded border border-outline-variant bg-surface-container-lowest p-4">
          <p className="text-sm text-on-surface-variant">Completed</p>
          <p className="font-headline text-2xl font-bold">
            {completed.length.toString().padStart(2, '0')}
          </p>
        </div>
      </div>

      <section className="mb-8">
        <h2 className="mb-3 font-headline text-lg font-semibold">Pending Inspections</h2>
        <div className="flex flex-col gap-3">
          {pending.length ? (
            pending.map((inspection) => {
              const property = inspection.properties as unknown as {
                name: string
                address: string
              }
              const template = inspection.checklist_templates as unknown as { name: string }
              return (
                <div
                  key={inspection.id}
                  className="rounded border border-outline-variant bg-surface-container-lowest p-4"
                >
                  <div className="mb-1 flex items-start justify-between">
                    <p className="font-headline text-lg font-semibold">{property.name}</p>
                    <StatusBadge status={inspection.status} />
                  </div>
                  <p className="mb-1 text-sm text-on-surface-variant">{property.address}</p>
                  <p className="mb-3 text-sm text-on-surface-variant">{template.name}</p>
                  <Link
                    href={`/inspector/inspections/${inspection.id}`}
                    className="flex min-h-12 w-full items-center justify-center rounded bg-primary-container font-headline text-sm font-semibold uppercase tracking-wide text-on-primary-container"
                  >
                    {inspection.status === 'in_progress' ? 'Continue Inspection' : 'Start Inspection'}
                  </Link>
                </div>
              )
            })
          ) : (
            <p className="text-sm text-on-surface-variant">No pending inspections. Nice work!</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-headline text-lg font-semibold">Completed</h2>
        <div className="flex flex-col gap-3">
          {completed.length ? (
            completed.map((inspection) => {
              const property = inspection.properties as unknown as { name: string }
              const template = inspection.checklist_templates as unknown as { name: string }
              return (
                <div
                  key={inspection.id}
                  className="rounded border border-outline-variant bg-surface-container-lowest p-4"
                >
                  <p className="font-semibold">{property.name}</p>
                  <p className="text-sm text-on-surface-variant">{template.name}</p>
                </div>
              )
            })
          ) : (
            <p className="text-sm text-on-surface-variant">No completed inspections yet.</p>
          )}
        </div>
      </section>
    </div>
  )
}
