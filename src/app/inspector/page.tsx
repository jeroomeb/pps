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
import { getProfile } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'

export default async function InspectorDashboardPage() {
  const profile = await getProfile()
  const supabase = await createClient()

  const { data: inspections } = await supabase
    .from('inspections')
    .select(
      'id, status, created_at, completed_at, properties(name, address), checklist_templates(name)'
    )
    .eq('inspector_id', profile.id)
    .order('created_at', { ascending: false })

  const all = inspections ?? []
  const pending = all.filter((i) => i.status === 'pending')
  const inProgress = all.filter((i) => i.status === 'in_progress')
  const completed = all.filter((i) => i.status === 'completed')
  const open = [...inProgress, ...pending]

  // Completed rows are clickable for everyone, but to role-appropriate views:
  // admins open the full report (admin-gated, with download/resend); inspectors
  // open their own read-only detail under /inspector. Neither can edit a
  // completed inspection.
  const isAdmin = profile.role === 'admin'
  const completedHref = (inspectionId: string) =>
    isAdmin ? `/admin/reports/${inspectionId}` : `/inspector/inspections/${inspectionId}`

  const stats = [
    { label: 'Pending', value: pending.length, icon: ClipboardList, accent: true },
    { label: 'In Progress', value: inProgress.length, icon: Clock, accent: true },
    { label: 'Completed', value: completed.length, icon: CheckCircle2, accent: false },
    { label: 'Total Assigned', value: all.length, icon: ClipboardCheck, accent: false },
  ]

  return (
    <div>
      <PageHeader eyebrow="Today's Schedule" title="My Assignments" />

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="flex items-center justify-between">
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
          )
        })}
      </div>

      <section className="mb-10">
        <h2 className="mb-3 font-headline text-lg font-semibold">Open Inspections</h2>
        {open.length ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {open.map((inspection) => {
              const property = inspection.properties as unknown as {
                name: string
                address: string
              }
              const template = inspection.checklist_templates as unknown as { name: string }
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
                      <p className="font-headline text-lg font-semibold">{property.name}</p>
                      <p className="flex items-center gap-1 text-sm text-on-surface-variant">
                        <MapPin size={13} className="shrink-0" />
                        {property.address}
                      </p>
                      <p className="mt-1 text-sm text-on-surface-variant">{template.name}</p>
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
          <EmptyState icon={ClipboardCheck} title="No open inspections" description="Nice work!" />
        )}
      </section>

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
                  const property = inspection.properties as unknown as { name: string }
                  const template = inspection.checklist_templates as unknown as { name: string }
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
                        <Link href={href} className={cell}>{property.name}</Link>
                      </td>
                      <td className="p-0 text-on-surface-variant">
                        <Link href={href} className={cell}>{template.name}</Link>
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
              {completed.map((inspection) => {
                const property = inspection.properties as unknown as { name: string }
                const template = inspection.checklist_templates as unknown as { name: string }
                return (
                  <Link
                    key={inspection.id}
                    href={completedHref(inspection.id)}
                    className="flex items-center justify-between p-4 transition hover:bg-surface-container-low"
                  >
                    <div>
                      <p className="font-semibold">{property.name}</p>
                      <p className="text-sm text-on-surface-variant">{template.name}</p>
                    </div>
                    <ChevronRight size={18} className="text-on-surface-variant" />
                  </Link>
                )
              })}
            </div>
          </Card>
        ) : (
          <p className="text-sm text-on-surface-variant">No completed inspections yet.</p>
        )}
      </section>
    </div>
  )
}
