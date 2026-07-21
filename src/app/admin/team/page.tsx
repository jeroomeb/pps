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

export default async function TeamPage() {
  const currentProfile = await getProfile()
  const supabase = await createClient()
  const { data: members } = await supabase
    .from('profiles')
    .select('id, full_name, role, created_at')
    .order('full_name')

  return (
    <div>
      <PageHeader eyebrow="Team" title="Team Members" />

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
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{member.full_name}</p>
                      <p className="label-tracked text-on-surface-variant">{member.role}</p>
                    </div>
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
