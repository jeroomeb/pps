'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { KeyRound, Mail, Sparkles, Check } from 'lucide-react'
import { SubmitButton } from '@/components/SubmitButton'
import { Card } from '@/components/ui/Card'
import { createTeamMember, type TeamMemberFormState } from '@/lib/actions/team'

const INPUT_CLASSES =
  'min-h-12 rounded border border-outline-variant px-3 focus:border-primary-container focus:outline-none'
const LABEL_CLASSES = 'text-sm font-semibold uppercase tracking-wide'

export function InspectorForm({
  tenants,
}: {
  tenants?: { id: string; name: string }[]
}) {
  const [state, formAction] = useActionState<TeamMemberFormState, FormData>(
    createTeamMember,
    undefined
  )
  const formRef = useRef<HTMLFormElement>(null)
  const [copied, setCopied] = useState(false)

  // Only clear the form on a confirmed success — never wipe the user's
  // input out from under a validation error.
  useEffect(() => {
    if (state?.success) formRef.current?.reset()
  }, [state])

  const copyPassword = (pwd: string) => {
    navigator.clipboard.writeText(pwd)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  return (
    <Card>
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-4"
    >
      {tenants && tenants.length > 0 && (
        <div className="flex flex-col gap-1">
          <label htmlFor="member_tenant_id" className="text-sm font-semibold uppercase tracking-wide">
            Assigned Organization / Tenant
          </label>
          <select
            id="member_tenant_id"
            name="tenant_id"
            className="min-h-12 rounded border border-outline-variant bg-surface-container-lowest px-3 focus:border-primary-container focus:outline-none"
          >
            <option value="">Amenity Op&apos;s HQ (Master / Global)</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="member_full_name" className={LABEL_CLASSES}>
          Full Name
        </label>
        <input
          id="member_full_name"
          name="full_name"
          required
          placeholder="e.g. Alex Rivera"
          className={INPUT_CLASSES}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="member_email" className={LABEL_CLASSES}>
          Email Address
        </label>
        <input
          id="member_email"
          name="email"
          type="email"
          required
          placeholder="alex@example.com"
          className={INPUT_CLASSES}
        />
        <p className="flex items-center gap-1.5 text-xs text-on-surface-variant mt-0.5">
          <Mail className="h-3.5 w-3.5 text-primary" />
          A welcome email with login credentials will be automatically sent to this address.
        </p>
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <label htmlFor="member_password" className={LABEL_CLASSES}>
            Temporary Password
          </label>
          <span className="flex items-center gap-1 text-xs text-primary font-medium">
            <Sparkles className="h-3.5 w-3.5" /> Auto-Generated if blank
          </span>
        </div>
        <input
          id="member_password"
          name="password"
          type="text"
          placeholder="Leave blank to auto-generate secure 14-char password"
          minLength={8}
          autoComplete="new-password"
          className={`${INPUT_CLASSES} font-mono text-sm`}
        />
        <p className="text-xs text-on-surface-variant">
          User will be required to configure their own permanent password on first sign-in.
        </p>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="role" className="text-sm font-semibold uppercase tracking-wide">
          Role
        </label>
        <select
          id="role"
          name="role"
          defaultValue="inspector"
          className="min-h-12 rounded border border-outline-variant bg-surface-container-lowest px-3"
        >
          <option value="inspector">Operational Continuity Specialist</option>
          <option value="admin">Admin</option>
        </select>
        <p className="text-xs text-on-surface-variant">
          Admins can also be assigned inspections, just like specialists.
        </p>
      </div>

      {state?.error && (
        <p className="rounded bg-error-container px-3 py-2 text-sm text-on-error-container">
          {state.error}
        </p>
      )}

      {state?.success && state.generatedPassword && (
        <div className="rounded border border-primary/30 bg-primary-container/20 p-3.5 text-sm">
          <div className="flex items-center gap-2 font-semibold text-primary">
            <KeyRound className="h-4 w-4" /> Account Created & Credentials Emailed
          </div>
          <p className="mt-1 text-xs text-on-surface-variant">
            Temporary password generated for this user:
          </p>
          <div className="mt-2 flex items-center justify-between gap-2 rounded bg-surface-container-lowest px-3 py-2 font-mono text-sm border border-outline-variant">
            <span className="font-bold text-on-surface select-all">{state.generatedPassword}</span>
            <button
              type="button"
              onClick={() => copyPassword(state.generatedPassword!)}
              className="flex items-center gap-1 text-xs text-primary hover:underline font-sans font-semibold cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" /> Copied!
                </>
              ) : (
                'Copy'
              )}
            </button>
          </div>
        </div>
      )}

      <SubmitButton pendingText="Creating…">+ Add Team Member</SubmitButton>
    </form>
    </Card>
  )
}
