'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { requireGlobalAdmin } from '@/lib/auth/dal'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { genSpecialistId } from '@/lib/ids'
import { generateSecureTemporaryPassword } from '@/lib/security'
import { sendWelcomeCredentialsEmail } from '@/lib/email/sendWelcomeCredentialsEmail'
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
  parent_organization_id: z.string().uuid().optional().nullable(),
  primary_specialist_id: z.string().uuid().optional().nullable(),
  admin_name: z.string().trim().optional(),
  admin_email: z.string().trim().email('Enter a valid admin email').optional().or(z.literal('')),
  admin_password: z.string().min(8, 'Admin password must be at least 8 characters').optional().or(z.literal('')),
})

export type TenantFormState = { error?: string; success?: boolean; generatedPassword?: string } | undefined

export async function createTenant(
  _prevState: TenantFormState,
  formData: FormData
): Promise<TenantFormState> {
  await requireGlobalAdmin()

  const rawSlug = formData.get('slug')
  const slug = typeof rawSlug === 'string' && rawSlug.trim() ? rawSlug.trim().toLowerCase() : undefined

  const rawParentOrgId = formData.get('parent_organization_id')
  const parentOrgId = typeof rawParentOrgId === 'string' && rawParentOrgId.trim() ? rawParentOrgId.trim() : null

  const rawSpecialistId = formData.get('primary_specialist_id')
  const primarySpecialistId =
    typeof rawSpecialistId === 'string' && rawSpecialistId.trim() ? rawSpecialistId.trim() : null

  const adminName = formData.get('admin_name')
  const adminEmail = formData.get('admin_email')
  const adminPassword = formData.get('admin_password')

  const parsed = tenantSchema.safeParse({
    name: formData.get('name'),
    slug,
    license_tier: formData.get('license_tier'),
    max_property_licenses: formData.get('max_property_licenses'),
    status: formData.get('status') || 'active',
    parent_organization_id: parentOrgId,
    primary_specialist_id: primarySpecialistId,
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
      parent_organization_id: parsed.data.parent_organization_id,
    })
    .select('id, name')
    .single()

  if (error || !newTenant) {
    if (error?.code === '23505') {
      return { error: 'A tenant with that company slug already exists.' }
    }
    return { error: error?.message ?? 'Failed to create tenant organization.' }
  }

  let finalAdminPassword = ''

  // If an existing verified specialist was appointed to this tenant:
  if (parsed.data.primary_specialist_id) {
    const admin = createAdminClient()
    const { error: assignError } = await admin
      .from('profiles')
      .update({
        tenant_id: newTenant.id,
      })
      .eq('id', parsed.data.primary_specialist_id)

    if (assignError) {
      console.error('[createTenant] Failed to assign primary specialist to tenant:', assignError)
    }
  }

  // Provision a new primary Tenant Admin user account if email was provided
  if (parsed.data.admin_email) {
    const admin = createAdminClient()
    const adminFullName = parsed.data.admin_name || `${parsed.data.name} Administrator`
    finalAdminPassword = parsed.data.admin_password || generateSecureTemporaryPassword()

    const { data: createdUser, error: authError } = await admin.auth.admin.createUser({
      email: parsed.data.admin_email,
      password: finalAdminPassword,
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

      // Fire-and-forget asynchronous welcome credential email dispatch via Resend
      sendWelcomeCredentialsEmail({
        recipientEmail: parsed.data.admin_email,
        recipientName: adminFullName,
        temporaryPassword: finalAdminPassword,
        role: 'admin',
        organizationName: newTenant.name,
      }).catch((err) => {
        console.error('[createTenant] Async credentials email dispatch error:', err)
      })
    }
  }

  revalidatePath('/admin/tenants')
  return { success: true, generatedPassword: finalAdminPassword || undefined }
}

const updateLicenseSchema = z.object({
  tenant_id: z.string().uuid(),
  name: z.string().trim().min(1, 'Company name is required'),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, 'Slug must only contain lowercase letters, numbers, and hyphens')
    .optional(),
  license_tier: z.enum(['starter', 'standard', 'pro', 'enterprise']),
  max_property_licenses: z.coerce.number().int().min(1, 'Minimum 1 property license required'),
  status: z.enum(['active', 'suspended', 'trial']),
  parent_organization_id: z.string().uuid().optional().nullable(),
})

export async function updateTenantLicense(
  _prevState: TenantFormState,
  formData: FormData
): Promise<TenantFormState> {
  await requireGlobalAdmin()

  const rawSlug = formData.get('slug')
  const slug = typeof rawSlug === 'string' && rawSlug.trim() ? rawSlug.trim().toLowerCase() : undefined

  const rawParentOrgId = formData.get('parent_organization_id')
  const parentOrgId = typeof rawParentOrgId === 'string' && rawParentOrgId.trim() ? rawParentOrgId.trim() : null

  const parsed = updateLicenseSchema.safeParse({
    tenant_id: formData.get('tenant_id'),
    name: formData.get('name'),
    slug,
    license_tier: formData.get('license_tier'),
    max_property_licenses: formData.get('max_property_licenses'),
    status: formData.get('status'),
    parent_organization_id: parentOrgId,
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
      parent_organization_id: parsed.data.parent_organization_id,
      slug: parsed.data.slug ?? undefined,
      updated_at: new Date().toISOString(),
    })
    .eq('id', parsed.data.tenant_id)

  if (error) {
    if (error.code === '23505') {
      return { error: 'A tenant with that account slug already exists.' }
    }
    return { error: error.message }
  }

  // Handle assigned specialists roster if provided in form
  const rawSpecialistIds = formData.getAll('specialist_ids')
  const selectedSpecialistIds = rawSpecialistIds
    .map((s) => (typeof s === 'string' ? s.trim() : ''))
    .filter(Boolean)

  const admin = createAdminClient()

  // 1. Unlink profiles previously attached to this tenant that were deselected
  const { data: currentStaff } = await admin
    .from('profiles')
    .select('id')
    .eq('tenant_id', parsed.data.tenant_id)

  const currentIds = (currentStaff ?? []).map((s) => s.id)
  const toRemove = currentIds.filter((id) => !selectedSpecialistIds.includes(id))
  if (toRemove.length > 0) {
    await admin.from('profiles').update({ tenant_id: null }).in('id', toRemove)
  }

  // 2. Assign newly selected specialists to this tenant
  if (selectedSpecialistIds.length > 0) {
    await admin
      .from('profiles')
      .update({ tenant_id: parsed.data.tenant_id })
      .in('id', selectedSpecialistIds)
  }

  revalidatePath('/admin/tenants')
  revalidatePath('/admin/properties')
  revalidatePath('/admin/team')
  return { success: true }
}

export async function deleteTenant(
  tenantId: string
): Promise<{ error?: string; success?: boolean }> {
  await requireGlobalAdmin()

  const supabase = await createClient()
  const admin = createAdminClient()

  // 1. Unlink any specialists linked to this tenant
  await admin.from('profiles').update({ tenant_id: null }).eq('tenant_id', tenantId)

  // 2. Unlink any child tenants that have this tenant as parent_organization_id
  await admin.from('tenants').update({ parent_organization_id: null }).eq('parent_organization_id', tenantId)

  // 3. Delete the tenant
  const { error } = await supabase.from('tenants').delete().eq('id', tenantId)
  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/tenants')
  revalidatePath('/admin/properties')
  revalidatePath('/admin/team')
  return { success: true }
}
