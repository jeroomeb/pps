'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/dal'
import { createAdminClient } from '@/lib/supabase/server'

const inspectorSchema = z.object({
  full_name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export type InspectorFormState = { error?: string } | undefined

export async function createInspector(
  _prevState: InspectorFormState,
  formData: FormData
): Promise<InspectorFormState> {
  await requireRole('admin')

  const parsed = inspectorSchema.safeParse({
    full_name: formData.get('full_name'),
    email: formData.get('email'),
    password: formData.get('password'),
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
      role: 'inspector',
    },
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/team')
}
