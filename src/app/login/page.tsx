'use client'

import { useActionState, useState, Suspense } from 'react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { signIn, type SignInState } from '@/lib/actions/auth'
import { SubmitButton } from '@/components/SubmitButton'

function LoginNotice() {
  const searchParams = useSearchParams()
  const notice = searchParams.get('notice')

  if (notice === 'password_updated') {
    return (
      <div className="flex items-start gap-2.5 rounded-lg border border-emerald-500/40 bg-emerald-950/30 p-3.5 text-xs text-emerald-200 shadow-sm animate-in fade-in duration-300">
        <CheckCircle2 size={18} className="shrink-0 text-emerald-400 mt-0.5" />
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-emerald-300">Password Updated Successfully</span>
          <span>Please log in with your new password.</span>
        </div>
      </div>
    )
  }
  return null
}

export default function LoginPage() {
  const [state, formAction] = useActionState<SignInState, FormData>(
    signIn,
    undefined
  )
  const [email, setEmail] = useState('')
  const [showPassword, setShowPassword] = useState(false)

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

        <Suspense fallback={null}>
          <div className="mb-4">
            <LoginNotice />
          </div>
        </Suspense>

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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="min-h-12 rounded border border-outline-variant bg-surface-container-lowest px-3 focus:border-primary-container focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm font-semibold uppercase tracking-wide">
              Password
            </label>
            <div className="relative flex items-center">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="Enter your password"
                className="min-h-12 w-full rounded border border-outline-variant bg-surface-container-lowest px-3 pr-10 focus:border-primary-container focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 p-1 text-on-surface-variant hover:text-on-surface transition"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
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
