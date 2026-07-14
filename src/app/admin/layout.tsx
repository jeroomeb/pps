import { requireRole } from '@/lib/auth/dal'
import { Header } from '@/components/Header'
import { BottomNav } from '@/components/BottomNav'

const NAV_ITEMS = [
  { href: '/admin/properties', label: 'Properties' },
  { href: '/admin/checklists', label: 'Checklists' },
  { href: '/admin/team', label: 'Team' },
  { href: '/admin/reports', label: 'Reports' },
  { href: '/inspector', label: 'My Inspections' },
]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await requireRole('admin')

  return (
    <div className="flex min-h-screen flex-col">
      <Header title="PPS Inspections — Admin" fullName={profile.full_name} />
      <main className="flex-1 overflow-y-auto bg-surface pb-4">{children}</main>
      <BottomNav items={NAV_ITEMS} />
    </div>
  )
}
