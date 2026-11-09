'use client'

import { useActionState, Suspense } from 'react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { AlertCircle } from 'lucide-react'
import { requestPasswordReset, type ResetState } from '@/lib/actions/auth'
import { SubmitButton } from '@/components/SubmitButton'

function ForgotPasswordNotice() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  if (!error) return null

  let message = 'Your password reset link is invalid or has expired. Please enter your email below to request a fresh link.'
  if (error === 'network') {
    message = 'A network issue occurred while verifying your link. Please enter your email below to try again.'
  }

  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/40 bg-amber-950/30 p-3.5 text-xs text-amber-200 shadow-sm animate-in fade-in duration-300">
      <AlertCircle size={18} className="shrink-0 text-amber-400 mt-0.5" />
      <div className="flex flex-col gap-0.5">
        <span className="font-semibold text-amber-300">Reset Link Expired or Invalid</span>
        <span>{message}</span>
      </div>
    </div>
  )
}

export default function ForgotPasswordPage() {
  const [state, formAction] = useActionState<ResetState, FormData>(requestPasswordReset, undefined)

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Image src="/logo-sm.png" alt="Amenity Op's" width={64} height={64} className="rounded-md" />
          <h1 className="font-headline text-2xl font-bold">Reset your password</h1>
          <p className="text-sm text-on-surface-variant">
            Enter your email and we&apos;ll send a reset link.
          </p>
        </div>

        <Suspense fallback={null}>
          <div className="mb-4">
            <ForgotPasswordNotice />
          </div>
        </Suspense>

        {state?.sent ? (
          <div className="rounded border border-outline-variant bg-surface-container-lowest p-6 text-center">
            <p className="text-sm">
              If an account exists for that email, a password reset link is on its way. Check your
              inbox (and spam folder).
            </p>
            <p className="mt-3 text-xs text-on-surface-variant">
              Received a numeric code?{' '}
              <a href="/reset-password/confirm" className="font-semibold text-primary underline">
                Enter code here
              </a>
            </p>
            <a
              href="/login"
              className="mt-4 inline-block text-sm font-semibold text-primary hover:underline"
            >
              Back to sign in
            </a>
          </div>
        ) : (
          <form
            action={formAction}
            className="flex flex-col gap-4 rounded border border-outline-variant bg-surface-container-lowest p-6"
          >
            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="text-sm font-semibold uppercase tracking-wide">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="Enter your email"
                className="min-h-12 rounded border border-outline-variant bg-surface-container-lowest px-3 focus:border-primary-container focus:outline-none"
              />
            </div>

            {state?.error && (
              <p className="rounded bg-error-container px-3 py-2 text-sm text-on-error-container">
                {state.error}
              </p>
            )}

            <SubmitButton pendingText="Sending…" className="mt-2">
              Send Reset Link
            </SubmitButton>

            <div className="mt-2 flex flex-col items-center gap-2">
              <a
                href="/login"
                className="text-center text-sm font-semibold text-primary hover:underline"
              >
                Back to sign in
              </a>
              <a
                href="/reset-password/confirm"
                className="text-center text-xs text-on-surface-variant hover:text-on-surface hover:underline"
              >
                Have a verification code?
              </a>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
