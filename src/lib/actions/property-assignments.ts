'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import type { SpecialistAssignmentRole } from '@/lib/database.types'

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

  // Verify specialist exists and is active
  const { data: specialist, error: specError } = await supabase
    .from('profiles')
    .select('id, full_name, status, tenant_id, is_contractor')
    .eq('id', parsed.data.specialist_id)
    .single()

  if (specError || !specialist) {
    return { error: 'Specialist not found.' }
  }

  if (specialist.status === 'inactive') {
    return { error: 'Cannot assign a deactivated specialist.' }
  }

  // Cross-tenant verification:
  // Must belong to the same tenant OR be part of the global independent contractor pool
  if (
    !profile.is_global_admin &&
    specialist.tenant_id !== profile.tenant_id &&
    !specialist.is_contractor
  ) {
    return { error: 'Specialist does not belong to your organization.' }
  }

  const { error } = await supabase.from('property_specialist_assignments').upsert(
    {
      property_id: parsed.data.property_id,
      specialist_id: parsed.data.specialist_id,
      role: parsed.data.role as SpecialistAssignmentRole,
      tenant_id: profile.tenant_id ?? null,
    },
    { onConflict: 'property_id,specialist_id' }
  )

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/properties/${parsed.data.property_id}`)
  revalidatePath('/admin/properties')
  revalidatePath('/admin/inspections/new')
  return { success: true }
}

/**
 * Removes a specialist assignment from a property roster.
 */
export async function removeSpecialistFromProperty(
  propertyId: string,
  specialistId: string
): Promise<{ error?: string; success?: boolean } | void> {
  await requireRole('admin')
  const supabase = await createClient()

  const { error } = await supabase
    .from('property_specialist_assignments')
    .delete()
    .eq('property_id', propertyId)
    .eq('specialist_id', specialistId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/properties/${propertyId}`)
  revalidatePath('/admin/properties')
  revalidatePath('/admin/inspections/new')
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
