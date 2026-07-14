import { getProfile } from '@/lib/auth/dal'
import { Header } from '@/components/Header'

export default async function InspectorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Any authenticated user (inspector or admin) can view/complete their own
  // assigned inspections here — admins can double as inspectors.
  const profile = await getProfile()

  return (
    <div className="flex min-h-screen flex-col">
      <Header title="PPS Inspections" fullName={profile.full_name} />
      <main className="flex-1 overflow-y-auto bg-surface pb-8">{children}</main>
    </div>
  )
}
