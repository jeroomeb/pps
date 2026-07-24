import Link from 'next/link'
import { Building2, ChevronRight, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'

export default async function PropertiesPage() {
  const supabase = await createClient()
  const { data: properties } = await supabase
    .from('properties')
    .select('id, name, address, email, phone, human_id')
    .order('name')

  return (
    <div>
      <PageHeader
        eyebrow="Portfolio"
        title="Properties"
        action={
          <Link
            href="/admin/properties/new"
            className="flex min-h-11 items-center gap-1.5 rounded-lg bg-primary-container px-4 font-headline text-sm font-semibold uppercase tracking-wide text-on-primary-container hover:brightness-95"
          >
            <Plus size={16} />
            New Property
          </Link>
        }
      />

      {properties?.length ? (
        <Card padded={false}>
          <table className="hidden w-full text-sm lg:table">
            <thead>
              <tr className="border-b border-outline-variant text-left label-tracked text-on-surface-variant">
                <th className="px-4 py-3 font-semibold">ID</th>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Address</th>
                <th className="px-4 py-3 font-semibold">Phone</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="w-10 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {properties.map((property) => {
                const href = `/admin/properties/${property.id}`
                const cell = 'block px-4 py-3'
                return (
                  <tr
                    key={property.id}
                    className="border-b border-outline-variant transition last:border-0 hover:bg-surface-container-low"
                  >
                    <td className="p-0 font-mono text-xs text-on-surface-variant">
                      <Link href={href} className={cell}>{property.human_id ?? '—'}</Link>
                    </td>
                    <td className="p-0 font-semibold">
                      <Link href={href} className={cell}>{property.name}</Link>
                    </td>
                    <td className="p-0 text-on-surface-variant">
                      <Link href={href} className={cell}>{property.address}</Link>
                    </td>
                    <td className="p-0 text-on-surface-variant">
                      <Link href={href} className={cell}>{property.phone ?? '—'}</Link>
                    </td>
                    <td className="p-0 text-on-surface-variant">
                      <Link href={href} className={cell}>{property.email}</Link>
                    </td>
                    <td className="p-0">
                      <Link href={href} className={cell}>
                        <ChevronRight size={16} className="text-on-surface-variant" />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <div className="flex flex-col divide-y divide-outline-variant lg:hidden">
            {properties.map((property) => (
              <Link
                key={property.id}
                href={`/admin/properties/${property.id}`}
                className="flex items-center justify-between p-4"
              >
                <div>
                  <p className="font-headline font-semibold">{property.name}</p>
                  <p className="text-sm text-on-surface-variant">{property.address}</p>
                  <p className="font-mono text-xs text-on-surface-variant">{property.human_id ?? ''}</p>
                </div>
                <ChevronRight size={18} className="text-on-surface-variant" />
              </Link>
            ))}
          </div>
        </Card>
      ) : (
        <EmptyState
          icon={Building2}
          title="No properties yet"
          description="Create your first one to get started."
        />
      )}
    </div>
  )
}
