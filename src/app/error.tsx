'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const isActionSkew =
    error?.name === 'UnrecognizedActionError' ||
    error?.message?.includes('Server Action') ||
    error?.message?.includes('was not found')

  useEffect(() => {
    console.error(error)
    // If a deployment occurred while the client tab was open, auto-reload once to fetch fresh assets
    if (isActionSkew) {
      const lastReload = sessionStorage.getItem('last_skew_reload')
      const now = Date.now()
      // Guard against infinite reload loops: reload at most once every 10 seconds
      if (!lastReload || now - Number(lastReload) > 10000) {
        sessionStorage.setItem('last_skew_reload', String(now))
        window.location.reload()
      }
    }
  }, [error, isActionSkew])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <AlertTriangle size={32} className="text-error" />
      <div>
        <h1 className="font-headline text-xl font-bold">
          {isActionSkew ? 'App Updated — Refreshing Session' : 'Something went wrong'}
        </h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          {isActionSkew
            ? "A newer version of Amenity Op's was just deployed. Click below to load the latest version."
            : 'Your data is safe. Try again — if this keeps happening, contact the administrator.'}
        </p>
        {error.digest && (
          <p className="mt-1 text-xs text-on-surface-variant">Error reference: {error.digest}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => {
          if (isActionSkew) {
            window.location.reload()
          } else {
            reset()
          }
        }}
        className="min-h-11 rounded-lg bg-primary-container px-5 font-headline text-sm font-semibold uppercase tracking-wide text-on-primary-container hover:brightness-95 inline-flex items-center gap-2"
      >
        {isActionSkew && <RefreshCw size={16} className="animate-spin" />}
        {isActionSkew ? 'Reload Latest Version' : 'Try Again'}
      </button>
    </div>
  )
}
