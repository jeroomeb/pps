'use client'

import { useActionState, useEffect, useRef } from 'react'
import { SubmitButton } from '@/components/SubmitButton'
import { Card } from '@/components/ui/Card'
import { addTemplateItem, type TemplateFormState } from '@/lib/actions/checklists'

export function AddChecklistItemForm({ templateId }: { templateId: string }) {
  const action = addTemplateItem.bind(null, templateId)
  const [state, formAction] = useActionState<TemplateFormState, FormData>(action, undefined)
  const formRef = useRef<HTMLFormElement>(null)

  // Only clear the form on a confirmed success — never wipe the user's
  // input out from under a validation error.
  useEffect(() => {
    if (state?.success) formRef.current?.reset()
  }, [state])

  return (
    <Card>
      <form
        ref={formRef}
        action={formAction}
        className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end"
      >
        <div className="flex flex-1 flex-col gap-1 lg:min-w-48">
          <label
            htmlFor="new_item_category"
            className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant"
          >
            Service Category
          </label>
          <input
            id="new_item_category"
            name="service_category"
            placeholder="e.g. Fire & Life Safety"
            required
            className="min-h-12 rounded border border-outline-variant px-3 focus:border-primary-container focus:outline-none"
          />
        </div>
        <div className="flex flex-1 flex-col gap-1 lg:min-w-48">
          <label
            htmlFor="new_item_name"
            className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant"
          >
            Item Name
          </label>
          <input
            id="new_item_name"
            name="item_name"
            placeholder="e.g. Path Obstructions"
            required
            className="min-h-12 rounded border border-outline-variant px-3 focus:border-primary-container focus:outline-none"
          />
        </div>
        <div className="flex flex-[2] flex-col gap-1 lg:min-w-64">
          <label
            htmlFor="new_item_description"
            className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant"
          >
            Description (Optional)
          </label>
          <textarea
            id="new_item_description"
            name="description"
            placeholder="Hover note shown to inspectors"
            rows={1}
            className="min-h-12 rounded border border-outline-variant px-3 py-2 focus:border-primary-container focus:outline-none"
          />
        </div>
        {state?.error && (
          <p className="w-full rounded bg-error-container px-3 py-2 text-sm text-on-error-container">
            {state.error}
          </p>
        )}
        <SubmitButton pendingText="Adding…">+ Add Item</SubmitButton>
      </form>
    </Card>
  )
}
