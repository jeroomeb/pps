'use client'

import { useActionState, useState, useEffect } from 'react'
import { Eye, EyeOff, Check, AlertCircle } from 'lucide-react'
import { updatePassword, type SignInState } from '@/lib/actions/auth'
import { SubmitButton } from '@/components/SubmitButton'
import { checkPasswordRequirements, isPasswordValid } from '@/lib/password'

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

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [confirmTouched, setConfirmTouched] = useState(false)

  const passwordReqs = checkPasswordRequirements(newPassword)
  const isComplexityMet = isPasswordValid(newPassword)
  const isMatch = newPassword === confirmPassword
  const hasMismatchError = confirmTouched && confirmPassword.length > 0 && !isMatch

  useEffect(() => {
    if (state?.error) {
      const lower = state.error.toLowerCase()
      if (lower.includes('current')) {
        setCurrentPassword('')
      }
    }
  }, [state])

  const canSubmit =
    (!requireCurrentPassword || currentPassword.trim().length > 0) &&
    isComplexityMet &&
    isMatch &&
    confirmPassword.length > 0

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
          <div className="relative flex items-center">
            <input
              id="current_password"
              name="current_password"
              type={showCurrentPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="Enter current password"
              className={`${INPUT} w-full pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword((prev) => !prev)}
              className="absolute right-3 p-1 text-on-surface-variant hover:text-on-surface transition"
              aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
            >
              {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
      )}

      {/* New Password */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-semibold uppercase tracking-wide">
          New Password
        </label>
        <div className="relative flex items-center">
          <input
            id="password"
            name="password"
            type={showNewPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            autoComplete="new-password"
            placeholder="Enter your new password"
            className={`${INPUT} w-full pr-10 ${
              newPassword.length > 0 && !isComplexityMet
                ? 'border-error/80 focus:border-error ring-1 ring-error/40'
                : newPassword.length > 0 && isComplexityMet
                ? 'border-emerald-500/60 focus:border-emerald-500'
                : ''
            }`}
          />
          <button
            type="button"
            onClick={() => setShowNewPassword((prev) => !prev)}
            className="absolute right-3 p-1 text-on-surface-variant hover:text-on-surface transition"
            aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
          >
            {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {/* Dynamic Standard Password Validation Indicator */}
        <div className="rounded-lg border border-outline-variant/60 bg-surface-container-high/40 p-2.5 text-xs mt-0.5">
          <p className="font-semibold text-on-surface mb-1.5 text-[11px] uppercase tracking-wider">
            Password Requirements:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
            <span
              className={`flex items-center gap-1.5 ${
                passwordReqs.minLength ? 'text-emerald-500 font-medium' : 'text-on-surface-variant'
              }`}
            >
              {passwordReqs.minLength ? (
                <Check size={13} className="shrink-0" />
              ) : (
                <span className="w-2.5 h-2.5 rounded-full border border-outline-variant shrink-0 inline-block" />
              )}
              8+ characters
            </span>
            <span
              className={`flex items-center gap-1.5 ${
                passwordReqs.hasUpper ? 'text-emerald-500 font-medium' : 'text-on-surface-variant'
              }`}
            >
              {passwordReqs.hasUpper ? (
                <Check size={13} className="shrink-0" />
              ) : (
                <span className="w-2.5 h-2.5 rounded-full border border-outline-variant shrink-0 inline-block" />
              )}
              1 uppercase letter (A-Z)
            </span>
            <span
              className={`flex items-center gap-1.5 ${
                passwordReqs.hasLower ? 'text-emerald-500 font-medium' : 'text-on-surface-variant'
              }`}
            >
              {passwordReqs.hasLower ? (
                <Check size={13} className="shrink-0" />
              ) : (
                <span className="w-2.5 h-2.5 rounded-full border border-outline-variant shrink-0 inline-block" />
              )}
              1 lowercase letter (a-z)
            </span>
            <span
              className={`flex items-center gap-1.5 ${
                passwordReqs.hasNumber ? 'text-emerald-500 font-medium' : 'text-on-surface-variant'
              }`}
            >
              {passwordReqs.hasNumber ? (
                <Check size={13} className="shrink-0" />
              ) : (
                <span className="w-2.5 h-2.5 rounded-full border border-outline-variant shrink-0 inline-block" />
              )}
              1 number (0-9)
            </span>
            <span
              className={`flex items-center gap-1.5 ${
                passwordReqs.hasSpecial ? 'text-emerald-500 font-medium' : 'text-on-surface-variant'
              }`}
            >
              {passwordReqs.hasSpecial ? (
                <Check size={13} className="shrink-0" />
              ) : (
                <span className="w-2.5 h-2.5 rounded-full border border-outline-variant shrink-0 inline-block" />
              )}
              1 special symbol (!@#$%)
            </span>
          </div>
        </div>
      </div>

      {/* Confirm Password */}
      <div className="flex flex-col gap-1">
        <label htmlFor="confirm" className="text-sm font-semibold uppercase tracking-wide">
          Confirm Password
        </label>
        <div className="relative flex items-center">
          <input
            id="confirm"
            name="confirm"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value)
              setConfirmTouched(true)
            }}
            onBlur={() => setConfirmTouched(true)}
            required
            autoComplete="new-password"
            placeholder="Confirm your new password"
            className={`${INPUT} w-full pr-10 ${
              hasMismatchError
                ? 'border-error/80 focus:border-error ring-1 ring-error/40'
                : confirmPassword.length > 0 && isMatch
                ? 'border-emerald-500/60 focus:border-emerald-500'
                : ''
            }`}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            className="absolute right-3 p-1 text-on-surface-variant hover:text-on-surface transition"
            aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
          >
            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {hasMismatchError && (
          <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-error">
            <AlertCircle size={14} className="shrink-0" />
            <span>Confirm Password must match the New Password.</span>
          </p>
        )}
      </div>

      {state?.error && (
        <p className="rounded bg-error-container px-3 py-2 text-sm text-on-error-container">
          {state.error}
        </p>
      )}

      <SubmitButton pendingText="Saving…" className="mt-2" disabled={!canSubmit}>
        Update Password
      </SubmitButton>
    </form>
  )
}
