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

export type TeamMemberFormState = { error?: string } | undefined

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
  const { error } = await admin.auth.admin.createUser({
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

  revalidatePath('/admin/team')
}

export async function setTeamMemberRole(profileId: string, role: 'admin' | 'inspector') {
  await requireRole('admin')
  const supabase = await createClient()
  await supabase.from('profiles').update({ role }).eq('id', profileId)
  revalidatePath('/admin/team')
}
