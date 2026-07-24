'use client'

import { useTransition } from 'react'
import { setTeamMemberRole } from '@/lib/actions/team'
import { useToast } from '@/components/ui/Toast'

export function RoleToggleButton({
  profileId,
  role,
}: {
  profileId: string
  role: 'admin' | 'inspector'
}) {
  const [pending, startTransition] = useTransition()
  const showToast = useToast()
  const nextRole = role === 'admin' ? 'inspector' : 'admin'

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          try {
            const result = await setTeamMemberRole(profileId, nextRole)
            if (result?.error) showToast('error', result.error)
          } catch {
            showToast('error', 'Could not change the role — please try again.')
          }
        })
      }
      className="rounded border border-outline-variant px-3 py-2 text-xs font-semibold uppercase tracking-wide hover:bg-surface-container disabled:opacity-50"
    >
      {pending ? 'Saving…' : `Make ${nextRole === 'admin' ? 'Admin' : 'Specialist'}`}
    </button>
  )
}
