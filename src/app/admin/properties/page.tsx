import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function PropertiesPage() {
  const supabase = await createClient()
  const { data: properties } = await supabase
    .from('properties')
    .select('id, name, address, email')
    .order('name')

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
            Portfolio
          </p>
          <h1 className="font-headline text-2xl font-bold">Properties</h1>
        </div>
        <Link
          href="/admin/properties/new"
          className="min-h-12 rounded bg-primary-container px-4 flex items-center font-headline text-sm font-semibold uppercase tracking-wide text-on-primary-container"
        >
          + New Property
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        {properties?.length ? (
          properties.map((property) => (
            <Link
              key={property.id}
              href={`/admin/properties/${property.id}`}
              className="rounded border border-outline-variant bg-surface-container-lowest p-4 hover:border-outline"
            >
              <p className="font-headline text-lg font-semibold">{property.name}</p>
              <p className="text-sm text-on-surface-variant">{property.address}</p>
              <p className="text-sm text-on-surface-variant">{property.email}</p>
            </Link>
          ))
        ) : (
          <p className="text-sm text-on-surface-variant">
            No properties yet. Create your first one to get started.
          </p>
        )}
      </div>
    </div>
  )
}
