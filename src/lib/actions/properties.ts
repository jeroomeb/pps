'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/dal'
import { getAdminScope } from '@/lib/auth/tenant-view'
import { createClient } from '@/lib/supabase/server'
import { cleanupInspectionStorage } from '@/lib/supabase/storage-cleanup'
import { genPropertyId } from '@/lib/ids'
import type { ScheduleEntry } from '@/lib/schedule'
import { composeAddress, normalizeAddressParts } from '@/lib/address'
import type { Database } from '@/lib/database.types'
import { BUILDING_CATEGORIES } from '@/lib/building-category'
import {
  filterTemplatesForTenant,
  replacePropertyChecklistAccess,
  templateIdsFromForm,
} from '@/lib/checklist-access'
import { ensureOpenInspectionsForProperty } from '@/lib/standing-inspections'

const propertySchema = z.object({
  name: z.string().trim().min(1, 'Property name is required'),
  street: z.string().trim().min(1, 'Street address is required'),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  zip: z.string().trim().optional(),
  county: z.string().trim().optional(),
  email: z.string().trim().email('Enter a valid email'),
  phone: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  require_id_photo: z.coerce.boolean().default(true),
  enable_gps_geofencing: z.coerce.boolean().default(true),
  latitude: z.preprocess((val) => (val === '' || val === null || val === undefined ? null : Number(val)), z.number().nullable().optional()),
  longitude: z.preprocess((val) => (val === '' || val === null || val === undefined ? null : Number(val)), z.number().nullable().optional()),
  geofence_radius_meters: z.coerce.number().min(10, 'Geofence radius must be at least 10 meters').default(100),
  payout_tier: z.enum(['tier_1', 'tier_2', 'tier_3', 'custom']).default('tier_2'),
  custom_payout_rate: z.preprocess((val) => (val === '' || val === null || val === undefined ? null : Number(val)), z.number().min(0).nullable().optional()),
  building_category: z.enum(BUILDING_CATEGORIES),
  checklist_always_available: z.coerce.boolean().default(false),
  tenant_id: z.string().uuid().optional().nullable(),
})

export type PropertyFormState = { error?: string } | undefined

// Schedule checkboxes are submitted as `schedule=<ordinal>-<weekday>` values.
// These are a declared reference list (not a scheduler), so the ordinal is
// always 1 — parseSchedule normalizes anyway, but we keep the wire format for
// backwards compatibility with existing stored data.
function parseScheduleFromForm(formData: FormData): ScheduleEntry[] {
  const weekdays = new Set<number>()
  for (const raw of formData.getAll('schedule')) {
    if (typeof raw !== 'string') continue
    const w = Number(raw.split('-')[1] ?? raw)
    if (Number.isInteger(w) && w >= 0 && w <= 6) weekdays.add(w)
  }
  return [...weekdays].sort((a, b) => a - b).map((weekday) => ({ ordinal: 1, weekday }))
}

/** Address parts + the derived single-line `address` used by PDFs/emails. */
function addressColumns(data: z.infer<typeof propertySchema>) {
  const parts = normalizeAddressParts(data)
  return { ...parts, address: composeAddress(parts) }
}

function propertyFormFields(formData: FormData) {
  const rawTenantId = formData.get('tenant_id')
  return {
    name: formData.get('name'),
    street: formData.get('street'),
    city: formData.get('city'),
    state: formData.get('state'),
    zip: formData.get('zip'),
    county: formData.get('county'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    notes: formData.get('notes'),
    require_id_photo: formData.get('require_id_photo') === 'on' || formData.get('require_id_photo') === 'true',
    enable_gps_geofencing: formData.get('enable_gps_geofencing') === 'on' || formData.get('enable_gps_geofencing') === 'true',
    latitude: formData.get('latitude'),
    longitude: formData.get('longitude'),
    geofence_radius_meters: formData.get('geofence_radius_meters') || 100,
    payout_tier: formData.get('payout_tier') || 'tier_2',
    custom_payout_rate: formData.get('custom_payout_rate'),
    building_category: formData.get('building_category'),
    checklist_always_available: formData.get('checklist_always_available') === 'on',
    tenant_id: typeof rawTenantId === 'string' && rawTenantId.trim() ? rawTenantId.trim() : null,
  }
}

export async function createProperty(
  _prevState: PropertyFormState,
  formData: FormData
): Promise<PropertyFormState> {
  const profile = await requireRole('admin')
  const scope = await getAdminScope()

  const parsed = propertySchema.safeParse(propertyFormFields(formData))

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const supabase = await createClient()

  // Target Tenant Resolution: Global admin can assign to any tenant; regular admin is locked to own tenant
  const targetTenantId = scope.isViewingTenant
    ? scope.tenantId
    : profile.is_global_admin && parsed.data.tenant_id
      ? parsed.data.tenant_id
      : profile.tenant_id ?? null

  // Enforce Tenant Property License SKU limits (Shared DB, Shared Schema Isolation)
  if (targetTenantId) {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id, name, max_property_licenses, status')
      .eq('id', targetTenantId)
      .single()

    if (tenant) {
      if (tenant.status === 'suspended') {
        return { error: 'Your organization account is suspended. Please contact support.' }
      }
      const { count } = await supabase
        .from('properties')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id)

      if ((count ?? 0) >= tenant.max_property_licenses) {
        return {
          error: `License limit reached: Organization "${tenant.name}" has allocated all ${tenant.max_property_licenses} property licenses on its plan. Upgrade the license to add more properties.`,
        }
      }
    }
  }

  const insertRow = {
    name: parsed.data.name,
    ...addressColumns(parsed.data),
    email: parsed.data.email,
    phone: parsed.data.phone || null,
    notes: parsed.data.notes || null,
    required_schedule: parseScheduleFromForm(formData),
    human_id: genPropertyId(),
    tenant_id: targetTenantId,
    require_id_photo: parsed.data.require_id_photo,
    enable_gps_geofencing: parsed.data.enable_gps_geofencing,
    latitude: parsed.data.latitude ?? null,
    longitude: parsed.data.longitude ?? null,
    geofence_radius_meters: parsed.data.geofence_radius_meters,
    payout_tier: parsed.data.payout_tier,
    custom_payout_rate: parsed.data.payout_tier === 'custom' ? (parsed.data.custom_payout_rate ?? null) : null,
    building_category: parsed.data.building_category,
    checklist_always_available: parsed.data.checklist_always_available,
  }

  // Retry once on the (astronomically unlikely) human_id collision.
  let data: { id: string } | null = null
  for (let attempt = 0; attempt < 2 && !data; attempt++) {
    const result = await supabase
      .from('properties')
      .insert({ ...insertRow, human_id: attempt === 0 ? insertRow.human_id : genPropertyId() })
      .select('id')
      .single()
    if (result.error) {
      if (result.error.code === '23505' && attempt === 0) continue
      return { error: result.error.message }
    }
    data = result.data
  }
  if (!data) {
    return { error: 'Could not create the property. Please try again.' }
  }

  const requestedTemplates = await filterTemplatesForTenant(
    supabase,
    targetTenantId,
    templateIdsFromForm(formData)
  )
  const accessError = await replacePropertyChecklistAccess(supabase, data.id, requestedTemplates)
  if (accessError) {
    return { error: accessError.message }
  }
  await ensureOpenInspectionsForProperty(data.id)

  revalidatePath('/admin/properties')
  redirect(`/admin/properties/${data.id}`)
}

export async function updateProperty(
  propertyId: string,
  _prevState: PropertyFormState,
  formData: FormData
): Promise<PropertyFormState> {
  const profile = await requireRole('admin')
  const scope = await getAdminScope()

  const parsed = propertySchema.safeParse(propertyFormFields(formData))

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const supabase = await createClient()

  const updateFields: Database['public']['Tables']['properties']['Update'] = {
    name: parsed.data.name,
    ...addressColumns(parsed.data),
    email: parsed.data.email,
    phone: parsed.data.phone || null,
    notes: parsed.data.notes || null,
    required_schedule: parseScheduleFromForm(formData),
    require_id_photo: parsed.data.require_id_photo,
    enable_gps_geofencing: parsed.data.enable_gps_geofencing,
    latitude: parsed.data.latitude ?? null,
    longitude: parsed.data.longitude ?? null,
    geofence_radius_meters: parsed.data.geofence_radius_meters,
    payout_tier: parsed.data.payout_tier,
    custom_payout_rate: parsed.data.payout_tier === 'custom' ? (parsed.data.custom_payout_rate ?? null) : null,
    building_category: parsed.data.building_category,
    checklist_always_available: parsed.data.checklist_always_available,
  }

  if (profile.is_global_admin && !scope.isViewingTenant && parsed.data.tenant_id !== undefined) {
    updateFields.tenant_id = parsed.data.tenant_id
  }

  const { error } = await supabase
    .from('properties')
    .update(updateFields)
    .eq('id', propertyId)

  if (error) {
    return { error: error.message }
  }

  const { data: saved } = await supabase.from('properties').select('tenant_id').eq('id', propertyId).single()
  const requestedTemplates = await filterTemplatesForTenant(
    supabase,
    saved?.tenant_id ?? null,
    templateIdsFromForm(formData)
  )
  const accessError = await replacePropertyChecklistAccess(supabase, propertyId, requestedTemplates)
  if (accessError) {
    return { error: accessError.message }
  }
  await ensureOpenInspectionsForProperty(propertyId)

  revalidatePath('/admin/properties')
  revalidatePath(`/admin/properties/${propertyId}`)
  revalidatePath('/admin')
  redirect(`/admin/properties/${propertyId}`)
}

export async function deleteProperty(propertyId: string): Promise<{ error?: string } | void> {
  await requireRole('admin')
  const supabase = await createClient()

  const { data: inspections } = await supabase
    .from('inspections')
    .select('id')
    .eq('property_id', propertyId)

  await cleanupInspectionStorage((inspections ?? []).map((i) => i.id))

  const { error } = await supabase.from('properties').delete().eq('id', propertyId)
  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/properties')
  revalidatePath('/admin')
  revalidatePath('/admin/inspections')
  revalidatePath('/admin/reports')
  revalidatePath('/inspector')
}
