'use client'

import { useActionState, useEffect, useState } from 'react'
import { KeyRound, ShieldAlert, Eye, EyeOff, Check, AlertCircle } from 'lucide-react'
import { completeForcedPasswordChange, type SignInState } from '@/lib/actions/auth'
import { SubmitButton } from '@/components/SubmitButton'
import { checkPasswordRequirements, isPasswordValid } from '@/lib/password'

const INPUT =
  'min-h-12 rounded border border-outline-variant bg-surface-container-lowest px-3 focus:border-primary-container focus:outline-none'

export function ForcePasswordChangeForm({ userEmail }: { userEmail: string }) {
  const [state, formAction] = useActionState<SignInState, FormData>(
    completeForcedPasswordChange,
    undefined
  )

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

  // Clear only temporary password if authentication fails; preserve entered new passwords (ONB-07)
  useEffect(() => {
    if (state?.error) {
      const lower = state.error.toLowerCase()
      if (lower.includes('current') || lower.includes('temporary')) {
        setCurrentPassword('')
      }
    }
  }, [state])

  const canSubmit =
    currentPassword.trim().length > 0 &&
    isComplexityMet &&
    isMatch &&
    confirmPassword.length > 0

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

      {/* Temporary Password */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="current_password"
          className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant"
        >
          Temporary Initial Password
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
            placeholder="Enter the password provided by your admin"
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

      {/* New Password */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="password"
          className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant"
        >
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
            placeholder="At least 8 characters"
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

        {/* Dynamic Standard Password Validation Indicator (ONB-08) */}
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
        <label
          htmlFor="confirm"
          className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant"
        >
          Confirm New Password
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
            placeholder="Re-enter your new password"
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

        {/* Clear Inline Password Mismatch Notification (ONB-09) */}
        {hasMismatchError && (
          <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-error">
            <AlertCircle size={14} className="shrink-0" />
            <span>Confirm Password must match the New Password.</span>
          </p>
        )}
      </div>

      {state?.error && (
        <div className="flex items-start gap-2 rounded bg-error-container p-3 text-xs text-on-error-container">
          <ShieldAlert size={16} className="shrink-0 mt-0.5" />
          <span>{state.error}</span>
        </div>
      )}

      <SubmitButton pendingText="Setting Password…" disabled={!canSubmit}>
        Activate Account &amp; Proceed
      </SubmitButton>
    </form>
  )
}
