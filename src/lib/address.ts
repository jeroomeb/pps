// Structured addresses for properties and specialists.
//
// The DB keeps BOTH the parts (street/city/state/zip/county) and a single-line
// `address` column. `address` is DERIVED — composed here on every write — so the
// PDF renderer, report screen and both email templates can keep reading one
// plain string without knowing about the parts.
//
// `county` is intentionally excluded from the composed line: it isn't part of a
// US mailing address. It exists for proximity matching and filtering.

export type AddressParts = {
  street?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  county?: string | null
}

/** Trim + uppercase, e.g. " nj " -> "NJ". Empty becomes null. */
export function normalizeState(value: string | null | undefined): string | null {
  const v = (value ?? '').trim().toUpperCase()
  return v || null
}

/** First 5 digits, e.g. "07102-1234" -> "07102". Empty becomes null. */
export function normalizeZip(value: string | null | undefined): string | null {
  const digits = (value ?? '').replace(/\D/g, '').slice(0, 5)
  return digits || null
}

/**
 * Trim, collapse whitespace, strip a trailing "County", Title Case — so
 * "essex  county", "Essex", and "ESSEX COUNTY" all normalize to "Essex".
 * The word is re-added wherever it's displayed (e.g. "Essex County"); keeping
 * it out of the stored value is what prevents "Essex County County" and lets
 * "Essex" / "Essex County" entries match each other instead of appearing as
 * two different filter options.
 */
export function normalizeCounty(value: string | null | undefined): string | null {
  const v = (value ?? '').trim().replace(/\s+/g, ' ').replace(/\s+county$/i, '')
  if (!v) return null
  return v
    .toLowerCase()
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/** Trim, collapse whitespace. Empty becomes null. */
export function normalizeText(value: string | null | undefined): string | null {
  const v = (value ?? '').trim().replace(/\s+/g, ' ')
  return v || null
}

export function normalizeAddressParts(parts: AddressParts): Required<AddressParts> {
  return {
    street: normalizeText(parts.street),
    city: normalizeText(parts.city),
    state: normalizeState(parts.state),
    zip: normalizeZip(parts.zip),
    county: normalizeCounty(parts.county),
  }
}

/**
 * "12 Main St, Newark, NJ 07102" — the single-line value stored in `address`
 * and printed on reports/emails.
 */
export function composeAddress(parts: AddressParts): string {
  const { street, city, state, zip } = normalizeAddressParts(parts)
  const region = [state, zip].filter(Boolean).join(' ')
  return [street, city, region].filter(Boolean).join(', ')
}

export type ProximityTier = 'zip' | 'county' | 'state'

export const PROXIMITY_LABELS: Record<ProximityTier, string> = {
  zip: 'Same ZIP',
  county: 'Same county',
  state: 'Same state',
}

/**
 * How close a specialist is to a property — most specific match wins.
 * Returns null when nothing matches (or either side has no address yet).
 */
export function proximityTier(property: AddressParts, person: AddressParts): ProximityTier | null {
  const p = normalizeAddressParts(property)
  const s = normalizeAddressParts(person)
  if (p.zip && s.zip && p.zip === s.zip) return 'zip'
  if (p.county && s.county && p.county === s.county) return 'county'
  if (p.state && s.state && p.state === s.state) return 'state'
  return null
}

const TIER_RANK: Record<ProximityTier, number> = { zip: 0, county: 1, state: 2 }

/** Sort rank for the assign-specialist dropdown — nearest first, then unmatched. */
export function proximityRank(tier: ProximityTier | null): number {
  return tier ? TIER_RANK[tier] : 3
}
