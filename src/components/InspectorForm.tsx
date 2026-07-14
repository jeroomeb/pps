'use client'

import { useActionState, useRef } from 'react'
import { SubmitButton } from '@/components/SubmitButton'
import { createTeamMember, type TeamMemberFormState } from '@/lib/actions/team'

export function InspectorForm() {
  const [state, formAction] = useActionState<TeamMemberFormState, FormData>(
    createTeamMember,
    undefined
  )
  const formRef = useRef<HTMLFormElement>(null)

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await formAction(formData)
        formRef.current?.reset()
      }}
      className="flex flex-col gap-4 rounded border border-outline-variant bg-surface-container-lowest p-4"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
        Add Team Member
      </p>
      <input
        name="full_name"
        placeholder="Full Name"
        required
        className="min-h-12 rounded border border-outline-variant px-3 focus:border-primary-container focus:outline-none"
      />
      <input
        name="email"
        type="email"
        placeholder="Email"
        required
        className="min-h-12 rounded border border-outline-variant px-3 focus:border-primary-container focus:outline-none"
      />
      <input
        name="password"
        type="password"
        placeholder="Temporary Password"
        required
        minLength={8}
        className="min-h-12 rounded border border-outline-variant px-3 focus:border-primary-container focus:outline-none"
      />
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
          <option value="inspector">Inspector</option>
          <option value="admin">Admin</option>
        </select>
        <p className="text-xs text-on-surface-variant">
          Admins can also be assigned inspections, just like inspectors.
        </p>
      </div>
      {state?.error && (
        <p className="rounded bg-error-container px-3 py-2 text-sm text-on-error-container">
          {state.error}
        </p>
      )}
      <SubmitButton pendingText="Creating…">+ Add Team Member</SubmitButton>
    </form>
  )
}
