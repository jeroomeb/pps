'use client'

import { useEffect } from 'react'

export default function GlobalError({
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
    if (isActionSkew) {
      const lastReload = sessionStorage.getItem('last_skew_reload_global')
      const now = Date.now()
      if (!lastReload || now - Number(lastReload) > 10000) {
        sessionStorage.setItem('last_skew_reload_global', String(now))
        window.location.reload()
      }
    }
  }, [error, isActionSkew])

  // Root-layout failure: no app CSS is guaranteed here, so use inline styles.
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: 'system-ui, sans-serif',
          display: 'flex',
          minHeight: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8f9fa',
          color: '#191c1d',
          textAlign: 'center',
          padding: 24,
        }}
      >
        <div>
          <h1 style={{ fontSize: 20, marginBottom: 8 }}>
            {isActionSkew ? 'App Updated — Reloading...' : 'Something went wrong'}
          </h1>
          <p style={{ fontSize: 14, color: '#4d4635', marginBottom: 16 }}>
            {isActionSkew
              ? 'A newer version of the application was deployed. Reloading latest assets.'
              : `Please try again.${error.digest ? ` (Ref: ${error.digest})` : ''}`}
          </p>
          <button
            type="button"
            onClick={() => {
              if (isActionSkew) {
                window.location.reload()
              } else {
                reset()
              }
            }}
            style={{
              minHeight: 44,
              padding: '0 20px',
              borderRadius: 8,
              border: 'none',
              background: '#ee8a4b',
              color: '#2b3742',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {isActionSkew ? 'Reload Page' : 'Try Again'}
          </button>
        </div>
      </body>
    </html>
  )
}
