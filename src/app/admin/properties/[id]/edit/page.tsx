import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PropertyForm } from '@/components/PropertyForm'
import { updateProperty } from '@/lib/actions/properties'
import { PageHeader } from '@/components/ui/PageHeader'
import { getProfile } from '@/lib/auth/dal'
import type { PayoutTier } from '@/lib/database.types'

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [supabase, profile] = await Promise.all([createClient(), getProfile()])

  const [{ data: property }, { data: tenants }] = await Promise.all([
    supabase
      .from('properties')
      .select(
        'name, street, city, state, zip, county, email, phone, notes, human_id, required_schedule, require_id_photo, enable_gps_geofencing, latitude, longitude, geofence_radius_meters, payout_tier, custom_payout_rate, tenant_id'
      )
      .eq('id', id)
      .single(),
    profile.is_global_admin
      ? supabase.from('tenants').select('id, name').order('name')
      : Promise.resolve({ data: null }),
  ])

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
        tenants={tenants ?? undefined}
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
          payoutTier: (property.payout_tier as PayoutTier) ?? 'tier_2',
          customPayoutRate: property.custom_payout_rate,
          tenantId: property.tenant_id,
        }}
      />
    </div>
  )
}
