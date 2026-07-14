'use client'

import { useTransition } from 'react'
import { setTeamMemberRole } from '@/lib/actions/team'

export function RoleToggleButton({
  profileId,
  role,
}: {
  profileId: string
  role: 'admin' | 'inspector'
}) {
  const [pending, startTransition] = useTransition()
  const nextRole = role === 'admin' ? 'inspector' : 'admin'

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => setTeamMemberRole(profileId, nextRole))}
      className="rounded border border-outline-variant px-3 py-2 text-xs font-semibold uppercase tracking-wide hover:bg-surface-container disabled:opacity-50"
    >
      {pending ? 'Saving…' : `Make ${nextRole === 'admin' ? 'Admin' : 'Inspector'}`}
    </button>
  )
}
