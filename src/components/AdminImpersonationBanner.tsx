'use client'

import { useState } from 'react'
import { ShieldAlert, X, ArrowLeft, Info } from 'lucide-react'

export function AdminImpersonationBanner({
  specialistName,
  specialistHumanId,
  adminName,
}: {
  specialistName: string
  specialistHumanId: string | null
  adminName: string
}) {
  const [closeNotice, setCloseNotice] = useState(false)

  const handleCloseTab = () => {
    // Attempt to close the current tab programmatically
    window.close()

    // If browser security blocks programmatic tab closure, display an explicit instruction instead of creating a duplicate tab
    setTimeout(() => {
      setCloseNotice(true)
    }, 300)
  }

  return (
    <div className="sticky top-0 z-50 border-b border-amber-500/40 bg-amber-500/15 px-4 py-2.5 text-xs text-amber-950 backdrop-blur-sm shadow-sm sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white">
            <ShieldAlert size={14} />
          </span>
          <div className="truncate">
            <span className="font-bold uppercase tracking-wider text-amber-900 mr-1.5">
              Admin Impersonation Mode:
            </span>
            <span className="text-on-surface">
              Viewing full specialist portal as <strong className="font-semibold text-primary">{specialistName}</strong>
              {specialistHumanId && <span className="font-mono text-on-surface-variant ml-1 font-medium">({specialistHumanId})</span>}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href="/api/impersonate/exit"
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-900/15 px-3 py-1.5 font-semibold text-amber-950 hover:bg-amber-900/25 transition-colors shadow-xs"
            title="Exit viewing mode and return to Admin Team page in this window"
          >
            <ArrowLeft size={13} />
            <span>Exit to Admin</span>
          </a>
          <button
            type="button"
            onClick={handleCloseTab}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-950 px-3 py-1.5 font-semibold text-white hover:bg-amber-900 transition-colors shadow-xs"
            title="Close this specialist panel tab and return to your Admin window"
          >
            <X size={13} />
            <span>Close Tab</span>
          </button>
        </div>
      </div>

      {closeNotice && (
        <div className="mt-2 flex items-center justify-between rounded border border-amber-500/40 bg-amber-500/20 px-3 py-1.5 text-[11px] text-amber-900">
          <div className="flex items-center gap-1.5">
            <Info size={13} className="shrink-0 text-amber-700" />
            <span>Browser tab closure was prevented by browser security. Please close this browser tab manually, or click <strong>Exit to Admin</strong> to return in this window.</span>
          </div>
          <button
            type="button"
            onClick={() => setCloseNotice(false)}
            className="ml-2 text-amber-900 hover:text-amber-950 font-bold"
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}
