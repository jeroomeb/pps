'use client'

import { useTransition } from 'react'
import { deleteTemplateItem } from '@/lib/actions/checklists'
import { useToast } from '@/components/ui/Toast'

export function DeleteItemButton({
  itemId,
  templateId,
}: {
  itemId: string
  templateId: string
}) {
  const [pending, startTransition] = useTransition()
  const showToast = useToast()

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm('Remove this checklist item?')) return
        startTransition(async () => {
          try {
            const result = await deleteTemplateItem(itemId, templateId)
            if (result?.error) showToast('error', result.error)
          } catch {
            showToast('error', 'Could not remove the item — please try again.')
          }
        })
      }}
      className="text-xs font-semibold uppercase tracking-wide text-error disabled:opacity-50"
    >
      {pending ? 'Removing…' : 'Remove'}
    </button>
  )
}
