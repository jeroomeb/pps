import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { UserRole, LicenseTier, TenantStatus } from '@/lib/database.types'

export type TenantInfo = {
  id: string
  name: string
  slug: string | null
  license_tier: LicenseTier
  max_property_licenses: number
  status: TenantStatus
}

export type ProfileWithTenant = {
  id: string
  full_name: string
  role: UserRole
  email: string
  tenant_id: string | null
  is_global_admin: boolean
  is_contractor: boolean
  status: string
  tenant: TenantInfo | null
}

export const getSessionUser = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return user
})

export const getProfile = cache(async (): Promise<ProfileWithTenant> => {
  const user = await getSessionUser()
  const supabase = await createClient()

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, tenant_id, is_global_admin, is_contractor, status, tenants(id, name, slug, license_tier, max_property_licenses, status)')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    // If migration 0007 has not yet been applied to the live database,
    // the tenants join/columns will fail with PGRST200. Fall back to
    // reading basic profile columns so the user does not get caught
    // in an infinite redirect loop between '/' and '/login'.
    const { data: basicProfile } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('id', user.id)
      .single()

    if (basicProfile) {
      return {
        id: basicProfile.id,
        full_name: basicProfile.full_name,
        role: basicProfile.role,
        email: user.email!,
        tenant_id: null,
        is_global_admin: basicProfile.role === 'admin',
        is_contractor: false,
        status: 'active',
        tenant: null,
      }
    }

    redirect('/login')
  }

  const tenant = profile.tenants as unknown as TenantInfo | null

  return {
    id: profile.id,
    full_name: profile.full_name,
    role: profile.role,
    email: user.email!,
    tenant_id: profile.tenant_id,
    is_global_admin: profile.is_global_admin ?? false,
    is_contractor: profile.is_contractor ?? false,
    status: profile.status ?? 'active',
    tenant: tenant ?? null,
  }
})

export async function requireRole(role: UserRole) {
  const profile = await getProfile()
  if (profile.role !== role) {
    redirect(profile.role === 'admin' ? '/admin' : '/inspector')
  }
  return profile
}

/**
 * Asserts that the authenticated user sits in the Global Management Layer
 * (SaaS Platform Owner / Super Admin), which bypasses multi-tenant boundaries.
 */
export async function requireGlobalAdmin() {
  const profile = await requireRole('admin')
  if (!profile.is_global_admin) {
    redirect('/admin')
  }
  return profile
}

export type LicenseSummary = {
  tenantName: string
  licenseTier: LicenseTier
  usedProperties: number
  maxProperties: number
  remainingLicenses: number
  isAtCapacity: boolean
}

/**
 * Fetches the property license usage summary for a specific tenant or the caller's tenant.
 */
export async function getTenantLicenseSummary(tenantId?: string | null): Promise<LicenseSummary | null> {
  const profile = await getProfile()
  const targetTenantId = tenantId ?? profile.tenant_id

  if (!targetTenantId) return null

  const supabase = await createClient()

  const [{ data: tenant }, { count }] = await Promise.all([
    supabase
      .from('tenants')
      .select('id, name, license_tier, max_property_licenses')
      .eq('id', targetTenantId)
      .single(),
    supabase
      .from('properties')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', targetTenantId),
  ])

  if (!tenant) return null

  const used = count ?? 0
  const max = tenant.max_property_licenses
  const remaining = Math.max(0, max - used)

  return {
    tenantName: tenant.name,
    licenseTier: tenant.license_tier as LicenseTier,
    usedProperties: used,
    maxProperties: max,
    remainingLicenses: remaining,
    isAtCapacity: used >= max,
  }
}
