import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PropertyForm } from '@/components/PropertyForm'
import { updateProperty } from '@/lib/actions/properties'
import { PageHeader } from '@/components/ui/PageHeader'

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: property } = await supabase
    .from('properties')
    .select('name, address, email')
    .eq('id', id)
    .single()

  if (!property) {
    notFound()
  }

  return (
    <div className="max-w-2xl">
      <PageHeader eyebrow="Properties" title="Edit Property" />
      <PropertyForm
        action={updateProperty.bind(null, id)}
        defaultValues={property}
      />
    </div>
  )
}
