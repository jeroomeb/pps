import type { AddressParts } from '@/lib/address'

const INPUT =
  'min-h-12 rounded border border-outline-variant px-3 focus:border-primary-container focus:outline-none'
const LABEL = 'text-sm font-semibold uppercase tracking-wide'

/**
 * Street / City / State / ZIP / County inputs, shared by the property form,
 * the specialist self-service profile and the admin's team-member form.
 * Field names match what the server actions read, and County is captured for
 * proximity matching + filtering (it is not printed in the mailing address).
 */
export function AddressFields({
  defaults,
  idPrefix = '',
  requireStreet = false,
}: {
  defaults?: AddressParts
  /** Prefix so two address blocks can coexist on one page without id clashes. */
  idPrefix?: string
  requireStreet?: boolean
}) {
  const id = (name: string) => `${idPrefix}${name}`
  return (
    <>
      <div className="flex flex-col gap-1">
        <label htmlFor={id('street')} className={LABEL}>
          Street Address
        </label>
        <input
          id={id('street')}
          name="street"
          required={requireStreet}
          defaultValue={defaults?.street ?? ''}
          className={INPUT}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="flex flex-col gap-1">
          <label htmlFor={id('city')} className={LABEL}>
            City
          </label>
          <input id={id('city')} name="city" defaultValue={defaults?.city ?? ''} className={INPUT} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={id('state')} className={LABEL}>
            State
          </label>
          <input
            id={id('state')}
            name="state"
            maxLength={2}
            placeholder="NJ"
            defaultValue={defaults?.state ?? ''}
            className={`${INPUT} uppercase`}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={id('zip')} className={LABEL}>
            ZIP Code
          </label>
          <input
            id={id('zip')}
            name="zip"
            inputMode="numeric"
            maxLength={10}
            placeholder="07102"
            defaultValue={defaults?.zip ?? ''}
            className={INPUT}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={id('county')} className={LABEL}>
            County
          </label>
          <input
            id={id('county')}
            name="county"
            placeholder="Essex"
            defaultValue={defaults?.county ?? ''}
            className={INPUT}
          />
        </div>
      </div>
    </>
  )
}
