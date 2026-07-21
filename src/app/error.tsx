'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <AlertTriangle size={32} className="text-error" />
      <div>
        <h1 className="font-headline text-xl font-bold">Something went wrong</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Your data is safe. Try again — if this keeps happening, contact the administrator.
        </p>
        {error.digest && (
          <p className="mt-1 text-xs text-on-surface-variant">Error reference: {error.digest}</p>
        )}
      </div>
      <button
        type="button"
        onClick={reset}
        className="min-h-11 rounded-lg bg-primary-container px-5 font-headline text-sm font-semibold uppercase tracking-wide text-on-primary-container hover:brightness-95"
      >
        Try Again
      </button>
    </div>
  )
}
