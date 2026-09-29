import { requireRole } from '@/lib/auth/dal'
import { getAdminScope } from '@/lib/auth/tenant-view'
import { Header } from '@/components/Header'
import { BottomNav } from '@/components/BottomNav'
import { AppShell } from '@/components/AppShell'
import { TenantViewBanner } from '@/components/TenantViewBanner'
import { signOut } from '@/lib/actions/auth'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await requireRole('admin')
  const scope = await getAdminScope()
  const showGlobalNav = profile.is_global_admin && !scope.isViewingTenant
  const enablePayouts = scope.isViewingTenant
    ? scope.enablePayouts
    : (profile.tenant?.enable_payouts ?? false)

  return (
    <>
      <Header title="Amenity Op's — Admin" fullName={profile.full_name} />
      {scope.isViewingTenant && scope.tenantName && (
        <TenantViewBanner tenantName={scope.tenantName} />
      )}
      <AppShell
        role="admin"
        fullName={profile.full_name}
        isGlobalAdmin={showGlobalNav}
        tenantName={scope.tenantName ?? profile.tenant?.name ?? null}
        enablePayouts={enablePayouts}
        showStartAudit
        signOutAction={signOut}
      >
        {children}
      </AppShell>
      <BottomNav role="admin" isGlobalAdmin={showGlobalNav} enablePayouts={enablePayouts} />
    </>
  )
}
