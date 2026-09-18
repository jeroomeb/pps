'use client'

import { useActionState } from 'react'
import { KeyRound, ShieldAlert } from 'lucide-react'
import { completeForcedPasswordChange, type SignInState } from '@/lib/actions/auth'
import { SubmitButton } from '@/components/SubmitButton'

const INPUT =
  'min-h-12 rounded border border-outline-variant bg-surface-container-lowest px-3 focus:border-primary-container focus:outline-none'

export function ForcePasswordChangeForm({ userEmail }: { userEmail: string }) {
  const [state, formAction] = useActionState<SignInState, FormData>(
    completeForcedPasswordChange,
    undefined
  )

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm"
    >
      <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary-container/20 p-3 text-xs text-on-surface">
        <KeyRound size={20} className="shrink-0 text-primary" />
        <div>
          <p className="font-semibold">Security Requirement</p>
          <p className="text-on-surface-variant">
            Signed in as <strong>{userEmail}</strong>. Please set a new private password to activate your account.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="current_password"
          className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant"
        >
          Temporary Initial Password
        </label>
        <input
          id="current_password"
          name="current_password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="Enter the password provided by your admin"
          className={INPUT}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="password"
          className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant"
        >
          New Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="At least 8 characters"
          className={INPUT}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="confirm"
          className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant"
        >
          Confirm New Password
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="Re-enter your new password"
          className={INPUT}
        />
      </div>

      {state?.error && (
        <div className="flex items-start gap-2 rounded bg-error-container p-3 text-xs text-on-error-container">
          <ShieldAlert size={16} className="shrink-0 mt-0.5" />
          <span>{state.error}</span>
        </div>
      )}

      <SubmitButton pendingText="Setting Password…">Activate Account &amp; Proceed</SubmitButton>
    </form>
  )
}
