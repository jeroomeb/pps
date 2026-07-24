'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { cleanupInspectionStorage } from '@/lib/supabase/storage-cleanup'
import { genPropertyId } from '@/lib/ids'
import type { ScheduleEntry } from '@/lib/schedule'

const propertySchema = z.object({
  name: z.string().trim().min(1, 'Property name is required'),
  address: z.string().trim().min(1, 'Address is required'),
  email: z.string().trim().email('Enter a valid email'),
  phone: z.string().trim().optional(),
  notes: z.string().trim().optional(),
})

export type PropertyFormState = { error?: string } | undefined

// Schedule checkboxes are submitted as `schedule=<ordinal>-<weekday>` values.
function parseScheduleFromForm(formData: FormData): ScheduleEntry[] {
  const seen = new Set<string>()
  const out: ScheduleEntry[] = []
  for (const raw of formData.getAll('schedule')) {
    if (typeof raw !== 'string' || seen.has(raw)) continue
    seen.add(raw)
    const [o, w] = raw.split('-').map((n) => Number(n))
    if (o >= 1 && o <= 5 && w >= 0 && w <= 6) out.push({ ordinal: o, weekday: w })
  }
  return out
}

export async function createProperty(
  _prevState: PropertyFormState,
  formData: FormData
): Promise<PropertyFormState> {
  await requireRole('admin')

  const parsed = propertySchema.safeParse({
    name: formData.get('name'),
    address: formData.get('address'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    notes: formData.get('notes'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const supabase = await createClient()
  const insertRow = {
    name: parsed.data.name,
    address: parsed.data.address,
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

  const parsed = propertySchema.safeParse({
    name: formData.get('name'),
    address: formData.get('address'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    notes: formData.get('notes'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('properties')
    .update({
      name: parsed.data.name,
      address: parsed.data.address,
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
}
