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

  return (
    <>
      <Header title="PPS Inspections — Admin" fullName={profile.full_name} />
      <AppShell role="admin" fullName={profile.full_name} showStartAudit signOutAction={signOut}>
        {children}
      </AppShell>
      <BottomNav role="admin" />
    </>
  )
}
