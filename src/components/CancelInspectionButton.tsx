'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { Ban, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import { cancelInspection } from '@/lib/actions/inspections'

/**
 * Cancel an inspection, via an explicit confirmation dialog.
 *
 * This deliberately does NOT use the two-tap arm-then-confirm pattern the
 * delete buttons use. Two-tap works for a delete, where there is nothing to
 * collect — but cancelling records a *reason*, and there is nowhere to put a
 * textarea in a list row. The first version hid the reason field behind the
 * arm tap, which meant the icon-only variant in the lists could never capture
 * one at all and the full variant's field was easy to never notice. A dialog
 * gives every entry point the same flow and always offers the reason.
 *
 * `Ban` rather than `Trash2` throughout: cancelling is reversible and keeps
 * the record, deleting is neither.
 *
 * Dialog mechanics mirror `ZoomableImage` — portal to body, Escape to close,
 * backdrop click to close, scroll lock while open.
 */
export function CancelInspectionButton({
  inspectionId,
  iconOnly = false,
  redirectTo,
}: {
  inspectionId: string
  iconOnly?: boolean
  /** Where to go after a successful cancel. Omit to just refresh in place. */
  redirectTo?: string
}) {
  const [pending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()
  const showToast = useToast()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    // Focus the reason field: it is the only thing here that takes input, and
    // it is the whole point of the dialog.
    textareaRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open])

  function handleConfirm() {
    startTransition(async () => {
      const formData = new FormData()
      formData.set('reason', reason)
      const result = await cancelInspection(inspectionId, undefined, formData)
      if (result?.error) {
        showToast('error', result.error)
        return
      }
      setOpen(false)
      setReason('')
      showToast('success', 'Inspection cancelled. The specialist has been notified.')
      if (redirectTo) {
        router.push(redirectTo)
      }
      router.refresh()
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Cancel this inspection"
        aria-label="Cancel this inspection"
        className={`flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-outline-variant text-xs font-semibold uppercase tracking-wide text-on-surface-variant transition hover:bg-surface-container ${
          iconOnly ? 'w-10' : 'px-3'
        }`}
      >
        <Ban size={14} />
        {!iconOnly && 'Cancel Inspection'}
      </button>

      {open &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`cancel-title-${inspectionId}`}
            onClick={() => !pending && setOpen(false)}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-t-2xl bg-surface-container-lowest p-6 shadow-2xl sm:rounded-2xl"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <h2
                  id={`cancel-title-${inspectionId}`}
                  className="font-headline text-xl font-bold"
                >
                  Cancel this inspection?
                </h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={pending}
                  aria-label="Close"
                  className="-mr-2 -mt-1 flex min-h-10 min-w-10 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container disabled:opacity-50"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="mb-4 text-sm text-on-surface-variant">
                It will be removed from the specialist&apos;s assignments and they&apos;ll be
                emailed. The record is kept — including who cancelled it and why — and it can be
                restored later.
              </p>

              <div className="mb-5 flex flex-col gap-1">
                <label
                  htmlFor={`cancel-reason-${inspectionId}`}
                  className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant"
                >
                  Reason <span className="font-normal normal-case">(optional)</span>
                </label>
                <textarea
                  ref={textareaRef}
                  id={`cancel-reason-${inspectionId}`}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  maxLength={500}
                  disabled={pending}
                  placeholder="e.g. Owner rescheduled for next month"
                  className="w-full rounded-lg border border-outline-variant px-3 py-2 text-sm focus:border-primary-container focus:outline-none disabled:opacity-50"
                />
                <p className="text-xs text-on-surface-variant">
                  Saved with the record and included in the email to the specialist.
                </p>
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={pending}
                  className="min-h-11 rounded-lg border border-outline-variant px-4 font-headline text-xs font-semibold uppercase tracking-wide text-on-surface-variant transition hover:bg-surface-container disabled:opacity-50"
                >
                  Keep Inspection
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={pending}
                  className="flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-error px-4 font-headline text-xs font-semibold uppercase tracking-wide text-white transition hover:brightness-95 disabled:opacity-50"
                >
                  <Ban size={14} />
                  {pending ? 'Cancelling…' : 'Cancel Inspection'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
