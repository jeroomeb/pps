'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireRole, getProfile } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { cleanupInspectionStorage } from '@/lib/supabase/storage-cleanup'
import { sendAssignmentEmail } from '@/lib/email/sendAssignmentEmail'
import { sendCancellationEmail } from '@/lib/email/sendCancellationEmail'
import { parseZonedDateTimeLocal } from '@/lib/timezone'
import { isSafeObjectPath } from '@/lib/storage-paths'

const newInspectionSchema = z.object({
  property_id: z.string().uuid(),
  template_id: z.string().uuid(),
  inspector_id: z.string().uuid(),
  // datetime-local string ("2026-08-01T09:00") or empty.
  scheduled_for: z.string().trim().optional(),
})

export type InspectionFormState = { error?: string } | undefined

/**
 * What actually happened to the specialist's cancellation email.
 *
 * `skipped-self` is not a failure — an admin cancelling an inspection assigned
 * to themselves has no one to tell. The others are real "nobody was told"
 * states the admin needs to see, because the specialist will otherwise turn up
 * at the property.
 */
export type CancelNotification = 'sent' | 'skipped-self' | 'failed' | 'no-address'

export type CancelInspectionState =
  | { error?: string; notification?: CancelNotification }
  | undefined

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
    // The `datetime-local` input carries no timezone of its own — interpret
    // it as APP_TIMEZONE wall-clock time, not the server's own timezone.
    const d = parseZonedDateTimeLocal(parsed.data.scheduled_for)
    if (!d || Number.isNaN(d.getTime())) {
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
  revalidatePath('/admin')
  revalidatePath('/admin/inspections')
  revalidatePath('/inspector')

  // Self-assigned inspections go straight into the checklist — no extra clicks.
  if (parsed.data.inspector_id === profile.id) {
    redirect(`/inspector/inspections/${inspection.id}`)
  }
  redirect(`/admin/properties/${parsed.data.property_id}`)
}

const updateInspectionSchema = z.object({
  inspector_id: z.string().uuid(),
  scheduled_for: z.string().trim().optional(),
})

/**
 * Admin edit of an existing inspection: reschedule it or reassign the
 * specialist. `template_id` is deliberately NOT editable — checklist items are
 * snapshotted into inspection_items at creation, so swapping the template would
 * leave the inspection's own item copies inconsistent with its label.
 */
export async function updateInspection(
  inspectionId: string,
  _prevState: InspectionFormState,
  formData: FormData
): Promise<InspectionFormState> {
  await requireRole('admin')

  const parsed = updateInspectionSchema.safeParse({
    inspector_id: formData.get('inspector_id'),
    scheduled_for: formData.get('scheduled_for'),
  })

  if (!parsed.success) {
    return { error: 'Please choose a specialist.' }
  }

  let scheduledForIso: string | null = null
  if (parsed.data.scheduled_for) {
    // The `datetime-local` input carries no timezone of its own — interpret
    // it as APP_TIMEZONE wall-clock time, not the server's own timezone.
    const d = parseZonedDateTimeLocal(parsed.data.scheduled_for)
    if (!d || Number.isNaN(d.getTime())) {
      return { error: 'That scheduled date/time is not valid.' }
    }
    scheduledForIso = d.toISOString()
  }

  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('inspections')
    .select('status, inspector_id, property_id, template_id')
    .eq('id', inspectionId)
    .single()

  if (!existing) {
    return { error: 'Inspection not found.' }
  }
  // Completed inspections are frozen — the emailed report is the record of truth.
  if (existing.status === 'completed') {
    return { error: 'This inspection is completed and can no longer be edited.' }
  }
  // Cancelled inspections are frozen too — restore it first, then reschedule.
  if (existing.status === 'cancelled') {
    return { error: 'This inspection is cancelled. Restore it before rescheduling.' }
  }

  const { error } = await supabase
    .from('inspections')
    .update({ inspector_id: parsed.data.inspector_id, scheduled_for: scheduledForIso })
    .eq('id', inspectionId)
    .neq('status', 'completed')

  if (error) {
    return { error: error.message }
  }

  // Notify the new assignee on reassignment. Best-effort — a mail failure must
  // not fail the edit.
  if (parsed.data.inspector_id !== existing.inspector_id) {
    try {
      const [{ data: assignee }, { data: property }, { data: template }] = await Promise.all([
        supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', parsed.data.inspector_id)
          .single(),
        supabase.from('properties').select('name, address').eq('id', existing.property_id).single(),
        supabase.from('checklist_templates').select('name').eq('id', existing.template_id).single(),
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
      console.error('Reassignment email failed:', err)
    }
  }

  revalidatePath('/admin')
  revalidatePath('/admin/inspections')
  revalidatePath(`/admin/properties/${existing.property_id}`)
  revalidatePath('/inspector')
  redirect(`/admin/properties/${existing.property_id}`)
}

/**
 * Cancel a scheduled or in-progress inspection.
 *
 * This is a SOFT state change, not a delete: inspections are an audit record,
 * so who cancelled it, when, and why all survive. `deleteInspection` below is
 * still the escape hatch for a genuine mistake, and destroys everything.
 *
 * Once cancelled the inspection is frozen the same way a completed one is —
 * enforced in three places, matching the existing completed-inspection
 * pattern: RLS (`inspection_items` + `inspections_update`, migration 0006),
 * `saveInspectionItem` below, and the submit route.
 */
export async function cancelInspection(
  inspectionId: string,
  _prevState: CancelInspectionState,
  formData: FormData
): Promise<CancelInspectionState> {
  const profile = await requireRole('admin')

  const rawReason = formData.get('reason')
  const reason = typeof rawReason === 'string' ? rawReason.trim().slice(0, 500) : ''

  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('inspections')
    .select('status, inspector_id, property_id, template_id, scheduled_for')
    .eq('id', inspectionId)
    .single()

  if (!existing) {
    return { error: 'Inspection not found.' }
  }
  if (existing.status === 'completed') {
    return {
      error:
        'This inspection is already completed — its report is the record of truth. Delete it from Reports if it must be removed.',
    }
  }
  if (existing.status === 'cancelled') {
    return { error: 'This inspection is already cancelled.' }
  }

  const { error } = await supabase
    .from('inspections')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancelled_by: profile.id,
      cancellation_reason: reason || null,
    })
    .eq('id', inspectionId)
    // Belt-and-suspenders against a race with a specialist submitting: never
    // let a cancel land on a row that reached `completed` in the meantime.
    .neq('status', 'completed')

  if (error) {
    return { error: error.message }
  }

  // Tell the assigned specialist it's off — they already got an assignment
  // email, and without this they'd show up at the property. Best-effort: a
  // mail failure must never fail the cancellation, which has already been
  // committed above.
  //
  // The outcome is REPORTED BACK rather than only logged. Swallowing it meant
  // the UI claimed "the specialist has been notified" even when no email was
  // sent — after a self-assigned cancel (skipped by design), after a Resend
  // failure, and when the specialist has no address on file. The dangerous
  // case is a genuine cancellation the specialist never hears about while the
  // admin is told they did: they turn up at the property.
  let notification: CancelNotification = 'sent'

  if (existing.inspector_id === profile.id) {
    // Self-assigned — emailing yourself about your own cancellation is noise.
    notification = 'skipped-self'
  } else {
    try {
      const [{ data: assignee }, { data: property }, { data: template }] = await Promise.all([
        supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', existing.inspector_id)
          .single(),
        supabase.from('properties').select('name, address').eq('id', existing.property_id).single(),
        supabase.from('checklist_templates').select('name').eq('id', existing.template_id).single(),
      ])
      if (!assignee?.email) {
        notification = 'no-address'
      } else {
        await sendCancellationEmail({
          to: assignee.email,
          specialistName: assignee.full_name,
          propertyName: property?.name ?? 'a property',
          propertyAddress: property?.address ?? '',
          checklistName: template?.name ?? 'an inspection',
          scheduledFor: existing.scheduled_for,
          reason: reason || null,
        })
      }
    } catch (err) {
      console.error('Cancellation email failed:', err)
      notification = 'failed'
    }
  }

  revalidatePath('/admin')
  revalidatePath('/admin/inspections')
  revalidatePath(`/admin/inspections/${inspectionId}/edit`)
  revalidatePath(`/admin/properties/${existing.property_id}`)
  revalidatePath('/inspector')
  revalidatePath(`/inspector/inspections/${inspectionId}`)

  return { notification }
}

/**
 * Undo a cancellation. Restores to `pending`, never to `in_progress` —
 * `saveInspectionItem` promotes pending → in_progress on the next item save
 * (it is scoped `.eq('status','pending')`), so any answers captured before the
 * cancellation are untouched and the status self-corrects on the next edit.
 */
export async function restoreInspection(
  inspectionId: string
): Promise<{ error?: string } | void> {
  await requireRole('admin')
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('inspections')
    .select('status, property_id')
    .eq('id', inspectionId)
    .single()

  if (!existing) {
    return { error: 'Inspection not found.' }
  }
  if (existing.status !== 'cancelled') {
    return { error: 'This inspection is not cancelled.' }
  }

  const { error } = await supabase
    .from('inspections')
    .update({
      status: 'pending',
      cancelled_at: null,
      cancelled_by: null,
      cancellation_reason: null,
    })
    .eq('id', inspectionId)
    .eq('status', 'cancelled')

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin')
  revalidatePath('/admin/inspections')
  revalidatePath(`/admin/inspections/${inspectionId}/edit`)
  revalidatePath(`/admin/properties/${existing.property_id}`)
  revalidatePath('/inspector')
  revalidatePath(`/inspector/inspections/${inspectionId}`)
}

export async function deleteInspection(
  inspectionId: string
): Promise<{ error?: string } | void> {
  await requireRole('admin')
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('inspections')
    .select('property_id')
    .eq('id', inspectionId)
    .single()

  await cleanupInspectionStorage([inspectionId])

  const { error } = await supabase.from('inspections').delete().eq('id', inspectionId)
  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin')
  revalidatePath('/admin/reports')
  revalidatePath('/admin/inspections')
  revalidatePath('/inspector')
  if (existing?.property_id) {
    revalidatePath(`/admin/properties/${existing.property_id}`)
  }
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
  // Cancelled mid-inspection: a specialist may still have the checklist open
  // from before the admin cancelled it. Stop the write here rather than
  // letting them keep filling in an inspection that will never be submitted.
  if (inspection.status === 'cancelled') {
    return { error: 'This inspection has been cancelled by an administrator.' }
  }
  // Specialists can't start before the scheduled time; admins can (they own the
  // schedule and may need to run or correct an inspection early).
  if (
    profile.role !== 'admin' &&
    inspection.scheduled_for &&
    new Date(inspection.scheduled_for) > new Date()
  ) {
    return { error: 'This inspection cannot be started before its scheduled time.' }
  }

  // A client-supplied photo path must belong to THIS inspection's folder —
  // otherwise a caller could point an item at another inspection's (or
  // another bucket's, via traversal) object.
  if (
    parsed.data.photo_path &&
    !isSafeObjectPath(parsed.data.photo_path, inspectionId)
  ) {
    return { error: 'Invalid photo reference.' }
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
    // Belt-and-suspenders: authorization above is checked against
    // `inspectionId`, so the write must be scoped to that same inspection —
    // otherwise a caller could pass a mismatched itemId/inspectionId pair.
    .eq('inspection_id', inspectionId)

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
