'use client'

import { useActionState } from 'react'
import { SubmitButton } from '@/components/SubmitButton'
import { AddressFields } from '@/components/AddressFields'
import { Card } from '@/components/ui/Card'
import type { PropertyFormState } from '@/lib/actions/properties'
import { WEEKDAY_LABELS, WEEKDAY_ORDER, type ScheduleEntry } from '@/lib/schedule'
import type { AddressParts } from '@/lib/address'

const INPUT =
  'min-h-12 rounded border border-outline-variant px-3 focus:border-primary-container focus:outline-none'
const LABEL = 'text-sm font-semibold uppercase tracking-wide'

export function PropertyForm({
  action,
  defaultValues,
}: {
  action: (state: PropertyFormState, formData: FormData) => Promise<PropertyFormState>
  defaultValues?: AddressParts & {
    name: string
    email: string
    phone?: string | null
    notes?: string | null
    humanId?: string | null
    schedule?: ScheduleEntry[]
    requireIdPhoto?: boolean
  }
}) {
  const [state, formAction] = useActionState<PropertyFormState, FormData>(action, undefined)

  // Schedule is first-of-month only, so a weekday is either on or off.
  const checkedDays = new Set((defaultValues?.schedule ?? []).map((e) => e.weekday))

  return (
    <Card>
      <form action={formAction} className="flex flex-col gap-4">
        {defaultValues?.humanId && (
          <p className="text-xs text-on-surface-variant">
            Property ID: <span className="font-mono font-semibold">{defaultValues.humanId}</span>
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="name" className={LABEL}>
              Property Name
            </label>
            <input id="name" name="name" required defaultValue={defaultValues?.name} className={INPUT} />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="email" className={LABEL}>
              Property Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              defaultValue={defaultValues?.email}
              className={INPUT}
            />
            <p className="text-xs text-on-surface-variant">
              Completed inspection reports are emailed here.
            </p>
          </div>
        </div>

        <AddressFields defaults={defaultValues} requireStreet />

        <div className="flex flex-col gap-1">
          <label htmlFor="phone" className={LABEL}>
            Phone Number
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={defaultValues?.phone ?? ''}
            className={`${INPUT} lg:max-w-xs`}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="notes" className={LABEL}>
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={2}
            defaultValue={defaultValues?.notes ?? ''}
            placeholder="Notes visible to admins and the assigned specialist…"
            className="w-full rounded border border-outline-variant px-3 py-2 text-sm focus:border-primary-container focus:outline-none"
          />
        </div>

        {/* Client Feature: Photo ID Verification Toggle */}
        <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              name="require_id_photo"
              defaultChecked={defaultValues?.requireIdPhoto ?? true}
              className="mt-1 h-4 w-4 accent-[#ee8a4b]"
            />
            <div>
              <p className="text-sm font-semibold text-on-surface">
                Require Driver&apos;s License ID Verification
              </p>
              <p className="text-xs text-on-surface-variant">
                Enable for 1099 independent contractor audits to enforce photo ID document submission.
                Disable for properties maintained by internal corporate / W-2 facilities staff.
              </p>
            </div>
          </label>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className={`${LABEL} mb-1`}>Required Inspection Days</legend>
          <p className="text-xs text-on-surface-variant">
            Pick which days of the week this property needs inspecting. Shown on the property page
            and to the assigned specialist for reference — inspections are still scheduled
            individually below.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {WEEKDAY_ORDER.map((w) => (
              <label
                key={w}
                className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-outline-variant px-3 text-sm font-semibold transition hover:bg-surface-container-low has-[:checked]:border-primary has-[:checked]:bg-primary-container has-[:checked]:text-on-primary-container"
              >
                <input
                  type="checkbox"
                  name="schedule"
                  value={`1-${w}`}
                  defaultChecked={checkedDays.has(w)}
                  className="h-4 w-4 accent-[#ee8a4b]"
                />
                {WEEKDAY_LABELS[w]}
              </label>
            ))}
          </div>
        </fieldset>

        {state?.error && (
          <p className="rounded bg-error-container px-3 py-2 text-sm text-on-error-container">
            {state.error}
          </p>
        )}

        <SubmitButton className="lg:self-start">Save Property</SubmitButton>
      </form>
    </Card>
  )
}
