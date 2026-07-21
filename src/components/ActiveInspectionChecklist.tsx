'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChecklistItemCard, type ChecklistItemData } from '@/components/ChecklistItemCard'
import { Card } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'

export function ActiveInspectionChecklist({
  inspectionId,
  propertyName,
  checklistName,
  inspectorName,
  startedAt,
  initialItems,
}: {
  inspectionId: string
  propertyName: string
  checklistName: string
  inspectorName: string
  startedAt: string
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
  const canSubmit = useMemo(
    () =>
      items.every((item) => item.status && (item.status !== 'fail' || item.photo_path)),
    [items]
  )

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
            <p className="label-tracked text-on-surface-variant">Inspector</p>
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

      <div className="fixed inset-x-0 bottom-16 z-10 border-t border-outline-variant bg-surface-container-lowest p-4 lg:sticky lg:bottom-0 lg:mt-6 lg:rounded-lg lg:border">
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
              Every item needs a status, and Fail items need a photo, before you can submit.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
