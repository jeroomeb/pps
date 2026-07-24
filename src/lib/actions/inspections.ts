'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireRole, getProfile } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { cleanupInspectionStorage } from '@/lib/supabase/storage-cleanup'
import { sendAssignmentEmail } from '@/lib/email/sendAssignmentEmail'

const newInspectionSchema = z.object({
  property_id: z.string().uuid(),
  template_id: z.string().uuid(),
  inspector_id: z.string().uuid(),
  // datetime-local string ("2026-08-01T09:00") or empty.
  scheduled_for: z.string().trim().optional(),
})

export type InspectionFormState = { error?: string } | undefined

export async function createInspection(
  _prevState: InspectionFormState,
  formData: FormData
): Promise<InspectionFormState> {
  const profile = await requireRole('admin')

  const parsed = newInspectionSchema.safeParse({
    property_id: formData.get('property_id'),
    template_id: formData.get('template_id'),
    inspector_id: formData.get('inspector_id'),
    scheduled_for: formData.get('scheduled_for'),
  })

  if (!parsed.success) {
    return { error: 'Please choose a checklist type and a specialist.' }
  }

  let scheduledForIso: string | null = null
  if (parsed.data.scheduled_for) {
    const d = new Date(parsed.data.scheduled_for)
    if (Number.isNaN(d.getTime())) {
      return { error: 'That scheduled date/time is not valid.' }
    }
    scheduledForIso = d.toISOString()
  }

  const supabase = await createClient()

  const { data: inspection, error: inspectionError } = await supabase
    .from('inspections')
    .insert({
      property_id: parsed.data.property_id,
      template_id: parsed.data.template_id,
      inspector_id: parsed.data.inspector_id,
      scheduled_for: scheduledForIso,
    })
    .select('id')
    .single()

  if (inspectionError) {
    return { error: inspectionError.message }
  }

  const { data: templateItems, error: templateItemsError } = await supabase
    .from('checklist_template_items')
    .select('id, service_category, item_name, description, sort_order')
    .eq('template_id', parsed.data.template_id)
    .order('sort_order')

  if (templateItemsError || !templateItems?.length) {
    await supabase.from('inspections').delete().eq('id', inspection.id)
    return { error: 'That checklist type has no items configured yet.' }
  }

  const { error: itemsError } = await supabase.from('inspection_items').insert(
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
    await supabase.from('inspections').delete().eq('id', inspection.id)
    return { error: itemsError.message }
  }

  // Notify the assigned specialist (unless the admin assigned themselves).
  // Best-effort — a mail failure must not fail the assignment.
  if (parsed.data.inspector_id !== profile.id) {
    try {
      const [{ data: assignee }, { data: property }, { data: template }] = await Promise.all([
        supabase.from('profiles').select('full_name, email').eq('id', parsed.data.inspector_id).single(),
        supabase.from('properties').select('name, address').eq('id', parsed.data.property_id).single(),
        supabase.from('checklist_templates').select('name').eq('id', parsed.data.template_id).single(),
      ])
      if (assignee?.email) {
        await sendAssignmentEmail({
          to: assignee.email,
          specialistName: assignee.full_name,
          propertyName: property?.name ?? 'a property',
          propertyAddress: property?.address ?? '',
          checklistName: template?.name ?? 'an inspection',
          scheduledFor: scheduledForIso,
        })
      }
    } catch (err) {
      console.error('Assignment email failed:', err)
    }
  }

  revalidatePath(`/admin/properties/${parsed.data.property_id}`)
  revalidatePath('/inspector')

  // Self-assigned inspections go straight into the checklist — no extra clicks.
  if (parsed.data.inspector_id === profile.id) {
    redirect(`/inspector/inspections/${inspection.id}`)
  }
  redirect(`/admin/properties/${parsed.data.property_id}`)
}

export async function deleteInspection(
  inspectionId: string
): Promise<{ error?: string } | void> {
  await requireRole('admin')
  const supabase = await createClient()

  await cleanupInspectionStorage([inspectionId])

  const { error } = await supabase.from('inspections').delete().eq('id', inspectionId)
  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin')
  revalidatePath('/admin/reports')
  revalidatePath('/inspector')
}

const itemUpdateSchema = z.object({
  status: z.enum(['pass', 'fail', 'na']).nullable(),
  comment: z.string().trim().optional(),
  photo_path: z.string().trim().nullable().optional(),
})

export async function saveInspectionItem(
  itemId: string,
  inspectionId: string,
  input: {
    status: 'pass' | 'fail' | 'na' | null
    comment?: string
    photo_path?: string | null
  }
): Promise<{ error?: string } | void> {
  // Returns { error } instead of throwing: server-action throw messages are
  // masked in production, and the autosave UI needs the real reason.
  const profile = await getProfile()

  const parsed = itemUpdateSchema.safeParse(input)
  if (!parsed.success) {
    return { error: 'Invalid input.' }
  }
  const supabase = await createClient()

  const { data: inspection } = await supabase
    .from('inspections')
    .select('status, inspector_id, scheduled_for')
    .eq('id', inspectionId)
    .single()

  if (!inspection) {
    return { error: 'Inspection not found.' }
  }
  if (profile.role !== 'admin' && inspection.inspector_id !== profile.id) {
    return { error: 'You are not assigned to this inspection.' }
  }
  if (inspection.status === 'completed') {
    return { error: 'This inspection has already been submitted and can no longer be edited.' }
  }
  if (inspection.scheduled_for && new Date(inspection.scheduled_for) > new Date()) {
    return { error: 'This inspection cannot be started before its scheduled time.' }
  }

  const { error } = await supabase
    .from('inspection_items')
    .update({
      status: parsed.data.status,
      comment: parsed.data.comment || null,
      // undefined = leave untouched; explicit null clears the photo
      photo_path: parsed.data.photo_path,
    })
    .eq('id', itemId)

  if (error) {
    return { error: error.message }
  }

  await supabase
    .from('inspections')
    .update({ status: 'in_progress' })
    .eq('id', inspectionId)
    .eq('status', 'pending')

  revalidatePath(`/inspector/inspections/${inspectionId}`)
}
