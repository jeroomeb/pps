'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { LogOut, Plus, ShieldCheck, Building } from 'lucide-react'
import { getNavItems, resolveActiveNavHref } from '@/lib/nav-items'

export function AppShell({
  role,
  fullName,
  isGlobalAdmin = false,
  tenantName,
  showStartAudit,
  signOutAction,
  children,
}: {
  role: 'admin' | 'inspector'
  fullName: string
  isGlobalAdmin?: boolean
  tenantName?: string | null
  showStartAudit?: boolean
  signOutAction: () => void | Promise<void>
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const navItems = getNavItems(role, isGlobalAdmin)
  // Resolved once for the whole list so exactly one tab can be active, even
  // where hrefs nest (e.g. /inspector and /inspector/profile).
  const activeHref = resolveActiveNavHref(pathname, navItems)

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-60 lg:shrink-0 lg:flex-col lg:border-r lg:border-outline-variant lg:bg-surface-container-lowest">
        <div className="flex items-center gap-2 border-b border-outline-variant px-5 py-5">
          <Image src="/logo-sm.png" alt="" width={32} height={32} className="rounded" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-headline text-sm font-bold leading-tight">Amenity Op&apos;s</p>
            <p className="truncate text-[11px] text-on-surface-variant">Property Inspections &amp; Audits</p>
          </div>
        </div>

        {/* Multi-Tenant / Organization Indicator */}
        <div className="border-b border-outline-variant px-5 py-2.5 bg-surface-container-low/40">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <Building size={13} className="shrink-0 text-primary" />
              <p className="truncate text-xs font-semibold text-on-surface">
                {tenantName ?? "Amenity Op's HQ"}
              </p>
            </div>
            {isGlobalAdmin && (
              <span
                title="SaaS Platform Owner / Global Apex Layer"
                className="inline-flex shrink-0 items-center gap-0.5 rounded bg-primary-container px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-on-primary-container"
              >
                <ShieldCheck size={10} />
                Apex
              </span>
            )}
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
          {navItems.map((item) => {
            const active = item.href === activeHref
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                  active
                    ? 'bg-primary-container text-on-primary-container'
                    : 'text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {showStartAudit && (
          <div className="px-3 pb-2">
            <Link
              href="/admin/inspections/new"
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary-container px-4 font-headline text-sm font-semibold text-on-primary-container hover:brightness-95"
            >
              <Plus size={16} />
              Start Inspection
            </Link>
          </div>
        )}

        <div className="flex flex-col gap-1 border-t border-outline-variant p-3">
          <form action={signOutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-on-surface-variant hover:bg-surface-container"
            >
              <LogOut size={18} />
              Logout
            </button>
          </form>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        {/* Desktop top bar */}
        <div className="hidden items-center justify-between border-b border-outline-variant bg-surface-container-lowest px-6 py-3 lg:flex">
          <div className="flex items-center gap-2">
            <span className="text-xs text-on-surface-variant font-medium">Tenant Account:</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-surface-container border border-outline-variant">
              {tenantName ?? "Amenity Op's HQ"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium leading-tight">{fullName}</p>
              <p className="text-[11px] text-on-surface-variant">
                {isGlobalAdmin ? 'Platform Owner / Super Admin' : role === 'admin' ? 'Tenant Administrator' : 'Specialist'}
              </p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-container text-xs font-bold text-on-primary-container">
              {fullName
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto bg-surface pb-24 lg:pb-8">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 lg:px-8 lg:py-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
