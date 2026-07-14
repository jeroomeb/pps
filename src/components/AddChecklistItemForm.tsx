'use client'

import { useActionState, useRef } from 'react'
import { SubmitButton } from '@/components/SubmitButton'
import { addTemplateItem, type TemplateFormState } from '@/lib/actions/checklists'

export function AddChecklistItemForm({ templateId }: { templateId: string }) {
  const action = addTemplateItem.bind(null, templateId)
  const [state, formAction] = useActionState<TemplateFormState, FormData>(action, undefined)
  const formRef = useRef<HTMLFormElement>(null)

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await formAction(formData)
        formRef.current?.reset()
      }}
      className="flex flex-col gap-3 rounded border border-outline-variant bg-surface-container-lowest p-4"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
        Add Item
      </p>
      <input
        name="service_category"
        placeholder="Service Category"
        required
        className="min-h-12 rounded border border-outline-variant px-3 focus:border-primary-container focus:outline-none"
      />
      <input
        name="item_name"
        placeholder="Item Name"
        required
        className="min-h-12 rounded border border-outline-variant px-3 focus:border-primary-container focus:outline-none"
      />
      <textarea
        name="description"
        placeholder="Description / hover note (optional)"
        rows={2}
        className="rounded border border-outline-variant px-3 py-2 focus:border-primary-container focus:outline-none"
      />
      {state?.error && (
        <p className="rounded bg-error-container px-3 py-2 text-sm text-on-error-container">
          {state.error}
        </p>
      )}
      <SubmitButton pendingText="Adding…">+ Add Item</SubmitButton>
    </form>
  )
}
