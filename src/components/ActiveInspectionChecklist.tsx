'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChecklistItemCard, type ChecklistItemData } from '@/components/ChecklistItemCard'

export function ActiveInspectionChecklist({
  inspectionId,
  propertyName,
  checklistName,
  initialItems,
}: {
  inspectionId: string
  propertyName: string
  checklistName: string
  initialItems: (ChecklistItemData & { service_category: string })[]
}) {
  const router = useRouter()
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

    const res = await fetch(`/api/inspections/${inspectionId}/complete`, {
      method: 'POST',
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong.')
      setSubmitting(false)
      return
    }

    if (data.warning) {
      alert(data.warning)
    }

    router.push('/inspector')
    router.refresh()
  }

  let runningIndex = 0

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
        {propertyName}
      </p>
      <div className="mb-1 flex items-baseline justify-between">
        <h1 className="font-headline text-2xl font-bold">{checklistName}</h1>
        <span className="font-headline text-sm font-semibold text-primary">
          {completedCount}/{items.length} Completed
        </span>
      </div>
      <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
        <div
          className="h-full bg-primary-container transition-all"
          style={{ width: `${items.length ? (completedCount / items.length) * 100 : 0}%` }}
        />
      </div>

      <div className="flex flex-col gap-6">
        {[...grouped.entries()].map(([category, categoryItems]) => (
          <section key={category}>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-on-surface-variant">
              {category}
            </h2>
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

      <button
        type="button"
        onClick={handleComplete}
        disabled={!canSubmit || submitting}
        className="mt-6 min-h-12 w-full rounded bg-primary-container font-headline text-sm font-semibold uppercase tracking-wide text-on-primary-container disabled:opacity-50"
      >
        {submitting ? 'Submitting…' : 'Complete Inspection'}
      </button>
      {!canSubmit && (
        <p className="mt-2 text-center text-xs text-on-surface-variant">
          Every item needs a status, and Fail items need a photo, before you can submit.
        </p>
      )}
    </div>
  )
}
