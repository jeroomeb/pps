'use client'

import { useState, useTransition, useActionState } from 'react'
import { Users, UserPlus, Trash2, Shield, UserCheck, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import {
  assignSpecialistToProperty,
  removeSpecialistFromProperty,
  updateSpecialistRosterRole,
  togglePropertyIdRequirement,
  type AssignmentFormState,
} from '@/lib/actions/property-assignments'
import type { SpecialistAssignmentRole } from '@/lib/database.types'

export type AssignedSpecialist = {
  id: string
  specialistId: string
  fullName: string
  email: string | null
  phone: string | null
  humanId: string | null
  role: SpecialistAssignmentRole
  isContractor: boolean
  assignedAt: string
}

export type CandidateSpecialist = {
  id: string
  fullName: string
  humanId: string | null
  role: 'admin' | 'inspector'
  isContractor: boolean
}

export function PropertyRosterManager({
  propertyId,
  assignedSpecialists,
  availableCandidates,
  requireIdPhotoInitial = true,
}: {
  propertyId: string
  assignedSpecialists: AssignedSpecialist[]
  availableCandidates: CandidateSpecialist[]
  requireIdPhotoInitial?: boolean
}) {
  const showToast = useToast()
  const [pending, startTransition] = useTransition()
  const [isAdding, setIsAdding] = useState(false)
  const [requireIdPhoto, setRequireIdPhoto] = useState(requireIdPhotoInitial)

  const [state, formAction] = useActionState<AssignmentFormState, FormData>(
    async (prevState, formData) => {
      const res = await assignSpecialistToProperty(prevState, formData)
      if (res?.success) {
        setIsAdding(false)
        showToast('success', 'Specialist added to property roster.')
      } else if (res?.error) {
        showToast('error', res.error)
      }
      return res
    },
    undefined
  )

  function handleRemove(specialistId: string, name: string) {
    if (!confirm(`Remove ${name} from this property's assigned roster?`)) return

    startTransition(async () => {
      const res = await removeSpecialistFromProperty(propertyId, specialistId)
      if (res?.error) {
        showToast('error', res.error)
      } else {
        showToast('success', `${name} removed from roster.`)
      }
    })
  }

  function handleRoleChange(specialistId: string, newRole: SpecialistAssignmentRole) {
    startTransition(async () => {
      const res = await updateSpecialistRosterRole(propertyId, specialistId, newRole)
      if (res?.error) {
        showToast('error', res.error)
      } else {
        showToast('success', 'Roster role updated.')
      }
    })
  }

  function handleToggleIdRequirement(e: React.ChangeEvent<HTMLInputElement>) {
    const nextVal = e.target.checked
    setRequireIdPhoto(nextVal)
    startTransition(async () => {
      const res = await togglePropertyIdRequirement(propertyId, nextVal)
      if (res?.error) {
        setRequireIdPhoto(!nextVal)
        showToast('error', res.error)
      } else {
        showToast('success', `Driver's License requirement ${nextVal ? 'enabled' : 'disabled'}.`)
      }
    })
  }

  // Filter candidates who aren't already on the roster
  const assignedIds = new Set(assignedSpecialists.map((a) => a.specialistId))
  const unassignedCandidates = availableCandidates.filter((c) => !assignedIds.has(c.id))

  return (
    <Card className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Users size={18} className="text-primary" />
            <h2 className="font-headline text-lg font-bold">Property Staff Roster</h2>
          </div>
          <p className="text-xs text-on-surface-variant">
            Assign primary, backup, or in-house specialists to this property. Open audits route directly to this team.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAdding(!isAdding)}
          disabled={pending || unassignedCandidates.length === 0}
          className="flex min-h-10 items-center gap-1.5 rounded-lg bg-primary-container px-3 text-xs font-semibold uppercase tracking-wide text-on-primary-container hover:brightness-95 disabled:opacity-50"
        >
          <UserPlus size={15} />
          {isAdding ? 'Close' : 'Add to Roster'}
        </button>
      </div>

      {/* ID Verification Toggle */}
      <div className="flex items-center justify-between rounded-lg border border-outline-variant bg-surface-container-low p-3">
        <div className="flex items-start gap-2.5">
          <Shield size={16} className="mt-0.5 text-primary shrink-0" />
          <div>
            <p className="text-xs font-semibold text-on-surface">Require Photo ID Document Verification</p>
            <p className="text-[11px] text-on-surface-variant">
              Turn ON for 1099 contractors; turn OFF if property is staffed by vetted W-2 maintenance employees.
            </p>
          </div>
        </div>
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            checked={requireIdPhoto}
            onChange={handleToggleIdRequirement}
            disabled={pending}
            className="sr-only peer"
          />
          <div className="peer h-6 w-11 rounded-full bg-surface-container-highest after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-focus:outline-none" />
        </label>
      </div>

      {/* Add Specialist Form */}
      {isAdding && (
        <form action={formAction} className="flex flex-col gap-3 rounded-lg border border-primary/40 bg-surface-container-low p-4">
          <input type="hidden" name="property_id" value={propertyId} />
          <p className="text-xs font-bold uppercase tracking-wider text-primary">Assign Specialist to Property</p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1.5fr_1fr]">
            <div className="flex flex-col gap-1">
              <label htmlFor="specialist_id" className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">
                Select Specialist
              </label>
              <select
                id="specialist_id"
                name="specialist_id"
                required
                className="min-h-10 rounded border border-outline-variant bg-surface-container-lowest px-2.5 text-xs focus:border-primary-container focus:outline-none"
              >
                <option value="">Select a specialist…</option>
                {unassignedCandidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} {c.humanId ? `(${c.humanId})` : ''} {c.isContractor ? '— [Contractor]' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="role" className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">
                Roster Role
              </label>
              <select
                id="role"
                name="role"
                defaultValue="primary"
                className="min-h-10 rounded border border-outline-variant bg-surface-container-lowest px-2.5 text-xs focus:border-primary-container focus:outline-none"
              >
                <option value="primary">Primary Specialist</option>
                <option value="backup">Backup Specialist</option>
                <option value="staff">On-Site Staff</option>
              </select>
            </div>
          </div>

          {state?.error && (
            <p className="rounded bg-error-container p-2 text-xs text-on-error-container">{state.error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="rounded border border-outline-variant px-3 py-1.5 text-xs font-semibold text-on-surface-variant hover:bg-surface-container"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded bg-primary-container px-3.5 py-1.5 text-xs font-semibold text-on-primary-container hover:brightness-95 disabled:opacity-50"
            >
              Assign to Property
            </button>
          </div>
        </form>
      )}

      {/* Roster List */}
      <div className="flex flex-col divide-y divide-outline-variant">
        {assignedSpecialists.length > 0 ? (
          assignedSpecialists.map((spec) => (
            <div key={spec.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm truncate">{spec.fullName}</p>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      spec.role === 'primary'
                        ? 'bg-primary-container text-on-primary-container'
                        : spec.role === 'backup'
                          ? 'bg-secondary-container text-on-secondary-container'
                          : 'bg-surface-container text-on-surface-variant'
                    }`}
                  >
                    {spec.role}
                  </span>
                  {spec.isContractor && (
                    <span className="rounded bg-amber-500/10 text-amber-700 px-1.5 py-0.5 text-[9px] font-bold uppercase">
                      Contractor Pool
                    </span>
                  )}
                </div>
                <p className="text-xs text-on-surface-variant truncate">
                  {[spec.humanId, spec.email, spec.phone].filter(Boolean).join(' · ')}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={spec.role}
                  onChange={(e) => handleRoleChange(spec.specialistId, e.target.value as SpecialistAssignmentRole)}
                  disabled={pending}
                  aria-label={`Change roster role for ${spec.fullName}`}
                  className="min-h-8 rounded border border-outline-variant bg-surface-container-lowest px-2 text-[11px] font-medium text-on-surface-variant focus:border-primary-container focus:outline-none"
                >
                  <option value="primary">Primary</option>
                  <option value="backup">Backup</option>
                  <option value="staff">Staff</option>
                </select>

                <button
                  type="button"
                  onClick={() => handleRemove(spec.specialistId, spec.fullName)}
                  disabled={pending}
                  title="Remove from roster"
                  aria-label={`Remove ${spec.fullName} from roster`}
                  className="flex min-h-8 w-8 items-center justify-center rounded border border-outline-variant text-on-surface-variant hover:border-error hover:bg-error-container/40 hover:text-error transition disabled:opacity-50"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center text-on-surface-variant">
            <AlertCircle size={24} className="mb-1 text-on-surface-variant/70" />
            <p className="text-xs font-semibold">No specialists assigned to this property yet.</p>
            <p className="text-[11px] text-on-surface-variant">
              Click &quot;Add to Roster&quot; above to assign primary and backup specialists to this property.
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}
