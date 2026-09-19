'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { requireGlobalAdmin } from '@/lib/auth/dal'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { genSpecialistId } from '@/lib/ids'
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
  admin_name: z.string().trim().optional(),
  admin_email: z.string().trim().email('Enter a valid admin email').optional().or(z.literal('')),
  admin_password: z.string().min(8, 'Admin password must be at least 8 characters').optional().or(z.literal('')),
})

export type TenantFormState = { error?: string; success?: boolean } | undefined

export async function createTenant(
  _prevState: TenantFormState,
  formData: FormData
): Promise<TenantFormState> {
  await requireGlobalAdmin()

  const rawSlug = formData.get('slug')
  const slug = typeof rawSlug === 'string' && rawSlug.trim() ? rawSlug.trim().toLowerCase() : undefined

  const adminName = formData.get('admin_name')
  const adminEmail = formData.get('admin_email')
  const adminPassword = formData.get('admin_password')

  const parsed = tenantSchema.safeParse({
    name: formData.get('name'),
    slug,
    license_tier: formData.get('license_tier'),
    max_property_licenses: formData.get('max_property_licenses'),
    status: formData.get('status') || 'active',
    admin_name: typeof adminName === 'string' && adminName.trim() ? adminName.trim() : undefined,
    admin_email: typeof adminEmail === 'string' && adminEmail.trim() ? adminEmail.trim() : '',
    admin_password: typeof adminPassword === 'string' && adminPassword.trim() ? adminPassword.trim() : '',
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

  const { data: newTenant, error } = await supabase
    .from('tenants')
    .insert({
      name: parsed.data.name,
      slug: tenantSlug,
      license_tier: parsed.data.license_tier as LicenseTier,
      max_property_licenses: parsed.data.max_property_licenses,
      status: parsed.data.status as TenantStatus,
    })
    .select('id, name')
    .single()

  if (error || !newTenant) {
    if (error?.code === '23505') {
      return { error: 'A tenant with that company slug already exists.' }
    }
    return { error: error?.message ?? 'Failed to create tenant organization.' }
  }

  // Provision the primary Tenant Admin user account if credentials were provided
  if (parsed.data.admin_email && parsed.data.admin_password) {
    const admin = createAdminClient()
    const adminFullName = parsed.data.admin_name || `${parsed.data.name} Administrator`

    const { data: createdUser, error: authError } = await admin.auth.admin.createUser({
      email: parsed.data.admin_email,
      password: parsed.data.admin_password,
      email_confirm: true,
      user_metadata: {
        full_name: adminFullName,
        role: 'admin',
      },
    })

    if (authError) {
      // If user creation fails, report it but don't crash
      return {
        error: `Tenant "${newTenant.name}" provisioned, but failed to create admin user: ${authError.message}`,
      }
    }

    if (createdUser.user) {
      // Associate profile with tenant_id, role = admin, must_reset_password = true
      for (let attempt = 0; attempt < 2; attempt++) {
        const { error: profileError } = await admin
          .from('profiles')
          .update({
            role: 'admin',
            human_id: genSpecialistId(),
            tenant_id: newTenant.id,
            is_global_admin: false,
            must_reset_password: true,
          })
          .eq('id', createdUser.user.id)

        if (!profileError) break
      }
    }
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
