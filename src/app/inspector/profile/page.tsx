import { getProfile } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { InspectorProfileForm } from '@/components/InspectorProfileForm'
import { PageHeader } from '@/components/ui/PageHeader'

export default async function InspectorProfilePage() {
  const profile = await getProfile()
  const supabase = await createClient()

  const { data: row } = await supabase
    .from('profiles')
    .select('human_id, phone, street, city, state, zip, county, id_front_path, id_back_path')
    .eq('id', profile.id)
    .single()

  return (
    <div className="max-w-3xl">
      <PageHeader eyebrow="My Profile" title="Profile & Identification" />
      <InspectorProfileForm
        userId={profile.id}
        humanId={row?.human_id ?? null}
        fullName={profile.full_name}
        email={profile.email}
        defaults={{
          phone: row?.phone ?? null,
          street: row?.street ?? null,
          city: row?.city ?? null,
          state: row?.state ?? null,
          zip: row?.zip ?? null,
          county: row?.county ?? null,
          id_front_path: row?.id_front_path ?? null,
          id_back_path: row?.id_back_path ?? null,
        }}
      />
    </div>
  )
}
