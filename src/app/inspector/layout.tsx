import { redirect } from 'next/navigation'
import { getEffectiveProfile } from '@/lib/auth/dal'
import { Header } from '@/components/Header'
import { BottomNav } from '@/components/BottomNav'
import { AppShell } from '@/components/AppShell'
import { signOut } from '@/lib/actions/auth'
import { SpecialistChatbot } from '@/components/SpecialistChatbot'
import { AdminImpersonationBanner } from '@/components/AdminImpersonationBanner'

export default async function InspectorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Supports direct specialist session or an Admin impersonating a specialist
  const { profile, isImpersonating, adminProfile } = await getEffectiveProfile()

  if (profile.must_reset_password && !isImpersonating) {
    redirect('/force-password-change')
  }

  const enablePayouts = profile.tenant?.enable_payouts ?? false

  return (
    <>
      {isImpersonating && (
        <AdminImpersonationBanner
          specialistName={profile.full_name}
          specialistHumanId={profile.human_id}
          adminName={adminProfile?.full_name ?? 'Admin'}
        />
      )}
      <Header title="Amenity Op's" fullName={profile.full_name} />
      <AppShell
        role={isImpersonating ? 'inspector' : profile.role}
        fullName={profile.full_name}
        isGlobalAdmin={isImpersonating ? false : profile.is_global_admin}
        tenantName={profile.tenant?.name ?? null}
        enablePayouts={enablePayouts}
        showStartAudit={!isImpersonating && profile.role === 'admin'}
        signOutAction={signOut}
      >
        {children}
      </AppShell>
      <BottomNav
        role={isImpersonating ? 'inspector' : profile.role}
        isGlobalAdmin={isImpersonating ? false : profile.is_global_admin}
        enablePayouts={enablePayouts}
      />
      <SpecialistChatbot specialistName={profile.full_name} />
    </>
  )
}
