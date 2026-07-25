import Link from 'next/link'
import { Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { InspectorForm } from '@/components/InspectorForm'
import { RoleToggleButton } from '@/components/RoleToggleButton'
import { getProfile } from '@/lib/auth/dal'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { ConfirmDeleteButton } from '@/components/ConfirmDeleteButton'
import { deleteTeamMember } from '@/lib/actions/team'
import { AddressFilterBar, distinctValues } from '@/components/AddressFilterBar'

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string; county?: string }>
}) {
  const { state, county } = await searchParams
  const currentProfile = await getProfile()
  const supabase = await createClient()

  // Unfiltered set drives the dropdown options.
  const { data: allMembers } = await supabase.from('profiles').select('state, county')

  let query = supabase
    .from('profiles')
    .select('id, full_name, role, created_at, city, state, county')
    .order('full_name')

  if (state) query = query.eq('state', state)
  if (county) query = query.eq('county', county)

  const { data: members } = await query

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
                      <p className="truncate font-semibold hover:underline">{member.full_name}</p>
                      <p className="label-tracked text-on-surface-variant">
                        {member.role === 'admin' ? 'Admin' : 'Operational Continuity Specialist'}
                      </p>
                      {/* Coverage area — drives proximity-based assignment. */}
                      {(member.county || member.state) && (
                        <p className="truncate text-xs text-on-surface-variant">
                          {[member.city, member.county && `${member.county} County`, member.state]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      )}
                    </Link>
                    {member.id !== currentProfile.id ? (
                      <div className="flex shrink-0 items-center gap-2">
                        <RoleToggleButton profileId={member.id} role={member.role} />
                        <ConfirmDeleteButton
                          action={deleteTeamMember.bind(null, member.id)}
                          confirmMessage="Delete this team member?"
                          iconOnly
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
