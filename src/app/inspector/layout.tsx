import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/auth/dal'
import { Header } from '@/components/Header'
import { BottomNav } from '@/components/BottomNav'
import { AppShell } from '@/components/AppShell'
import { signOut } from '@/lib/actions/auth'
import { SpecialistChatbot } from '@/components/SpecialistChatbot'

export default async function InspectorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Any authenticated user (inspector or admin) can view/complete their own
  // assigned inspections here — admins can double as inspectors.
  const profile = await getProfile()

  if (profile.must_reset_password) {
    redirect('/force-password-change')
  }

  const enablePayouts = profile.tenant?.enable_payouts ?? false

  return (
    <>
      <Header title="Amenity Op's" fullName={profile.full_name} />
      <AppShell
        role={profile.role}
        fullName={profile.full_name}
        isGlobalAdmin={profile.is_global_admin}
        tenantName={profile.tenant?.name ?? null}
        enablePayouts={enablePayouts}
        showStartAudit={profile.role === 'admin'}
        signOutAction={signOut}
      >
        {children}
      </AppShell>
      <BottomNav
        role={profile.role}
        isGlobalAdmin={profile.is_global_admin}
        enablePayouts={enablePayouts}
      />
      <SpecialistChatbot specialistName={profile.full_name} />
    </>
  )
}
