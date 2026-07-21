import Link from 'next/link'
import { Building2, ClipboardList, ChevronRight, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'

type InspectionRow = {
  id: string
  property_id: string
  status: string
  created_at: string
  checklist_templates: { name: string } | null
}

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  const [{ data: properties }, { data: inspections }] = await Promise.all([
    supabase.from('properties').select('id, name, address').order('name'),
    supabase
      .from('inspections')
      .select('id, property_id, status, created_at, checklist_templates(name)')
      .order('created_at', { ascending: false }),
  ])

  const pendingCount = (inspections ?? []).filter((i) => i.status !== 'completed').length

  // Latest inspection per property — used only to show which checklist was
  // last run; no health/status is derived at the property level.
  const latestByProperty = new Map<string, InspectionRow>()
  for (const inspection of (inspections ?? []) as unknown as InspectionRow[]) {
    if (!latestByProperty.has(inspection.property_id)) {
      latestByProperty.set(inspection.property_id, inspection)
    }
  }

  const recentProperties = (properties ?? []).slice(0, 8)

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

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="flex items-center justify-between">
          <div>
            <p className="label-tracked text-on-surface-variant">Total Properties</p>
            <p className="font-headline text-3xl font-bold">{properties?.length ?? 0}</p>
          </div>
          <Building2 size={28} className="text-primary" />
        </Card>
        <Card className="flex items-center justify-between">
          <div>
            <p className="label-tracked text-on-surface-variant">Pending Inspections</p>
            <p className="font-headline text-3xl font-bold">{pendingCount}</p>
          </div>
          <ClipboardList size={28} className="text-primary" />
        </Card>
      </div>

      <Card padded={false}>
        <div className="flex items-center justify-between border-b border-outline-variant p-4">
          <h2 className="font-headline text-lg font-semibold">Recent Properties</h2>
          <Link
            href="/admin/properties"
            className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-primary"
          >
            View All <ChevronRight size={14} />
          </Link>
        </div>

        {recentProperties.length ? (
          <>
            {/* Desktop table — every cell is a full-bleed link so the whole row is clickable */}
            <table className="hidden w-full text-sm lg:table">
              <thead>
                <tr className="border-b border-outline-variant text-left label-tracked text-on-surface-variant">
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Address</th>
                  <th className="px-4 py-3 font-semibold">Last Checklist</th>
                  <th className="w-10 px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {recentProperties.map((property) => {
                  const latest = latestByProperty.get(property.id)
                  const template = latest?.checklist_templates ?? null
                  const href = `/admin/properties/${property.id}`
                  const cell = 'block px-4 py-3'
                  return (
                    <tr
                      key={property.id}
                      className="border-b border-outline-variant transition last:border-0 hover:bg-surface-container-low"
                    >
                      <td className="p-0 font-semibold">
                        <Link href={href} className={cell}>{property.name}</Link>
                      </td>
                      <td className="p-0 text-on-surface-variant">
                        <Link href={href} className={cell}>{property.address}</Link>
                      </td>
                      <td className="p-0 text-on-surface-variant">
                        <Link href={href} className={cell}>{template?.name ?? '—'}</Link>
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
              {recentProperties.map((property) => (
                <Link
                  key={property.id}
                  href={`/admin/properties/${property.id}`}
                  className="flex items-center justify-between p-4"
                >
                  <div>
                    <p className="font-semibold">{property.name}</p>
                    <p className="text-sm text-on-surface-variant">{property.address}</p>
                  </div>
                  <ChevronRight size={18} className="text-on-surface-variant" />
                </Link>
              ))}
            </div>
          </>
        ) : (
          <div className="p-4">
            <EmptyState
              icon={Building2}
              title="No properties yet"
              description="Add your first property to start scheduling audits."
            />
          </div>
        )}
      </Card>
    </div>
  )
}
