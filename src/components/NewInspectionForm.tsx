'use client'

import { useActionState } from 'react'
import { SubmitButton } from '@/components/SubmitButton'
import { createInspection, type InspectionFormState } from '@/lib/actions/inspections'

export function NewInspectionForm({
  propertyId,
  templates,
  inspectors,
}: {
  propertyId: string
  templates: { id: string; name: string }[]
  inspectors: { id: string; full_name: string }[]
}) {
  const [state, formAction] = useActionState<InspectionFormState, FormData>(
    createInspection,
    undefined
  )

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded border border-outline-variant bg-surface-container-lowest p-4"
    >
      <input type="hidden" name="property_id" value={propertyId} />

      <div className="flex flex-col gap-1">
        <label htmlFor="template_id" className="text-sm font-semibold uppercase tracking-wide">
          Checklist Type
        </label>
        <select
          id="template_id"
          name="template_id"
          required
          defaultValue=""
          className="min-h-12 rounded border border-outline-variant bg-surface-container-lowest px-3"
        >
          <option value="" disabled>
            Select a checklist…
          </option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="inspector_id" className="text-sm font-semibold uppercase tracking-wide">
          Assign Inspector
        </label>
        <select
          id="inspector_id"
          name="inspector_id"
          required
          defaultValue=""
          className="min-h-12 rounded border border-outline-variant bg-surface-container-lowest px-3"
        >
          <option value="" disabled>
            Select an inspector…
          </option>
          {inspectors.map((i) => (
            <option key={i.id} value={i.id}>
              {i.full_name}
            </option>
          ))}
        </select>
      </div>

      {state?.error && (
        <p className="rounded bg-error-container px-3 py-2 text-sm text-on-error-container">
          {state.error}
        </p>
      )}

      <SubmitButton pendingText="Creating…">+ Create Inspection</SubmitButton>
    </form>
  )
}
