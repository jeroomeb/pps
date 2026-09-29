import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PropertyForm } from '@/components/PropertyForm'
import { updateProperty } from '@/lib/actions/properties'
import { PageHeader } from '@/components/ui/PageHeader'
import { getProfile } from '@/lib/auth/dal'
import { getAdminScope } from '@/lib/auth/tenant-view'
import type { BuildingCategory, PayoutTier } from '@/lib/database.types'

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [supabase, profile, scope] = await Promise.all([createClient(), getProfile(), getAdminScope()])

  const [{ data: property }, { data: tenants }, { data: templates }, { data: checklistAccess }, { data: propertyAccess }] = await Promise.all([
    supabase
      .from('properties')
      .select(
        'name, street, city, state, zip, county, email, phone, notes, human_id, required_schedule, require_id_photo, enable_gps_geofencing, latitude, longitude, geofence_radius_meters, payout_tier, custom_payout_rate, tenant_id, building_category, checklist_always_available'
      )
      .eq('id', id)
      .single(),
    profile.is_global_admin && !scope.isViewingTenant
      ? supabase.from('tenants').select('id, name').order('name')
      : Promise.resolve({ data: null }),
    supabase.from('checklist_templates').select('id, name').order('name'),
    supabase.from('tenant_checklist_access').select('tenant_id, template_id'),
    supabase.from('property_checklist_access').select('template_id').eq('property_id', id),
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
          buildingCategory: (property.building_category as BuildingCategory | null) ?? 'luxury',
          checklistAlwaysAvailable: property.checklist_always_available ?? false,
          enabledTemplateIds: (propertyAccess ?? []).map((row) => row.template_id),
        }}
        templates={
          profile.is_global_admin && !scope.isViewingTenant
            ? (templates ?? [])
            : (templates ?? []).filter((template) =>
                (checklistAccess ?? [])
                  .filter((row) => row.tenant_id === (property.tenant_id ?? scope.tenantId))
                  .some((row) => row.template_id === template.id)
              )
        }
        accessByTenant={
          profile.is_global_admin && !scope.isViewingTenant
            ? Object.fromEntries(
                (checklistAccess ?? []).reduce((map, row) => {
                  const list = map.get(row.tenant_id) ?? []
                  list.push(row.template_id)
                  map.set(row.tenant_id, list)
                  return map
                }, new Map<string, string[]>())
              )
            : undefined
        }
      />
    </div>
  )
}
