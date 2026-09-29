'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import type { SpecialistAssignmentRole } from '@/lib/database.types'
import { sendPropertyAssignmentEmail } from '@/lib/email/sendPropertyAssignmentEmail'
import {
  cancelPendingInspectionsForUnassignedSpecialist,
  ensureOpenInspectionsForProperty,
} from '@/lib/standing-inspections'

const assignSchema = z.object({
  property_id: z.string().uuid(),
  specialist_id: z.string().uuid(),
  role: z.enum(['primary', 'backup', 'staff']).default('primary'),
})

export type AssignmentFormState = { error?: string; success?: boolean } | undefined

/**
 * Assigns an Operational Continuity Specialist to a property roster.
 */
export async function assignSpecialistToProperty(
  _prevState: AssignmentFormState,
  formData: FormData
): Promise<AssignmentFormState> {
  const profile = await requireRole('admin')

  const parsed = assignSchema.safeParse({
    property_id: formData.get('property_id'),
    specialist_id: formData.get('specialist_id'),
    role: formData.get('role') || 'primary',
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const supabase = await createClient()

  const { data: specialist, error: specError } = await supabase
    .from('profiles')
    .select('id, full_name, email, status, tenant_id, is_contractor')
    .eq('id', parsed.data.specialist_id)
    .single()

  if (specError || !specialist) {
    return { error: 'Specialist not found.' }
  }

  if (specialist.status === 'inactive') {
    return { error: 'Cannot assign a deactivated specialist.' }
  }

  if (
    !profile.is_global_admin &&
    specialist.tenant_id !== profile.tenant_id &&
    !specialist.is_contractor
  ) {
    return { error: 'Specialist does not belong to your organization.' }
  }

  const { data: property } = await supabase
    .from('properties')
    .select('id, name, address, tenant_id, checklist_always_available')
    .eq('id', parsed.data.property_id)
    .single()

  if (!property) {
    return { error: 'Property not found.' }
  }

  const { data: existing } = await supabase
    .from('property_specialist_assignments')
    .select('id')
    .eq('property_id', parsed.data.property_id)
    .eq('specialist_id', parsed.data.specialist_id)
    .maybeSingle()

  const { error } = await supabase.from('property_specialist_assignments').upsert(
    {
      property_id: parsed.data.property_id,
      specialist_id: parsed.data.specialist_id,
      role: parsed.data.role as SpecialistAssignmentRole,
      tenant_id: property.tenant_id,
    },
    { onConflict: 'property_id,specialist_id' }
  )

  if (error) {
    return { error: error.message }
  }

  await ensureOpenInspectionsForProperty(parsed.data.property_id, parsed.data.specialist_id)

  if (!existing && parsed.data.specialist_id !== profile.id && specialist.email) {
    const { data: access } = await supabase
      .from('property_checklist_access')
      .select('checklist_templates(name)')
      .eq('property_id', parsed.data.property_id)
    const checklistNames = (access ?? [])
      .map((row) => (row.checklist_templates as unknown as { name?: string } | null)?.name)
      .filter((name): name is string => Boolean(name))

    sendPropertyAssignmentEmail({
      to: specialist.email,
      specialistName: specialist.full_name,
      propertyName: property.name,
      propertyAddress: property.address,
      checklistNames,
      alwaysAvailable: property.checklist_always_available,
    }).catch((err) => {
      console.error('[assignSpecialistToProperty] Assignment email failed:', err)
    })
  }

  revalidatePath(`/admin/properties/${parsed.data.property_id}`)
  revalidatePath('/admin/properties')
  revalidatePath('/inspector')
  return { success: true }
}

/**
 * Removes a specialist assignment from a property roster.
 */
export async function removeSpecialistFromProperty(
  propertyId: string,
  specialistId: string
): Promise<{ error?: string; success?: boolean } | void> {
  const profile = await requireRole('admin')
  const supabase = await createClient()

  const { error } = await supabase
    .from('property_specialist_assignments')
    .delete()
    .eq('property_id', propertyId)
    .eq('specialist_id', specialistId)

  if (error) {
    return { error: error.message }
  }

  await cancelPendingInspectionsForUnassignedSpecialist(propertyId, specialistId, profile.id)

  revalidatePath(`/admin/properties/${propertyId}`)
  revalidatePath('/admin/properties')
  revalidatePath('/inspector')
  return { success: true }
}

/**
 * Updates a specialist's role on a property roster ('primary', 'backup', 'staff').
 */
export async function updateSpecialistRosterRole(
  propertyId: string,
  specialistId: string,
  role: SpecialistAssignmentRole
): Promise<{ error?: string; success?: boolean } | void> {
  await requireRole('admin')
  const supabase = await createClient()

  const { error } = await supabase
    .from('property_specialist_assignments')
    .update({ role })
    .eq('property_id', propertyId)
    .eq('specialist_id', specialistId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/properties/${propertyId}`)
  return { success: true }
}

/**
 * Toggles whether a property mandates Driver's License ID verification photos.
 */
export async function togglePropertyIdRequirement(
  propertyId: string,
  requireIdPhoto: boolean
): Promise<{ error?: string; success?: boolean } | void> {
  await requireRole('admin')
  const supabase = await createClient()

  const { error } = await supabase
    .from('properties')
    .update({ require_id_photo: requireIdPhoto })
    .eq('id', propertyId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/properties/${propertyId}`)
  revalidatePath(`/admin/properties/${propertyId}/edit`)
  revalidatePath('/inspector/profile')
  return { success: true }
}
