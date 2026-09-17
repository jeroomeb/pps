import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Building2,
  ClipboardList,
  Users,
  FileText,
  ClipboardCheck,
  UserCircle,
  ShieldCheck,
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

export const GLOBAL_ADMIN_NAV_ITEMS: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/inspector', label: 'My Inspections', shortLabel: 'My Work', icon: ClipboardCheck },
  { href: '/admin/properties', label: 'Properties', icon: Building2 },
  { href: '/admin/tenants', label: 'Tenants & Licenses', shortLabel: 'Tenants', icon: ShieldCheck },
  { href: '/admin/reports', label: 'Reports', icon: FileText },
  { href: '/admin/checklists', label: 'Checklists', shortLabel: 'Lists', icon: ClipboardList },
  { href: '/admin/team', label: 'Team', icon: Users },
]

// `/inspector` is the specialist's landing/assignments page — it prefix-matches
// so it stays lit inside `/inspector/inspections/[id]` too. `/inspector/profile`
// is nested under it, which is exactly why `resolveActiveNavHref` below picks
// the most specific match rather than lighting up both.
export const INSPECTOR_NAV_ITEMS: NavItem[] = [
  { href: '/inspector', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/inspector/profile', label: 'Profile', icon: UserCircle },
]

export function getNavItems(role: 'admin' | 'inspector', isGlobalAdmin?: boolean): NavItem[] {
  if (role === 'inspector') return INSPECTOR_NAV_ITEMS
  return isGlobalAdmin ? GLOBAL_ADMIN_NAV_ITEMS : ADMIN_NAV_ITEMS
}

/** Does this item match the path at all? Not "is it THE active one" — see
 * `resolveActiveNavHref`, which disambiguates between overlapping matches. */
function navItemMatches(pathname: string, item: NavItem) {
  if (item.exact) return pathname === item.href
  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}

/**
 * The href of the single nav item that should render as active, or null.
 *
 * Nav hrefs nest (`/inspector` contains `/inspector/profile`; `/admin` used to
 * contain everything), so more than one item can legitimately match a path.
 * Most-specific-wins — the longest matching href — is what makes exactly one
 * tab light up. Resolving this once for the whole list is the only correct
 * approach: a per-item predicate cannot know another item matched better,
 * which is what caused Dashboard and Profile to both highlight.
 */
export function resolveActiveNavHref(pathname: string, items: NavItem[]): string | null {
  let best: string | null = null
  for (const item of items) {
    if (!navItemMatches(pathname, item)) continue
    if (best === null || item.href.length > best.length) best = item.href
  }
  return best
}
