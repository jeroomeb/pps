'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { AlertTriangle, CalendarClock, CircleDot, Circle, CalendarDays, X, Undo2 } from 'lucide-react'
import { dismissOccurrence, restoreOccurrence } from '@/lib/actions/schedule'
import { useToast } from '@/components/ui/Toast'
import { EmptyState } from '@/components/ui/EmptyState'
import type { DueTone } from '@/lib/schedule'

// Plain serializable row — Date objects and lucide icons stay out of the
// server → client payload (see CLAUDE.md).
export type ScheduleRow = {
  propertyId: string
  propertyName: string
  dateKey: string
  dateLabel: string
  label: string
  tone: DueTone
  dueText: string
}

export type DismissedRow = {
  propertyId: string
  propertyName: string
  dateKey: string
  dateLabel: string
}

const GROUPS: { tone: DueTone; title: string; icon: typeof AlertTriangle; accent: string }[] = [
  { tone: 'overdue', title: 'Overdue', icon: AlertTriangle, accent: 'text-error' },
  { tone: 'today', title: 'Due Today', icon: CircleDot, accent: 'text-primary' },
  { tone: 'soon', title: 'Due Soon', icon: Circle, accent: 'text-on-surface-variant' },
]

const VISIBLE_LIMIT = 6

export function DashboardSchedulePanel({
  rows,
  dismissedRows,
}: {
  rows: ScheduleRow[]
  dismissedRows: DismissedRow[]
}) {
  const showToast = useToast()
  const [pending, startTransition] = useTransition()
  // Optimistically hidden rows, so a dismissal feels instant.
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const [restored, setRestored] = useState<Set<string>>(new Set())
  const [showAll, setShowAll] = useState(false)
  const [showUpcoming, setShowUpcoming] = useState(false)
  const [showDismissed, setShowDismissed] = useState(false)

  const key = (r: { propertyId: string; dateKey: string }) => `${r.propertyId}|${r.dateKey}`
  const active = rows.filter((r) => !hidden.has(key(r)))
  const actionable = active.filter((r) => r.tone !== 'future')
  const upcoming = active.filter((r) => r.tone === 'future')
  const shown = showAll ? actionable : actionable.slice(0, VISIBLE_LIMIT)
  const shownKeys = new Set(shown.map(key))
  const visibleDismissed = dismissedRows.filter((r) => !restored.has(key(r)))

  function handleDismiss(row: ScheduleRow) {
    const k = key(row)
    setHidden((prev) => new Set(prev).add(k))
    startTransition(async () => {
      const result = await dismissOccurrence(row.propertyId, row.dateKey)
      if (result?.error) {
        // Put it back — the dismissal didn't persist.
        setHidden((prev) => {
          const next = new Set(prev)
          next.delete(k)
          return next
        })
        showToast('error', result.error)
      } else {
        showToast('success', `Dismissed ${row.propertyName} — ${row.dateLabel}.`)
      }
    })
  }

  function handleRestore(row: DismissedRow) {
    const k = key(row)
    setRestored((prev) => new Set(prev).add(k))
    startTransition(async () => {
      const result = await restoreOccurrence(row.propertyId, row.dateKey)
      if (result?.error) {
        setRestored((prev) => {
          const next = new Set(prev)
          next.delete(k)
          return next
        })
        showToast('error', result.error)
      } else {
        showToast('success', `Restored ${row.propertyName} — ${row.dateLabel}.`)
      }
    })
  }

  if (!actionable.length && !upcoming.length && !visibleDismissed.length) {
    return (
      <EmptyState
        icon={CalendarClock}
        title="Nothing needs scheduling"
        description="Every required inspection day is covered."
      />
    )
  }

  return (
    <div className="flex flex-col">
      {!actionable.length && (
        <div className="px-4 py-6">
          <EmptyState
            icon={CalendarClock}
            title="Nothing needs scheduling"
            description="Every required inspection day is covered."
          />
        </div>
      )}

      {GROUPS.map((group) => {
        const groupTotal = actionable.filter((r) => r.tone === group.tone).length
        const groupRows = shown.filter((r) => r.tone === group.tone)
        if (!groupTotal) return null
        const Icon = group.icon
        return (
          <div key={group.tone}>
            <p
              className={`flex items-center gap-1.5 border-b border-outline-variant bg-surface-container-low px-4 py-2 label-tracked ${group.accent}`}
            >
              <Icon size={13} />
              {group.title} ({groupTotal})
            </p>
            {/* If the global cap hid every row of this tone (e.g. overdue
                overflow burying "Due Today"), say so instead of silently
                showing nothing under the header. */}
            {!groupRows.length && (
              <p className="px-4 py-2 text-xs text-on-surface-variant">
                Hidden by the limit above —{' '}
                <button
                  type="button"
                  onClick={() => setShowAll(true)}
                  className="font-semibold text-primary hover:underline"
                >
                  show all
                </button>
                .
              </p>
            )}
            <div className="flex flex-col divide-y divide-outline-variant">
              {groupRows.map((row) => (
                <div
                  key={key(row)}
                  className="flex items-center gap-2 px-4 py-3 transition hover:bg-surface-container-low"
                >
                  <Link
                    href={`/admin/inspections/new?property=${row.propertyId}&date=${row.dateKey}`}
                    className="min-w-0 flex-1"
                  >
                    <p className="truncate font-semibold">{row.propertyName}</p>
                    <p className="truncate text-xs text-on-surface-variant">
                      {row.label} · {row.dateLabel}
                    </p>
                    <p
                      className={`text-xs font-semibold ${
                        row.tone === 'overdue'
                          ? 'text-error'
                          : row.tone === 'today'
                            ? 'text-primary'
                            : 'text-on-surface-variant'
                      }`}
                    >
                      {row.dueText}
                    </p>
                  </Link>
                  <Link
                    href={`/admin/inspections/new?property=${row.propertyId}&date=${row.dateKey}`}
                    className="shrink-0 rounded-full bg-primary-container px-3 py-1 text-xs font-semibold text-on-primary-container hover:brightness-95"
                  >
                    Schedule
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDismiss(row)}
                    disabled={pending}
                    aria-label={`Dismiss ${row.propertyName} ${row.dateLabel}`}
                    title="Dismiss this reminder"
                    className="shrink-0 rounded-full p-2 text-on-surface-variant hover:bg-surface-container hover:text-on-surface disabled:opacity-50"
                  >
                    <X size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {actionable.length > shownKeys.size && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="border-t border-outline-variant px-4 py-3 text-xs font-semibold uppercase tracking-wide text-primary hover:bg-surface-container-low"
        >
          {showAll ? 'Show less' : `View all ${actionable.length}`}
        </button>
      )}

      {upcoming.length > 0 && (
        <div className="border-t border-outline-variant">
          <button
            type="button"
            onClick={() => setShowUpcoming((v) => !v)}
            className="flex w-full items-center gap-1.5 px-4 py-2 label-tracked text-on-surface-variant hover:bg-surface-container-low"
          >
            <CalendarDays size={13} />
            Upcoming ({upcoming.length}) — {showUpcoming ? 'hide' : 'show'}
          </button>
          {showUpcoming && (
            <div className="flex flex-col divide-y divide-outline-variant">
              {upcoming.map((row) => (
                <Link
                  key={key(row)}
                  href={`/admin/inspections/new?property=${row.propertyId}&date=${row.dateKey}`}
                  className="flex items-center justify-between gap-2 px-4 py-3 transition hover:bg-surface-container-low"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{row.propertyName}</p>
                    <p className="truncate text-xs text-on-surface-variant">
                      {row.label} · {row.dateLabel}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-on-surface-variant">{row.dueText}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {visibleDismissed.length > 0 && (
        <div className="border-t border-outline-variant">
          <button
            type="button"
            onClick={() => setShowDismissed((v) => !v)}
            className="flex w-full items-center gap-1.5 px-4 py-2 label-tracked text-on-surface-variant hover:bg-surface-container-low"
          >
            <Undo2 size={13} />
            Dismissed ({visibleDismissed.length}) — {showDismissed ? 'hide' : 'show'}
          </button>
          {showDismissed && (
            <div className="flex flex-col divide-y divide-outline-variant">
              {visibleDismissed.map((row) => (
                <div
                  key={key(row)}
                  className="flex items-center justify-between gap-2 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{row.propertyName}</p>
                    <p className="truncate text-xs text-on-surface-variant">{row.dateLabel}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRestore(row)}
                    disabled={pending}
                    className="shrink-0 flex items-center gap-1.5 rounded-full border border-outline-variant px-3 py-1.5 text-xs font-semibold hover:bg-surface-container"
                  >
                    <Undo2 size={13} />
                    Restore
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
