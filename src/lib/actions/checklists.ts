'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'

const itemSchema = z.object({
  service_category: z.string().trim().min(1),
  item_name: z.string().trim().min(1),
  description: z.string().trim().optional(),
})

const templateSchema = z.object({
  name: z.string().trim().min(1, 'Checklist name is required'),
  items: z
    .array(itemSchema)
    .min(1, 'Add at least one checklist item'),
})

export type TemplateFormState = { error?: string } | undefined

export async function createTemplate(
  _prevState: TemplateFormState,
  formData: FormData
): Promise<TemplateFormState> {
  await requireRole('admin')

  let items: unknown
  try {
    items = JSON.parse(String(formData.get('items') ?? '[]'))
  } catch {
    return { error: 'Could not read checklist items.' }
  }

  const parsed = templateSchema.safeParse({
    name: formData.get('name'),
    items,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const supabase = await createClient()

  const { data: template, error: templateError } = await supabase
    .from('checklist_templates')
    .insert({ name: parsed.data.name })
    .select('id')
    .single()

  if (templateError) {
    return { error: templateError.message }
  }

  const { error: itemsError } = await supabase
    .from('checklist_template_items')
    .insert(
      parsed.data.items.map((item, index) => ({
        template_id: template.id,
        service_category: item.service_category,
        item_name: item.item_name,
        description: item.description || null,
        sort_order: index,
      }))
    )

  if (itemsError) {
    return { error: itemsError.message }
  }

  revalidatePath('/admin/checklists')
  redirect(`/admin/checklists/${template.id}`)
}

export async function addTemplateItem(
  templateId: string,
  _prevState: TemplateFormState,
  formData: FormData
): Promise<TemplateFormState> {
  await requireRole('admin')

  const parsed = itemSchema.safeParse({
    service_category: formData.get('service_category'),
    item_name: formData.get('item_name'),
    description: formData.get('description') ?? '',
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const supabase = await createClient()

  const { count } = await supabase
    .from('checklist_template_items')
    .select('id', { count: 'exact', head: true })
    .eq('template_id', templateId)

  const { error } = await supabase.from('checklist_template_items').insert({
    template_id: templateId,
    service_category: parsed.data.service_category,
    item_name: parsed.data.item_name,
    description: parsed.data.description || null,
    sort_order: count ?? 0,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/checklists/${templateId}`)
}

export async function deleteTemplateItem(itemId: string, templateId: string) {
  await requireRole('admin')
  const supabase = await createClient()
  await supabase.from('checklist_template_items').delete().eq('id', itemId)
  revalidatePath(`/admin/checklists/${templateId}`)
}
