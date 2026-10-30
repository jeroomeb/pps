'use client'

import { useState } from 'react'
import { ShieldAlert, ArrowLeft, X, Info } from 'lucide-react'

export function TenantViewBanner({
  tenantName,
}: {
  tenantName: string
}) {
  const [closeNotice, setCloseNotice] = useState(false)

  const handleCloseTab = () => {
    // Attempt to close tab programmatically
    window.close()

    // If browser security prevents window.close(), prompt user cleanly without creating duplicate tabs
    setTimeout(() => {
      setCloseNotice(true)
    }, 300)
  }

  return (
    <div className="sticky top-0 z-50 border-b border-primary/30 bg-primary-container/40 px-4 py-2.5 text-xs text-on-surface shadow-sm backdrop-blur-sm sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
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
            onClick={handleCloseTab}
            className="inline-flex items-center gap-1 rounded px-2 py-1 font-semibold text-on-surface-variant hover:bg-surface"
          >
            <X size={13} />
            Close tab
          </button>
        </div>
      </div>

      {closeNotice && (
        <div className="mt-2 flex items-center justify-between rounded border border-primary/40 bg-primary/10 px-3 py-1.5 text-[11px] text-on-surface">
          <div className="flex items-center gap-1.5">
            <Info size={13} className="shrink-0 text-primary" />
            <span>Browser tab closure was prevented by browser security. Please close this browser tab manually, or click <strong>Exit to HQ</strong> to return in this window.</span>
          </div>
          <button
            type="button"
            onClick={() => setCloseNotice(false)}
            className="ml-2 font-bold text-on-surface hover:text-primary"
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}
