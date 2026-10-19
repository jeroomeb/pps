import 'server-only'
import { getProfile, requireRole } from '@/lib/auth/dal'
import { getAdminScope } from '@/lib/auth/tenant-view'
import { createClient } from '@/lib/supabase/server'

/**
 * Checks whether the current user has permission to manage (create, edit, clone, delete)
 * checklist templates and checklist items.
 *
 * Rules:
 * 1. Platform Owner / Super Admin (is_global_admin with no provisional tenant view active) always has full access.
 * 2. Provisional Tenant admins have access ONLY IF the Platform Owner has explicitly enabled
 *    `allow_checklist_management` on their tenant organization.
 * 3. All other users are restricted to Read-Only mode.
 */
export async function canManageChecklists(): Promise<{ allowed: boolean; isSuperAdmin: boolean }> {
  try {
    const profile = await getProfile()
    const scope = await getAdminScope()

    const isSuperAdmin = Boolean(profile.is_global_admin && !scope.isViewingTenant)
    if (isSuperAdmin) {
      return { allowed: true, isSuperAdmin: true }
    }

    const tenantId = scope.tenantId ?? profile.tenant_id
    if (!tenantId) {
      return { allowed: false, isSuperAdmin: false }
    }

    const supabase = await createClient()
    const { data: tenant } = await supabase
      .from('tenants')
      .select('allow_checklist_management')
      .eq('id', tenantId)
      .maybeSingle()

    return {
      allowed: Boolean(tenant?.allow_checklist_management),
      isSuperAdmin: false,
    }
  } catch {
    return { allowed: false, isSuperAdmin: false }
  }
}

/**
 * Server action authorization guard for checklist mutations.
 * Throws a descriptive error if the caller does not have checklist management permissions.
 */
export async function requireChecklistManagementPermission(): Promise<{
  isSuperAdmin: boolean
  tenantId: string | null
}> {
  await requireRole('admin')
  const { allowed, isSuperAdmin } = await canManageChecklists()

  if (!allowed) {
    throw new Error(
      'Checklist modification is restricted. Contact the platform owner / Super Admin to enable checklist management for your organization.'
    )
  }

  const scope = await getAdminScope()
  const profile = await getProfile()
  const tenantId = isSuperAdmin ? null : (scope.tenantId ?? profile.tenant_id)

  return { isSuperAdmin, tenantId }
}
