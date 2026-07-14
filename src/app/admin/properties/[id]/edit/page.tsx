import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PropertyForm } from '@/components/PropertyForm'
import { updateProperty } from '@/lib/actions/properties'

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
    <div className="mx-auto max-w-2xl px-4 py-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
        Properties
      </p>
      <h1 className="mb-6 font-headline text-2xl font-bold">Edit Property</h1>
      <PropertyForm
        action={updateProperty.bind(null, id)}
        defaultValues={property}
      />
    </div>
  )
}
