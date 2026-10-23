export const BUILDING_CATEGORIES = ['luxury', 'adult', 'commercial'] as const

export type BuildingCategory = string

export const BUILDING_CATEGORY_LABELS: Record<string, string> = {
  luxury: 'Luxury Condominium',
  adult: '55+ Active Adult Community',
  commercial: 'Commercial Multi-Tenant',
}

/** Keys stored on tenants.payout_matrix. */
export function payoutMatrixKey(category: string | null | undefined): 'luxury_condo' | 'adult_community' | 'commercial_multi' {
  if (category === 'adult' || category === 'adult_community') return 'adult_community'
  if (category === 'commercial' || category === 'commercial_multi') return 'commercial_multi'
  return 'luxury_condo'
}

export function isBuildingCategory(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0
}
