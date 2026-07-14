import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NewInspectionForm } from '@/components/NewInspectionForm'
import { StatusBadge } from '@/components/StatusBadge'

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: property }, { data: templates }, { data: inspectors }, { data: inspections }] =
    await Promise.all([
      supabase.from('properties').select('*').eq('id', id).single(),
      supabase.from('checklist_templates').select('id, name').order('name'),
      supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'inspector')
        .order('full_name'),
      supabase
        .from('inspections')
        .select(
          'id, status, created_at, completed_at, pdf_path, checklist_templates(name), profiles(full_name)'
        )
        .eq('property_id', id)
        .order('created_at', { ascending: false }),
    ])

  if (!property) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
            Property
          </p>
          <h1 className="font-headline text-2xl font-bold">{property.name}</h1>
          <p className="text-sm text-on-surface-variant">{property.address}</p>
          <p className="text-sm text-on-surface-variant">{property.email}</p>
        </div>
        <Link
          href={`/admin/properties/${id}/edit`}
          className="rounded border border-outline-variant px-3 py-2 text-xs font-semibold uppercase tracking-wide hover:bg-surface-container"
        >
          Edit
        </Link>
      </div>

      <section className="mb-8">
        <h2 className="mb-3 font-headline text-lg font-semibold">New Inspection</h2>
        <NewInspectionForm
          propertyId={id}
          templates={templates ?? []}
          inspectors={inspectors ?? []}
        />
      </section>

      <section>
        <h2 className="mb-3 font-headline text-lg font-semibold">Inspections</h2>
        <div className="flex flex-col gap-3">
          {inspections?.length ? (
            inspections.map((inspection) => (
              <div
                key={inspection.id}
                className="flex items-center justify-between rounded border border-outline-variant bg-surface-container-lowest p-4"
              >
                <div>
                  <p className="font-semibold">
                    {(inspection.checklist_templates as unknown as { name: string } | null)
                      ?.name ?? 'Checklist'}
                  </p>
                  <p className="text-sm text-on-surface-variant">
                    Inspector:{' '}
                    {(inspection.profiles as unknown as { full_name: string } | null)
                      ?.full_name ?? 'Unassigned'}
                  </p>
                </div>
                <StatusBadge status={inspection.status} />
              </div>
            ))
          ) : (
            <p className="text-sm text-on-surface-variant">
              No inspections created for this property yet.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
