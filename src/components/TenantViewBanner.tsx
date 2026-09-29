'use client'

import { ShieldAlert, ArrowLeft, X } from 'lucide-react'

export function TenantViewBanner({
  tenantName,
}: {
  tenantName: string
}) {
  const handleClose = () => {
    if (window.opener && !window.opener.closed) {
      window.close()
    } else {
      window.location.href = '/api/tenant-view/exit'
    }
  }

  return (
    <div className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-3 border-b border-primary/30 bg-primary-container/40 px-4 py-2.5 text-xs text-on-surface shadow-sm backdrop-blur-sm sm:px-6">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-white">
          <ShieldAlert size={14} />
        </span>
        <p className="truncate">
          <span className="mr-1.5 font-bold uppercase tracking-wider text-primary">HQ tenant view:</span>
          Viewing the admin dashboard for <strong>{tenantName}</strong>
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <a
          href="/api/tenant-view/exit"
          className="inline-flex items-center gap-1 rounded bg-primary/10 px-2.5 py-1 font-semibold text-on-surface hover:bg-primary/20"
        >
          <ArrowLeft size={13} />
          Exit to HQ
        </a>
        <button
          type="button"
          onClick={handleClose}
          className="inline-flex items-center gap-1 rounded px-2 py-1 font-semibold text-on-surface-variant hover:bg-surface"
        >
          <X size={13} />
          Close tab
        </button>
      </div>
    </div>
  )
}
