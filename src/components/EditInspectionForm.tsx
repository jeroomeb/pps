'use client'

import { useActionState } from 'react'
import { SubmitButton } from '@/components/SubmitButton'
import { Card } from '@/components/ui/Card'
import {
  SpecialistSelect,
  type PropertyLocation,
  type SpecialistOption,
} from '@/components/SpecialistSelect'
import { updateInspection, type InspectionFormState } from '@/lib/actions/inspections'

const INPUT =
  'min-h-12 rounded border border-outline-variant bg-surface-container-lowest px-3 focus:border-primary-container focus:outline-none'

export function EditInspectionForm({
  inspectionId,
  property,
  checklistName,
  inspectors,
  defaultInspectorId,
  defaultScheduledFor,
  timeZoneLabel,
}: {
  inspectionId: string
  property: PropertyLocation & { name: string }
  checklistName: string
  inspectors: SpecialistOption[]
  defaultInspectorId: string
  /** `datetime-local` value ("2026-08-01T09:00") or undefined when unscheduled. */
  defaultScheduledFor?: string
  /** e.g. "EDT" — `datetime-local` carries no timezone, and the server reads it
   * as APP_TIMEZONE, so an admin in another zone must be told which clock. */
  timeZoneLabel: string
}) {
  const [state, formAction] = useActionState<InspectionFormState, FormData>(
    updateInspection.bind(null, inspectionId),
    undefined
  )

  return (
    <Card>
      <form action={formAction} className="flex flex-col gap-4">
        {/* The checklist can't be changed: items are snapshotted into
            inspection_items at creation, so swapping it would leave the
            inspection's own copies inconsistent with its label. */}
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <div>
            <p className="label-tracked text-on-surface-variant">Property</p>
            <p className="font-semibold">{property.name}</p>
          </div>
          <div>
            <p className="label-tracked text-on-surface-variant">Checklist</p>
            <p className="font-semibold">{checklistName}</p>
          </div>
        </div>

        <SpecialistSelect
          specialists={inspectors}
          property={property}
          defaultValue={defaultInspectorId}
        />

        <div className="flex flex-col gap-1">
          <label htmlFor="scheduled_for" className="text-sm font-semibold uppercase tracking-wide">
            Scheduled Date &amp; Time <span className="text-on-surface-variant">(optional)</span>
          </label>
          <input
            id="scheduled_for"
            name="scheduled_for"
            type="datetime-local"
            defaultValue={defaultScheduledFor}
            className={INPUT}
          />
          <p className="text-xs text-on-surface-variant">
            Times are <span className="font-semibold">{timeZoneLabel}</span>. The specialist can’t
            start before this time. Clear it to let them start right away.
            Admins can always start early.
          </p>
        </div>

        {state?.error && (
          <p className="rounded bg-error-container px-3 py-2 text-sm text-on-error-container">
            {state.error}
          </p>
        )}

        <SubmitButton pendingText="Saving…">Save Changes</SubmitButton>
      </form>
    </Card>
  )
}
