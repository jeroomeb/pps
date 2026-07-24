'use client'

import { useActionState } from 'react'
import Image from 'next/image'
import { signIn, type SignInState } from '@/lib/actions/auth'
import { SubmitButton } from '@/components/SubmitButton'

export default function LoginPage() {
  const [state, formAction] = useActionState<SignInState, FormData>(
    signIn,
    undefined
  )

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Image src="/logo-sm.png" alt="Amenity Op's" width={64} height={64} className="rounded-md" />
          <h1 className="font-headline text-2xl font-bold">Amenity Op&apos;s</h1>
          <p className="text-sm text-on-surface-variant">
            Property Inspections &amp; Audits
          </p>
        </div>

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

          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm font-semibold uppercase tracking-wide">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="min-h-12 rounded border border-outline-variant bg-surface-container-lowest px-3 focus:border-primary-container focus:outline-none"
            />
          </div>

          {state?.error && (
            <p className="rounded bg-error-container px-3 py-2 text-sm text-on-error-container">
              {state.error}
            </p>
          )}

          <SubmitButton pendingText="Signing in…" className="mt-2">
            Sign In
          </SubmitButton>

          <a
            href="/forgot-password"
            className="text-center text-sm font-semibold text-primary hover:underline"
          >
            Forgot password?
          </a>
        </form>
      </div>
    </div>
  )
}
