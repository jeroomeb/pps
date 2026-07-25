'use client'

import { useActionState, useState } from 'react'
import { SubmitButton } from '@/components/SubmitButton'
import { Card } from '@/components/ui/Card'
import {
  SpecialistSelect,
  type PropertyLocation,
  type SpecialistOption,
} from '@/components/SpecialistSelect'
import { createInspection, type InspectionFormState } from '@/lib/actions/inspections'

const SELECT_CLASSES =
  'min-h-12 rounded border border-outline-variant bg-surface-container-lowest px-3 focus:border-primary-container focus:outline-none'

export function NewInspectionForm({
  propertyId,
  properties,
  templates,
  inspectors,
  defaultPropertyId,
  defaultScheduledFor,
  timeZoneLabel,
}: {
  /** Fixed property (property-detail page) — renders a hidden input. */
  propertyId?: string
  /**
   * Selectable properties (global Start Inspection page) — renders a dropdown.
   * When `propertyId` is fixed, pass that one property here too so the
   * specialist list can still rank by proximity to it.
   */
  properties?: PropertyLocation[]
  templates: { id: string; name: string }[]
  inspectors: SpecialistOption[]
  /** Preselects a property in the dropdown (dashboard "Schedule" deep-link). */
  defaultPropertyId?: string
  /** Prefills the date input, e.g. when scheduling a due day from the dashboard. */
  defaultScheduledFor?: string
  /** e.g. "EDT" — `datetime-local` carries no timezone, and the server reads it
   * as APP_TIMEZONE, so an admin in another zone must be told which clock. */
  timeZoneLabel: string
}) {
  const [state, formAction] = useActionState<InspectionFormState, FormData>(
    createInspection,
    undefined
  )
  // Tracked so the specialist list can re-rank by proximity as soon as a
  // property is picked on the global Start Inspection page.
  const [selectedPropertyId, setSelectedPropertyId] = useState(
    propertyId ?? defaultPropertyId ?? ''
  )

  const selectedProperty = (properties ?? []).find((p) => p.id === selectedPropertyId) ?? null

  return (
    <Card>
      <form action={formAction} className="flex flex-col gap-4">
        {propertyId ? (
          <input type="hidden" name="property_id" value={propertyId} />
        ) : (
          <div className="flex flex-col gap-1">
            <label htmlFor="property_id" className="text-sm font-semibold uppercase tracking-wide">
              Select Property
            </label>
            <select
              id="property_id"
              name="property_id"
              required
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              className={SELECT_CLASSES}
            >
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

        <SpecialistSelect specialists={inspectors} property={selectedProperty} />

        <div className="flex flex-col gap-1">
          <label htmlFor="scheduled_for" className="text-sm font-semibold uppercase tracking-wide">
            Scheduled Date &amp; Time <span className="text-on-surface-variant">(optional)</span>
          </label>
          <input
            id="scheduled_for"
            name="scheduled_for"
            type="datetime-local"
            defaultValue={defaultScheduledFor}
            className={SELECT_CLASSES}
          />
          <p className="text-xs text-on-surface-variant">
            Times are <span className="font-semibold">{timeZoneLabel}</span>. The specialist can’t
            start the inspection before this time. Leave blank to allow starting right away.
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
