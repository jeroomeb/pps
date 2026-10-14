'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { SubmitButton } from '@/components/SubmitButton'
import { Card } from '@/components/ui/Card'
import { addTemplateItem, type TemplateFormState } from '@/lib/actions/checklists'
import { RISK_DOMAINS, RISK_DOMAIN_LABELS } from '@/lib/risk-domain'

export function AddChecklistItemForm({
  templateId,
  existingCategories = [],
}: {
  templateId: string
  existingCategories?: string[]
}) {
  const action = addTemplateItem.bind(null, templateId)
  const [state, formAction] = useActionState<TemplateFormState, FormData>(action, undefined)
  const formRef = useRef<HTMLFormElement>(null)

  const hasExisting = existingCategories.length > 0
  const [isCreatingNew, setIsCreatingNew] = useState(!hasExisting)
  const [selectedCategory, setSelectedCategory] = useState(hasExisting ? existingCategories[0] : '')

  // Only clear the form on a confirmed success — never wipe the user's
  // input out from under a validation error.
  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset()
      if (hasExisting) {
        setIsCreatingNew(false)
        setSelectedCategory(existingCategories[0])
      }
    }
  }, [state, hasExisting, existingCategories])

  return (
    <Card>
      <form
        ref={formRef}
        action={formAction}
        className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end"
      >
        <div className="flex flex-1 flex-col gap-1 lg:min-w-48">
          <div className="flex items-center justify-between">
            <label
              htmlFor={isCreatingNew ? 'new_item_category_input' : 'new_item_category_select'}
              className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant"
            >
              {isCreatingNew ? 'New Category' : 'Service Category'}
            </label>
            {hasExisting && (
              <button
                type="button"
                onClick={() => setIsCreatingNew(!isCreatingNew)}
                className="text-xs font-semibold text-primary hover:underline"
              >
                {isCreatingNew ? '← Choose existing' : '+ New category'}
              </button>
            )}
          </div>
          {isCreatingNew ? (
            <input
              id="new_item_category_input"
              name="service_category"
              placeholder="e.g. Fire & Life Safety"
              required
              autoFocus={hasExisting}
              className="min-h-12 rounded border border-outline-variant px-3 focus:border-primary-container focus:outline-none"
            />
          ) : (
            <select
              id="new_item_category_select"
              name="service_category"
              required
              value={selectedCategory}
              onChange={(e) => {
                if (e.target.value === '__new__') {
                  setIsCreatingNew(true)
                } else {
                  setSelectedCategory(e.target.value)
                }
              }}
              className="min-h-12 rounded border border-outline-variant bg-surface px-3 focus:border-primary-container focus:outline-none"
            >
              <option value="" disabled>
                Select a category
              </option>
              {existingCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
              <option value="__new__" className="font-semibold text-primary">
                + Add new category...
              </option>
            </select>
          )}
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
        <div className="flex flex-1 flex-col gap-1 lg:min-w-48">
          <label
            htmlFor="new_item_risk_domain"
            className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant"
          >
            Risk area
          </label>
          <select
            id="new_item_risk_domain"
            name="risk_domain"
            required
            defaultValue=""
            className="min-h-12 rounded border border-outline-variant bg-surface px-3 focus:border-primary-container focus:outline-none"
          >
            <option value="" disabled>
              Choose an area
            </option>
            {RISK_DOMAINS.map((domain) => (
              <option key={domain} value={domain}>
                {RISK_DOMAIN_LABELS[domain]}
              </option>
            ))}
          </select>
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
