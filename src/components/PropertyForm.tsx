'use client'

import { useActionState } from 'react'
import { SubmitButton } from '@/components/SubmitButton'
import type { PropertyFormState } from '@/lib/actions/properties'

export function PropertyForm({
  action,
  defaultValues,
}: {
  action: (state: PropertyFormState, formData: FormData) => Promise<PropertyFormState>
  defaultValues?: { name: string; address: string; email: string }
}) {
  const [state, formAction] = useActionState<PropertyFormState, FormData>(
    action,
    undefined
  )

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded border border-outline-variant bg-surface-container-lowest p-6"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-semibold uppercase tracking-wide">
          Property Name
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={defaultValues?.name}
          className="min-h-12 rounded border border-outline-variant px-3 focus:border-primary-container focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="address" className="text-sm font-semibold uppercase tracking-wide">
          Property Address
        </label>
        <input
          id="address"
          name="address"
          required
          defaultValue={defaultValues?.address}
          className="min-h-12 rounded border border-outline-variant px-3 focus:border-primary-container focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-semibold uppercase tracking-wide">
          Property Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          defaultValue={defaultValues?.email}
          className="min-h-12 rounded border border-outline-variant px-3 focus:border-primary-container focus:outline-none"
        />
        <p className="text-xs text-on-surface-variant">
          Completed inspection reports are emailed here.
        </p>
      </div>

      {state?.error && (
        <p className="rounded bg-error-container px-3 py-2 text-sm text-on-error-container">
          {state.error}
        </p>
      )}

      <SubmitButton>Save Property</SubmitButton>
    </form>
  )
}
