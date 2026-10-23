import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { BUILDING_CATEGORY_LABELS, type BuildingCategory } from '@/lib/building-category'

export type PropertyTypeRecord = {
  id: string
  key: string
  label: string
  description: string | null
  payout_matrix_key: string
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export const FALLBACK_PROPERTY_TYPES: PropertyTypeRecord[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    key: 'luxury',
    label: BUILDING_CATEGORY_LABELS.luxury ?? 'Luxury Condominium',
    description: 'High-rise luxury residential & condo buildings',
    payout_matrix_key: 'luxury_condo',
    is_active: true,
    sort_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    key: 'adult',
    label: BUILDING_CATEGORY_LABELS.adult ?? '55+ Active Adult Community',
    description: 'Senior & active adult gated communities',
    payout_matrix_key: 'adult_community',
    is_active: true,
    sort_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    key: 'commercial',
    label: BUILDING_CATEGORY_LABELS.commercial ?? 'Commercial Multi-Tenant',
    description: 'Office towers & commercial multi-tenant plazas',
    payout_matrix_key: 'commercial_multi',
    is_active: true,
    sort_order: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

/**
 * Returns active property types for dropdowns and selectors.
 * Falls back gracefully to legacy defaults if the table is not yet populated.
 */
export async function getActivePropertyTypes(): Promise<PropertyTypeRecord[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('property_types')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error || !data || data.length === 0) {
      return FALLBACK_PROPERTY_TYPES
    }

    return data as PropertyTypeRecord[]
  } catch {
    return FALLBACK_PROPERTY_TYPES
  }
}

/**
 * Returns all property types (active and inactive) for Super Admin management.
 */
export async function getAllPropertyTypes(): Promise<PropertyTypeRecord[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('property_types')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error || !data || data.length === 0) {
      return FALLBACK_PROPERTY_TYPES
    }

    return data as PropertyTypeRecord[]
  } catch {
    return FALLBACK_PROPERTY_TYPES
  }
}
