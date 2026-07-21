'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { cleanupInspectionStorage } from '@/lib/supabase/storage-cleanup'

const propertySchema = z.object({
  name: z.string().trim().min(1, 'Property name is required'),
  address: z.string().trim().min(1, 'Address is required'),
  email: z.string().trim().email('Enter a valid email'),
})

export type PropertyFormState = { error?: string } | undefined

export async function createProperty(
  _prevState: PropertyFormState,
  formData: FormData
): Promise<PropertyFormState> {
  await requireRole('admin')

  const parsed = propertySchema.safeParse({
    name: formData.get('name'),
    address: formData.get('address'),
    email: formData.get('email'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('properties')
    .insert(parsed.data)
    .select('id')
    .single()

  if (error) {
    return { error: error.message }
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
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('properties')
    .update(parsed.data)
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
