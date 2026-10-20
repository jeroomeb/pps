'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireGlobalAdmin } from '@/lib/auth/dal'
import { requireChecklistManagementPermission } from '@/lib/auth/checklist-permissions'
import { createClient } from '@/lib/supabase/server'
import { inferRiskDomain, isRiskDomain, type RiskDomain } from '@/lib/risk-domain'

const itemSchema = z.object({
  service_category: z.string().trim().min(1),
  item_name: z.string().trim().min(1),
  description: z.string().trim().optional(),
  risk_domain: z.string().trim().optional(),
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
  const { isSuperAdmin, tenantId } = await requireChecklistManagementPermission()

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

  const enablePredictiveScoring =
    formData.get('enable_predictive_scoring') !== 'false' &&
    formData.get('enable_predictive_scoring') !== null

  const supabase = await createClient()

  const { data: template, error: templateError } = await supabase
    .from('checklist_templates')
    .insert({
      name: parsed.data.name,
      enable_predictive_scoring: enablePredictiveScoring,
    })
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
      parsed.data.items.map((item, index) => {
        const chosen = isRiskDomain(item.risk_domain) ? item.risk_domain : null
        return {
          template_id: template.id,
          service_category: item.service_category,
          item_name: item.item_name,
          description: item.description || null,
          sort_order: index,
          risk_domain:
            chosen ??
            inferRiskDomain(item.service_category, item.item_name, item.description),
        }
      })
    )

  if (itemsError) {
    // Don't leave an orphan template behind — it would block a retry with
    // the same name via the unique constraint.
    await supabase.from('checklist_templates').delete().eq('id', template.id)
    return { error: itemsError.message }
  }

  // If created by a provisional tenant, auto-grant checklist access to that tenant
  if (!isSuperAdmin && tenantId) {
    await supabase.from('tenant_checklist_access').insert({
      tenant_id: tenantId,
      template_id: template.id,
    })
  }

  revalidatePath('/admin/checklists')
  redirect(`/admin/checklists/${template.id}`)
}

export async function addTemplateItem(
  templateId: string,
  _prevState: TemplateFormState,
  formData: FormData
): Promise<TemplateFormState> {
  await requireChecklistManagementPermission()

  const parsed = itemSchema.safeParse({
    service_category: formData.get('service_category'),
    item_name: formData.get('item_name'),
    description: formData.get('description') ?? '',
    risk_domain: formData.get('risk_domain'),
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

  const chosen = isRiskDomain(parsed.data.risk_domain) ? parsed.data.risk_domain : null
  const { error } = await supabase.from('checklist_template_items').insert({
    template_id: templateId,
    service_category: parsed.data.service_category,
    item_name: parsed.data.item_name,
    description: parsed.data.description || null,
    sort_order: (lastItem?.sort_order ?? -1) + 1,
    risk_domain:
      chosen ??
      inferRiskDomain(
        parsed.data.service_category,
        parsed.data.item_name,
        parsed.data.description
      ),
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
  await requireChecklistManagementPermission()
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
  await requireChecklistManagementPermission()

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
  await requireChecklistManagementPermission()
  const supabase = await createClient()

  const { data: existing, error: fetchError } = await supabase
    .from('checklist_template_items')
    .select('id, template_id, service_category, item_name, description, risk_domain')
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
      risk_domain: item.risk_domain,
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

export async function setTemplateItemRiskDomain(
  itemId: string,
  templateId: string,
  domain: RiskDomain | ''
): Promise<{ error?: string } | void> {
  await requireChecklistManagementPermission()
  const supabase = await createClient()
  const { error } = await supabase
    .from('checklist_template_items')
    .update({ risk_domain: isRiskDomain(domain) ? domain : null })
    .eq('id', itemId)
    .eq('template_id', templateId)
  if (error) return { error: error.message }
  revalidatePath(`/admin/checklists/${templateId}`)
}

export async function deleteTemplate(templateId: string): Promise<{ error?: string } | void> {
  await requireChecklistManagementPermission()
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

export async function updateTemplatePredictiveScoring(
  templateId: string,
  enablePredictiveScoring: boolean
): Promise<{ error?: string; success?: boolean }> {
  await requireGlobalAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from('checklist_templates')
    .update({ enable_predictive_scoring: enablePredictiveScoring })
    .eq('id', templateId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/checklists')
  revalidatePath(`/admin/checklists/${templateId}`)
  return { success: true }
}

export async function cloneTemplate(
  templateId: string,
  customName?: string
): Promise<{ error?: string; success?: boolean; newId?: string }> {
  const { isSuperAdmin, tenantId } = await requireChecklistManagementPermission()
  const supabase = await createClient()

  // 1. Fetch source template
  const { data: source, error: sourceError } = await supabase
    .from('checklist_templates')
    .select('id, name, enable_predictive_scoring')
    .eq('id', templateId)
    .single()

  if (sourceError || !source) {
    return { error: 'Source checklist template not found.' }
  }

  // 2. Fetch all items
  const { data: items, error: itemsError } = await supabase
    .from('checklist_template_items')
    .select('service_category, item_name, description, sort_order, risk_domain')
    .eq('template_id', templateId)
    .order('sort_order')

  if (itemsError) {
    return { error: `Failed to load source items: ${itemsError.message}` }
  }

  // 3. Name calculation
  const newName =
    customName && customName.trim()
      ? customName.trim()
      : `${source.name} (Copy)`

  // 4. Insert cloned template
  const { data: newTemplate, error: insertError } = await supabase
    .from('checklist_templates')
    .insert({
      name: newName,
      enable_predictive_scoring: source.enable_predictive_scoring ?? true,
    })
    .select('id')
    .single()

  if (insertError) {
    if (insertError.code === '23505') {
      return {
        error: `A checklist named "${newName}" already exists. Please choose a different name.`,
      }
    }
    return { error: insertError.message }
  }

  // 5. Insert cloned items
  if (items && items.length > 0) {
    const clonedItems = items.map((item) => ({
      template_id: newTemplate.id,
      service_category: item.service_category,
      item_name: item.item_name,
      description: item.description,
      sort_order: item.sort_order,
      risk_domain: item.risk_domain,
    }))

    const { error: cloneItemsError } = await supabase
      .from('checklist_template_items')
      .insert(clonedItems)

    if (cloneItemsError) {
      await supabase.from('checklist_templates').delete().eq('id', newTemplate.id)
      return { error: cloneItemsError.message }
    }
  }

  // If cloned by a provisional tenant, auto-grant checklist access to that tenant
  if (!isSuperAdmin && tenantId) {
    await supabase.from('tenant_checklist_access').insert({
      tenant_id: tenantId,
      template_id: newTemplate.id,
    })
  }

  revalidatePath('/admin/checklists')
  return { success: true, newId: newTemplate.id }
}
