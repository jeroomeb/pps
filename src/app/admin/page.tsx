import Link from 'next/link'
import {
  Building2,
  ClipboardList,
  Plus,
  CalendarClock,
  Clock,
  FileText,
  Users,
  ChevronRight,
  Zap,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { dueLabel } from '@/lib/schedule'
import { zonedDate, formatDateTime } from '@/lib/timezone'

const QUICK_ACTIONS = [
  { href: '/admin/inspections/new', label: 'Start Inspection', icon: Plus, primary: true },
  { href: '/admin/properties/new', label: 'Add Property', icon: Building2, primary: false },
  { href: '/admin/reports', label: 'View Reports', icon: FileText, primary: false },
  { href: '/admin/team', label: 'Manage Team', icon: Users, primary: false },
]

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  const [{ data: properties }, { data: inspections }] = await Promise.all([
    supabase.from('properties').select('id, name').order('name'),
    supabase
      .from('inspections')
      .select(
        'id, property_id, status, created_at, completed_at, scheduled_for, properties(name), checklist_templates(name)'
      )
      .order('created_at', { ascending: false }),
  ])

  const allProperties = properties ?? []
  const allInspections = inspections ?? []

  const pendingCount = allInspections.filter((i) => i.status === 'pending').length
  const inProgress = allInspections.filter((i) => i.status === 'in_progress')

  // Real scheduled inspections only — no derived/auto-generated due dates.
  const now = zonedDate()
  const upcoming = allInspections
    .filter((i) => i.status !== 'completed' && i.scheduled_for)
    .map((i) => {
      const property = i.properties as unknown as { name: string } | null
      const template = i.checklist_templates as unknown as { name: string } | null
      const due = dueLabel(zonedDate(new Date(i.scheduled_for!)), now)
      return {
        id: i.id,
        propertyName: property?.name ?? 'Unknown property',
        templateName: template?.name ?? '—',
        scheduledLabel: formatDateTime(i.scheduled_for),
        dueText: due.text,
        dueTone: due.tone,
        scheduledFor: i.scheduled_for!,
      }
    })
    .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime())

  const stats = [
    {
      label: 'Total Properties',
      value: allProperties.length,
      icon: Building2,
      href: '/admin/properties',
    },
    {
      label: 'Pending',
      value: pendingCount,
      icon: ClipboardList,
      href: '/admin/inspections?status=pending',
    },
    {
      label: 'In Progress',
      value: inProgress.length,
      icon: Clock,
      href: '/admin/inspections?status=in_progress',
    },
  ]

  return (
    <div>
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        action={
          <Link
            href="/admin/inspections/new"
            className="flex min-h-11 items-center gap-1.5 rounded-lg bg-primary-container px-4 font-headline text-sm font-semibold uppercase tracking-wide text-on-primary-container hover:brightness-95"
          >
            <Plus size={16} />
            Start Inspection
          </Link>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Link key={stat.label} href={stat.href} className="rounded-lg transition hover:brightness-95">
              <Card className="flex items-center justify-between">
                <div>
                  <p className="label-tracked text-on-surface-variant">{stat.label}</p>
                  <p className="font-headline text-3xl font-bold">{stat.value}</p>
                </div>
                <Icon size={28} className="text-primary" />
              </Card>
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left — what's scheduled */}
        <section>
          <h2 className="mb-3 flex items-center gap-2 font-headline text-lg font-semibold">
            <CalendarClock size={18} className="text-primary" />
            Upcoming Inspections
          </h2>
          <Card padded={false} className="overflow-hidden">
            {upcoming.length ? (
              <div className="flex flex-col divide-y divide-outline-variant">
                {upcoming.slice(0, 6).map((row) => (
                  <Link
                    key={row.id}
                    href={`/inspector/inspections/${row.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-surface-container-low"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{row.propertyName}</p>
                      <p className="truncate text-xs text-on-surface-variant">
                        {row.templateName} · {row.scheduledLabel}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-xs font-semibold ${
                        row.dueTone === 'overdue'
                          ? 'text-error'
                          : row.dueTone === 'today'
                            ? 'text-primary'
                            : 'text-on-surface-variant'
                      }`}
                    >
                      {row.dueText}
                    </span>
                  </Link>
                ))}
                {upcoming.length > 6 && (
                  <Link
                    href="/admin/inspections"
                    className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-primary hover:bg-surface-container-low"
                  >
                    View all {upcoming.length}
                  </Link>
                )}
              </div>
            ) : (
              <div className="p-4">
                <EmptyState
                  icon={CalendarClock}
                  title="Nothing scheduled"
                  description="Scheduled inspections appear here."
                />
              </div>
            )}
          </Card>
        </section>

        {/* Right — act on it */}
        <section className="flex flex-col gap-6">
          <div>
            <h2 className="mb-3 font-headline text-lg font-semibold">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className={`flex min-h-14 items-center gap-2 rounded-lg px-4 font-headline text-sm font-semibold transition hover:brightness-95 ${
                      action.primary
                        ? 'bg-primary-container text-on-primary-container'
                        : 'border border-outline-variant bg-surface-container-lowest'
                    }`}
                  >
                    <Icon size={16} className={action.primary ? '' : 'text-primary'} />
                    {action.label}
                  </Link>
                )
              })}
            </div>
          </div>

          <div>
            <h2 className="mb-3 flex items-center gap-2 font-headline text-lg font-semibold">
              <Zap size={18} className="text-primary" />
              Active Now
            </h2>
            <Card padded={false}>
              {inProgress.length ? (
                <div className="flex flex-col divide-y divide-outline-variant">
                  {inProgress.slice(0, 5).map((inspection) => {
                    const property = inspection.properties as unknown as { name: string } | null
                    const template = inspection.checklist_templates as unknown as {
                      name: string
                    } | null
                    return (
                      <Link
                        key={inspection.id}
                        href={`/inspector/inspections/${inspection.id}`}
                        className="group flex items-center gap-3 p-4 transition hover:bg-surface-container-low"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold">
                            {property?.name ?? 'Unknown property'}
                          </p>
                          <p className="truncate text-xs text-on-surface-variant">
                            {template?.name ?? '—'}
                          </p>
                        </div>
                        <ChevronRight
                          size={16}
                          className="shrink-0 text-on-surface-variant transition group-hover:translate-x-0.5"
                        />
                      </Link>
                    )
                  })}
                  {inProgress.length > 5 && (
                    <Link
                      href="/admin/inspections?status=in_progress"
                      className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-primary hover:bg-surface-container-low"
                    >
                      View all {inProgress.length}
                    </Link>
                  )}
                </div>
              ) : (
                <div className="p-4">
                  <EmptyState
                    icon={Clock}
                    title="Nothing in progress"
                    description="Started inspections appear here."
                  />
                </div>
              )}
            </Card>
          </div>
        </section>
      </div>
    </div>
  )
}
