import { getProfile } from '@/lib/auth/dal'
import { Header } from '@/components/Header'
import { BottomNav } from '@/components/BottomNav'
import { AppShell } from '@/components/AppShell'
import { signOut } from '@/lib/actions/auth'

export default async function InspectorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Any authenticated user (inspector or admin) can view/complete their own
  // assigned inspections here — admins can double as inspectors.
  const profile = await getProfile()

  return (
    <>
      <Header title="Amenity Op's" fullName={profile.full_name} />
      <AppShell
        role={profile.role}
        fullName={profile.full_name}
        showStartAudit={profile.role === 'admin'}
        signOutAction={signOut}
      >
        {children}
      </AppShell>
      <BottomNav role={profile.role} />
    </>
  )
}
