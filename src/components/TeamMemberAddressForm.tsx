'use client'

import { useActionState } from 'react'
import { SubmitButton } from '@/components/SubmitButton'
import { AddressFields } from '@/components/AddressFields'
import { Card } from '@/components/ui/Card'
import { updateTeamMemberAddress, type TeamMemberFormState } from '@/lib/actions/team'
import type { AddressParts } from '@/lib/address'

/**
 * Admin-editable coverage area for a specialist. Specialists maintain this
 * themselves at /inspector/profile, but proximity-based assignment only works
 * if it's populated — so admins can fill it in here.
 */
export function TeamMemberAddressForm({
  profileId,
  defaults,
}: {
  profileId: string
  defaults: AddressParts
}) {
  const [state, formAction] = useActionState<TeamMemberFormState, FormData>(
    updateTeamMemberAddress.bind(null, profileId),
    undefined
  )

  return (
    <Card>
      <form action={formAction} className="flex flex-col gap-4">
        <AddressFields defaults={defaults} idPrefix="member-" />

        <p className="text-xs text-on-surface-variant">
          County, state and ZIP are used to match this specialist with nearby properties when
          assigning inspections.
        </p>

        {state?.error && (
          <p className="rounded bg-error-container px-3 py-2 text-sm text-on-error-container">
            {state.error}
          </p>
        )}
        {state?.success && (
          <p className="rounded bg-success-container px-3 py-2 text-sm text-on-success-container">
            Coverage area saved.
          </p>
        )}

        <SubmitButton className="lg:self-start">Save Address</SubmitButton>
      </form>
    </Card>
  )
}
