'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Loader2 } from 'lucide-react'

export function ResetPasswordFallback() {
  const router = useRouter()
  const [verifying, setVerifying] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    // Check if the recovery session tokens were passed directly in the URL hash
    if (typeof window === 'undefined') return

    const hash = window.location.hash.substring(1)
    if (!hash) return

    const hashParams = new URLSearchParams(hash)
    const error = hashParams.get('error') || hashParams.get('error_code')
    const errorDescription = hashParams.get('error_description')

    if (error) {
      const isExpired = error === 'otp_expired' || (errorDescription && errorDescription.toLowerCase().includes('expired'))
      router.replace(`/forgot-password?error=${isExpired ? 'expired' : encodeURIComponent(error)}`)
      return
    }

    const accessToken = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')

    if (accessToken) {
      setVerifying(true)
      fetch('/auth/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.ok) {
            // Remove hash and reload so Server Component receives the session cookie
            window.location.href = '/reset-password'
          } else {
            setVerifying(false)
            setErrorMessage('Your password reset link is invalid or has expired.')
          }
        })
        .catch(() => {
          setVerifying(false)
          setErrorMessage('Failed to connect to authentication service. Please try again.')
        })
    }
  }, [router])

  if (verifying) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-outline-variant bg-surface-container-lowest p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
        <h2 className="text-base font-semibold text-on-surface">Verifying reset link…</h2>
        <p className="mt-1 text-xs text-on-surface-variant">
          Please wait while we secure your recovery session.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded border border-outline-variant bg-surface-container-lowest p-6 text-center text-sm shadow-sm">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
        <AlertCircle size={22} />
      </div>
      <p className="font-medium text-on-surface">
        {errorMessage || 'This reset link is invalid or has expired.'}
      </p>
      <p className="mt-1 text-xs text-on-surface-variant">
        Password reset links can only be used once and expire shortly after delivery.
      </p>
      <a
        href="/forgot-password"
        className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-xs font-semibold text-on-primary transition hover:opacity-95"
      >
        Request a new link
      </a>
    </div>
  )
}

