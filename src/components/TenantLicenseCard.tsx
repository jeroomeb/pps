'use client'

import { useActionState, useState, useTransition } from 'react'
import {
  Building,
  KeyRound,
  Pencil,
  Check,
  X,
  ShieldAlert,
  Trash2,
  Users,
  UserCheck,
  GitFork,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { updateTenantLicense, deleteTenant, type TenantFormState } from '@/lib/actions/tenants'
import type { LicenseTier, TenantStatus } from '@/lib/database.types'
import { formatDate } from '@/lib/timezone'
import type { VerifiedSpecialistOption } from '@/components/CreateTenantForm'

export type TenantItem = {
  id: string
  name: string
  slug: string | null
  license_tier: LicenseTier
  max_property_licenses: number
  status: TenantStatus
  parent_organization_id?: string | null
  created_at: string
  propertyCount: number
  staffCount: number
  assignedStaffNames?: string[]
}

export function TenantLicenseCard({
  tenant,
  parentTenants = [],
  specialists = [],
}: {
  tenant: TenantItem
  parentTenants?: { id: string; name: string }[]
  specialists?: VerifiedSpecialistOption[]
}) {
  const showToast = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Track selected specialists in editing mode
  const initialAssignedIds = specialists
    .filter((s) => s.currentTenantId === tenant.id)
    .map((s) => s.id)

  const [selectedSpecialistIds, setSelectedSpecialistIds] = useState<string[]>(initialAssignedIds)

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

  const handleDeleteTenant = () => {
    if (!isDeleting) {
      setIsDeleting(true)
      setTimeout(() => setIsDeleting(false), 5000)
      return
    }

    startTransition(async () => {
      const res = await deleteTenant(tenant.id)
      if (res?.success) {
        showToast('success', `Tenant "${tenant.name}" deleted successfully.`)
      } else {
        showToast('error', res?.error || 'Failed to delete tenant.')
      }
    })
  }

  const toggleSpecialist = (id: string) => {
    setSelectedSpecialistIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const usagePct =
    tenant.max_property_licenses > 0
      ? Math.min(100, Math.round((tenant.propertyCount / tenant.max_property_licenses) * 100))
      : 0

  const isAtCapacity = tenant.propertyCount >= tenant.max_property_licenses

  const parentOrgName =
    parentTenants.find((pt) => pt.id === tenant.parent_organization_id)?.name ?? null

  const eligibleParents = parentTenants.filter((pt) => pt.id !== tenant.id)

  return (
    <Card className="flex flex-col justify-between transition-shadow hover:shadow-sm">
      <div>
        <div className="flex items-start justify-between gap-3 border-b border-outline-variant pb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Building size={16} className="text-primary shrink-0" />
              <h3 className="truncate font-headline font-bold text-base text-on-surface">
                {tenant.name}
              </h3>
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-on-surface-variant font-mono">
              <span>slug: {tenant.slug ?? tenant.id.slice(0, 8)}</span>
              {parentOrgName && (
                <span className="inline-flex items-center gap-1 rounded bg-secondary-container/60 px-1.5 py-0.2 text-[10px] font-sans font-medium text-on-surface-variant">
                  <GitFork size={10} /> {parentOrgName}
                </span>
              )}
            </div>
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
              onClick={() => {
                setIsEditing(!isEditing)
                setIsDeleting(false)
                setSelectedSpecialistIds(
                  specialists.filter((s) => s.currentTenantId === tenant.id).map((s) => s.id)
                )
              }}
              className="rounded p-1 text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              title="Edit Tenant"
            >
              {isEditing ? <X size={15} /> : <Pencil size={15} />}
            </button>
          </div>
        </div>

        {isEditing ? (
          <form action={formAction} className="mt-4 flex flex-col gap-3">
            <input type="hidden" name="tenant_id" value={tenant.id} />

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">
                  Account Slug
                </label>
                <input
                  name="slug"
                  defaultValue={tenant.slug ?? ''}
                  placeholder="e.g. company-slug"
                  className="min-h-9 rounded border border-outline-variant px-2.5 text-xs font-mono focus:border-primary-container focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
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
            </div>

            {/* Parent Organization Assignment */}
            {eligibleParents.length > 0 && (
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">
                  Parent Corporate HQ (Optional Hierarchy)
                </label>
                <select
                  name="parent_organization_id"
                  defaultValue={tenant.parent_organization_id ?? ''}
                  className="min-h-9 rounded border border-outline-variant px-2 text-xs bg-surface-container-lowest focus:border-primary-container focus:outline-none"
                >
                  <option value="">None (Top-Level Independent Organization)</option>
                  {eligibleParents.map((pt) => (
                    <option key={pt.id} value={pt.id}>
                      {pt.name} (Parent HQ)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Specialist & Staff Assignment Section */}
            <div className="rounded-lg border border-outline-variant bg-surface-container-low/60 p-2.5">
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-on-surface">
                  <UserCheck size={14} className="text-primary" /> Assign Specialists & Staff
                </span>
                <span className="text-[10px] text-on-surface-variant font-medium">
                  {selectedSpecialistIds.length} assigned
                </span>
              </div>

              {specialists.length > 0 ? (
                <div className="max-h-36 overflow-y-auto divide-y divide-outline-variant/40 rounded border border-outline-variant bg-surface">
                  {specialists.map((s) => {
                    const isChecked = selectedSpecialistIds.includes(s.id)
                    return (
                      <label
                        key={s.id}
                        className="flex items-center justify-between gap-2 p-2 text-xs hover:bg-surface-container-high cursor-pointer"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            name="specialist_ids"
                            value={s.id}
                            checked={isChecked}
                            onChange={() => toggleSpecialist(s.id)}
                            className="rounded border-outline-variant text-primary focus:ring-primary h-3.5 w-3.5"
                          />
                          <div className="truncate">
                            <span className="font-medium text-on-surface">
                              {s.isIdVerified ? '✓ ' : ''}{s.full_name}
                            </span>
                            {s.human_id && (
                              <span className="ml-1 text-[10px] text-on-surface-variant font-mono">
                                ({s.human_id})
                              </span>
                            )}
                          </div>
                        </div>

                        {s.currentTenantName && s.currentTenantId !== tenant.id && (
                          <span className="truncate text-[10px] text-on-surface-variant/80 shrink-0">
                            [{s.currentTenantName}]
                          </span>
                        )}
                      </label>
                    )
                  })}
                </div>
              ) : (
                <p className="text-[11px] text-on-surface-variant italic">No specialists available.</p>
              )}
            </div>

            {state?.error && (
              <p className="rounded bg-error-container p-2 text-xs text-on-error-container">
                {state.error}
              </p>
            )}

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant pt-2.5">
              {/* Destructive Delete Button */}
              <button
                type="button"
                onClick={handleDeleteTenant}
                disabled={isPending}
                className={`inline-flex items-center gap-1 rounded px-2.5 py-1.5 text-xs font-semibold transition ${
                  isDeleting
                    ? 'bg-error text-white animate-pulse'
                    : 'border border-error/40 text-error hover:bg-error/10'
                }`}
                title="Delete this corporate tenant"
              >
                <Trash2 size={13} />
                <span>{isDeleting ? 'Confirm Delete?' : 'Delete Tenant'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="rounded border border-outline-variant px-3 py-1.5 text-xs font-semibold text-on-surface-variant hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1 rounded bg-primary-container px-3.5 py-1.5 text-xs font-semibold text-on-primary-container hover:brightness-95"
                >
                  <Check size={14} /> Save Changes
                </button>
              </div>
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
                <p className="font-semibold text-on-surface">
                  {tenant.staffCount} member{tenant.staffCount === 1 ? '' : 's'}
                </p>
              </div>
            </div>

            {/* Assigned Staff Preview */}
            {tenant.assignedStaffNames && tenant.assignedStaffNames.length > 0 && (
              <div className="flex items-center gap-1.5 text-[11px] text-on-surface-variant truncate">
                <Users size={12} className="text-primary shrink-0" />
                <span className="truncate font-medium">
                  {tenant.assignedStaffNames.join(', ')}
                </span>
              </div>
            )}

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
        <span>Registered {formatDate(new Date(tenant.created_at))}</span>
      </div>
    </Card>
  )
}
