import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Building2,
  ClipboardList,
  Users,
  FileText,
  ClipboardCheck,
  UserCircle,
} from 'lucide-react'

export type NavItem = {
  href: string
  label: string
  /** Shorter label for the mobile bottom-nav tab, where space is tight. Defaults to `label`. */
  shortLabel?: string
  icon: LucideIcon
  exact?: boolean
}

export const ADMIN_NAV_ITEMS: NavItem[] = [
  // Overview first, My Inspections second — per client request (punch list #8).
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/inspector', label: 'My Inspections', shortLabel: 'My Work', icon: ClipboardCheck },
  { href: '/admin/properties', label: 'Properties', icon: Building2 },
  { href: '/admin/reports', label: 'Reports', icon: FileText },
  // Checklists is second-to-last, Team is last — per client request.
  { href: '/admin/checklists', label: 'Checklists', shortLabel: 'Lists', icon: ClipboardList },
  { href: '/admin/team', label: 'Team', icon: Users },
]

// This is one of two tabs for the inspector role, and it's the specialist's
// landing/assignments page — keep it lit while inside a checklist detail too.
export const INSPECTOR_NAV_ITEMS: NavItem[] = [
  { href: '/inspector', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/inspector/profile', label: 'Profile', icon: UserCircle, exact: true },
]

export function isNavItemActive(pathname: string, item: NavItem) {
  if (item.exact) return pathname === item.href
  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}
