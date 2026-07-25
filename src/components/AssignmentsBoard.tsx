'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ClipboardCheck,
  ClipboardList,
  MapPin,
  Phone,
  Clock,
  Play,
  CheckCircle2,
  ChevronRight,
  Plus,
  UserCircle,
  CalendarOff,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import type { DueTone } from '@/lib/schedule'

// Plain, serializable shape passed from the server component — no lucide
// component references or Date objects cross the RSC boundary (see CLAUDE.md).
export type AssignmentRow = {
  id: string
  status: string
  created_at: string
  completed_at: string | null
  /** Preformatted on the server (app timezone) — formatting here would use the
   * browser's zone instead. Null when not completed. */
  completedLabel: string | null
  propertyName: string
  propertyAddress: string
  propertyPhone: string | null
  templateName: string
  /** Precomputed on the server so client and server agree on "today". */
  dueText: string | null
  dueTone: DueTone | null
  scheduledLabel: string | null
}

type Filter = 'all' | 'pending' | 'in_progress' | 'completed'

// Overdue first, then today, soon, later; unscheduled last — an assignment
// with no date shouldn't outrank one that's actually due.
const TONE_RANK: Record<DueTone, number> = { overdue: 0, today: 1, soon: 2, future: 3 }

function urgencyRank(row: AssignmentRow): number {
  return row.dueTone ? TONE_RANK[row.dueTone] : 4
}

function toneClass(tone: DueTone | null): string {
  if (tone === 'overdue') return 'text-error'
  if (tone === 'today') return 'text-primary'
  return 'text-on-surface-variant'
}

export function AssignmentsBoard({
  inspections,
  isAdmin,
}: {
  inspections: AssignmentRow[]
  isAdmin: boolean
}) {
  const [filter, setFilter] = useState<Filter>('all')

  const pending = inspections.filter((i) => i.status === 'pending')
  const inProgress = inspections.filter((i) => i.status === 'in_progress')
  const completed = inspections.filter((i) => i.status === 'completed')

  // Completed rows open role-appropriate views: admins → full report (with
  // download/resend); specialists → their own read-only detail. Neither edits.
  const completedHref = (id: string) =>
    isAdmin ? `/admin/reports/${id}` : `/inspector/inspections/${id}`

  const openBase =
    filter === 'pending' ? pending : filter === 'in_progress' ? inProgress : [...inProgress, ...pending]
  const open = [...openBase].sort(
    (a, b) =>
      urgencyRank(a) - urgencyRank(b) ||
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  const showOpen = filter !== 'completed'
  const showCompleted = filter === 'all' || filter === 'completed'

  const stats: {
    label: string
    value: number
    icon: typeof ClipboardList
    accent: boolean
    filter: Filter
  }[] = [
    { label: 'Total Assigned', value: inspections.length, icon: ClipboardCheck, accent: false, filter: 'all' },
    { label: 'Pending', value: pending.length, icon: ClipboardList, accent: true, filter: 'pending' },
    { label: 'In Progress', value: inProgress.length, icon: Clock, accent: true, filter: 'in_progress' },
    { label: 'Completed', value: completed.length, icon: CheckCircle2, accent: false, filter: 'completed' },
  ]

  const openEmptyTitle =
    filter === 'pending'
      ? 'No Pending Inspections'
      : filter === 'in_progress'
        ? 'No In-Progress Inspections'
        : 'No open inspections'

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          const active = filter === stat.filter
          return (
            <button
              key={stat.label}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter((f) => (f === stat.filter ? 'all' : stat.filter))}
              className={`rounded-lg text-left transition hover:brightness-95 ${
                active ? 'ring-2 ring-primary' : ''
              }`}
            >
              <Card className="flex items-center justify-between">
                <div>
                  <p className="label-tracked text-on-surface-variant">{stat.label}</p>
                  <p
                    className={`font-headline text-2xl font-bold lg:text-3xl ${stat.accent ? 'text-primary' : ''}`}
                  >
                    {stat.value.toString().padStart(2, '0')}
                  </p>
                </div>
                <Icon size={24} className="hidden text-primary lg:block" />
              </Card>
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Left — the work */}
        <div className="flex flex-col gap-8">
          {showOpen && (
            <section>
              <h2 className="mb-3 font-headline text-lg font-semibold">Open Inspections</h2>
              {open.length ? (
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  {open.map((inspection) => {
                    const inProg = inspection.status === 'in_progress'
                    return (
                      <Card key={inspection.id} padded={false} className="flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between gap-2 border-b border-outline-variant bg-surface-container-low px-4 py-2">
                          {/* Due date, not the created date — this is what the
                              specialist actually needs to see. */}
                          <span
                            className={`label-tracked flex items-center gap-1.5 ${toneClass(inspection.dueTone)}`}
                          >
                            {inspection.dueText ? <Clock size={13} /> : <CalendarOff size={13} />}
                            {inspection.dueText ?? 'Not scheduled'}
                          </span>
                          <span
                            className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                              inProg
                                ? 'bg-primary-container text-on-primary-container'
                                : 'bg-secondary-container text-on-surface-variant'
                            }`}
                          >
                            {inProg ? 'In Progress' : 'Pending'}
                          </span>
                        </div>
                        <div className="flex flex-1 flex-col gap-3 p-4">
                          <div>
                            <p className="font-headline text-lg font-semibold">
                              {inspection.propertyName}
                            </p>
                            <p className="flex items-center gap-1 text-sm text-on-surface-variant">
                              <MapPin size={13} className="shrink-0" />
                              {inspection.propertyAddress}
                            </p>
                            {inspection.propertyPhone && (
                              <a
                                href={`tel:${inspection.propertyPhone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                              >
                                <Phone size={13} className="shrink-0" />
                                {inspection.propertyPhone}
                              </a>
                            )}
                            <p className="mt-1 text-sm text-on-surface-variant">
                              {inspection.templateName}
                            </p>
                            {inspection.scheduledLabel && (
                              <p className="mt-1 text-xs text-on-surface-variant">
                                Scheduled {inspection.scheduledLabel}
                              </p>
                            )}
                          </div>
                          <Link
                            href={`/inspector/inspections/${inspection.id}`}
                            className="mt-auto flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary-container font-headline text-sm font-semibold uppercase tracking-wide text-on-primary-container transition hover:brightness-95"
                          >
                            <Play size={14} />
                            {inProg ? 'Continue Inspection' : 'Start Inspection'}
                          </Link>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                <EmptyState icon={ClipboardCheck} title={openEmptyTitle} description="Nice work!" />
              )}
            </section>
          )}

          {showCompleted && (
            <section>
              <h2 className="mb-3 font-headline text-lg font-semibold">Completed</h2>
              {completed.length ? (
                <Card padded={false}>
                  {/* Desktop table — every cell is a full-bleed link so the whole
                      row opens the report (admin) or read-only detail (specialist) */}
                  <table className="hidden w-full text-sm lg:table">
                    <thead>
                      <tr className="border-b border-outline-variant text-left label-tracked text-on-surface-variant">
                        <th className="px-4 py-3 font-semibold">Property</th>
                        <th className="px-4 py-3 font-semibold">Checklist</th>
                        <th className="px-4 py-3 font-semibold">Completed</th>
                        <th className="w-10 px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {completed.map((inspection) => {
                        const dateLabel = inspection.completedLabel ?? '—'
                        const href = completedHref(inspection.id)
                        const cell = 'block px-4 py-3'
                        return (
                          <tr
                            key={inspection.id}
                            className="border-b border-outline-variant transition last:border-0 hover:bg-surface-container-low"
                          >
                            <td className="p-0 font-semibold">
                              <Link href={href} className={cell}>{inspection.propertyName}</Link>
                            </td>
                            <td className="p-0 text-on-surface-variant">
                              <Link href={href} className={cell}>{inspection.templateName}</Link>
                            </td>
                            <td className="p-0 text-on-surface-variant">
                              <Link href={href} className={cell}>{dateLabel}</Link>
                            </td>
                            <td className="p-0">
                              <Link href={href} className={cell}>
                                <ChevronRight size={16} className="text-on-surface-variant" />
                              </Link>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>

                  {/* Mobile cards */}
                  <div className="flex flex-col divide-y divide-outline-variant lg:hidden">
                    {completed.map((inspection) => (
                      <Link
                        key={inspection.id}
                        href={completedHref(inspection.id)}
                        className="flex items-center justify-between p-4 transition hover:bg-surface-container-low"
                      >
                        <div>
                          <p className="font-semibold">{inspection.propertyName}</p>
                          <p className="text-sm text-on-surface-variant">{inspection.templateName}</p>
                        </div>
                        <ChevronRight size={18} className="text-on-surface-variant" />
                      </Link>
                    ))}
                  </div>
                </Card>
              ) : (
                <p className="text-sm text-on-surface-variant">No completed inspections yet.</p>
              )}
            </section>
          )}
        </div>

        {/* Right — quick actions + recent activity */}
        <aside className="flex flex-col gap-6">
          <div>
            <h2 className="mb-3 font-headline text-lg font-semibold">Quick Actions</h2>
            <div className="flex flex-col gap-2">
              {isAdmin && (
                <Link
                  href="/admin/inspections/new"
                  className="flex min-h-12 items-center gap-2 rounded-lg bg-primary-container px-4 font-headline text-sm font-semibold text-on-primary-container transition hover:brightness-95"
                >
                  <Plus size={16} />
                  Start Inspection
                </Link>
              )}
              <Link
                href="/inspector/profile"
                className="flex min-h-12 items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 font-headline text-sm font-semibold transition hover:brightness-95"
              >
                <UserCircle size={16} className="text-primary" />
                My Profile
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="flex min-h-12 items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 font-headline text-sm font-semibold transition hover:brightness-95"
                >
                  <ClipboardList size={16} className="text-primary" />
                  Dashboard
                </Link>
              )}
            </div>
          </div>

          <div>
            <h2 className="mb-3 font-headline text-lg font-semibold">Recently Completed</h2>
            <Card padded={false}>
              {completed.length ? (
                <div className="flex flex-col divide-y divide-outline-variant">
                  {completed.slice(0, 4).map((inspection) => (
                    <Link
                      key={inspection.id}
                      href={completedHref(inspection.id)}
                      className="group flex items-center gap-2 p-3 transition hover:bg-surface-container-low"
                    >
                      <CheckCircle2 size={14} className="shrink-0 text-success" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{inspection.propertyName}</p>
                        <p className="truncate text-xs text-on-surface-variant">
                          {inspection.completedLabel ?? '—'}
                        </p>
                      </div>
                      <ChevronRight
                        size={14}
                        className="shrink-0 text-on-surface-variant transition group-hover:translate-x-0.5"
                      />
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="p-4 text-sm text-on-surface-variant">Nothing completed yet.</p>
              )}
            </Card>
          </div>
        </aside>
      </div>
    </div>
  )
}
