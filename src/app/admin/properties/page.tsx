import Link from 'next/link'
import { Building2, ChevronRight, Plus, KeyRound } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getTenantLicenseSummary } from '@/lib/auth/dal'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { AddressFilterBar, distinctValues } from '@/components/AddressFilterBar'

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string; county?: string; zip?: string }>
}) {
  const { state, county, zip } = await searchParams
  const [supabase, licenseSummary] = await Promise.all([
    createClient(),
    getTenantLicenseSummary(),
  ])

  // Unfiltered set drives the filter dropdown options, so choosing one filter
  // never empties the others.
  const { data: allProperties } = await supabase
    .from('properties')
    .select('state, county, zip')

  let query = supabase
    .from('properties')
    .select('id, name, address, city, state, zip, county, email, phone, human_id')
    .order('name')

  if (state) query = query.eq('state', state)
  if (county) query = query.eq('county', county)
  if (zip) query = query.eq('zip', zip)

  const { data: properties } = await query
  const hasFilter = Boolean(state || county || zip)

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

      {/* Property License SKU Usage Indicator */}
      {licenseSummary && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3">
          <div className="flex items-center gap-2">
            <KeyRound size={16} className="text-primary" />
            <span className="text-sm font-semibold text-on-surface">Property Licenses:</span>
            <span className="text-sm text-on-surface-variant">
              <span className="font-bold text-on-surface">{licenseSummary.usedProperties}</span> of{' '}
              <span className="font-bold text-on-surface">{licenseSummary.maxProperties}</span> SKU units allocated (
              <span className="capitalize">{licenseSummary.licenseTier}</span> Tier)
            </span>
          </div>
          {licenseSummary.isAtCapacity ? (
            <span className="rounded bg-error-container px-2.5 py-1 text-xs font-bold text-on-error-container">
              Capacity Reached
            </span>
          ) : (
            <span className="text-xs font-semibold text-primary">
              {licenseSummary.remainingLicenses} license{licenseSummary.remainingLicenses === 1 ? '' : 's'} available
            </span>
          )}
        </div>
      )}

      <AddressFilterBar
        action="/admin/properties"
        values={{ state, county, zip }}
        states={distinctValues(allProperties ?? [], 'state')}
        counties={distinctValues(allProperties ?? [], 'county')}
        zips={distinctValues(allProperties ?? [], 'zip')}
      />

      {properties?.length ? (
        <Card padded={false}>
          <table className="hidden w-full text-sm lg:table">
            <thead>
              <tr className="border-b border-outline-variant text-left label-tracked text-on-surface-variant">
                <th className="px-4 py-3 font-semibold">ID</th>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Address</th>
                <th className="px-4 py-3 font-semibold">County</th>
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
                      <Link href={href} className={cell}>{property.county ?? '—'}</Link>
                    </td>
                    <td className="p-0 text-on-surface-variant">
                      <Link href={href} className={cell}>{property.phone ?? '—'}</Link>
                    </td>
                    <td className="p-0 text-on-surface-variant">
                      <Link href={href} className={`${cell} truncate max-w-[16rem]`}>{property.email}</Link>
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
                className="flex items-center justify-between gap-3 p-4"
              >
                <div className="min-w-0">
                  <p className="font-headline font-semibold">{property.name}</p>
                  <p className="text-sm text-on-surface-variant">{property.address}</p>
                  {property.phone && (
                    <p className="text-sm text-on-surface-variant">{property.phone}</p>
                  )}
                  <p className="truncate text-sm text-on-surface-variant">{property.email}</p>
                  <p className="font-mono text-xs text-on-surface-variant">
                    {property.human_id ?? ''}
                    {property.county ? ` · ${property.county}` : ''}
                  </p>
                </div>
                <ChevronRight size={18} className="shrink-0 text-on-surface-variant" />
              </Link>
            ))}
          </div>
        </Card>
      ) : (
        <EmptyState
          icon={Building2}
          title={hasFilter ? 'No properties in this area' : 'No properties yet'}
          description={
            hasFilter ? 'Try clearing the location filter.' : 'Create your first one to get started.'
          }
        />
      )}
    </div>
  )
}
