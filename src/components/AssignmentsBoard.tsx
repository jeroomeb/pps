'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ClipboardCheck,
  ClipboardList,
  MapPin,
  Clock,
  Play,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'

// Plain, serializable shape passed from the server component — no lucide
// component references cross the RSC boundary (see CLAUDE.md).
export type AssignmentRow = {
  id: string
  status: string
  created_at: string
  completed_at: string | null
  propertyName: string
  propertyAddress: string
  templateName: string
}

type Filter = 'all' | 'pending' | 'in_progress' | 'completed'

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
  // download/resend); inspectors → their own read-only detail. Neither edits.
  const completedHref = (id: string) =>
    isAdmin ? `/admin/reports/${id}` : `/inspector/inspections/${id}`

  // Open list respects the active filter; pending/in_progress narrow it, and
  // selecting Completed hides the open section entirely (and vice versa).
  const open =
    filter === 'pending'
      ? pending
      : filter === 'in_progress'
        ? inProgress
        : [...inProgress, ...pending]

  const showOpen = filter === 'all' || filter === 'pending' || filter === 'in_progress'
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

  // Empty-state copy for the open list reflects the active filter.
  const openEmptyTitle =
    filter === 'pending'
      ? 'No Pending Inspections'
      : filter === 'in_progress'
        ? 'No In-Progress Inspections'
        : 'No open inspections'

  return (
    <div>
      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
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

      {showOpen && (
        <section className="mb-10">
          <h2 className="mb-3 font-headline text-lg font-semibold">Open Inspections</h2>
          {open.length ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {open.map((inspection) => {
                const inProg = inspection.status === 'in_progress'
                return (
                  <Card key={inspection.id} padded={false} className="flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-low px-4 py-2">
                      <span className="label-tracked flex items-center gap-1.5 text-on-surface-variant">
                        <Clock size={13} />
                        {new Date(inspection.created_at).toLocaleDateString('en-US', {
                          dateStyle: 'medium',
                        })}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
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
                        <p className="font-headline text-lg font-semibold">{inspection.propertyName}</p>
                        <p className="flex items-center gap-1 text-sm text-on-surface-variant">
                          <MapPin size={13} className="shrink-0" />
                          {inspection.propertyAddress}
                        </p>
                        <p className="mt-1 text-sm text-on-surface-variant">{inspection.templateName}</p>
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
                  row opens the report (admin) or read-only detail (inspector) */}
              <table className="hidden w-full text-sm lg:table">
                <thead>
                  <tr className="border-b border-outline-variant text-left label-tracked text-on-surface-variant">
                    <th className="px-4 py-3 font-semibold">Property</th>
                    <th className="px-4 py-3 font-semibold">Checklist</th>
                    <th className="px-4 py-3 font-semibold">Completed</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="w-10 px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {completed.map((inspection) => {
                    const dateLabel = inspection.completed_at
                      ? new Date(inspection.completed_at).toLocaleDateString('en-US', {
                          dateStyle: 'medium',
                        })
                      : '—'
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
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-success-container px-3 py-1 text-xs font-semibold uppercase tracking-wide text-on-success-container">
                              <CheckCircle2 size={12} />
                              Completed
                            </span>
                          </Link>
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
  )
}
