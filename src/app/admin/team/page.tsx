import Link from 'next/link'
import { Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { InspectorForm } from '@/components/InspectorForm'
import { RoleToggleButton } from '@/components/RoleToggleButton'
import { getProfile } from '@/lib/auth/dal'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { DeactivateMemberModal } from '@/components/DeactivateMemberModal'
import { AddressFilterBar, distinctValues } from '@/components/AddressFilterBar'

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string; county?: string }>
}) {
  const { state, county } = await searchParams
  const currentProfile = await getProfile()
  const supabase = await createClient()

  // Unfiltered set drives the dropdown options and active inspections counts
  const [{ data: allMembers }, { data: openInspections }] = await Promise.all([
    supabase.from('profiles').select('state, county'),
    supabase
      .from('inspections')
      .select('inspector_id')
      .in('status', ['pending', 'in_progress']),
  ])

  const openCounts = new Map<string, number>()
  for (const i of openInspections ?? []) {
    openCounts.set(i.inspector_id, (openCounts.get(i.inspector_id) ?? 0) + 1)
  }

  let query = supabase
    .from('profiles')
    .select('id, full_name, role, human_id, email, phone, city, state, county, status, must_reset_password')
    .order('full_name')

  if (state) query = query.eq('state', state)
  if (county) query = query.eq('county', county)

  const { data: members } = await query

  const availableInspectors = (members ?? [])
    .filter((m) => (m.status ?? 'active') === 'active')
    .map((m) => ({ id: m.id, full_name: m.full_name, human_id: m.human_id }))

  return (
    <div>
      <PageHeader eyebrow="Team" title="Team Members" />

      <AddressFilterBar
        action="/admin/team"
        values={{ state, county }}
        states={distinctValues(allMembers ?? [], 'state')}
        counties={distinctValues(allMembers ?? [], 'county')}
      />

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1.3fr_1fr]">
        <section>
          <h2 className="mb-3 font-headline text-lg font-semibold">Current Members</h2>
          {members?.length ? (
            <Card padded={false}>
              <div className="flex flex-col divide-y divide-outline-variant">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between gap-3 p-4"
                  >
                    <Link href={`/admin/team/${member.id}`} className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-semibold hover:underline">{member.full_name}</p>
                        {member.status === 'inactive' && (
                          <span className="rounded bg-error-container px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-on-error-container">
                            Inactive
                          </span>
                        )}
                        {member.must_reset_password && (
                          <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                            Setup Pending
                          </span>
                        )}
                        {(openCounts.get(member.id) ?? 0) > 0 && (
                          <span className="rounded bg-primary-container px-1.5 py-0.5 text-[10px] font-semibold text-on-primary-container">
                            {openCounts.get(member.id)} open
                          </span>
                        )}
                      </div>
                      <p className="label-tracked flex flex-wrap items-center gap-x-2 text-on-surface-variant">
                        {member.role === 'admin' ? 'Admin' : 'Operational Continuity Specialist'}
                        {member.human_id && (
                          <span className="font-mono normal-case">{member.human_id}</span>
                        )}
                      </p>
                      <p className="truncate text-sm text-on-surface-variant">
                        {[member.email, member.phone].filter(Boolean).join(' · ')}
                      </p>
                      {/* Coverage area — drives proximity-based assignment. */}
                      {(member.county || member.state) ? (
                        <p className="truncate text-xs text-on-surface-variant">
                          {[member.city, member.county && `${member.county} County`, member.state]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      ) : (
                        <p className="truncate text-xs text-error">Coverage area not set</p>
                      )}
                    </Link>
                    {member.id !== currentProfile.id ? (
                      <div className="flex shrink-0 items-center gap-2">
                        <RoleToggleButton profileId={member.id} role={member.role} />
                        <DeactivateMemberModal
                          memberId={member.id}
                          memberName={member.full_name}
                          memberStatus={member.status ?? 'active'}
                          openInspectionsCount={openCounts.get(member.id) ?? 0}
                          availableInspectors={availableInspectors.filter((ins) => ins.id !== member.id)}
                        />
                      </div>
                    ) : (
                      <span className="shrink-0 rounded-full bg-secondary-container px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-on-surface-variant">
                        You
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <EmptyState icon={Users} title="No team members yet" />
          )}
        </section>

        <section>
          <h2 className="mb-3 font-headline text-lg font-semibold">Add Team Member</h2>
          <InspectorForm />
        </section>
      </div>
    </div>
  )
}
