import { notFound, redirect } from 'next/navigation'
import { getProfile } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { ActiveInspectionChecklist } from '@/components/ActiveInspectionChecklist'

export default async function InspectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const profile = await getProfile()
  const supabase = await createClient()

  const { data: inspection } = await supabase
    .from('inspections')
    .select(
      'id, status, inspector_id, properties(name), checklist_templates(name)'
    )
    .eq('id', id)
    .single()

  if (!inspection) {
    notFound()
  }

  if (profile.role !== 'admin' && inspection.inspector_id !== profile.id) {
    redirect('/inspector')
  }

  if (inspection.status === 'completed') {
    redirect('/inspector')
  }

  const { data: items } = await supabase
    .from('inspection_items')
    .select('id, service_category, item_name, description, status, comment, photo_path')
    .eq('inspection_id', id)
    .order('sort_order')

  const itemsWithUrls = await Promise.all(
    (items ?? []).map(async (item) => {
      let photoUrl: string | null = null
      if (item.photo_path) {
        const { data } = await supabase.storage
          .from('photos')
          .createSignedUrl(item.photo_path, 3600)
        photoUrl = data?.signedUrl ?? null
      }
      return { ...item, photoUrl }
    })
  )

  const property = inspection.properties as unknown as { name: string }
  const template = inspection.checklist_templates as unknown as { name: string }

  return (
    <ActiveInspectionChecklist
      inspectionId={id}
      propertyName={property.name}
      checklistName={template.name}
      initialItems={itemsWithUrls}
    />
  )
}
