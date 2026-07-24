'use client'

import { useActionState } from 'react'
import Image from 'next/image'
import { requestPasswordReset, type ResetState } from '@/lib/actions/auth'
import { SubmitButton } from '@/components/SubmitButton'

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

        {state?.sent ? (
          <div className="rounded border border-outline-variant bg-surface-container-lowest p-6 text-center">
            <p className="text-sm">
              If an account exists for that email, a password reset link is on its way. Check your
              inbox (and spam folder).
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

            <a
              href="/login"
              className="text-center text-sm font-semibold text-primary hover:underline"
            >
              Back to sign in
            </a>
          </form>
        )}
      </div>
    </div>
  )
}
