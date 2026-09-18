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

  // Sign the ID documents so the specialist can actually SEE what they
  // uploaded — previously this page only passed the storage paths down, so the
  // form could say "uploaded" but never show the image. Same pattern the admin
  // view already uses (src/app/admin/team/[id]/page.tsx); `documents_read` RLS
  // permits owner-or-admin, so reading one's own is allowed.
  async function signed(path: string | null | undefined) {
    if (!path) return null
    const { data } = await supabase.storage.from('documents').createSignedUrl(path, 3600)
    return data?.signedUrl ?? null
  }
  const [idFrontUrl, idBackUrl] = await Promise.all([
    signed(row?.id_front_path),
    signed(row?.id_back_path),
  ])

  // Check if assigned properties require ID verification
  const { data: assignments } = await supabase
    .from('property_specialist_assignments')
    .select('properties(require_id_photo)')
    .eq('specialist_id', profile.id)

  const hasMandatoryIdProperty =
    (assignments ?? []).some((a) => {
      const prop = a.properties as unknown as { require_id_photo?: boolean } | null
      return prop?.require_id_photo !== false
    }) || assignments?.length === 0 // If no properties assigned yet, default to true per platform standard

  return (
    <div className="max-w-3xl">
      <PageHeader eyebrow="My Profile" title="Profile & Identification" />
      <InspectorProfileForm
        userId={profile.id}
        humanId={row?.human_id ?? null}
        fullName={profile.full_name}
        email={profile.email}
        isIdVerificationMandatory={hasMandatoryIdProperty}
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
        idFrontUrl={idFrontUrl}
        idBackUrl={idBackUrl}
      />
    </div>
  )
}
