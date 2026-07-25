'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, AlertTriangle, MapPin, Phone, Clock } from 'lucide-react'
import { ChecklistItemCard, type ChecklistItemData } from '@/components/ChecklistItemCard'
import { Card } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { validateInspectionItems } from '@/lib/inspection-validation'

export function ActiveInspectionChecklist({
  inspectionId,
  propertyName,
  propertyAddress,
  propertyPhone,
  checklistName,
  inspectorName,
  startedAt,
  scheduledFor,
  initialItems,
}: {
  inspectionId: string
  propertyName: string
  propertyAddress?: string | null
  propertyPhone?: string | null
  checklistName: string
  inspectorName: string
  startedAt: string
  scheduledFor?: string | null
  initialItems: (ChecklistItemData & { service_category: string })[]
}) {
  const router = useRouter()
  const showToast = useToast()
  const [items, setItems] = useState(initialItems)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleSaved(itemId: string, patch: Partial<ChecklistItemData>) {
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, ...patch } : item))
    )
  }

  const completedCount = items.filter((item) => item.status).length
  const issues = useMemo(() => validateInspectionItems(items), [items])
  const canSubmit = issues.length === 0

  const grouped = useMemo(() => {
    const map = new Map<string, typeof items>()
    for (const item of items) {
      if (!map.has(item.service_category)) map.set(item.service_category, [])
      map.get(item.service_category)!.push(item)
    }
    return map
  }, [items])

  async function handleComplete() {
    setSubmitting(true)
    setError(null)

    let res: Response
    let data: { error?: string; warning?: string } | null = null
    try {
      res = await fetch(`/api/inspections/${inspectionId}/complete`, {
        method: 'POST',
      })
      if ((res.headers.get('content-type') ?? '').includes('application/json')) {
        data = await res.json()
      }
    } catch {
      setError('Network error — your answers are saved. Check your connection and try again.')
      setSubmitting(false)
      return
    }

    if (!res.ok || !data) {
      setError(
        data?.error ??
          'Something went wrong — your answers are saved. Please sign in again if needed and retry.'
      )
      setSubmitting(false)
      return
    }

    if (data.warning) {
      showToast('error', data.warning)
    } else {
      showToast('success', 'Inspection submitted and report generated.')
    }

    router.push('/inspector')
    router.refresh()
  }

  let runningIndex = 0
  const progressPct = items.length ? (completedCount / items.length) * 100 : 0

  return (
    <div className="max-w-3xl pb-28 lg:pb-8">
      <Link
        href="/inspector"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-on-surface-variant hover:text-on-surface"
      >
        <ArrowLeft size={16} />
        Back to My Inspections
      </Link>
      <Card className="mb-6">
        <div className="mb-3 flex items-baseline justify-between">
          <div>
            <p className="label-tracked text-on-surface-variant">{propertyName}</p>
            <h1 className="font-headline text-xl font-bold lg:text-2xl">{checklistName}</h1>
          </div>
          <span className="font-headline text-sm font-semibold text-primary">
            {completedCount}/{items.length} Completed
          </span>
        </div>

        {(propertyAddress || propertyPhone || scheduledFor) && (
          <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-outline-variant pt-3 text-sm text-on-surface-variant">
            {propertyAddress && (
              <span className="flex items-center gap-1.5">
                <MapPin size={14} className="shrink-0 text-primary" />
                {propertyAddress}
              </span>
            )}
            {propertyPhone && (
              <a
                href={`tel:${propertyPhone}`}
                className="flex items-center gap-1.5 font-semibold text-on-surface hover:underline"
              >
                <Phone size={14} className="shrink-0 text-primary" />
                {propertyPhone}
              </a>
            )}
            {scheduledFor && (
              <span className="flex items-center gap-1.5">
                <Clock size={14} className="shrink-0 text-primary" />
                Scheduled{' '}
                {new Date(scheduledFor).toLocaleString('en-US', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
            )}
          </div>
        )}

        <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
          <div
            className="h-full bg-primary-container transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-outline-variant pt-3 sm:grid-cols-3">
          <div>
            <p className="label-tracked text-on-surface-variant">Inspection ID</p>
            <p className="text-sm font-semibold">#{inspectionId.slice(0, 8).toUpperCase()}</p>
          </div>
          <div>
            <p className="label-tracked text-on-surface-variant">Specialist</p>
            <p className="text-sm font-semibold">{inspectorName}</p>
          </div>
          <div>
            <p className="label-tracked text-on-surface-variant">Started</p>
            <p className="text-sm font-semibold">
              {new Date(startedAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}
            </p>
          </div>
        </div>
      </Card>

      <div className="flex flex-col gap-6">
        {[...grouped.entries()].map(([category, categoryItems]) => (
          <section key={category}>
            <h2 className="label-tracked mb-2 text-on-surface-variant">{category}</h2>
            <div className="flex flex-col gap-3">
              {categoryItems.map((item) => {
                runningIndex += 1
                return (
                  <ChecklistItemCard
                    key={item.id}
                    item={item}
                    index={runningIndex}
                    inspectionId={inspectionId}
                    onSaved={handleSaved}
                  />
                )
              })}
            </div>
          </section>
        ))}
      </div>

      {error && (
        <p className="mt-4 rounded bg-error-container px-3 py-2 text-sm text-on-error-container">
          {error}
        </p>
      )}

      {issues.length > 0 && (
        <Card className="mt-4 border-error/40 bg-error-container/20">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-on-error-container">
            <AlertTriangle size={15} />
            {issues.length} item{issues.length === 1 ? '' : 's'} need attention before you can
            submit
          </p>
          <ul className="flex flex-col gap-1">
            {issues.map((issue) => (
              <li key={`${issue.itemId}-${issue.reason}`}>
                <a
                  href={`#checklist-item-${issue.itemId}`}
                  className="text-sm text-on-error-container underline underline-offset-2 hover:no-underline"
                >
                  {issue.itemName}
                </a>
                <span className="text-sm text-on-error-container"> — {issue.reason}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Bottom nav is ~56px tall on mobile; keep the submit bar clear of it,
          and clear of the toast stack too (Toast.tsx anchors at bottom-20). */}
      <div className="fixed inset-x-0 bottom-14 z-20 border-t border-outline-variant bg-surface-container-lowest p-4 lg:sticky lg:bottom-0 lg:mt-6 lg:rounded-lg lg:border">
        <div className="max-w-3xl">
          <button
            type="button"
            onClick={handleComplete}
            disabled={!canSubmit || submitting}
            className="min-h-12 w-full rounded-lg bg-primary-container font-headline text-sm font-semibold uppercase tracking-wide text-on-primary-container shadow-lg transition hover:brightness-95 disabled:opacity-50 disabled:shadow-none"
          >
            {submitting ? 'Submitting…' : 'Submit Inspection'}
          </button>
          {!canSubmit && (
            <p className="mt-2 text-center text-xs text-on-surface-variant">
              {issues.length} item{issues.length === 1 ? '' : 's'} above need a status, photo, or
              comment before you can submit.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
