import { createClient } from '@/lib/supabase/server'
import { InspectorForm } from '@/components/InspectorForm'

export default async function TeamPage() {
  const supabase = await createClient()
  const { data: inspectors } = await supabase
    .from('profiles')
    .select('id, full_name, created_at')
    .eq('role', 'inspector')
    .order('full_name')

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
        Team
      </p>
      <h1 className="mb-6 font-headline text-2xl font-bold">Inspectors</h1>

      <div className="mb-8 flex flex-col gap-3">
        {inspectors?.length ? (
          inspectors.map((inspector) => (
            <div
              key={inspector.id}
              className="rounded border border-outline-variant bg-surface-container-lowest p-4"
            >
              <p className="font-semibold">{inspector.full_name}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-on-surface-variant">No inspectors yet.</p>
        )}
      </div>

      <InspectorForm />
    </div>
  )
}
