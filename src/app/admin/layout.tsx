import { requireRole } from '@/lib/auth/dal'
import { Header } from '@/components/Header'
import { BottomNav } from '@/components/BottomNav'
import { AppShell } from '@/components/AppShell'
import { signOut } from '@/lib/actions/auth'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await requireRole('admin')
  const enablePayouts = profile.tenant?.enable_payouts ?? false

  return (
    <>
      <Header title="Amenity Op's — Admin" fullName={profile.full_name} />
      <AppShell
        role="admin"
        fullName={profile.full_name}
        isGlobalAdmin={profile.is_global_admin}
        tenantName={profile.tenant?.name ?? null}
        enablePayouts={enablePayouts}
        showStartAudit
        signOutAction={signOut}
      >
        {children}
      </AppShell>
      <BottomNav role="admin" isGlobalAdmin={profile.is_global_admin} enablePayouts={enablePayouts} />
    </>
  )
}
