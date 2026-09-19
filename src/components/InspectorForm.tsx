'use client'

import { useActionState, useEffect, useRef } from 'react'
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

  // Only clear the form on a confirmed success — never wipe the user's
  // input out from under a validation error.
  useEffect(() => {
    if (state?.success) formRef.current?.reset()
  }, [state])

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
          className={INPUT_CLASSES}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="member_email" className={LABEL_CLASSES}>
          Email
        </label>
        <input
          id="member_email"
          name="email"
          type="email"
          required
          className={INPUT_CLASSES}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="member_password" className={LABEL_CLASSES}>
          Temporary Password
        </label>
        <input
          id="member_password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={INPUT_CLASSES}
        />
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
      <SubmitButton pendingText="Creating…">+ Add Team Member</SubmitButton>
    </form>
    </Card>
  )
}
