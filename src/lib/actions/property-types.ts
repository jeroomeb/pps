'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { requireGlobalAdmin } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'

const propertyTypeSchema = z.object({
  label: z.string().trim().min(1, 'Property type label is required'),
  key: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_-]+$/, 'Key must only contain lowercase letters, numbers, underscores, and hyphens')
    .optional(),
  description: z.string().trim().optional(),
  payout_matrix_key: z.enum(['luxury_condo', 'adult_community', 'commercial_multi']).default('luxury_condo'),
  is_active: z.coerce.boolean().default(true),
  sort_order: z.coerce.number().int().default(0),
})

export type CreatePropertyTypeInput = {
  label: string
  key?: string
  description?: string
  payout_matrix_key?: 'luxury_condo' | 'adult_community' | 'commercial_multi'
  is_active?: boolean
  sort_order?: number
}

export type PropertyTypeResult = {
  error?: string
  success?: boolean
  data?: any
}

export type PropertyTypeFormState = PropertyTypeResult | undefined

function slugifyKey(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 50)
}

export async function createPropertyType(
  arg1: CreatePropertyTypeInput | PropertyTypeFormState,
  arg2?: FormData
): Promise<PropertyTypeResult> {
  await requireGlobalAdmin()

  let input: {
    label: string
    key?: string
    description?: string
    payout_matrix_key?: string
    is_active?: boolean
    sort_order?: number
  }

  if (arg2 instanceof FormData) {
    const rawLabel = String(arg2.get('label') ?? '')
    let rawKey = String(arg2.get('key') ?? '').trim()
    if (!rawKey && rawLabel) {
      rawKey = slugifyKey(rawLabel)
    }
    input = {
      label: rawLabel,
      key: rawKey,
      description: (arg2.get('description') as string) || undefined,
      payout_matrix_key: (arg2.get('payout_matrix_key') as string) || 'luxury_condo',
      is_active: arg2.get('is_active') !== 'false' && arg2.get('is_active') !== null,
      sort_order: Number(arg2.get('sort_order')) || 0,
    }
  } else if (arg1 && typeof arg1 === 'object' && 'label' in arg1) {
    input = {
      label: arg1.label,
      key: arg1.key ? arg1.key.trim() : slugifyKey(arg1.label),
      description: arg1.description,
      payout_matrix_key: arg1.payout_matrix_key || 'luxury_condo',
      is_active: arg1.is_active ?? true,
      sort_order: arg1.sort_order ?? 0,
    }
  } else {
    return { error: 'Invalid property type input.' }
  }

  const parsed = propertyTypeSchema.safeParse(input)

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid property type input.' }
  }

  const supabase = await createClient()

  // Get next sort order if 0
  let sortOrder = parsed.data.sort_order
  if (sortOrder === 0) {
    const { data: maxItem } = await supabase
      .from('property_types')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle()
    sortOrder = (maxItem?.sort_order ?? 0) + 1
  }

  const { data, error } = await supabase
    .from('property_types')
    .insert({
      key: parsed.data.key!,
      label: parsed.data.label,
      description: parsed.data.description || null,
      payout_matrix_key: parsed.data.payout_matrix_key,
      is_active: parsed.data.is_active,
      sort_order: sortOrder,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return { error: `A property type with key "${parsed.data.key}" already exists. Please choose a different name or key.` }
    }
    return { error: error.message }
  }

  revalidatePath('/admin/property-types')
  revalidatePath('/admin/properties')
  revalidatePath('/admin/properties/new')
  return { success: true, data }
}

export async function updatePropertyType(
  id: string,
  _prevState: PropertyTypeFormState,
  formData: FormData
): Promise<PropertyTypeFormState> {
  await requireGlobalAdmin()

  const parsed = propertyTypeSchema.safeParse({
    label: formData.get('label'),
    key: formData.get('key'),
    description: formData.get('description'),
    payout_matrix_key: formData.get('payout_matrix_key') || 'luxury_condo',
    is_active: formData.get('is_active') !== 'false' && formData.get('is_active') !== null,
    sort_order: formData.get('sort_order') || 0,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid property type input.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('property_types')
    .update({
      label: parsed.data.label,
      description: parsed.data.description || null,
      payout_matrix_key: parsed.data.payout_matrix_key,
      is_active: parsed.data.is_active,
      sort_order: parsed.data.sort_order,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/property-types')
  revalidatePath('/admin/properties')
  revalidatePath('/admin/properties/new')
  return { success: true }
}

export async function togglePropertyTypeActive(
  id: string,
  nextActiveState: boolean
): Promise<{ error?: string; success?: boolean }> {
  await requireGlobalAdmin()

  const supabase = await createClient()
  const { error } = await supabase
    .from('property_types')
    .update({
      is_active: nextActiveState,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/property-types')
  revalidatePath('/admin/properties')
  revalidatePath('/admin/properties/new')
  return { success: true }
}
