'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function BottomNav({
  items,
}: {
  items: { href: string; label: string }[]
}) {
  const pathname = usePathname()

  return (
    <nav className="sticky bottom-0 z-10 flex border-t border-outline-variant bg-surface-container-lowest">
      {items.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs font-semibold uppercase tracking-wide ${
              active
                ? 'border-t-2 border-primary-container text-on-primary-container'
                : 'border-t-2 border-transparent text-on-surface-variant'
            }`}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
