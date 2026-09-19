'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  MoreHorizontal,
  X,
  LayoutDashboard,
  Building2,
  FileText,
  Users,
  BarChart3,
  CircleDollarSign,
  ClipboardCheck,
  ClipboardList,
  ShieldCheck,
  UserCircle,
  Award,
} from 'lucide-react'
import { getNavItems, resolveActiveNavHref, type NavItem } from '@/lib/nav-items'

export function BottomNav({
  role,
  isGlobalAdmin = false,
  enablePayouts = false,
}: {
  role: 'admin' | 'inspector'
  isGlobalAdmin?: boolean
  enablePayouts?: boolean
}) {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  // Close drawer on navigation
  useEffect(() => {
    setMoreOpen(false)
  }, [pathname])

  // Lock scroll when more drawer is open
  useEffect(() => {
    if (moreOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [moreOpen])

  const allItems = getNavItems(role, isGlobalAdmin, enablePayouts)
  const activeHref = resolveActiveNavHref(pathname, allItems)

  // For specialists (OCS), 3-4 items fit comfortably on mobile
  if (role === 'inspector') {
    return (
      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-outline-variant bg-surface-container-lowest lg:hidden">
        {allItems.map((item) => {
          const active = item.href === activeHref
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              title={item.label}
              className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 py-1.5 transition ${
                active
                  ? 'border-t-2 border-primary text-primary font-bold'
                  : 'border-t-2 border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Icon size={19} />
              <span className="text-[10px] font-semibold leading-tight">
                {item.shortLabel ?? item.label}
              </span>
            </Link>
          )
        })}
      </nav>
    )
  }

  // For Admin / Global Admin:
  // Primary 4 tabs + 1 "More" tab to prevent mobile cramming and text overlap
  const primaryAdminHrefs = ['/admin', '/admin/properties', '/admin/reports', '/admin/team']
  const primaryItems = allItems.filter((item) => primaryAdminHrefs.includes(item.href))
  const secondaryItems = allItems.filter((item) => !primaryAdminHrefs.includes(item.href))

  const isSecondaryActive = secondaryItems.some((item) => item.href === activeHref)

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-outline-variant bg-surface-container-lowest shadow-lg lg:hidden">
        {primaryItems.map((item) => {
          const active = item.href === activeHref
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              title={item.label}
              className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 py-1.5 transition ${
                active
                  ? 'border-t-2 border-primary text-primary font-bold'
                  : 'border-t-2 border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Icon size={19} />
              <span className="text-[10px] font-semibold leading-tight">
                {item.shortLabel ?? item.label}
              </span>
            </Link>
          )
        })}

        {/* More Tab Trigger */}
        <button
          type="button"
          onClick={() => setMoreOpen(!moreOpen)}
          aria-label="More navigation options"
          className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 py-1.5 transition ${
            isSecondaryActive || moreOpen
              ? 'border-t-2 border-primary text-primary font-bold'
              : 'border-t-2 border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <div className="relative">
            <MoreHorizontal size={19} />
            {isSecondaryActive && (
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary" />
            )}
          </div>
          <span className="text-[10px] font-semibold leading-tight">More</span>
        </button>
      </nav>

      {/* Slide-Up "More" Sheet Modal on Mobile */}
      {moreOpen && (
        <div className="fixed inset-0 z-30 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMoreOpen(false)}
          />

          {/* Drawer Content */}
          <div className="fixed inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-outline-variant bg-surface-container-lowest p-5 pb-20 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="mb-4 flex items-center justify-between border-b border-outline-variant pb-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary" />
                <h3 className="font-headline font-bold text-base text-on-surface">
                  All Management Sections
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {secondaryItems.map((item) => {
                const active = item.href === activeHref
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={`flex items-center gap-3.5 rounded-xl border p-3.5 transition ${
                      active
                        ? 'border-primary-container bg-primary-container/20 text-primary font-bold'
                        : 'border-outline-variant bg-surface-container-low text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                        active
                          ? 'bg-primary-container text-primary'
                          : 'bg-surface-container-highest text-on-surface-variant'
                      }`}
                    >
                      <Icon size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm">{item.label}</p>
                      <p className="text-xs text-on-surface-variant">
                        {item.href === '/admin/analytics' && 'Operational KPIs & throughput analytics'}
                        {item.href === '/admin/payouts' && 'Specialist compensation ledger & rates'}
                        {item.href === '/inspector' && 'Switch to field inspection mode'}
                        {item.href === '/admin/checklists' && 'Manage audit checklist templates'}
                        {item.href === '/admin/tenants' && 'Multi-tenant organization licenses'}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
