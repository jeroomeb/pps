'use client'

import { useActionState, useState } from 'react'
import { Building, KeyRound, Pencil, Check, X, ShieldAlert } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { updateTenantLicense, type TenantFormState } from '@/lib/actions/tenants'
import type { LicenseTier, TenantStatus } from '@/lib/database.types'

export type TenantItem = {
  id: string
  name: string
  slug: string | null
  license_tier: LicenseTier
  max_property_licenses: number
  status: TenantStatus
  created_at: string
  propertyCount: number
  staffCount: number
}

export function TenantLicenseCard({ tenant }: { tenant: TenantItem }) {
  const showToast = useToast()
  const [isEditing, setIsEditing] = useState(false)

  const [state, formAction] = useActionState<TenantFormState, FormData>(async (prevState, formData) => {
    const res = await updateTenantLicense(prevState, formData)
    if (res?.success) {
      setIsEditing(false)
      showToast('success', `${tenant.name} license updated successfully.`)
    } else if (res?.error) {
      showToast('error', res.error)
    }
    return res
  }, undefined)

  const usagePct = tenant.max_property_licenses > 0
    ? Math.min(100, Math.round((tenant.propertyCount / tenant.max_property_licenses) * 100))
    : 0

  const isAtCapacity = tenant.propertyCount >= tenant.max_property_licenses

  return (
    <Card className="flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-3 border-b border-outline-variant pb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Building size={16} className="text-primary shrink-0" />
              <h3 className="truncate font-headline font-bold text-base text-on-surface">
                {tenant.name}
              </h3>
            </div>
            <p className="mt-0.5 truncate text-xs text-on-surface-variant font-mono">
              slug: {tenant.slug ?? tenant.id.slice(0, 8)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                tenant.status === 'active'
                  ? 'bg-success-container text-on-success-container'
                  : tenant.status === 'trial'
                    ? 'bg-primary-container text-on-primary-container'
                    : 'bg-error-container text-on-error-container'
              }`}
            >
              {tenant.status}
            </span>

            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="rounded p-1 text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              title="Edit Tenant License"
            >
              {isEditing ? <X size={15} /> : <Pencil size={15} />}
            </button>
          </div>
        </div>

        {isEditing ? (
          <form action={formAction} className="mt-4 flex flex-col gap-3">
            <input type="hidden" name="tenant_id" value={tenant.id} />

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">
                Company Name
              </label>
              <input
                name="name"
                defaultValue={tenant.name}
                required
                className="min-h-9 rounded border border-outline-variant px-2.5 text-xs focus:border-primary-container focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">
                  Tier
                </label>
                <select
                  name="license_tier"
                  defaultValue={tenant.license_tier}
                  className="min-h-9 rounded border border-outline-variant px-2 text-xs bg-surface-container-lowest focus:border-primary-container focus:outline-none"
                >
                  <option value="starter">Starter</option>
                  <option value="standard">Standard</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">
                  Max Licenses
                </label>
                <input
                  name="max_property_licenses"
                  type="number"
                  min={1}
                  max={500}
                  defaultValue={tenant.max_property_licenses}
                  required
                  className="min-h-9 rounded border border-outline-variant px-2.5 text-xs focus:border-primary-container focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">
                Status
              </label>
              <select
                name="status"
                defaultValue={tenant.status}
                className="min-h-9 rounded border border-outline-variant px-2 text-xs bg-surface-container-lowest focus:border-primary-container focus:outline-none"
              >
                <option value="active">Active</option>
                <option value="trial">Trial</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            {state?.error && (
              <p className="rounded bg-error-container p-2 text-xs text-on-error-container">
                {state.error}
              </p>
            )}

            <div className="mt-2 flex items-center justify-end gap-2 border-t border-outline-variant pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded border border-outline-variant px-3 py-1.5 text-xs font-semibold text-on-surface-variant hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1 rounded bg-primary-container px-3 py-1.5 text-xs font-semibold text-on-primary-container hover:brightness-95"
              >
                <Check size={14} /> Save
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 font-semibold text-on-surface-variant">
                  <KeyRound size={13} className="text-primary" /> Property Licenses
                </span>
                <span className="font-bold">
                  {tenant.propertyCount} / {tenant.max_property_licenses} used
                </span>
              </div>

              {/* Progress bar */}
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
                <div
                  className={`h-full transition-all duration-300 ${
                    isAtCapacity ? 'bg-error' : usagePct > 80 ? 'bg-primary' : 'bg-primary-container'
                  }`}
                  style={{ width: `${usagePct}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded bg-surface-container-low p-2.5 text-xs">
              <div>
                <p className="label-tracked text-on-surface-variant text-[10px]">Tier</p>
                <p className="font-semibold capitalize text-on-surface">{tenant.license_tier}</p>
              </div>
              <div>
                <p className="label-tracked text-on-surface-variant text-[10px]">In-House Staff</p>
                <p className="font-semibold text-on-surface">{tenant.staffCount} member{tenant.staffCount === 1 ? '' : 's'}</p>
              </div>
            </div>

            {isAtCapacity && (
              <p className="flex items-center gap-1 text-[11px] font-semibold text-error">
                <ShieldAlert size={13} /> All allocated licenses used
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 border-t border-outline-variant pt-2 text-[10px] text-on-surface-variant flex justify-between">
        <span>ID: {tenant.id.slice(0, 8)}...</span>
        <span>Registered {new Date(tenant.created_at).toLocaleDateString()}</span>
      </div>
    </Card>
  )
}
