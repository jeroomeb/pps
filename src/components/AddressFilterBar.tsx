import { Filter, X } from 'lucide-react'
import Link from 'next/link'

const SELECT =
  'min-h-10 rounded border border-outline-variant bg-surface-container-lowest px-2 text-sm focus:border-primary-container focus:outline-none'

export type AddressFilterValues = {
  state?: string
  county?: string
  zip?: string
}

/**
 * Server-rendered location filter — a plain GET form, matching the
 * searchParams pattern the inspections list already uses. `hidden` carries any
 * other active params (e.g. `status`) through the submit so filters compose.
 */
export function AddressFilterBar({
  action,
  values,
  states,
  counties,
  zips,
  hidden = {},
}: {
  /** Path this form submits to, e.g. "/admin/properties". */
  action: string
  values: AddressFilterValues
  states: string[]
  counties: string[]
  zips?: string[]
  hidden?: Record<string, string | undefined>
}) {
  const hasAny = Boolean(values.state || values.county || values.zip)
  const hiddenEntries = Object.entries(hidden).filter(([, v]) => v)

  // Nothing to filter by yet — don't show an empty control strip.
  if (!states.length && !counties.length && !(zips ?? []).length) return null

  return (
    <form
      action={action}
      className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2"
    >
      {hiddenEntries.map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}

      <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
        <Filter size={13} />
        Location
      </span>

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
