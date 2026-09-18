'use client'

import { useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { UserX, UserCheck, AlertTriangle, X, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import {
  deactivateTeamMember,
  reactivateTeamMember,
  deleteTeamMember,
} from '@/lib/actions/team'

export type EligibleInspector = {
  id: string
  full_name: string
  human_id?: string | null
}

export function DeactivateMemberModal({
  memberId,
  memberName,
  memberStatus,
  openInspectionsCount,
  availableInspectors,
}: {
  memberId: string
  memberName: string
  memberStatus: string
  openInspectionsCount: number
  availableInspectors: EligibleInspector[]
}) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'deactivate' | 'delete'>('deactivate')
  const [selectedInspectorId, setSelectedInspectorId] = useState<string>('')
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const showToast = useToast()

  const isInactive = memberStatus === 'inactive'

  function handleReactivate() {
    startTransition(async () => {
      const res = await reactivateTeamMember(memberId)
      if (res?.error) {
        showToast('error', res.error)
      } else {
        showToast('success', `${memberName} has been reactivated.`)
        router.refresh()
      }
    })
  }

  function handleConfirmAction() {
    if (openInspectionsCount > 0 && !selectedInspectorId) {
      showToast('error', 'Please select a replacement specialist to reassign the open inspections.')
      return
    }

    startTransition(async () => {
      if (mode === 'deactivate') {
        const res = await deactivateTeamMember(memberId, selectedInspectorId || null)
        if (res?.error) {
          showToast('error', res.error)
          return
        }
        showToast(
          'success',
          openInspectionsCount > 0
            ? `${memberName} deactivated and ${openInspectionsCount} open inspection(s) reassigned.`
            : `${memberName} has been deactivated.`
        )
      } else {
        const res = await deleteTeamMember(memberId, selectedInspectorId || null)
        if (res?.error) {
          showToast('error', res.error)
          return
        }
        if (res?.deactivatedInstead) {
          showToast('info', res.notice || 'Account deactivated to preserve audit history.')
        } else {
          showToast('success', `${memberName} was deleted.`)
        }
      }

      setOpen(false)
      router.refresh()
    })
  }

  return (
    <>
      <div className="flex items-center gap-1.5">
        {isInactive ? (
          <button
            type="button"
            onClick={handleReactivate}
            disabled={pending}
            title="Reactivate specialist"
            className="flex min-h-9 items-center gap-1 rounded-lg border border-success/40 bg-success-container/30 px-2.5 text-xs font-semibold text-on-success-container hover:bg-success-container/60 transition disabled:opacity-50"
          >
            <UserCheck size={14} />
            Reactivate
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setMode('deactivate')
              setOpen(true)
            }}
            disabled={pending}
            title="Deactivate specialist"
            className="flex min-h-9 items-center gap-1 rounded-lg border border-outline-variant px-2.5 text-xs font-semibold text-on-surface-variant hover:bg-surface-container hover:text-error transition disabled:opacity-50"
          >
            <UserX size={14} />
            Deactivate
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            setMode('delete')
            setOpen(true)
          }}
          disabled={pending}
          title="Delete specialist"
          aria-label="Delete specialist"
          className="flex min-h-9 w-9 items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant hover:border-error hover:bg-error-container/40 hover:text-error transition disabled:opacity-50"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {open &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            onClick={() => !pending && setOpen(false)}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-t-2xl bg-surface-container-lowest p-6 shadow-2xl sm:rounded-2xl"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-error-container p-2 text-on-error-container">
                    <AlertTriangle size={18} />
                  </div>
                  <div>
                    <h2 className="font-headline text-lg font-bold">
                      {mode === 'deactivate' ? 'Deactivate Specialist' : 'Delete Specialist'}
                    </h2>
                    <p className="text-xs text-on-surface-variant">{memberName}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={pending}
                  className="rounded p-1 text-on-surface-variant hover:bg-surface-container"
                >
                  <X size={18} />
                </button>
              </div>

              {openInspectionsCount > 0 ? (
                <div className="mt-4 flex flex-col gap-3">
                  <div className="rounded-lg border border-error/30 bg-error-container/20 p-3 text-xs text-on-error-container">
                    <p className="font-bold">Pending Inspections Notice</p>
                    <p className="mt-1">
                      <strong>{memberName}</strong> is currently assigned to{' '}
                      <strong>{openInspectionsCount}</strong> open (pending/in-progress) inspection
                      {openInspectionsCount === 1 ? '' : 's'}.
                    </p>
                    <p className="mt-1 text-[11px]">
                      Please choose another specialist to reassign these open inspections to so work is not disrupted.
                    </p>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="reassign-select"
                      className="text-xs font-semibold uppercase tracking-wide text-on-surface"
                    >
                      Reassign open inspections to:
                    </label>
                    <select
                      id="reassign-select"
                      value={selectedInspectorId}
                      onChange={(e) => setSelectedInspectorId(e.target.value)}
                      required
                      className="min-h-11 rounded border border-outline-variant bg-surface-container-lowest px-3 text-sm focus:border-primary-container focus:outline-none"
                    >
                      <option value="">Select a replacement specialist…</option>
                      {availableInspectors.map((ins) => (
                        <option key={ins.id} value={ins.id}>
                          {ins.full_name} {ins.human_id ? `(${ins.human_id})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm text-on-surface-variant">
                  {mode === 'deactivate'
                    ? `Are you sure you want to deactivate ${memberName}? They will be immediately blocked from signing in and excluded from new inspection assignments.`
                    : `Are you sure you want to delete ${memberName}? If they have completed historical audits, their account will be deactivated instead to preserve historical records.`}
                </p>
              )}

              <div className="mt-6 flex items-center justify-end gap-3 border-t border-outline-variant pt-4">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={pending}
                  className="rounded-lg border border-outline-variant px-4 py-2 text-xs font-semibold uppercase tracking-wide text-on-surface-variant hover:bg-surface-container disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAction}
                  disabled={pending || (openInspectionsCount > 0 && !selectedInspectorId)}
                  className="flex items-center gap-1.5 rounded-lg bg-error px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:brightness-95 disabled:opacity-50"
                >
                  {pending
                    ? 'Processing…'
                    : openInspectionsCount > 0
                      ? 'Reassign & Confirm'
                      : mode === 'deactivate'
                        ? 'Deactivate'
                        : 'Confirm Delete'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
