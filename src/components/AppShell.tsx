'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LogOut,
  Plus,
  ShieldCheck,
  Building,
  User,
  ChevronDown,
  AlertCircle,
} from 'lucide-react'
import { getNavItems, resolveActiveNavHref } from '@/lib/nav-items'

export function AppShell({
  role,
  fullName,
  isGlobalAdmin = false,
  tenantName,
  enablePayouts = false,
  showStartAudit,
  signOutAction,
  children,
}: {
  role: 'admin' | 'inspector'
  fullName: string
  isGlobalAdmin?: boolean
  tenantName?: string | null
  enablePayouts?: boolean
  showStartAudit?: boolean
  signOutAction: () => void | Promise<void>
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const navItems = getNavItems(role, isGlobalAdmin, enablePayouts)
  const activeHref = resolveActiveNavHref(pathname, navItems)

  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showProfileMenu) return
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showProfileMenu])

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-60 lg:shrink-0 lg:flex-col lg:border-r lg:border-outline-variant lg:bg-surface-container-lowest lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
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
          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-on-surface-variant hover:bg-surface-container transition"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        {/* Desktop top bar */}
        <div className="hidden items-center justify-between border-b border-outline-variant bg-surface-container-lowest/95 backdrop-blur-sm px-6 py-3 lg:flex lg:sticky lg:top-0 lg:z-30">
          <div className="flex items-center gap-2">
            <span className="text-xs text-on-surface-variant font-medium">Tenant Account:</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-surface-container border border-outline-variant">
              {tenantName ?? "Amenity Op's HQ"}
            </span>
          </div>

          {/* User Profile & Top-Right Dropdown (ONB-14) */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setShowProfileMenu((prev) => !prev)}
              className="flex items-center gap-3 rounded-lg p-1.5 transition hover:bg-surface-container focus:outline-none"
              aria-expanded={showProfileMenu}
              aria-haspopup="true"
            >
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
              <ChevronDown
                size={14}
                className={`text-on-surface-variant transition-transform duration-150 ${
                  showProfileMenu ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-outline-variant bg-surface-container-lowest p-1.5 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="border-b border-outline-variant/60 px-3 py-2">
                  <p className="text-xs font-semibold text-on-surface truncate">{fullName}</p>
                  <p className="text-[10px] text-on-surface-variant truncate">
                    {tenantName ?? "Amenity Op's HQ"}
                  </p>
                </div>
                <div className="py-1">
                  <Link
                    href="/inspector/profile"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium text-on-surface hover:bg-surface-container transition"
                  >
                    <User size={14} className="text-primary" />
                    My Profile
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false)
                      setShowLogoutModal(true)
                    }}
                    className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium text-error hover:bg-error-container/20 transition text-left"
                  >
                    <LogOut size={14} />
                    Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <main className="flex-1 overflow-y-auto bg-surface pb-24 lg:pb-8">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 lg:px-8 lg:py-8">{children}</div>
        </main>
      </div>

      {/* Logout Confirmation Modal (ONB-13) */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-error-container/30 p-2 text-error shrink-0">
                <AlertCircle size={22} />
              </div>
              <div>
                <h3 className="font-headline text-base font-bold text-on-surface">Confirm Logout</h3>
                <p className="mt-1 text-xs text-on-surface-variant">
                  Are you sure you want to log out of your session? You will need to sign in again to access your account.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
                className="rounded-lg border border-outline-variant px-4 py-2 text-xs font-semibold uppercase tracking-wider text-on-surface hover:bg-surface-container transition"
              >
                Cancel
              </button>
              <form action={async () => {
                setIsLoggingOut(true)
                await signOutAction()
              }}>
                <button
                  type="submit"
                  disabled={isLoggingOut}
                  className="rounded-lg bg-error px-4 py-2 text-xs font-semibold uppercase tracking-wider text-on-error hover:brightness-95 transition shadow-sm"
                >
                  {isLoggingOut ? 'Logging out…' : 'Confirm Logout'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
