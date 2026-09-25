'use client'

import { ShieldAlert, X, ArrowLeft, ExternalLink } from 'lucide-react'

export function AdminImpersonationBanner({
  specialistName,
  specialistHumanId,
  adminName,
}: {
  specialistName: string
  specialistHumanId: string | null
  adminName: string
}) {
  const handleClose = () => {
    // If opened as a new tab/window, close it; otherwise redirect to exit
    if (window.opener && !window.opener.closed) {
      window.close()
    } else {
      window.location.href = '/api/impersonate/exit'
    }
  }

  return (
    <div className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-3 border-b border-amber-500/40 bg-amber-500/15 px-4 py-2.5 text-xs text-amber-950 backdrop-blur-sm shadow-sm sm:px-6">
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
          className="inline-flex items-center gap-1 rounded bg-amber-900/10 px-2.5 py-1 font-semibold text-amber-950 hover:bg-amber-900/20 transition-colors"
        >
          <ArrowLeft size={13} />
          <span>Exit to Admin</span>
        </a>
        <button
          type="button"
          onClick={handleClose}
          className="inline-flex items-center gap-1 rounded bg-amber-950 px-2.5 py-1 font-semibold text-white hover:bg-amber-900 transition-colors shadow-sm"
          title="Close this specialist panel tab"
        >
          <X size={13} />
          <span>Close Tab</span>
        </button>
      </div>
    </div>
  )
}
