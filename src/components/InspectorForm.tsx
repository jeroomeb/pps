'use client'

import { useActionState, useRef } from 'react'
import { SubmitButton } from '@/components/SubmitButton'
import { createInspector, type InspectorFormState } from '@/lib/actions/team'

export function InspectorForm() {
  const [state, formAction] = useActionState<InspectorFormState, FormData>(
    createInspector,
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
        Add Inspector
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
      {state?.error && (
        <p className="rounded bg-error-container px-3 py-2 text-sm text-on-error-container">
          {state.error}
        </p>
      )}
      <SubmitButton pendingText="Creating…">+ Add Inspector</SubmitButton>
    </form>
  )
}
