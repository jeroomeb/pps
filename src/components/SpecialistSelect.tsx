'use client'

import { useState, useMemo } from 'react'
import { AlertCircle, UserPlus, Users } from 'lucide-react'
import { PROXIMITY_LABELS, proximityRank, proximityTier, type AddressParts } from '@/lib/address'

const SELECT_CLASSES =
  'min-h-12 rounded border border-outline-variant bg-surface-container-lowest px-3 focus:border-primary-container focus:outline-none'

export type SpecialistOption = AddressParts & {
  id: string
  full_name: string
  role: 'admin' | 'inspector'
  rosterRole?: 'primary' | 'backup' | 'staff' | null
}

export type PropertyLocation = AddressParts & { id: string; name?: string }

/**
 * Assign-specialist dropdown:
 * Displays specialists assigned to the selected property's staff roster.
 * Excludes admins and non-specialist accounts.
 * Allows expanding to unlisted team specialists, with automatic enrollment on save.
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
  // Only include users who are eligible specialists (exclude admins/managers)
  const eligibleSpecialists = useMemo(() => {
    return specialists.filter((s) => s.role === 'inspector')
  }, [specialists])

  // Split into rostered specialists and other organization specialists
  const rosterSpecialists = useMemo(() => {
    if (!property) return []
    return eligibleSpecialists.filter((s) => Boolean(s.rosterRole))
  }, [eligibleSpecialists, property])

  const otherSpecialists = useMemo(() => {
    if (!property) return eligibleSpecialists
    return eligibleSpecialists.filter((s) => !s.rosterRole)
  }, [eligibleSpecialists, property])

  // Check if default value belongs to an unlisted specialist
  const defaultIsUnlisted = useMemo(() => {
    if (!defaultValue || !property) return false
    return !rosterSpecialists.some((s) => s.id === defaultValue)
  }, [defaultValue, property, rosterSpecialists])

  // Track whether admin wants to see all organization specialists
  const [showAll, setShowAll] = useState<boolean>(defaultIsUnlisted)

  // Sort helpers
  function sortSpecialists(list: SpecialistOption[]) {
    return list
      .map((s) => {
        const tier = property ? proximityTier(property, s) : null
        return { ...s, tier }
      })
      .sort((a, b) => {
        const rosterWeight = (item: typeof a) => {
          if (item.rosterRole === 'primary') return 0
          if (item.rosterRole === 'backup') return 1
          if (item.rosterRole === 'staff') return 2
          return 3
        }
        const weightDiff = rosterWeight(a) - rosterWeight(b)
        if (weightDiff !== 0) return weightDiff

        return (
          proximityRank(a.tier) - proximityRank(b.tier) ||
          a.full_name.localeCompare(b.full_name)
        )
      })
  }

  const sortedRoster = useMemo(() => sortSpecialists(rosterSpecialists), [rosterSpecialists, property])
  const sortedOthers = useMemo(() => sortSpecialists(otherSpecialists), [otherSpecialists, property])

  const hasRoster = sortedRoster.length > 0

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label htmlFor="inspector_id" className="text-sm font-semibold uppercase tracking-wide">
          Assign Specialist <span className="text-error">*</span>
        </label>
        {property && hasRoster && (
          <span className="flex items-center gap-1 text-xs text-on-surface-variant font-medium">
            <Users size={13} className="text-primary" />
            {sortedRoster.length} on Property Roster
          </span>
        )}
      </div>

      {property && !hasRoster && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
          <AlertCircle size={15} className="mt-0.5 shrink-0 text-amber-400" />
          <span>
            No specialists are currently assigned to this property&apos;s staff roster. Select an available team specialist below to assign them and automatically enroll them on the property roster.
          </span>
        </div>
      )}

      <select
        id="inspector_id"
        name="inspector_id"
        required
        defaultValue={defaultValue ?? ''}
        className={SELECT_CLASSES}
        disabled={!property}
      >
        <option value="" disabled>
          {!property ? 'Select a property first…' : 'Select a specialist…'}
        </option>

        {property && hasRoster && !showAll && (
          sortedRoster.map((s) => {
            const roleBadge = s.rosterRole ? ` [${s.rosterRole.toUpperCase()}]` : ''
            const proximity = s.tier ? ` — ${PROXIMITY_LABELS[s.tier]}` : ''
            return (
              <option key={s.id} value={s.id}>
                {s.full_name}
                {roleBadge}
                {proximity}
              </option>
            )
          })
        )}

        {property && hasRoster && showAll && (
          <>
            <optgroup label="Property Staff Roster">
              {sortedRoster.map((s) => {
                const roleBadge = s.rosterRole ? ` [${s.rosterRole.toUpperCase()}]` : ''
                const proximity = s.tier ? ` — ${PROXIMITY_LABELS[s.tier]}` : ''
                return (
                  <option key={s.id} value={s.id}>
                    {s.full_name}
                    {roleBadge}
                    {proximity}
                  </option>
                )
              })}
            </optgroup>
            <optgroup label="Other Available Specialists (Will Auto-Add to Roster)">
              {sortedOthers.map((s) => {
                const proximity = s.tier ? ` — ${PROXIMITY_LABELS[s.tier]}` : ''
                return (
                  <option key={s.id} value={s.id}>
                    {s.full_name} (Auto-enrolls on Roster){proximity}
                  </option>
                )
              })}
            </optgroup>
          </>
        )}

        {property && !hasRoster && (
          <optgroup label="Available Team Specialists (Auto-enrolls on Roster)">
            {sortedOthers.map((s) => {
              const proximity = s.tier ? ` — ${PROXIMITY_LABELS[s.tier]}` : ''
              return (
                <option key={s.id} value={s.id}>
                  {s.full_name} (Auto-enrolls on Roster){proximity}
                </option>
              )
            })}
          </optgroup>
        )}
      </select>

      {property && hasRoster && (
        <label className="flex items-center gap-2 cursor-pointer pt-1 text-xs text-on-surface-variant hover:text-on-surface select-none">
          <input
            type="checkbox"
            checked={showAll}
            onChange={(e) => setShowAll(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-outline-variant text-primary accent-primary"
          />
          <span className="flex items-center gap-1">
            <UserPlus size={13} className="text-primary" />
            Allow assigning unlisted specialist (automatically adds to property staff roster)
          </span>
        </label>
      )}

      <p className="text-[11px] text-on-surface-variant">
        {!property
          ? 'Pick a property above to load its assigned roster specialists.'
          : hasRoster
            ? 'Only specialists assigned to this property are selectable by default. Assigning an unlisted specialist will add them to the roster.'
            : 'Assigned specialist will automatically be added to this property’s staff roster.'}
      </p>
    </div>
  )
}
