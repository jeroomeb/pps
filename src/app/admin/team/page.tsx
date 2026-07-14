import { createClient } from '@/lib/supabase/server'
import { InspectorForm } from '@/components/InspectorForm'
import { RoleToggleButton } from '@/components/RoleToggleButton'
import { getProfile } from '@/lib/auth/dal'

export default async function TeamPage() {
  const currentProfile = await getProfile()
  const supabase = await createClient()
  const { data: members } = await supabase
    .from('profiles')
    .select('id, full_name, role, created_at')
    .order('full_name')

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
        Team
      </p>
      <h1 className="mb-6 font-headline text-2xl font-bold">Team Members</h1>

      <div className="mb-8 flex flex-col gap-3">
        {members?.length ? (
          members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between rounded border border-outline-variant bg-surface-container-lowest p-4"
            >
              <div>
                <p className="font-semibold">{member.full_name}</p>
                <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                  {member.role}
                </p>
              </div>
              {member.id !== currentProfile.id && (
                <RoleToggleButton profileId={member.id} role={member.role} />
              )}
            </div>
          ))
        ) : (
          <p className="text-sm text-on-surface-variant">No team members yet.</p>
        )}
      </div>

      <InspectorForm />
    </div>
  )
}
