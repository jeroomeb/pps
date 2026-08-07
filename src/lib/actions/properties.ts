'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { cleanupInspectionStorage } from '@/lib/supabase/storage-cleanup'
import { genPropertyId } from '@/lib/ids'
import type { ScheduleEntry } from '@/lib/schedule'
import { composeAddress, normalizeAddressParts } from '@/lib/address'

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
  }
}

export async function createProperty(
  _prevState: PropertyFormState,
  formData: FormData
): Promise<PropertyFormState> {
  await requireRole('admin')

  const parsed = propertySchema.safeParse(propertyFormFields(formData))

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const supabase = await createClient()
  const insertRow = {
    name: parsed.data.name,
    ...addressColumns(parsed.data),
    email: parsed.data.email,
    phone: parsed.data.phone || null,
    notes: parsed.data.notes || null,
    required_schedule: parseScheduleFromForm(formData),
    human_id: genPropertyId(),
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

  revalidatePath('/admin/properties')
  redirect(`/admin/properties/${data.id}`)
}

export async function updateProperty(
  propertyId: string,
  _prevState: PropertyFormState,
  formData: FormData
): Promise<PropertyFormState> {
  await requireRole('admin')

  const parsed = propertySchema.safeParse(propertyFormFields(formData))

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('properties')
    .update({
      name: parsed.data.name,
      ...addressColumns(parsed.data),
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      notes: parsed.data.notes || null,
      required_schedule: parseScheduleFromForm(formData),
    })
    .eq('id', propertyId)

  if (error) {
    return { error: error.message }
  }

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
