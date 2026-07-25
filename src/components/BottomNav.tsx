'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ADMIN_NAV_ITEMS, INSPECTOR_NAV_ITEMS, isNavItemActive } from '@/lib/nav-items'

export function BottomNav({ role }: { role: 'admin' | 'inspector' }) {
  const pathname = usePathname()
  const items = role === 'admin' ? ADMIN_NAV_ITEMS : INSPECTOR_NAV_ITEMS

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-outline-variant bg-surface-container-lowest lg:hidden">
      {items.map((item) => {
        const active = isNavItemActive(pathname, item)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            title={item.label}
            className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 py-2 ${
              active
                ? 'border-t-2 border-primary-container text-primary'
                : 'border-t-2 border-transparent text-on-surface-variant'
            }`}
          >
            <Icon size={20} />
            <span className="text-[10px] font-semibold leading-none">
              {item.shortLabel ?? item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
