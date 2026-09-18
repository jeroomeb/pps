import Link from 'next/link'
import { Building2, ChevronRight, Plus, KeyRound, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getProfile, getTenantLicenseSummary } from '@/lib/auth/dal'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { AddressFilterBar, distinctValues } from '@/components/AddressFilterBar'

type PropertyRow = {
  id: string
  name: string
  address: string
  city: string | null
  state: string | null
  zip: string | null
  county: string | null
  email: string
  phone: string | null
  human_id: string | null
}

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string; county?: string; zip?: string }>
}) {
  const { state, county, zip } = await searchParams
  const supabase = await createClient()
  const hasFilter = Boolean(state || county || zip)

  let filteredQuery = supabase
    .from('properties')
    .select('id, name, address, city, state, zip, county, email, phone, human_id')
    .order('name')

  if (state) filteredQuery = filteredQuery.eq('state', state)
  if (county) filteredQuery = filteredQuery.eq('county', county)
  if (zip) filteredQuery = filteredQuery.eq('zip', zip)

  // Execute all remote queries simultaneously in a single round-trip batch
  const [
    propertiesResult,
    { data: allLocationProps },
    { data: rosterAssignments },
    profile,
  ] = await Promise.all([
    filteredQuery,
    hasFilter
      ? supabase.from('properties').select('state, county, zip')
      : Promise.resolve({ data: null }),
    supabase.from('property_specialist_assignments').select('property_id, role'),
    getProfile(),
  ])

  const properties = (propertiesResult.data ?? []) as PropertyRow[]

  // Count properties for the tenant license summary without a separate DB query
  const totalCount = hasFilter
    ? (allLocationProps?.length ?? 0)
    : (properties?.length ?? 0)

  // Computes in-memory reusing profile.tenant and totalCount (0 extra queries!)
  const licenseSummary = await getTenantLicenseSummary(profile.tenant_id, totalCount)

  // Aggregate roster counts per property
  const rosterCountMap = new Map<string, { total: number; hasPrimary: boolean }>()
  for (const assign of rosterAssignments ?? []) {
    const curr = rosterCountMap.get(assign.property_id) ?? { total: 0, hasPrimary: false }
    curr.total += 1
    if (assign.role === 'primary') curr.hasPrimary = true
    rosterCountMap.set(assign.property_id, curr)
  }

  // Filter dropdown data source
  const locationDataSource = hasFilter ? (allLocationProps ?? []) : (properties ?? [])

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
        states={distinctValues(locationDataSource, 'state')}
        counties={distinctValues(locationDataSource, 'county')}
        zips={distinctValues(locationDataSource, 'zip')}
      />

      {properties?.length ? (
        <Card padded={false}>
          <table className="hidden w-full text-sm lg:table">
            <thead>
              <tr className="border-b border-outline-variant text-left label-tracked text-on-surface-variant">
                <th className="px-4 py-3 font-semibold">ID</th>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Staff Roster</th>
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
                const roster = rosterCountMap.get(property.id)
                return (
                  <tr
                    key={property.id}
                    className="border-b border-outline-variant transition last:border-0 hover:bg-surface-container-low"
                  >
                    <td className="p-0 font-mono text-xs text-on-surface-variant">
                      <Link href={href} prefetch={false} className={cell}>{property.human_id ?? '—'}</Link>
                    </td>
                    <td className="p-0 font-semibold">
                      <Link href={href} className={cell}>{property.name}</Link>
                    </td>
                    <td className="p-0">
                      <Link href={href} prefetch={false} className={cell}>
                        {roster && roster.total > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded bg-primary-container/30 px-2 py-0.5 text-xs font-semibold text-primary">
                            <Users size={12} />
                            {roster.total} Specialist{roster.total > 1 ? 's' : ''}
                            {roster.hasPrimary ? ' (Primary set)' : ''}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded bg-surface-container-highest px-2 py-0.5 text-xs text-on-surface-variant">
                            Unassigned
                          </span>
                        )}
                      </Link>
                    </td>
                    <td className="p-0 text-on-surface-variant">
                      <Link href={href} prefetch={false} className={cell}>{property.address}</Link>
                    </td>
                    <td className="p-0 text-on-surface-variant">
                      <Link href={href} prefetch={false} className={cell}>{property.county ?? '—'}</Link>
                    </td>
                    <td className="p-0 text-on-surface-variant">
                      <Link href={href} prefetch={false} className={cell}>{property.phone ?? '—'}</Link>
                    </td>
                    <td className="p-0 text-on-surface-variant">
                      <Link href={href} prefetch={false} className={`${cell} truncate max-w-[16rem]`}>{property.email}</Link>
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
            {properties.map((property) => {
              const roster = rosterCountMap.get(property.id)
              return (
                <Link
                  key={property.id}
                  href={`/admin/properties/${property.id}`}
                  className="flex items-center justify-between gap-3 p-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-headline font-semibold">{property.name}</p>
                      {roster && roster.total > 0 && (
                        <span className="rounded bg-primary-container/30 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                          {roster.total} Staff
                        </span>
                      )}
                    </div>
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
              )
            })}
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
