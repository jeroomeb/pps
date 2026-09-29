import 'server-only'
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

type Client = SupabaseClient<Database>

export function templateIdsFromForm(formData: FormData): string[] {
  const ids = new Set<string>()
  for (const raw of formData.getAll('template_ids')) {
    if (typeof raw !== 'string') continue
    const value = raw.trim()
    if (z.string().uuid().safeParse(value).success) ids.add(value)
  }
  return [...ids]
}

export async function replaceTenantChecklistAccess(
  supabase: Client,
  tenantId: string,
  templateIds: string[]
) {
  const { error: clearError } = await supabase
    .from('tenant_checklist_access')
    .delete()
    .eq('tenant_id', tenantId)
  if (clearError) return clearError

  if (!templateIds.length) return null

  const { error } = await supabase.from('tenant_checklist_access').insert(
    templateIds.map((template_id) => ({ tenant_id: tenantId, template_id }))
  )
  return error
}

export async function replacePropertyChecklistAccess(
  supabase: Client,
  propertyId: string,
  templateIds: string[]
) {
  const { error: clearError } = await supabase
    .from('property_checklist_access')
    .delete()
    .eq('property_id', propertyId)
  if (clearError) return clearError

  if (!templateIds.length) return null

  const { error } = await supabase.from('property_checklist_access').insert(
    templateIds.map((template_id) => ({ property_id: propertyId, template_id }))
  )
  return error
}

/** Keep only templates the organization is allowed to use. */
export async function filterTemplatesForTenant(
  supabase: Client,
  tenantId: string | null,
  templateIds: string[]
) {
  if (!tenantId || !templateIds.length) return templateIds
  const { data } = await supabase
    .from('tenant_checklist_access')
    .select('template_id')
    .eq('tenant_id', tenantId)
  const allowed = new Set((data ?? []).map((row) => row.template_id))
  if (!allowed.size) return templateIds
  return templateIds.filter((id) => allowed.has(id))
}
