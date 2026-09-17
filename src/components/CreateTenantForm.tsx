'use client'

import { useActionState, useState } from 'react'
import { Plus, X, Building, ShieldCheck } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { SubmitButton } from '@/components/SubmitButton'
import { createTenant, type TenantFormState } from '@/lib/actions/tenants'

export function CreateTenantForm() {
  const [isOpen, setIsOpen] = useState(false)
  const [state, formAction] = useActionState<TenantFormState, FormData>(async (prevState, formData) => {
    const res = await createTenant(prevState, formData)
    if (res?.success) {
      setIsOpen(false)
    }
    return res
  }, undefined)

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex min-h-11 items-center gap-1.5 rounded-lg bg-primary-container px-4 font-headline text-sm font-semibold uppercase tracking-wide text-on-primary-container hover:brightness-95"
      >
        <Plus size={16} />
        Provision Tenant
      </button>
    )
  }

  return (
    <Card className="mb-8 border-primary-container bg-surface-container-low/40">
      <div className="mb-4 flex items-center justify-between border-b border-outline-variant pb-3">
        <div className="flex items-center gap-2">
          <Building size={18} className="text-primary" />
          <h2 className="font-headline text-base font-bold">Provision New Corporate Tenant</h2>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="rounded p-1 text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
        >
          <X size={18} />
        </button>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="name" className="text-xs font-semibold uppercase tracking-wide">
              Company / Tenant Name
            </label>
            <input
              id="name"
              name="name"
              required
              placeholder="e.g. Apex Property Management"
              className="min-h-11 rounded border border-outline-variant px-3 text-sm focus:border-primary-container focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="slug" className="text-xs font-semibold uppercase tracking-wide">
              Account Slug (Optional)
            </label>
            <input
              id="slug"
              name="slug"
              placeholder="e.g. apex-pm (auto-generated if blank)"
              className="min-h-11 rounded border border-outline-variant px-3 text-sm focus:border-primary-container focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="license_tier" className="text-xs font-semibold uppercase tracking-wide">
              License Tier
            </label>
            <select
              id="license_tier"
              name="license_tier"
              defaultValue="standard"
              className="min-h-11 rounded border border-outline-variant px-3 text-sm bg-surface-container-lowest focus:border-primary-container focus:outline-none"
            >
              <option value="starter">Starter (Single Site)</option>
              <option value="standard">Standard (Up to 5)</option>
              <option value="pro">Pro (Up to 20)</option>
              <option value="enterprise">Enterprise (Custom)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="max_property_licenses" className="text-xs font-semibold uppercase tracking-wide">
              Licensed Property SKUs
            </label>
            <input
              id="max_property_licenses"
              name="max_property_licenses"
              type="number"
              min={1}
              max={500}
              defaultValue={5}
              required
              className="min-h-11 rounded border border-outline-variant px-3 text-sm focus:border-primary-container focus:outline-none"
            />
            <p className="text-[11px] text-on-surface-variant">Max physical buildings allowed</p>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="status" className="text-xs font-semibold uppercase tracking-wide">
              Subscription Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue="active"
              className="min-h-11 rounded border border-outline-variant px-3 text-sm bg-surface-container-lowest focus:border-primary-container focus:outline-none"
            >
              <option value="active">Active</option>
              <option value="trial">Trial</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        {state?.error && (
          <p className="rounded bg-error-container px-3 py-2 text-xs font-medium text-on-error-container">
            {state.error}
          </p>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded border border-outline-variant px-4 py-2 text-xs font-semibold uppercase tracking-wide text-on-surface-variant hover:bg-surface-container"
          >
            Cancel
          </button>
          <SubmitButton>Create Tenant</SubmitButton>
        </div>
      </form>
    </Card>
  )
}
