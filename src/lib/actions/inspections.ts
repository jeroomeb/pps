'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireRole, getProfile } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'

const newInspectionSchema = z.object({
  property_id: z.string().uuid(),
  template_id: z.string().uuid(),
  inspector_id: z.string().uuid(),
})

export type InspectionFormState = { error?: string } | undefined

export async function createInspection(
  _prevState: InspectionFormState,
  formData: FormData
): Promise<InspectionFormState> {
  await requireRole('admin')

  const parsed = newInspectionSchema.safeParse({
    property_id: formData.get('property_id'),
    template_id: formData.get('template_id'),
    inspector_id: formData.get('inspector_id'),
  })

  if (!parsed.success) {
    return { error: 'Please choose a checklist type and an inspector.' }
  }

  const supabase = await createClient()

  const { data: inspection, error: inspectionError } = await supabase
    .from('inspections')
    .insert(parsed.data)
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

  revalidatePath(`/admin/properties/${parsed.data.property_id}`)
  redirect(`/admin/properties/${parsed.data.property_id}`)
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
) {
  await getProfile()

  const parsed = itemUpdateSchema.parse(input)
  const supabase = await createClient()

  const { error } = await supabase
    .from('inspection_items')
    .update({
      status: parsed.status,
      comment: parsed.comment || null,
      photo_path: parsed.photo_path ?? undefined,
    })
    .eq('id', itemId)

  if (error) {
    throw new Error(error.message)
  }

  await supabase
    .from('inspections')
    .update({ status: 'in_progress' })
    .eq('id', inspectionId)
    .eq('status', 'pending')

  revalidatePath(`/inspector/inspections/${inspectionId}`)
}
