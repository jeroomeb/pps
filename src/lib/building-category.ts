export const BUILDING_CATEGORIES = ['luxury', 'adult', 'commercial'] as const

export type BuildingCategory = (typeof BUILDING_CATEGORIES)[number]

export const BUILDING_CATEGORY_LABELS: Record<BuildingCategory, string> = {
  luxury: 'Luxury Condominium',
  adult: '55+ Active Adult Community',
  commercial: 'Commercial Multi-Tenant',
}

/** Keys stored on tenants.payout_matrix. */
export function payoutMatrixKey(category: BuildingCategory): 'luxury_condo' | 'adult_community' | 'commercial_multi' {
  if (category === 'adult') return 'adult_community'
  if (category === 'commercial') return 'commercial_multi'
  return 'luxury_condo'
}

export function isBuildingCategory(value: string | null | undefined): value is BuildingCategory {
  return value === 'luxury' || value === 'adult' || value === 'commercial'
}
