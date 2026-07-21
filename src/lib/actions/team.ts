'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/dal'
import { createAdminClient, createClient } from '@/lib/supabase/server'

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
  // admin). Admin-created admins are promoted explicitly here instead.
  if (parsed.data.role === 'admin' && created.user) {
    const { error: roleError } = await admin
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', created.user.id)
    if (roleError) {
      return {
        error: `Account created, but promoting to admin failed: ${roleError.message}. Use the role toggle to retry.`,
      }
    }
  }

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
