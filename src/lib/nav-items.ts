import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Building2,
  ClipboardList,
  Users,
  FileText,
  ClipboardCheck,
} from 'lucide-react'

export type NavItem = { href: string; label: string; icon: LucideIcon; exact?: boolean }

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/properties', label: 'Properties', icon: Building2 },
  { href: '/admin/reports', label: 'Reports', icon: FileText },
  { href: '/inspector', label: 'My Inspections', icon: ClipboardCheck },
  // Checklists is second-to-last, Team is last — per client request.
  { href: '/admin/checklists', label: 'Checklists', icon: ClipboardList },
  { href: '/admin/team', label: 'Team', icon: Users },
]

// Note: no `exact` here — it's the inspector role's only tab, so it should
// stay lit while they're inside /inspector/inspections/[id] too.
export const INSPECTOR_NAV_ITEMS: NavItem[] = [
  { href: '/inspector', label: 'Dashboard', icon: LayoutDashboard },
]

export function isNavItemActive(pathname: string, item: NavItem) {
  if (item.exact) return pathname === item.href
  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}
