'use client'

import { useActionState } from 'react'
import { SubmitButton } from '@/components/SubmitButton'
import { Card } from '@/components/ui/Card'
import { createInspection, type InspectionFormState } from '@/lib/actions/inspections'

const SELECT_CLASSES =
  'min-h-12 rounded border border-outline-variant bg-surface-container-lowest px-3 focus:border-primary-container focus:outline-none'

export function NewInspectionForm({
  propertyId,
  properties,
  templates,
  inspectors,
}: {
  /** Fixed property (property-detail page) — renders a hidden input. */
  propertyId?: string
  /** Selectable properties (global Start Inspection page) — renders a dropdown. */
  properties?: { id: string; name: string }[]
  templates: { id: string; name: string }[]
  inspectors: { id: string; full_name: string; role: 'admin' | 'inspector' }[]
}) {
  const [state, formAction] = useActionState<InspectionFormState, FormData>(
    createInspection,
    undefined
  )

  return (
    <Card>
    <form
      action={formAction}
      className="flex flex-col gap-4"
    >
      {propertyId ? (
        <input type="hidden" name="property_id" value={propertyId} />
      ) : (
        <div className="flex flex-col gap-1">
          <label htmlFor="property_id" className="text-sm font-semibold uppercase tracking-wide">
            Select Property
          </label>
          <select id="property_id" name="property_id" required defaultValue="" className={SELECT_CLASSES}>
            <option value="" disabled>
              Select a property…
            </option>
            {(properties ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="template_id" className="text-sm font-semibold uppercase tracking-wide">
          Select Checklist
        </label>
        <select id="template_id" name="template_id" required defaultValue="" className={SELECT_CLASSES}>
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
        <select id="inspector_id" name="inspector_id" required defaultValue="" className={SELECT_CLASSES}>
          <option value="" disabled>
            Select an inspector…
          </option>
          {inspectors.map((i) => (
            <option key={i.id} value={i.id}>
              {i.full_name}
              {i.role === 'admin' ? ' (Admin)' : ''}
            </option>
          ))}
        </select>
        <p className="text-xs text-on-surface-variant">
          Assign yourself and you’ll be taken straight to the checklist.
        </p>
      </div>

      {state?.error && (
        <p className="rounded bg-error-container px-3 py-2 text-sm text-on-error-container">
          {state.error}
        </p>
      )}

      <SubmitButton pendingText="Creating…">Start Inspection</SubmitButton>
    </form>
    </Card>
  )
}
