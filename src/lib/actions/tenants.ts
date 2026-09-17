'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { requireGlobalAdmin } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import type { LicenseTier, TenantStatus } from '@/lib/database.types'

const tenantSchema = z.object({
  name: z.string().trim().min(1, 'Tenant company name is required'),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, 'Slug must only contain lowercase letters, numbers, and hyphens')
    .optional(),
  license_tier: z.enum(['starter', 'standard', 'pro', 'enterprise']),
  max_property_licenses: z.coerce.number().int().min(1, 'Minimum 1 property license required'),
  status: z.enum(['active', 'suspended', 'trial']).default('active'),
})

export type TenantFormState = { error?: string; success?: boolean } | undefined

export async function createTenant(
  _prevState: TenantFormState,
  formData: FormData
): Promise<TenantFormState> {
  await requireGlobalAdmin()

  const rawSlug = formData.get('slug')
  const slug = typeof rawSlug === 'string' && rawSlug.trim() ? rawSlug.trim().toLowerCase() : undefined

  const parsed = tenantSchema.safeParse({
    name: formData.get('name'),
    slug,
    license_tier: formData.get('license_tier'),
    max_property_licenses: formData.get('max_property_licenses'),
    status: formData.get('status') || 'active',
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const supabase = await createClient()

  // Generate fallback slug from name if not provided
  const tenantSlug =
    parsed.data.slug ||
    parsed.data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

  const { error } = await supabase.from('tenants').insert({
    name: parsed.data.name,
    slug: tenantSlug,
    license_tier: parsed.data.license_tier as LicenseTier,
    max_property_licenses: parsed.data.max_property_licenses,
    status: parsed.data.status as TenantStatus,
  })

  if (error) {
    if (error.code === '23505') {
      return { error: 'A tenant with that company slug already exists.' }
    }
    return { error: error.message }
  }

  revalidatePath('/admin/tenants')
  return { success: true }
}

const updateLicenseSchema = z.object({
  tenant_id: z.string().uuid(),
  name: z.string().trim().min(1, 'Company name is required'),
  license_tier: z.enum(['starter', 'standard', 'pro', 'enterprise']),
  max_property_licenses: z.coerce.number().int().min(1, 'Minimum 1 property license required'),
  status: z.enum(['active', 'suspended', 'trial']),
})

export async function updateTenantLicense(
  _prevState: TenantFormState,
  formData: FormData
): Promise<TenantFormState> {
  await requireGlobalAdmin()

  const parsed = updateLicenseSchema.safeParse({
    tenant_id: formData.get('tenant_id'),
    name: formData.get('name'),
    license_tier: formData.get('license_tier'),
    max_property_licenses: formData.get('max_property_licenses'),
    status: formData.get('status'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('tenants')
    .update({
      name: parsed.data.name,
      license_tier: parsed.data.license_tier as LicenseTier,
      max_property_licenses: parsed.data.max_property_licenses,
      status: parsed.data.status as TenantStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', parsed.data.tenant_id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/tenants')
  revalidatePath('/admin/properties')
  return { success: true }
}
