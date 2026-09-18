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
    .select(
      'name, street, city, state, zip, county, email, phone, notes, human_id, required_schedule, require_id_photo, enable_gps_geofencing, latitude, longitude, geofence_radius_meters'
    )
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
          street: property.street,
          city: property.city,
          state: property.state,
          zip: property.zip,
          county: property.county,
          email: property.email,
          phone: property.phone,
          notes: property.notes,
          humanId: property.human_id,
          schedule: property.required_schedule ?? [],
          requireIdPhoto: property.require_id_photo ?? true,
          enableGpsGeofencing: property.enable_gps_geofencing ?? true,
          latitude: property.latitude,
          longitude: property.longitude,
          geofenceRadiusMeters: property.geofence_radius_meters ?? 100,
        }}
      />
    </div>
  )
}
