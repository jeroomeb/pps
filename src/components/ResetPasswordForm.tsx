'use client'

import { useActionState } from 'react'
import { updatePassword, type SignInState } from '@/lib/actions/auth'
import { SubmitButton } from '@/components/SubmitButton'

const INPUT =
  'min-h-12 rounded border border-outline-variant bg-surface-container-lowest px-3 focus:border-primary-container focus:outline-none'

export function ResetPasswordForm({
  requireCurrentPassword,
}: {
  /** True when this isn't a genuine password-reset (recovery) session — e.g.
   * an already-logged-in user navigated here directly — so re-proving
   * identity is required before the password can change. */
  requireCurrentPassword: boolean
}) {
  const [state, formAction] = useActionState<SignInState, FormData>(updatePassword, undefined)

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded border border-outline-variant bg-surface-container-lowest p-6"
    >
      {requireCurrentPassword && (
        <div className="flex flex-col gap-1">
          <label
            htmlFor="current_password"
            className="text-sm font-semibold uppercase tracking-wide"
          >
            Current Password
          </label>
          <input
            id="current_password"
            name="current_password"
            type="password"
            required
            autoComplete="current-password"
            className={INPUT}
          />
        </div>
      )}

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
