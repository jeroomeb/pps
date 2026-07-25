'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { AlertTriangle, CalendarClock, CircleDot, Circle, X } from 'lucide-react'
import { dismissOccurrence } from '@/lib/actions/schedule'
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

const GROUPS: { tone: DueTone; title: string; icon: typeof AlertTriangle; accent: string }[] = [
  { tone: 'overdue', title: 'Overdue', icon: AlertTriangle, accent: 'text-error' },
  { tone: 'today', title: 'Due Today', icon: CircleDot, accent: 'text-primary' },
  { tone: 'soon', title: 'Due Soon', icon: Circle, accent: 'text-on-surface-variant' },
]

const VISIBLE_LIMIT = 6

export function DashboardSchedulePanel({ rows }: { rows: ScheduleRow[] }) {
  const showToast = useToast()
  const [pending, startTransition] = useTransition()
  // Optimistically hidden rows, so a dismissal feels instant.
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const [showAll, setShowAll] = useState(false)

  const key = (r: ScheduleRow) => `${r.propertyId}|${r.dateKey}`
  // "Due Soon" is the next 7 days; anything further out isn't actionable yet.
  const visible = rows.filter((r) => !hidden.has(key(r)) && r.tone !== 'future')
  const shown = showAll ? visible : visible.slice(0, VISIBLE_LIMIT)

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

  if (!visible.length) {
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
      {GROUPS.map((group) => {
        const groupRows = shown.filter((r) => r.tone === group.tone)
        if (!groupRows.length) return null
        const Icon = group.icon
        return (
          <div key={group.tone}>
            <p
              className={`flex items-center gap-1.5 border-b border-outline-variant bg-surface-container-low px-4 py-2 label-tracked ${group.accent}`}
            >
              <Icon size={13} />
              {group.title} ({visible.filter((r) => r.tone === group.tone).length})
            </p>
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
                    className="shrink-0 rounded-full p-1.5 text-on-surface-variant hover:bg-surface-container hover:text-on-surface disabled:opacity-50"
                  >
                    <X size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {visible.length > VISIBLE_LIMIT && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="border-t border-outline-variant px-4 py-3 text-xs font-semibold uppercase tracking-wide text-primary hover:bg-surface-container-low"
        >
          {showAll ? 'Show less' : `View all ${visible.length}`}
        </button>
      )}
    </div>
  )
}
