'use client'

import { useActionState } from 'react'
import { updatePassword, type SignInState } from '@/lib/actions/auth'
import { SubmitButton } from '@/components/SubmitButton'

const INPUT =
  'min-h-12 rounded border border-outline-variant bg-surface-container-lowest px-3 focus:border-primary-container focus:outline-none'

export function ResetPasswordForm() {
  const [state, formAction] = useActionState<SignInState, FormData>(updatePassword, undefined)

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded border border-outline-variant bg-surface-container-lowest p-6"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-semibold uppercase tracking-wide">
          New Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={INPUT}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="confirm" className="text-sm font-semibold uppercase tracking-wide">
          Confirm Password
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={INPUT}
        />
      </div>

      {state?.error && (
        <p className="rounded bg-error-container px-3 py-2 text-sm text-on-error-container">
          {state.error}
        </p>
      )}

      <SubmitButton pendingText="Saving…" className="mt-2">
        Update Password
      </SubmitButton>
    </form>
  )
}
