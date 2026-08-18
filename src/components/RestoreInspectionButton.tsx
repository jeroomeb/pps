'use client'

import { useTransition } from 'react'
import { RotateCcw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import { restoreInspection } from '@/lib/actions/inspections'

/**
 * Undo a cancellation. Single tap — unlike cancel/delete this is not
 * destructive, so it doesn't need the arm-then-confirm pattern.
 */
export function RestoreInspectionButton({ inspectionId }: { inspectionId: string }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const showToast = useToast()

  function handleClick() {
    startTransition(async () => {
      const result = await restoreInspection(inspectionId)
      if (result?.error) {
        showToast('error', result.error)
        return
      }
      showToast('success', 'Inspection restored — it is pending again.')
      router.refresh()
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-primary-container px-4 text-xs font-semibold uppercase tracking-wide text-on-primary-container transition hover:brightness-95 disabled:opacity-50"
    >
      <RotateCcw size={14} />
      {pending ? 'Restoring…' : 'Restore Inspection'}
    </button>
  )
}
