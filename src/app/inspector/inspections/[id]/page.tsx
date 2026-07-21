import { notFound, redirect } from 'next/navigation'
import { getProfile } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { ActiveInspectionChecklist } from '@/components/ActiveInspectionChecklist'
import { ReadOnlyInspectionView } from '@/components/ReadOnlyInspectionView'

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
      'id, status, inspector_id, created_at, completed_at, properties(name), checklist_templates(name), profiles(full_name)'
    )
    .eq('id', id)
    .single()

  if (!inspection) {
    notFound()
  }

  if (profile.role !== 'admin' && inspection.inspector_id !== profile.id) {
    redirect('/inspector')
  }

  // Admins get the full report (download/resend/email). Inspectors can still
  // *see* their own completed inspection below — just read-only, since it's
  // frozen once submitted.
  if (inspection.status === 'completed' && profile.role === 'admin') {
    redirect(`/admin/reports/${id}`)
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
  const inspector = inspection.profiles as unknown as { full_name: string }

  if (inspection.status === 'completed') {
    return (
      <ReadOnlyInspectionView
        propertyName={property.name}
        checklistName={template.name}
        inspectorName={inspector.full_name}
        completedAt={inspection.completed_at}
        items={itemsWithUrls}
      />
    )
  }

  return (
    <ActiveInspectionChecklist
      inspectionId={id}
      propertyName={property.name}
      checklistName={template.name}
      inspectorName={inspector.full_name}
      startedAt={inspection.created_at}
      initialItems={itemsWithUrls}
    />
  )
}
