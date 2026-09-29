import 'server-only'
import { cache } from 'react'
import { cookies } from 'next/headers'
import { getProfile } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'

export const TENANT_VIEW_COOKIE = 'amenity_view_tenant_id'

export type AdminScope = {
  tenantId: string | null
  tenantName: string | null
  isViewingTenant: boolean
  enablePayouts: boolean
}

/**
 * HQ can open one provisional tenant's admin dashboard in a new tab.
 * While that cookie is set, admin lists are limited to that tenant.
 * A normal tenant admin is always limited to their own tenant.
 * HQ with no cookie still sees every tenant.
 */
export const getAdminScope = cache(async (): Promise<AdminScope> => {
  const profile = await getProfile()

  if (!profile.is_global_admin) {
    return {
      tenantId: profile.tenant_id,
      tenantName: profile.tenant?.name ?? null,
      isViewingTenant: false,
      enablePayouts: profile.tenant?.enable_payouts ?? false,
    }
  }

  const cookieStore = await cookies()
  const viewedId = cookieStore.get(TENANT_VIEW_COOKIE)?.value
  if (!viewedId) {
    return {
      tenantId: null,
      tenantName: null,
      isViewingTenant: false,
      enablePayouts: profile.tenant?.enable_payouts ?? false,
    }
  }

  const supabase = await createClient()
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, name, enable_payouts')
    .eq('id', viewedId)
    .maybeSingle()

  if (!tenant) {
    return {
      tenantId: null,
      tenantName: null,
      isViewingTenant: false,
      enablePayouts: false,
    }
  }

  return {
    tenantId: tenant.id,
    tenantName: tenant.name,
    isViewingTenant: true,
    enablePayouts: tenant.enable_payouts ?? false,
  }
})
