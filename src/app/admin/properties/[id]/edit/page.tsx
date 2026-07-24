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
    .select('name, address, email, phone, notes, human_id, required_schedule')
    .eq('id', id)
    .single()

  if (!property) {
    notFound()
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        eyebrow="Properties"
        title="Edit Property"
        backHref={`/admin/properties/${id}`}
        backLabel="Property"
      />
      <PropertyForm
        action={updateProperty.bind(null, id)}
        defaultValues={{
          name: property.name,
          address: property.address,
          email: property.email,
          phone: property.phone,
          notes: property.notes,
          humanId: property.human_id,
          schedule: property.required_schedule ?? [],
        }}
      />
    </div>
  )
}
