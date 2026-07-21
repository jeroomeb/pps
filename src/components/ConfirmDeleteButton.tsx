'use client'

import { useState, useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'

export function ConfirmDeleteButton({
  action,
  confirmMessage,
  label = 'Delete',
  iconOnly = false,
  redirectTo,
}: {
  action: () => Promise<{ error?: string } | void>
  confirmMessage: string
  label?: string
  iconOnly?: boolean
  redirectTo?: string
}) {
  const [pending, startTransition] = useTransition()
  const [armed, setArmed] = useState(false)
  const router = useRouter()
  const showToast = useToast()

  function handleClick() {
    if (!armed) {
      setArmed(true)
      setTimeout(() => setArmed(false), 4000)
      return
    }
    setArmed(false)
    startTransition(async () => {
      const result = await action()
      if (result?.error) {
        showToast('error', result.error)
        return
      }
      showToast('success', 'Deleted.')
      if (redirectTo) {
        router.push(redirectTo)
        router.refresh()
      }
    })
  }

  const text = pending ? 'Deleting…' : armed ? 'Confirm?' : label

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      title={armed ? confirmMessage : label}
      aria-label={label}
      className={`flex min-h-10 items-center justify-center gap-1.5 rounded-lg border text-xs font-semibold uppercase tracking-wide transition disabled:opacity-50 ${
        armed
          ? 'border-error bg-error text-white'
          : 'border-outline-variant text-error hover:bg-error-container/40'
      } ${iconOnly ? 'w-10' : 'px-3'}`}
    >
      <Trash2 size={14} />
      {!iconOnly && text}
    </button>
  )
}
