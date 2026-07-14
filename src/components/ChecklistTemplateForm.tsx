'use client'

import { useActionState, useState } from 'react'
import { SubmitButton } from '@/components/SubmitButton'
import { createTemplate, type TemplateFormState } from '@/lib/actions/checklists'

type ItemDraft = { service_category: string; item_name: string; description: string }

const EMPTY_ITEM: ItemDraft = { service_category: '', item_name: '', description: '' }

export function ChecklistTemplateForm() {
  const [state, formAction] = useActionState<TemplateFormState, FormData>(
    createTemplate,
    undefined
  )
  const [items, setItems] = useState<ItemDraft[]>([{ ...EMPTY_ITEM }])

  function updateItem(index: number, patch: Partial<ItemDraft>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  function addItem() {
    setItems((prev) => [...prev, { ...EMPTY_ITEM }])
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 rounded border border-outline-variant bg-surface-container-lowest p-4">
        <label htmlFor="name" className="text-sm font-semibold uppercase tracking-wide">
          Checklist Name
        </label>
        <input
          id="name"
          name="name"
          required
          placeholder="e.g. Waterfront Villas Checklist Master"
          className="min-h-12 rounded border border-outline-variant px-3 focus:border-primary-container focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-3">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex flex-col gap-3 rounded border border-outline-variant bg-surface-container-lowest p-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                Item {index + 1}
              </p>
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="text-xs font-semibold uppercase tracking-wide text-error"
                >
                  Remove
                </button>
              )}
            </div>
            <input
              placeholder="Service Category (e.g. Common Area Fire & Life Safety)"
              value={item.service_category}
              onChange={(e) => updateItem(index, { service_category: e.target.value })}
              required
              className="min-h-12 rounded border border-outline-variant px-3 focus:border-primary-container focus:outline-none"
            />
            <input
              placeholder="Item Name (e.g. Path Obstructions)"
              value={item.item_name}
              onChange={(e) => updateItem(index, { item_name: e.target.value })}
              required
              className="min-h-12 rounded border border-outline-variant px-3 focus:border-primary-container focus:outline-none"
            />
            <textarea
              placeholder="Description / hover note (optional)"
              value={item.description}
              onChange={(e) => updateItem(index, { description: e.target.value })}
              rows={2}
              className="rounded border border-outline-variant px-3 py-2 focus:border-primary-container focus:outline-none"
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addItem}
        className="min-h-12 rounded border-2 border-on-surface font-headline text-sm font-semibold uppercase tracking-wide"
      >
        + Add Item
      </button>

      <input type="hidden" name="items" value={JSON.stringify(items)} />

      {state?.error && (
        <p className="rounded bg-error-container px-3 py-2 text-sm text-on-error-container">
          {state.error}
        </p>
      )}

      <SubmitButton pendingText="Creating checklist…">Save Checklist Type</SubmitButton>
    </form>
  )
}
