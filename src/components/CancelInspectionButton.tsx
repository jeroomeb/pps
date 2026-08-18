'use client'

import { useState, useTransition } from 'react'
import { Ban } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import { cancelInspection } from '@/lib/actions/inspections'

/**
 * Two-tap cancel, matching `ConfirmDeleteButton`'s arm-then-confirm pattern
 * (the app deliberately avoids native `confirm()` — see the session-10 notes).
 * `Ban` rather than `Trash2` so cancelling reads as distinct from deleting:
 * cancelling is reversible and keeps the record, deleting is not and does not.
 *
 * The full variant collects an optional reason; `iconOnly` is the quick
 * cancel used inline in list rows, where there's no space for a textarea.
 */
export function CancelInspectionButton({
  inspectionId,
  iconOnly = false,
  redirectTo,
}: {
  inspectionId: string
  iconOnly?: boolean
  redirectTo?: string
}) {
  const [pending, startTransition] = useTransition()
  const [armed, setArmed] = useState(false)
  const [reason, setReason] = useState('')
  const router = useRouter()
  const showToast = useToast()

  function run() {
    setArmed(false)
    startTransition(async () => {
      const formData = new FormData()
      formData.set('reason', reason)
      const result = await cancelInspection(inspectionId, undefined, formData)
      if (result?.error) {
        showToast('error', result.error)
        return
      }
      showToast('success', 'Inspection cancelled. The specialist has been notified.')
      setReason('')
      if (redirectTo) {
        router.push(redirectTo)
      }
      router.refresh()
    })
  }

  function handleClick() {
    if (!armed) {
      setArmed(true)
      // Auto-disarm, so a stray tap can't sit armed indefinitely. The full
      // variant gets longer — there's a reason to type first.
      setTimeout(() => setArmed(false), iconOnly ? 4000 : 15000)
      return
    }
    run()
  }

  const text = pending ? 'Cancelling…' : armed ? 'Confirm?' : 'Cancel Inspection'

  const button = (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      title={armed ? 'Confirm cancelling this inspection' : 'Cancel this inspection'}
      aria-label={armed ? 'Confirm: cancel this inspection' : 'Cancel this inspection'}
      className={`flex min-h-10 items-center justify-center gap-1.5 rounded-lg border text-xs font-semibold uppercase tracking-wide transition disabled:opacity-50 ${
        armed
          ? 'border-error bg-error text-white'
          : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'
      } ${iconOnly ? (armed ? 'w-auto px-3' : 'w-10') : 'px-3'}`}
    >
      <Ban size={14} />
      {(!iconOnly || armed) && text}
    </button>
  )

  if (iconOnly) return button

  return (
    <div className="flex flex-col gap-2">
      {armed && (
        <div className="flex flex-col gap-1">
          <label
            htmlFor={`cancel-reason-${inspectionId}`}
            className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant"
          >
            Reason <span className="font-normal normal-case">(optional)</span>
          </label>
          <textarea
            id={`cancel-reason-${inspectionId}`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            maxLength={500}
            autoFocus
            placeholder="e.g. Owner rescheduled for next month"
            className="w-full rounded border border-outline-variant px-3 py-2 text-sm focus:border-primary-container focus:outline-none"
          />
          <p className="text-xs text-on-surface-variant">
            Saved with the record and included in the email to the specialist.
          </p>
        </div>
      )}
      {button}
      {!armed && !pending && (
        <p className="text-xs text-on-surface-variant">
          Keeps the record and notifies the specialist. Can be restored later.
        </p>
      )}
    </div>
  )
}
