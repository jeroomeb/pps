'use client'

import { useActionState, useState } from 'react'
import { Pencil, X } from 'lucide-react'
import { SubmitButton } from '@/components/SubmitButton'
import { renameTemplate, type TemplateFormState } from '@/lib/actions/checklists'

export function RenameTemplateForm({
  templateId,
  currentName,
}: {
  templateId: string
  currentName: string
}) {
  const [open, setOpen] = useState(false)
  const action = renameTemplate.bind(null, templateId)
  const [state, formAction] = useActionState<TemplateFormState, FormData>(action, undefined)

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-10 items-center gap-1.5 rounded-lg border border-outline-variant px-3 text-xs font-semibold uppercase tracking-wide hover:bg-surface-container"
      >
        <Pencil size={14} />
        Rename
      </button>
    )
  }

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input
        name="name"
        defaultValue={currentName}
        required
        autoFocus
        className="min-h-10 rounded border border-outline-variant px-3 text-sm focus:border-primary-container focus:outline-none"
      />
      <SubmitButton pendingText="Saving…" className="!min-h-10 !px-3 !text-xs">
        Save
      </SubmitButton>
      <button
        type="button"
        onClick={() => setOpen(false)}
        aria-label="Cancel"
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-outline-variant hover:bg-surface-container"
      >
        <X size={14} />
      </button>
      {state?.error && <p className="text-xs text-error">{state.error}</p>}
    </form>
  )
}
