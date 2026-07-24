'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { LogOut, Plus } from 'lucide-react'
import { ADMIN_NAV_ITEMS, INSPECTOR_NAV_ITEMS, isNavItemActive } from '@/lib/nav-items'

export function AppShell({
  role,
  fullName,
  showStartAudit,
  signOutAction,
  children,
}: {
  role: 'admin' | 'inspector'
  fullName: string
  showStartAudit?: boolean
  signOutAction: () => void | Promise<void>
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const navItems = role === 'admin' ? ADMIN_NAV_ITEMS : INSPECTOR_NAV_ITEMS

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-60 lg:shrink-0 lg:flex-col lg:border-r lg:border-outline-variant lg:bg-surface-container-lowest">
        <div className="flex items-center gap-2 border-b border-outline-variant px-5 py-5">
          <Image src="/logo-sm.png" alt="" width={32} height={32} className="rounded" />
          <div>
            <p className="font-headline text-sm font-bold leading-tight">Amenity Op&apos;s</p>
            <p className="text-[11px] text-on-surface-variant">Property Inspections &amp; Audits</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
          {navItems.map((item) => {
            const active = isNavItemActive(pathname, item)
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
        <div className="hidden items-center justify-end gap-3 border-b border-outline-variant bg-surface-container-lowest px-6 py-3 lg:flex">
          <p className="text-sm font-medium">{fullName}</p>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-fixed text-xs font-bold text-on-primary-fixed">
            {fullName
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()}
          </div>
        </div>

        <main className="flex-1 overflow-y-auto bg-surface pb-24 lg:pb-8">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 lg:px-8 lg:py-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
