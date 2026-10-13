import { Filter, X, Search } from 'lucide-react'
import Link from 'next/link'

const SELECT =
  'min-h-10 rounded border border-outline-variant bg-surface-container-lowest px-2 text-sm focus:border-primary-container focus:outline-none'

const SEARCH_INPUT =
  'min-h-10 rounded border border-outline-variant bg-surface-container-lowest pl-8 pr-3 text-sm focus:border-primary-container focus:outline-none placeholder:text-on-surface-variant/60'

export type AddressFilterValues = {
  q?: string
  state?: string
  county?: string
  zip?: string
  tenant?: string
}

/**
 * Server-rendered location, organization & keyword filter — a plain GET form, matching the
 * searchParams pattern the inspections list already uses. `hidden` carries any
 * other active params (e.g. `status`) through the submit so filters compose.
 */
export function AddressFilterBar({
  action,
  values,
  states = [],
  counties = [],
  zips,
  organizations,
  defaultTenant = 'hq',
  searchPlaceholder,
  hidden = {},
}: {
  /** Path this form submits to, e.g. "/admin/properties". */
  action: string
  values: AddressFilterValues
  states?: string[]
  counties?: string[]
  zips?: string[]
  organizations?: { id: string; name: string }[]
  defaultTenant?: string
  searchPlaceholder?: string
  hidden?: Record<string, string | undefined>
}) {
  const effectiveDefaultTenant = defaultTenant ?? 'hq'
  const hasAny = Boolean(
    values.q ||
    values.state ||
    values.county ||
    values.zip ||
    (values.tenant && values.tenant !== effectiveDefaultTenant)
  )
  const hiddenEntries = Object.entries(hidden).filter(([, v]) => v)

  // Nothing to filter by yet — don't show an empty control strip.
  if (!states.length && !counties.length && !(zips ?? []).length && !(organizations ?? []).length && !searchPlaceholder) return null

  return (
    <form
      action={action}
      className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2"
    >
      {hiddenEntries.map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}

      {searchPlaceholder && (
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant/70" />
          <input
            type="search"
            name="q"
            defaultValue={values.q ?? ''}
            placeholder={searchPlaceholder}
            className={`w-full ${SEARCH_INPUT}`}
            aria-label={searchPlaceholder}
          />
        </div>
      )}

      <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
        <Filter size={13} />
        Filter
      </span>

      {organizations && organizations.length > 0 && (
        <select
          name="tenant"
          defaultValue={values.tenant ?? effectiveDefaultTenant}
          className={SELECT}
          aria-label="Organization"
        >
          {effectiveDefaultTenant === 'all' ? (
            <>
              <option value="all">All Organizations</option>
              <option value="hq">Amenity Op&apos;s HQ (Master)</option>
            </>
          ) : (
            <>
              <option value="hq">Amenity Op&apos;s HQ (Master)</option>
              <option value="all">All Organizations</option>
            </>
          )}
          {organizations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </select>
      )}

      {states.length > 0 && (
        <select name="state" defaultValue={values.state ?? ''} className={SELECT} aria-label="State">
          <option value="">All states</option>
          {states.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      )}

      {counties.length > 0 && (
        <select
          name="county"
          defaultValue={values.county ?? ''}
          className={SELECT}
          aria-label="County"
        >
          <option value="">All counties</option>
          {counties.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      )}

      {(zips ?? []).length > 0 && (
        <select name="zip" defaultValue={values.zip ?? ''} className={SELECT} aria-label="ZIP code">
          <option value="">All ZIPs</option>
          {(zips ?? []).map((z) => (
            <option key={z} value={z}>
              {z}
            </option>
          ))}
        </select>
      )}

      <button
        type="submit"
        className="min-h-10 rounded-lg bg-primary-container px-3 text-xs font-semibold uppercase tracking-wide text-on-primary-container hover:brightness-95"
      >
        Apply
      </button>

      {hasAny && (
        <Link
          href={
            hiddenEntries.length
              ? `${action}?${new URLSearchParams(hiddenEntries as [string, string][]).toString()}`
              : action
          }
          className="flex items-center gap-1 text-xs font-semibold text-on-surface-variant hover:text-on-surface"
        >
          <X size={13} />
          Clear
        </Link>
      )}
    </form>
  )
}

/** Sorted, de-duplicated non-null values for a filter dropdown. */
export function distinctValues(rows: ({ [k: string]: unknown } | null)[], key: string): string[] {
  const set = new Set<string>()
  for (const row of rows) {
    const v = row?.[key]
    if (typeof v === 'string' && v.trim()) set.add(v.trim())
  }
  return [...set].sort((a, b) => a.localeCompare(b))
}
