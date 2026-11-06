'use client'

import { useState } from 'react'
import Image from 'next/image'
import { AlertCircle } from 'lucide-react'
import { signOut } from '@/lib/actions/auth'

export function Header({
  title,
  fullName,
}: {
  title: string
  fullName: string
}) {
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-outline-variant bg-surface-container-lowest/95 backdrop-blur-sm px-4 py-3 lg:hidden">
        <div className="flex items-center gap-3">
          <Image src="/logo-sm.png" alt="" width={32} height={32} className="rounded" />
          <div>
            <p className="font-headline text-lg font-bold leading-tight">{title}</p>
            <p className="text-xs text-on-surface-variant">{fullName}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowLogoutModal(true)}
          className="rounded border border-outline-variant px-3 py-2 text-xs font-semibold uppercase tracking-wide hover:bg-surface-container transition"
        >
          Sign Out
        </button>
      </header>

      {/* Mobile Logout Confirmation Modal (ONB-13) */}
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
                  Are you sure you want to end your session? You will need to sign in again to access your account.
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
                try {
                  await signOut()
                } catch (error) {
                  if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
                    throw error
                  }
                  window.location.href = '/login'
                }
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
    </>
  )
}
