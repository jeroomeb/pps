import 'server-only'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * Opens a pending inspection for each enabled checklist on a property.
 *
 * Assignment is to the property. When 24/7 access is on, a completed visit
 * is replaced by a new pending copy. When it is off, a completed checklist
 * is not reopened.
 */
export async function ensureOpenInspectionsForProperty(
  propertyId: string,
  specialistId?: string
) {
  const admin = createAdminClient()

  const [{ data: property }, { data: access }, { data: roster }] = await Promise.all([
    admin
      .from('properties')
      .select('id, tenant_id, checklist_always_available')
      .eq('id', propertyId)
      .single(),
    admin.from('property_checklist_access').select('template_id').eq('property_id', propertyId),
    specialistId
      ? Promise.resolve({ data: [{ specialist_id: specialistId }] })
      : admin
          .from('property_specialist_assignments')
          .select('specialist_id')
          .eq('property_id', propertyId),
  ])

  if (!property || !access?.length || !roster?.length) return

  for (const member of roster) {
    for (const row of access) {
      await openInspectionIfNeeded({
        propertyId,
        tenantId: property.tenant_id,
        specialistId: member.specialist_id,
        templateId: row.template_id,
        alwaysAvailable: property.checklist_always_available,
      })
    }
  }
}

/** After a 24/7 checklist is submitted, put a fresh pending copy on the board. */
export async function renewStandingInspection(
  propertyId: string,
  specialistId: string,
  templateId: string
) {
  const admin = createAdminClient()
  const [{ data: property }, { data: access }, { data: assignment }] = await Promise.all([
    admin
      .from('properties')
      .select('tenant_id, checklist_always_available')
      .eq('id', propertyId)
      .single(),
    admin
      .from('property_checklist_access')
      .select('template_id')
      .eq('property_id', propertyId)
      .eq('template_id', templateId)
      .maybeSingle(),
    admin
      .from('property_specialist_assignments')
      .select('id')
      .eq('property_id', propertyId)
      .eq('specialist_id', specialistId)
      .maybeSingle(),
  ])

  if (!property?.checklist_always_available || !access || !assignment) return

  await openInspectionIfNeeded({
    propertyId,
    tenantId: property.tenant_id,
    specialistId,
    templateId,
    alwaysAvailable: true,
  })
}

/** Pending work for a specialist who was removed from the property is called off. */
export async function cancelPendingInspectionsForUnassignedSpecialist(
  propertyId: string,
  specialistId: string,
  cancelledBy: string
) {
  const admin = createAdminClient()
  await admin
    .from('inspections')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancelled_by: cancelledBy,
      cancellation_reason: 'Specialist was removed from this property.',
    })
    .eq('property_id', propertyId)
    .eq('inspector_id', specialistId)
    .eq('status', 'pending')
}

async function openInspectionIfNeeded({
  propertyId,
  tenantId,
  specialistId,
  templateId,
  alwaysAvailable,
}: {
  propertyId: string
  tenantId: string | null
  specialistId: string
  templateId: string
  alwaysAvailable: boolean
}) {
  const admin = createAdminClient()

  const { data: existing } = await admin
    .from('inspections')
    .select('id, status')
    .eq('property_id', propertyId)
    .eq('inspector_id', specialistId)
    .eq('template_id', templateId)
    .in('status', ['pending', 'in_progress', 'completed'])

  const rows = existing ?? []
  if (rows.some((row) => row.status === 'pending' || row.status === 'in_progress')) return
  if (!alwaysAvailable && rows.some((row) => row.status === 'completed')) return

  const { data: templateItems, error: itemsLookupError } = await admin
    .from('checklist_template_items')
    .select('id, service_category, item_name, description, sort_order')
    .eq('template_id', templateId)
    .order('sort_order')

  if (itemsLookupError || !templateItems?.length) return

  const { data: inspection, error: inspectionError } = await admin
    .from('inspections')
    .insert({
      property_id: propertyId,
      template_id: templateId,
      inspector_id: specialistId,
      tenant_id: tenantId,
      scheduled_for: null,
    })
    .select('id')
    .single()

  if (inspectionError || !inspection) {
    console.error('[standing-inspections] Could not open checklist:', inspectionError)
    return
  }

  const { error: itemsError } = await admin.from('inspection_items').insert(
    templateItems.map((item) => ({
      inspection_id: inspection.id,
      template_item_id: item.id,
      service_category: item.service_category,
      item_name: item.item_name,
      description: item.description,
      sort_order: item.sort_order,
    }))
  )

  if (itemsError) {
    await admin.from('inspections').delete().eq('id', inspection.id)
    console.error('[standing-inspections] Could not snapshot checklist items:', itemsError)
  }
}
