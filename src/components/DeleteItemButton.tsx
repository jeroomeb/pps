'use client'

import { deleteTemplateItem } from '@/lib/actions/checklists'

export function DeleteItemButton({
  itemId,
  templateId,
}: {
  itemId: string
  templateId: string
}) {
  return (
    <button
      type="button"
      onClick={() => {
        if (confirm('Remove this checklist item?')) {
          deleteTemplateItem(itemId, templateId)
        }
      }}
      className="text-xs font-semibold uppercase tracking-wide text-error"
    >
      Remove
    </button>
  )
}
