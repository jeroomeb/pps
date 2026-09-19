'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { requireRole, getProfile } from '@/lib/auth/dal'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { genSpecialistId } from '@/lib/ids'
import { composeAddress, normalizeAddressParts } from '@/lib/address'
import { isSafeObjectPath } from '@/lib/storage-paths'
import type { Database } from '@/lib/database.types'

const teamMemberSchema = z.object({
  full_name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['admin', 'inspector']),
  tenant_id: z.string().uuid().optional().nullable(),
})

export type TeamMemberFormState = { error?: string; success?: boolean } | undefined

export async function createTeamMember(
  _prevState: TeamMemberFormState,
  formData: FormData
): Promise<TeamMemberFormState> {
  const profile = await requireRole('admin')

  const rawTenantId = formData.get('tenant_id')
  const parsed = teamMemberSchema.safeParse({
    full_name: formData.get('full_name'),
    email: formData.get('email'),
    password: formData.get('password'),
    role: formData.get('role'),
    tenant_id: typeof rawTenantId === 'string' && rawTenantId.trim() ? rawTenantId.trim() : null,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const targetTenantId = profile.is_global_admin && parsed.data.tenant_id
    ? parsed.data.tenant_id
    : profile.tenant_id ?? null

  const admin = createAdminClient()
  const { data: created, error } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: {
      full_name: parsed.data.full_name,
      role: parsed.data.role,
    },
  })

  if (error) {
    return { error: error.message }
  }

  // The handle_new_user trigger deliberately ignores metadata and always
  // creates the profile as 'inspector' (so public signup can never mint an
  // admin), and copies the email. We add a human-readable OCS id here,
  // associate their tenant_id, and promote admins explicitly.
  // Explicitly set must_reset_password: true so newly provisioned accounts
  // are forced to configure their own private password upon first sign-in.
  if (created.user) {
    const patch: { role?: 'admin'; human_id: string; tenant_id?: string | null; must_reset_password: boolean } = {
      human_id: genSpecialistId(),
      tenant_id: targetTenantId,
      must_reset_password: true,
    }
    if (parsed.data.role === 'admin') patch.role = 'admin'

    // Retry once on the unlikely human_id collision.
    let roleError = null
    for (let attempt = 0; attempt < 2; attempt++) {
      const { error } = await admin
        .from('profiles')
        .update({ ...patch, human_id: attempt === 0 ? patch.human_id : genSpecialistId() })
        .eq('id', created.user.id)
      if (!error) {
        roleError = null
        break
      }
      roleError = error
      if (error.code !== '23505') break
    }
    if (roleError) {
      return {
        error: `Account created, but finishing setup failed: ${roleError.message}. Use the role toggle to retry.`,
      }
    }
  }

  revalidatePath('/admin/team')
  return { success: true }
}

const addressPartsSchema = {
  street: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  zip: z.string().trim().optional(),
  county: z.string().trim().optional(),
}

const ownProfileSchema = z.object({
  phone: z.string().trim().optional(),
  ...addressPartsSchema,
  id_front_path: z.string().trim().nullable().optional(),
  id_back_path: z.string().trim().nullable().optional(),
})

export type ProfileAddressInput = {
  street?: string
  city?: string
  state?: string
  zip?: string
  county?: string
}

// Self-service: a specialist updates their own contact info / ID document
// paths. The DB guard trigger blocks any role/human_id/email change here, so
// this can't be used to escalate. Returns { error } instead of throwing.
export async function updateOwnProfile(
  input: ProfileAddressInput & {
    phone?: string
    id_front_path?: string | null
    id_back_path?: string | null
  }
): Promise<{ error?: string } | void> {
  const profile = await getProfile()

  const parsed = ownProfileSchema.safeParse(input)
  if (!parsed.success) {
    return { error: 'Invalid input.' }
  }

  // A client-supplied ID-document path must live under the caller's OWN
  // folder — otherwise a specialist could point their profile at someone
  // else's uploaded document (the admin reviewing it would see the wrong
  // person's ID, believing it belongs to this profile).
  if (
    (parsed.data.id_front_path && !isSafeObjectPath(parsed.data.id_front_path, profile.id)) ||
    (parsed.data.id_back_path && !isSafeObjectPath(parsed.data.id_back_path, profile.id))
  ) {
    return { error: 'Invalid document reference.' }
  }

  const supabase = await createClient()
  const addressParts = normalizeAddressParts(parsed.data)
  const patch: Database['public']['Tables']['profiles']['Update'] = {
    phone: parsed.data.phone || null,
    ...addressParts,
    // Derived single-line value read by the PDF/report/email pipeline.
    address: composeAddress(addressParts) || null,
  }
  if (parsed.data.id_front_path !== undefined) patch.id_front_path = parsed.data.id_front_path
  if (parsed.data.id_back_path !== undefined) patch.id_back_path = parsed.data.id_back_path

  const { error } = await supabase.from('profiles').update(patch).eq('id', profile.id)
  if (error) {
    return { error: error.message }
  }

  revalidatePath('/inspector/profile')
  revalidatePath('/admin/team')
}

const memberAddressSchema = z.object(addressPartsSchema)

/**
 * Admin-set coverage area for a specialist. Specialists can maintain this
 * themselves from /inspector/profile, but proximity-based assignment is only
 * useful if it's actually populated — so admins can fill it in from the
 * member's detail page. Address columns only; never role/email/human_id.
 */
export async function updateTeamMemberAddress(
  profileId: string,
  _prevState: TeamMemberFormState,
  formData: FormData
): Promise<TeamMemberFormState> {
  await requireRole('admin')

  const parsed = memberAddressSchema.safeParse({
    street: formData.get('street'),
    city: formData.get('city'),
    state: formData.get('state'),
    zip: formData.get('zip'),
    county: formData.get('county'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const supabase = await createClient()
  const addressParts = normalizeAddressParts(parsed.data)
  const { error } = await supabase
    .from('profiles')
    .update({ ...addressParts, address: composeAddress(addressParts) || null })
    .eq('id', profileId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/team/${profileId}`)
  revalidatePath('/admin/team')
  return { success: true }
}

export async function setTeamMemberRole(
  profileId: string,
  role: 'admin' | 'inspector'
): Promise<{ error?: string } | void> {
  await requireRole('admin')
  const supabase = await createClient()

  if (role === 'inspector') {
    const { count, error: countError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'admin')
      .neq('id', profileId)
    if (countError) {
      return { error: countError.message }
    }
    if (!count) {
      return { error: 'At least one admin must remain — promote someone else first.' }
    }
  }

  const { error } = await supabase.from('profiles').update({ role }).eq('id', profileId)
  if (error) {
    return { error: error.message }
  }
  revalidatePath('/admin/team')
}

export async function deactivateTeamMember(
  profileId: string,
  reassignToInspectorId?: string | null
): Promise<{ error?: string; success?: boolean } | void> {
  const current = await requireRole('admin')

  if (profileId === current.id) {
    return { error: 'You cannot deactivate your own account.' }
  }

  const supabase = await createClient()

  // 1. If a replacement inspector is provided, reassign all open (pending/in_progress) inspections
  if (reassignToInspectorId) {
    const { error: reassignError } = await supabase
      .from('inspections')
      .update({ inspector_id: reassignToInspectorId })
      .eq('inspector_id', profileId)
      .in('status', ['pending', 'in_progress'])

    if (reassignError) {
      return { error: `Failed to reassign open inspections: ${reassignError.message}` }
    }
  }

  // 2. Deactivate the specialist account
  const { error } = await supabase
    .from('profiles')
    .update({ status: 'inactive' })
    .eq('id', profileId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/team')
  revalidatePath(`/admin/team/${profileId}`)
  revalidatePath('/admin/inspections')
  revalidatePath('/inspector')
  return { success: true }
}

export async function reactivateTeamMember(profileId: string): Promise<{ error?: string; success?: boolean } | void> {
  await requireRole('admin')
  const supabase = await createClient()

  const { error } = await supabase
    .from('profiles')
    .update({ status: 'active' })
    .eq('id', profileId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/team')
  revalidatePath(`/admin/team/${profileId}`)
  return { success: true }
}

export async function deleteTeamMember(
  profileId: string,
  reassignToInspectorId?: string | null
): Promise<{ error?: string; notice?: string; deactivatedInstead?: boolean } | void> {
  const current = await requireRole('admin')

  if (profileId === current.id) {
    return { error: 'You cannot delete your own account.' }
  }

  const supabase = await createClient()

  // 1. Reassign open inspections if a replacement inspector is supplied
  if (reassignToInspectorId) {
    const { error: reassignError } = await supabase
      .from('inspections')
      .update({ inspector_id: reassignToInspectorId })
      .eq('inspector_id', profileId)
      .in('status', ['pending', 'in_progress'])

    if (reassignError) {
      return { error: `Failed to reassign open inspections: ${reassignError.message}` }
    }
  }

  // 2. Verify no remaining open inspections
  const { count: openCount, error: openCountError } = await supabase
    .from('inspections')
    .select('id', { count: 'exact', head: true })
    .eq('inspector_id', profileId)
    .in('status', ['pending', 'in_progress'])

  if (openCountError) {
    return { error: openCountError.message }
  }

  if (openCount && openCount > 0) {
    return {
      error: `This member still has ${openCount} open inspection${openCount === 1 ? '' : 's'}. Please choose a specialist to reassign them to.`,
    }
  }

  // 3. Check for completed historical inspections
  const { count: completedCount, error: completedCountError } = await supabase
    .from('inspections')
    .select('id', { count: 'exact', head: true })
    .eq('inspector_id', profileId)

  if (completedCountError) {
    return { error: completedCountError.message }
  }

  if (completedCount && completedCount > 0) {
    // Specialist has historical reports on record. Deactivate instead of hard deleting
    // to preserve legal report chains, audit trail, and signatures.
    const { error: deactivateError } = await supabase
      .from('profiles')
      .update({ status: 'inactive' })
      .eq('id', profileId)

    if (deactivateError) {
      return { error: deactivateError.message }
    }

    revalidatePath('/admin/team')
    revalidatePath(`/admin/team/${profileId}`)
    revalidatePath('/admin/inspections')
    return {
      deactivatedInstead: true,
      notice: `This specialist has ${completedCount} completed audit report${completedCount === 1 ? '' : 's'}. To preserve legal audit records, their account has been deactivated instead of deleted.`,
    }
  }

  // 4. Zero inspections: safe to completely hard delete
  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(profileId)
  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/team')
}
