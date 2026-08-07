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

export type TemplateFormState = { error?: string; success?: boolean } | undefined

const FRIENDLY_DUPLICATE_NAME =
  'A checklist with that name already exists — pick a different name.'

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
    return {
      error: templateError.code === '23505' ? FRIENDLY_DUPLICATE_NAME : templateError.message,
    }
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
    // Don't leave an orphan template behind — it would block a retry with
    // the same name via the unique constraint.
    await supabase.from('checklist_templates').delete().eq('id', template.id)
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

  // max+1 (not count) so deletions never produce duplicate sort_orders
  const { data: lastItem } = await supabase
    .from('checklist_template_items')
    .select('sort_order')
    .eq('template_id', templateId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { error } = await supabase.from('checklist_template_items').insert({
    template_id: templateId,
    service_category: parsed.data.service_category,
    item_name: parsed.data.item_name,
    description: parsed.data.description || null,
    sort_order: (lastItem?.sort_order ?? -1) + 1,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/checklists/${templateId}`)
  return { success: true }
}

export async function deleteTemplateItem(
  itemId: string,
  templateId: string
): Promise<{ error?: string } | void> {
  await requireRole('admin')
  const supabase = await createClient()
  const { error } = await supabase.from('checklist_template_items').delete().eq('id', itemId)
  if (error) {
    if (error.code === '23503') {
      return {
        error:
          'This item is referenced by existing inspections and can’t be removed. Delete those inspections first.',
      }
    }
    return { error: error.message }
  }
  revalidatePath(`/admin/checklists/${templateId}`)
}

export async function renameTemplate(
  templateId: string,
  _prevState: TemplateFormState,
  formData: FormData
): Promise<TemplateFormState> {
  await requireRole('admin')

  const name = String(formData.get('name') ?? '').trim()
  if (!name) {
    return { error: 'Checklist name is required.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('checklist_templates')
    .update({ name })
    .eq('id', templateId)

  if (error) {
    return { error: error.code === '23505' ? FRIENDLY_DUPLICATE_NAME : error.message }
  }

  revalidatePath('/admin/checklists')
  revalidatePath(`/admin/checklists/${templateId}`)
}

/**
 * Persist a new item order for a template (drag/reorder UI). `orderedIds`
 * must be the full, exact set of the template's current item ids — rejected
 * otherwise, so a stale client can't drop or duplicate items. Only the
 * template's `sort_order` changes; existing inspections already snapshotted
 * their own item order into `inspection_items` at creation and are
 * unaffected (see createInspection in lib/actions/inspections.ts).
 */
export async function reorderTemplateItems(
  templateId: string,
  orderedIds: string[]
): Promise<{ error?: string } | void> {
  await requireRole('admin')
  const supabase = await createClient()

  const { data: existing, error: fetchError } = await supabase
    .from('checklist_template_items')
    .select('id, template_id, service_category, item_name, description')
    .eq('template_id', templateId)

  if (fetchError) {
    return { error: fetchError.message }
  }

  const existingIds = new Set((existing ?? []).map((item) => item.id))
  if (
    orderedIds.length !== existingIds.size ||
    !orderedIds.every((id) => existingIds.has(id))
  ) {
    return { error: 'Checklist items changed elsewhere — refresh and try again.' }
  }

  const byId = new Map((existing ?? []).map((item) => [item.id, item]))
  const rows = orderedIds.map((id, index) => {
    const item = byId.get(id)!
    return {
      id,
      template_id: item.template_id,
      service_category: item.service_category,
      item_name: item.item_name,
      description: item.description,
      sort_order: index,
    }
  })

  const { error } = await supabase.from('checklist_template_items').upsert(rows, {
    onConflict: 'id',
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/checklists/${templateId}`)
}

export async function deleteTemplate(templateId: string): Promise<{ error?: string } | void> {
  await requireRole('admin')
  const supabase = await createClient()

  const { error } = await supabase.from('checklist_templates').delete().eq('id', templateId)
  if (error) {
    if (error.code === '23503') {
      return {
        error:
          'This checklist is used by existing inspections and can’t be deleted. Delete those inspections first.',
      }
    }
    return { error: error.message }
  }

  revalidatePath('/admin/checklists')
}
