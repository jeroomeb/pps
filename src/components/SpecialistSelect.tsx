'use client'

import { useMemo } from 'react'
import { PROXIMITY_LABELS, proximityRank, proximityTier, type AddressParts } from '@/lib/address'

const SELECT_CLASSES =
  'min-h-12 rounded border border-outline-variant bg-surface-container-lowest px-3 focus:border-primary-container focus:outline-none'

export type SpecialistOption = AddressParts & {
  id: string
  full_name: string
  role: 'admin' | 'inspector'
}

export type PropertyLocation = AddressParts & { id: string; name?: string }

/**
 * Assign-specialist dropdown, ordered by how close each specialist is to the
 * selected property (same ZIP → county → state → everyone else) and labeled
 * with the match. Ordering is a convenience only — every specialist stays
 * selectable, so an out-of-area assignment is never blocked.
 */
export function SpecialistSelect({
  specialists,
  property,
  defaultValue,
}: {
  specialists: SpecialistOption[]
  /** The property being inspected, or null while none is chosen yet. */
  property: PropertyLocation | null
  defaultValue?: string
}) {
  const ordered = useMemo(() => {
    return specialists
      .map((s) => {
        const tier = property ? proximityTier(property, s) : null
        return { ...s, tier }
      })
      .sort(
        (a, b) =>
          proximityRank(a.tier) - proximityRank(b.tier) ||
          a.full_name.localeCompare(b.full_name)
      )
  }, [specialists, property])

  const anyMatch = ordered.some((s) => s.tier)

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="inspector_id" className="text-sm font-semibold uppercase tracking-wide">
        Assign Specialist
      </label>
      <select
        id="inspector_id"
        name="inspector_id"
        required
        defaultValue={defaultValue ?? ''}
        className={SELECT_CLASSES}
      >
        <option value="" disabled>
          Select a specialist…
        </option>
        {ordered.map((s) => (
          <option key={s.id} value={s.id}>
            {s.full_name}
            {s.role === 'admin' ? ' (Admin)' : ''}
            {s.tier ? ` — ${PROXIMITY_LABELS[s.tier]}` : ''}
          </option>
        ))}
      </select>
      <p className="text-xs text-on-surface-variant">
        {anyMatch
          ? 'Specialists nearest the property are listed first. Anyone can still be assigned.'
          : 'Assign yourself and you’ll be taken straight to the checklist.'}
      </p>
    </div>
  )
}
