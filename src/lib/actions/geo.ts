'use server'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/dal'
import { evaluateGeofence } from '@/lib/geo'

export type BreadcrumbPayload = {
  inspectionId: string
  propertyId: string
  latitude: number
  longitude: number
  speed?: number | null
  accuracy?: number | null
}

export type BreadcrumbResult = {
  success: boolean
  isInside?: boolean
  distanceMeters?: number
  arrivedAt?: string | null
  error?: string
}

/**
 * Logs a specialist's live geographic coordinate breadcrumb,
 * evaluates proximity against the property's geofence perimeter,
 * and automatically captures the arrival timestamp when within range.
 */
export async function logInspectionGeoBreadcrumb(
  payload: BreadcrumbPayload
): Promise<BreadcrumbResult> {
  const profile = await getProfile()
  if (!profile) {
    return { success: false, error: 'Unauthorized' }
  }

  const supabase = await createClient()

  // 1. Fetch property coordinates & GPS configuration
  const { data: property, error: propError } = await supabase
    .from('properties')
    .select('id, enable_gps_geofencing, latitude, longitude, geofence_radius_meters, tenant_id')
    .eq('id', payload.propertyId)
    .single()

  if (propError || !property) {
    return { success: false, error: 'Property not found' }
  }

  // If GPS is disabled for this property, mark as exempt and exit
  if (!property.enable_gps_geofencing) {
    await supabase
      .from('inspections')
      .update({ geofence_status: 'exempt' })
      .eq('id', payload.inspectionId)
      .eq('geofence_status', 'pending')

    return { success: true, isInside: true }
  }

  // 2. Evaluate Geofence boundary
  const geofence = evaluateGeofence(
    payload.latitude,
    payload.longitude,
    property.latitude,
    property.longitude,
    property.geofence_radius_meters || 100
  )

  const isInside = geofence ? geofence.isInside : false
  const distanceMeters = geofence ? geofence.distanceMeters : null

  // 3. Log breadcrumb point
  await supabase.from('inspection_geo_logs').insert({
    tenant_id: property.tenant_id ?? profile.tenant_id ?? null,
    inspection_id: payload.inspectionId,
    specialist_id: profile.id,
    property_id: property.id,
    latitude: payload.latitude,
    longitude: payload.longitude,
    speed_meters_per_sec: payload.speed ?? null,
    accuracy_meters: payload.accuracy ?? null,
    distance_to_center_meters: distanceMeters,
    is_inside_geofence: isInside,
  })

  // 4. Fetch current inspection state to check arrival
  const { data: inspection } = await supabase
    .from('inspections')
    .select('id, arrived_at, status')
    .eq('id', payload.inspectionId)
    .single()

  let arrivedAt = inspection?.arrived_at ?? null

  // If inside the geofence and arrived_at is not set yet, automatically capture arrival!
  if (isInside && !arrivedAt && inspection?.status !== 'completed' && inspection?.status !== 'cancelled') {
    const nowIso = new Date().toISOString()
    const { error: updateError } = await supabase
      .from('inspections')
      .update({
        arrived_at: nowIso,
        geofence_status: 'verified',
      })
      .eq('id', payload.inspectionId)

    if (!updateError) {
      arrivedAt = nowIso
    }
  } else if (!isInside && !arrivedAt) {
    // Specialist is active but outside perimeter
    await supabase
      .from('inspections')
      .update({
        geofence_status: 'outside',
      })
      .eq('id', payload.inspectionId)
      .eq('geofence_status', 'pending')
  }

  return {
    success: true,
    isInside,
    distanceMeters: distanceMeters ?? undefined,
    arrivedAt,
  }
}

/**
 * Records departure and calculates dwell time when an audit is completed or departed.
 */
export async function recordInspectionDeparture(
  inspectionId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: inspection, error } = await supabase
    .from('inspections')
    .select('id, arrived_at, departed_at')
    .eq('id', inspectionId)
    .single()

  if (error || !inspection) {
    return { success: false, error: 'Inspection not found' }
  }

  const departedAt = new Date().toISOString()
  let dwellSeconds: number | null = null

  if (inspection.arrived_at) {
    const start = new Date(inspection.arrived_at).getTime()
    const end = new Date(departedAt).getTime()
    dwellSeconds = Math.max(0, Math.round((end - start) / 1000))
  }

  await supabase
    .from('inspections')
    .update({
      departed_at: departedAt,
      dwell_time_seconds: dwellSeconds,
    })
    .eq('id', inspectionId)

  return { success: true }
}

/**
 * Fetches geo logs and presence metrics for a given inspection.
 */
export async function getInspectionGeoTelemetry(inspectionId: string) {
  const supabase = await createClient()

  const { data: logs, error } = await supabase
    .from('inspection_geo_logs')
    .select('*')
    .eq('inspection_id', inspectionId)
    .order('logged_at', { ascending: true })

  if (error) {
    return { logs: [], error: error.message }
  }

  return { logs: logs ?? [], error: null }
}
