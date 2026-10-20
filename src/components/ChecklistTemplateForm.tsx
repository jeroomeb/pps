'use client'

import { useActionState, useState } from 'react'
import { SubmitButton } from '@/components/SubmitButton'
import { createTemplate, type TemplateFormState } from '@/lib/actions/checklists'
import { RISK_DOMAINS, RISK_DOMAIN_LABELS } from '@/lib/risk-domain'

type ItemDraft = {
  service_category: string
  item_name: string
  description: string
  risk_domain: string
}

const EMPTY_ITEM: ItemDraft = {
  service_category: '',
  item_name: '',
  description: '',
  risk_domain: '',
}

export function ChecklistTemplateForm({
  isSuperAdmin = false,
  existingCategories = [],
}: {
  isSuperAdmin?: boolean
  existingCategories?: string[]
}) {
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

  const categorySuggestions = Array.from(
    new Set([
      ...existingCategories,
      ...items.map((it) => it.service_category.trim()).filter(Boolean),
    ])
  )

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

        {isSuperAdmin ? (
          <div className="mt-3 flex items-start gap-2.5 rounded-md border border-outline-variant/60 bg-surface-container-low/50 p-3">
            <input
              type="checkbox"
              id="enable_predictive_scoring"
              name="enable_predictive_scoring"
              defaultChecked
              className="mt-0.5 h-4 w-4 rounded border-outline-variant text-[#ee8a4b] focus:ring-[#ee8a4b]"
            />
            <div className="flex flex-col">
              <label
                htmlFor="enable_predictive_scoring"
                className="text-xs font-semibold text-on-surface cursor-pointer"
              >
                Enable Predictive Risk Scoring for this Checklist
              </label>
              <p className="text-[11px] text-on-surface-variant">
                When enabled, inspections using this checklist participate in pre-shift risk score calculations and recurring failure trends.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex items-start gap-2.5 rounded-md border border-outline-variant/60 bg-surface-container-low/50 p-3">
            <input type="hidden" name="enable_predictive_scoring" value="true" />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-on-surface">
                Predictive Risk Scoring: Enabled
              </span>
              <p className="text-[11px] text-on-surface-variant">
                Checklist predictive risk analytics settings are managed by Platform Owner / Super Admin.
              </p>
            </div>
          </div>
        )}
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

            <div className="flex flex-col gap-1">
              <label
                htmlFor={`item_cat_${index}`}
                className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant"
              >
                Service Category
              </label>
              <input
                id={`item_cat_${index}`}
                list="category-suggestions"
                placeholder="Service Category (e.g. Common Area Fire & Life Safety)"
                value={item.service_category}
                onChange={(e) => updateItem(index, { service_category: e.target.value })}
                required
                className="min-h-12 rounded border border-outline-variant px-3 focus:border-primary-container focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor={`item_name_${index}`}
                className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant"
              >
                Item Name
              </label>
              <input
                id={`item_name_${index}`}
                placeholder="Item Name (e.g. Path Obstructions)"
                value={item.item_name}
                onChange={(e) => updateItem(index, { item_name: e.target.value })}
                required
                className="min-h-12 rounded border border-outline-variant px-3 focus:border-primary-container focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor={`item_desc_${index}`}
                className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant"
              >
                Description (Optional)
              </label>
              <textarea
                id={`item_desc_${index}`}
                placeholder="Description / hover note (optional)"
                value={item.description}
                onChange={(e) => updateItem(index, { description: e.target.value })}
                rows={2}
                className="rounded border border-outline-variant px-3 py-2 focus:border-primary-container focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor={`item_risk_${index}`}
                className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant"
              >
                Risk Area
              </label>
              <select
                id={`item_risk_${index}`}
                value={item.risk_domain}
                onChange={(e) => updateItem(index, { risk_domain: e.target.value })}
                className="min-h-12 rounded border border-outline-variant bg-surface px-3 focus:border-primary-container focus:outline-none"
              >
                <option value="">Choose an area</option>
                {RISK_DOMAINS.map((domain) => (
                  <option key={domain} value={domain}>
                    {RISK_DOMAIN_LABELS[domain]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>

      {categorySuggestions.length > 0 && (
        <datalist id="category-suggestions">
          {categorySuggestions.map((cat) => (
            <option key={cat} value={cat} />
          ))}
        </datalist>
      )}

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
