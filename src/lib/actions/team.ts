'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { requireRole, getProfile } from '@/lib/auth/dal'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { genSpecialistId } from '@/lib/ids'
import { composeAddress, normalizeAddressParts } from '@/lib/address'
import type { Database } from '@/lib/database.types'

const teamMemberSchema = z.object({
  full_name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['admin', 'inspector']),
})

export type TeamMemberFormState = { error?: string; success?: boolean } | undefined

export async function createTeamMember(
  _prevState: TeamMemberFormState,
  formData: FormData
): Promise<TeamMemberFormState> {
  await requireRole('admin')

  const parsed = teamMemberSchema.safeParse({
    full_name: formData.get('full_name'),
    email: formData.get('email'),
    password: formData.get('password'),
    role: formData.get('role'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

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
  // admin), and copies the email. We add a human-readable OCS id here, and
  // promote admins explicitly.
  if (created.user) {
    const patch: { role?: 'admin'; human_id: string } = {
      human_id: genSpecialistId(),
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

export async function deleteTeamMember(profileId: string): Promise<{ error?: string } | void> {
  const current = await requireRole('admin')

  if (profileId === current.id) {
    return { error: 'You can’t delete your own account.' }
  }

  const supabase = await createClient()
  const { count, error: countError } = await supabase
    .from('inspections')
    .select('id', { count: 'exact', head: true })
    .eq('inspector_id', profileId)

  if (countError) {
    return { error: countError.message }
  }

  if (count) {
    return {
      error: `This member is assigned to ${count} inspection${count === 1 ? '' : 's'} and can’t be deleted. Reassign or delete those first.`,
    }
  }

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(profileId)
  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/team')
}
