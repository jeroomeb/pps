'use client'

import { useActionState } from 'react'
import { SubmitButton } from '@/components/SubmitButton'
import { Card } from '@/components/ui/Card'
import type { PropertyFormState } from '@/lib/actions/properties'
import { ORDINAL_LABELS, WEEKDAY_LABELS, type ScheduleEntry } from '@/lib/schedule'

const INPUT =
  'min-h-12 rounded border border-outline-variant px-3 focus:border-primary-container focus:outline-none'
const LABEL = 'text-sm font-semibold uppercase tracking-wide'

// Row order Mon..Sun (business-week first); ordinals First..Last.
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0]
const ORDINALS = [1, 2, 3, 4, 5]

export function PropertyForm({
  action,
  defaultValues,
}: {
  action: (state: PropertyFormState, formData: FormData) => Promise<PropertyFormState>
  defaultValues?: {
    name: string
    address: string
    email: string
    phone?: string | null
    notes?: string | null
    humanId?: string | null
    schedule?: ScheduleEntry[]
  }
}) {
  const [state, formAction] = useActionState<PropertyFormState, FormData>(action, undefined)

  const checked = new Set((defaultValues?.schedule ?? []).map((e) => `${e.ordinal}-${e.weekday}`))

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
            <label htmlFor="address" className={LABEL}>
              Property Address
            </label>
            <input
              id="address"
              name="address"
              required
              defaultValue={defaultValues?.address}
              className={INPUT}
            />
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

          <div className="flex flex-col gap-1">
            <label htmlFor="phone" className={LABEL}>
              Phone Number
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={defaultValues?.phone ?? ''}
              className={INPUT}
            />
          </div>
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
            placeholder="Internal notes visible to admins…"
            className="w-full rounded border border-outline-variant px-3 py-2 text-sm focus:border-primary-container focus:outline-none"
          />
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className={`${LABEL} mb-1`}>Required Inspection Days</legend>
          <p className="text-xs text-on-surface-variant">
            Pick the monthly schedule (e.g. First Monday). Due properties show on the dashboard until
            an inspection is scheduled for that day.
          </p>
          <div className="mt-2 overflow-x-auto">
            <table className="text-xs">
              <thead>
                <tr>
                  <th className="p-1" />
                  {ORDINALS.map((o) => (
                    <th key={o} className="px-2 py-1 font-semibold text-on-surface-variant">
                      {ORDINAL_LABELS[o]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {WEEKDAY_ORDER.map((w) => (
                  <tr key={w}>
                    <td className="pr-2 font-semibold">{WEEKDAY_LABELS[w]}</td>
                    {ORDINALS.map((o) => {
                      const value = `${o}-${w}`
                      return (
                        <td key={o} className="px-2 py-1 text-center">
                          <input
                            type="checkbox"
                            name="schedule"
                            value={value}
                            defaultChecked={checked.has(value)}
                            className="h-4 w-4 accent-[#ee8a4b]"
                            aria-label={`${ORDINAL_LABELS[o]} ${WEEKDAY_LABELS[w]}`}
                          />
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
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
