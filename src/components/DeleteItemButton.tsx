'use client'

import { deleteTemplateItem } from '@/lib/actions/checklists'
import { ConfirmDeleteButton } from '@/components/ConfirmDeleteButton'

export function DeleteItemButton({
  itemId,
  templateId,
}: {
  itemId: string
  templateId: string
}) {
  return (
    <ConfirmDeleteButton
      action={deleteTemplateItem.bind(null, itemId, templateId)}
      confirmMessage="Remove this checklist item?"
      label="Remove"
    />
  )
}
