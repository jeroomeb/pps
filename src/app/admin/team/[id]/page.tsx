import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  Mail,
  Phone,
  MapPin,
  Landmark,
  ClipboardList,
  Clock,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
} from 'lucide-react'
import { requireRole } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/StatusBadge'
import { ZoomableImage } from '@/components/ZoomableImage'
import { TeamMemberAddressForm } from '@/components/TeamMemberAddressForm'
import { SpecialistScorecard } from '@/components/SpecialistScorecard'
import { computeOperationalAnalytics } from '@/lib/analytics'

export default async function TeamMemberProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireRole('admin')
  const { id } = await params
  const supabase = await createClient()

  const { data: member } = await supabase
    .from('profiles')
    .select(
      'id, full_name, role, email, phone, address, street, city, state, zip, county, human_id, id_front_path, id_back_path, status, must_reset_password'
    )
    .eq('id', id)
    .single()

  if (!member) {
    notFound()
  }

  const { data: inspections } = await supabase
    .from('inspections')
    .select(
      'id, status, created_at, completed_at, scheduled_for, arrived_at, dwell_time_seconds, template_id, inspector_id, property_id, properties(name, human_id), checklist_templates(name), profiles!inspections_inspector_id_fkey(full_name, human_id, email)'
    )
    .eq('inspector_id', id)
    .order('created_at', { ascending: false })

  const rawInspections = (inspections as any[]) ?? []
  const inspectionIds = rawInspections.map((i) => i.id)

  let itemsQuery = supabase
    .from('inspection_items')
    .select('inspection_id, status, photo_path')

  if (inspectionIds.length > 0) {
    itemsQuery = itemsQuery.in('inspection_id', inspectionIds)
  }

  const { data: items } = await itemsQuery
  const rawItems = (items as any[]) ?? []

  const summary = computeOperationalAnalytics(rawInspections, rawItems, 'all')
  const scorecard = summary.specialistLeaderboard.find((s) => s.specialistId === member.id) || {
    specialistId: member.id,
    fullName: member.full_name,
    humanId: member.human_id,
    email: member.email,
    completedCount: 0,
    inProgressCount: 0,
    onTimeRate: 100,
    onTimeCount: 0,
    scheduledCount: 0,
    avgDurationMinutes: 0,
    avgDwellMinutes: 0,
    failureDiscoveryRate: 0,
    failuresFlagged: 0,
    totalItemsChecked: 0,
    photoComplianceRate: 100,
  }

  const all = rawInspections
  const pending = all.filter((i) => i.status === 'pending').length
  const inProgress = all.filter((i) => i.status === 'in_progress').length
  const completed = all.filter((i) => i.status === 'completed').length

  async function signed(path: string | null) {
    if (!path) return null
    const { data } = await supabase.storage.from('documents').createSignedUrl(path, 3600)
    return data?.signedUrl ?? null
  }
  const [frontUrl, backUrl] = await Promise.all([
    signed(member.id_front_path),
    signed(member.id_back_path),
  ])

  const roleLabel = member.role === 'admin' ? 'Admin' : 'Operational Continuity Specialist'
  const stats = [
    { label: 'Pending', value: pending, icon: ClipboardList },
    { label: 'In Progress', value: inProgress, icon: Clock },
    { label: 'Completed', value: completed, icon: CheckCircle2 },
  ]

  return (
    <div>
      <PageHeader
        eyebrow={roleLabel}
        title={
          <span className="flex items-center gap-3">
            <span>{member.full_name}</span>
            {member.status === 'inactive' && (
              <span className="rounded bg-error-container px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-on-error-container">
                Deactivated
              </span>
            )}
            {member.must_reset_password && (
              <span className="rounded bg-amber-500/10 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-amber-700">
                Setup Pending
              </span>
            )}
          </span>
        }
        backHref="/admin/team"
        backLabel="Team"
        subtitle={
          <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {member.human_id && <span className="font-mono font-semibold">{member.human_id}</span>}
            {member.email && (
              <span className="flex items-center gap-1">
                <Mail size={13} /> {member.email}
              </span>
            )}
            {member.phone && (
              <span className="flex items-center gap-1">
                <Phone size={13} /> {member.phone}
              </span>
            )}
            {member.address && (
              <span className="flex items-center gap-1">
                <MapPin size={13} /> {member.address}
              </span>
            )}
            {member.county && (
              <span className="flex items-center gap-1">
                <Landmark size={13} /> {member.county} County
              </span>
            )}
          </span>
        }
        action={
          <Link
            href={`/inspector?viewAs=${member.id}`}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 transition-colors"
          >
            <ExternalLink size={15} />
            View Specialist Dashboard
          </Link>
        }
      />

      {/* Operational Scorecard */}
      <div className="mb-8">
        <SpecialistScorecard
          scorecard={scorecard}
          templateBreakdown={summary.templateBreakdown}
        />
      </div>

      <section className="mb-8">
        <h2 className="mb-3 font-headline text-lg font-semibold">Coverage Area</h2>
        <TeamMemberAddressForm
          profileId={member.id}
          defaults={{
            street: member.street,
            city: member.city,
            state: member.state,
            zip: member.zip,
            county: member.county,
          }}
        />
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 font-headline text-lg font-semibold">Identification</h2>
          <Card className="flex flex-col gap-4 sm:flex-row">
            {frontUrl || backUrl ? (
              <>
                {frontUrl && (
                  <div className="flex-1">
                    <p className="label-tracked mb-1 text-on-surface-variant">Front</p>
                    <ZoomableImage src={frontUrl} alt="ID front" thumbClassName="h-40 w-full" />
                  </div>
                )}
                {backUrl && (
                  <div className="flex-1">
                    <p className="label-tracked mb-1 text-on-surface-variant">Back</p>
                    <ZoomableImage src={backUrl} alt="ID back" thumbClassName="h-40 w-full" />
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-on-surface-variant">
                No identification uploaded yet. The specialist uploads this from their own profile.
              </p>
            )}
          </Card>
        </section>

        <section>
          <h2 className="mb-3 font-headline text-lg font-semibold">Assignments</h2>
          {all.length ? (
            <Card padded={false}>
              <div className="flex flex-col divide-y divide-outline-variant">
                {all.map((inspection) => {
                  const property = inspection.properties as unknown as { name: string } | null
                  const template = inspection.checklist_templates as unknown as { name: string } | null
                  const href =
                    inspection.status === 'completed'
                      ? `/admin/reports/${inspection.id}`
                      : `/inspector/inspections/${inspection.id}`
                  return (
                    <Link
                      key={inspection.id}
                      href={href}
                      className="flex items-center justify-between gap-3 p-4 transition hover:bg-surface-container-low"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{property?.name ?? 'Unknown'}</p>
                        <p className="truncate text-sm text-on-surface-variant">
                          {template?.name ?? '—'}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <StatusBadge status={inspection.status} />
                        <ChevronRight size={16} className="text-on-surface-variant" />
                      </div>
                    </Link>
                  )
                })}
              </div>
            </Card>
          ) : (
            <p className="text-sm text-on-surface-variant">No assignments yet.</p>
          )}
        </section>
      </div>
    </div>
  )
}
