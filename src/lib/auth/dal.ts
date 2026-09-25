import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { cookies, headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'
import type { UserRole, LicenseTier, TenantStatus } from '@/lib/database.types'

export type TenantInfo = {
  id: string
  name: string
  slug: string | null
  license_tier: LicenseTier
  max_property_licenses: number
  status: TenantStatus
  enable_payouts?: boolean
  default_payout_rate?: number
  parent_organization_id?: string | null
}

export type ProfileWithTenant = {
  id: string
  full_name: string
  role: UserRole
  email: string
  human_id: string | null
  tenant_id: string | null
  is_global_admin: boolean
  is_contractor: boolean
  status: string
  must_reset_password: boolean
  tenant: TenantInfo | null
}

/**
 * Resolves all accessible tenant IDs for the current profile.
 * - Global admins: returns null (representing unrestricted access to all tenants)
 * - Parent tenant admins: returns array containing their own tenant ID + all child tenant IDs
 * - Child tenant users: returns array containing only their own tenant ID
 */
export async function getAccessibleTenantIds(): Promise<string[] | null> {
  const profile = await getProfile()
  if (profile.is_global_admin) {
    return null
  }
  if (!profile.tenant_id) {
    return []
  }

  const supabase = await createClient()
  const { data: childTenants } = await supabase
    .from('tenants')
    .select('id')
    .eq('parent_organization_id', profile.tenant_id)

  const ids = [profile.tenant_id]
  if (childTenants && childTenants.length > 0) {
    for (const child of childTenants) {
      ids.push(child.id)
    }
  }

  return ids
}

export const getSessionUser = cache(async () => {
  // Fast path: if proxy.ts already verified the session and forwarded the user id header,
  // reuse it directly to avoid an extra remote HTTP round-trip to Supabase auth!
  try {
    const headerList = await headers()
    const headerUserId = headerList.get('x-user-id')
    const headerUserEmail = headerList.get('x-user-email')

    if (headerUserId) {
      return {
        id: headerUserId,
        email: headerUserEmail || undefined,
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '',
      } as unknown as User
    }
  } catch {
    // headers() might not be accessible in non-request contexts
  }

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
    .select('id, full_name, role, human_id, tenant_id, is_global_admin, is_contractor, status, must_reset_password, tenants(id, name, slug, license_tier, max_property_licenses, status, enable_payouts, default_payout_rate)')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    // If migration 0007 has not yet been applied to the live database,
    // the tenants join/columns will fail with PGRST200. Fall back to
    // reading basic profile columns so the user does not get caught
    // in an infinite redirect loop between '/' and '/login'.
    const { data: basicProfile } = await supabase
      .from('profiles')
      .select('id, full_name, role, human_id')
      .eq('id', user.id)
      .single()

    if (basicProfile) {
      return {
        id: basicProfile.id,
        full_name: basicProfile.full_name,
        role: basicProfile.role,
        email: user.email!,
        human_id: basicProfile.human_id ?? null,
        tenant_id: null,
        is_global_admin: basicProfile.role === 'admin',
        is_contractor: false,
        status: 'active',
        must_reset_password: false,
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
    human_id: profile.human_id ?? null,
    tenant_id: profile.tenant_id,
    is_global_admin: profile.is_global_admin ?? false,
    is_contractor: profile.is_contractor ?? false,
    status: profile.status ?? 'active',
    must_reset_password: profile.must_reset_password ?? false,
    tenant: tenant ?? null,
  }
})

export async function requireRole(role: UserRole) {
  const profile = await getProfile()
  if (profile.status === 'inactive' || profile.status === 'suspended') {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }
  if (profile.must_reset_password) {
    redirect('/force-password-change')
  }
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
 * Reuses profile.tenant in-memory whenever available to eliminate redundant database round-trips.
 */
export async function getTenantLicenseSummary(
  tenantId?: string | null,
  knownPropertyCount?: number
): Promise<LicenseSummary | null> {
  const profile = await getProfile()
  const targetTenantId = tenantId ?? profile.tenant_id

  if (!targetTenantId) return null

  // Fast path: if targeting the current user's tenant and tenant info was already loaded in profile, reuse it!
  const cachedTenant =
    targetTenantId === profile.tenant_id && profile.tenant ? profile.tenant : null

  const supabase = await createClient()

  const tenantPromise = cachedTenant
    ? Promise.resolve({ data: cachedTenant })
    : supabase
        .from('tenants')
        .select('id, name, license_tier, max_property_licenses')
        .eq('id', targetTenantId)
        .single()

  const countPromise =
    typeof knownPropertyCount === 'number'
      ? Promise.resolve({ count: knownPropertyCount })
      : supabase
          .from('properties')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', targetTenantId)

  const [{ data: tenant }, { count }] = await Promise.all([tenantPromise, countPromise])

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

/**
 * Checks if the current admin session is impersonating a specialist via the
 * `amenity_impersonate_id` cookie.
 */
export const getImpersonatedSpecialist = cache(async (): Promise<ProfileWithTenant | null> => {
  try {
    const user = await getSessionUser()
    const supabase = await createClient()
    const { data: caller } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .single()

    if (!caller || caller.role !== 'admin') return null

    const cookieStore = await cookies()
    const impersonateId = cookieStore.get('amenity_impersonate_id')?.value
    if (!impersonateId || impersonateId === user.id) return null

    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('id, full_name, role, human_id, tenant_id, is_global_admin, is_contractor, status, must_reset_password, tenants(id, name, slug, license_tier, max_property_licenses, status, enable_payouts, default_payout_rate)')
      .eq('id', impersonateId)
      .single()

    if (!targetProfile) return null
    const tenant = targetProfile.tenants as unknown as TenantInfo | null

    return {
      id: targetProfile.id,
      full_name: targetProfile.full_name,
      role: targetProfile.role,
      email: '',
      human_id: targetProfile.human_id ?? null,
      tenant_id: targetProfile.tenant_id,
      is_global_admin: targetProfile.is_global_admin ?? false,
      is_contractor: targetProfile.is_contractor ?? false,
      status: targetProfile.status ?? 'active',
      must_reset_password: targetProfile.must_reset_password ?? false,
      tenant: tenant ?? null,
    }
  } catch {
    return null
  }
})

/**
 * Returns the effective profile for specialist routes.
 * If an admin is impersonating a specialist, returns the specialist's profile
 * along with the admin's original profile and `isImpersonating = true`.
 */
export async function getEffectiveProfile(): Promise<{
  profile: ProfileWithTenant
  isImpersonating: boolean
  adminProfile: ProfileWithTenant | null
}> {
  const profile = await getProfile()
  const impersonated = await getImpersonatedSpecialist()
  if (impersonated) {
    return {
      profile: impersonated,
      isImpersonating: true,
      adminProfile: profile,
    }
  }
  return {
    profile,
    isImpersonating: false,
    adminProfile: null,
  }
}

