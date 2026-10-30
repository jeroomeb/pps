'use client'

import { useTransition } from 'react'
import { setTeamMemberRole } from '@/lib/actions/team'
import { useToast } from '@/components/ui/Toast'

export function RoleToggleButton({
  profileId,
  role,
  canDemoteAdmin = true,
}: {
  profileId: string
  role: 'admin' | 'inspector'
  canDemoteAdmin?: boolean
}) {
  const [pending, startTransition] = useTransition()
  const showToast = useToast()
  const nextRole = role === 'admin' ? 'inspector' : 'admin'
  const isDemotionBlocked = role === 'admin' && !canDemoteAdmin

  return (
    <button
      type="button"
      disabled={pending || isDemotionBlocked}
      title={
        isDemotionBlocked
          ? 'Demoting an Administrator requires Super Admin authorization'
          : `Change role to ${nextRole === 'admin' ? 'Admin' : 'Specialist'}`
      }
      onClick={() => {
        if (isDemotionBlocked) {
          showToast('error', 'Demoting an Administrator requires Super Admin authorization.')
          return
        }
        startTransition(async () => {
          try {
            const result = await setTeamMemberRole(profileId, nextRole)
            if (result?.error) showToast('error', result.error)
            else showToast('success', `Role updated to ${nextRole === 'admin' ? 'Admin' : 'Specialist'}.`)
          } catch {
            showToast('error', 'Could not change the role — please try again.')
          }
        })
      }}
      className={`rounded border border-outline-variant px-3 py-2 text-xs font-semibold uppercase tracking-wide transition ${
        isDemotionBlocked
          ? 'opacity-40 cursor-not-allowed bg-surface-container-low text-on-surface-variant'
          : 'hover:bg-surface-container disabled:opacity-50 text-on-surface'
      }`}
    >
      {pending ? 'Saving…' : `Make ${nextRole === 'admin' ? 'Admin' : 'Specialist'}`}
    </button>
  )
}
