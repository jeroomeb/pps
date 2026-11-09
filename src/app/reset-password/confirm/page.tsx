'use client'

import { useState, Suspense } from 'react'
import Image from 'next/image'
import { useSearchParams, useRouter } from 'next/navigation'
import { ShieldCheck, AlertCircle, Loader2, ArrowRight } from 'lucide-react'

function ConfirmPasswordResetContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tokenHash = searchParams.get('token_hash')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Manual OTP inputs in case token_hash is not present or expired
  const [showManualCode, setShowManualCode] = useState(!tokenHash)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')

  const handleConfirm = async () => {
    if (!tokenHash) {
      setError('Reset token is missing. Please enter your email and code below.')
      setShowManualCode(true)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/auth/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token_hash: tokenHash,
          type: 'recovery',
        }),
      })

      const data = await res.json()

      if (res.ok && data?.ok) {
        // Successful verification! Redirect to the password update form
        window.location.href = '/reset-password'
      } else {
        setLoading(false)
        setError(data?.error || 'This reset link is invalid or has expired.')
      }
    } catch {
      setLoading(false)
      setError('A network error occurred. Please try again.')
    }
  }

  const handleManualVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !code.trim()) {
      setError('Please enter both your email and the verification code.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/auth/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          token: code.trim(),
          type: 'recovery',
        }),
      })

      const data = await res.json()

      if (res.ok && data?.ok) {
        window.location.href = '/reset-password'
      } else {
        setLoading(false)
        setError(data?.error || 'Invalid or expired verification code.')
      }
    } catch {
      setLoading(false)
      setError('A network error occurred. Please try again.')
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Image src="/logo-sm.png" alt="Amenity Op's" width={64} height={64} className="rounded-md" />
          <h1 className="font-headline text-2xl font-bold">Password Reset</h1>
          <p className="text-sm text-on-surface-variant">
            Confirm your identity to update your password
          </p>
        </div>

        <div className="flex flex-col gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
          {error && (
            <div className="flex items-start gap-2.5 rounded-lg border border-error/40 bg-error-container/30 p-3.5 text-xs text-on-error-container">
              <AlertCircle size={18} className="shrink-0 text-error mt-0.5" />
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold text-error">Verification Error</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {!showManualCode && tokenHash ? (
            <div className="flex flex-col gap-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ShieldCheck size={28} />
              </div>
              <div>
                <h2 className="text-base font-semibold text-on-surface">Ready to Reset Password</h2>
                <p className="mt-1 text-xs text-on-surface-variant leading-relaxed">
                  Click the button below to verify your recovery request and proceed to set a new password.
                </p>
              </div>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={loading}
                className="mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary font-semibold text-on-primary transition hover:opacity-95 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Verifying session…</span>
                  </>
                ) : (
                  <>
                    <span>Continue to Reset Password</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowManualCode(true)}
                className="text-xs text-on-surface-variant hover:text-on-surface hover:underline"
              >
                Have a numeric code instead?
              </button>
            </div>
          ) : (
            <form onSubmit={handleManualVerify} className="flex flex-col gap-4">
              <div className="text-center">
                <h2 className="text-base font-semibold text-on-surface">Enter Verification Code</h2>
                <p className="mt-1 text-xs text-on-surface-variant">
                  Enter your email and the OTP code received in your email.
                </p>
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="confirm-email" className="text-xs font-semibold uppercase tracking-wide">
                  Email
                </label>
                <input
                  id="confirm-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your-email@example.com"
                  className="min-h-11 rounded border border-outline-variant bg-surface-container-lowest px-3 text-sm focus:border-primary-container focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="confirm-code" className="text-xs font-semibold uppercase tracking-wide">
                  Verification Code
                </label>
                <input
                  id="confirm-code"
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. 09598579"
                  className="min-h-11 rounded border border-outline-variant bg-surface-container-lowest px-3 font-mono text-sm tracking-widest text-center focus:border-primary-container focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary font-semibold text-on-primary transition hover:opacity-95 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Verifying code…</span>
                  </>
                ) : (
                  <span>Verify and Proceed</span>
                )}
              </button>

              <div className="text-center">
                <a
                  href="/forgot-password"
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Request a new link or code
                </a>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ConfirmPasswordResetPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center px-4 py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <ConfirmPasswordResetContent />
    </Suspense>
  )
}

