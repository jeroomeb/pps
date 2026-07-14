import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/lib/database.types'

export const getSessionUser = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return user
})

export const getProfile = cache(async () => {
  const user = await getSessionUser()
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  return { ...profile, email: user.email! }
})

export async function requireRole(role: UserRole) {
  const profile = await getProfile()
  if (profile.role !== role) {
    redirect(profile.role === 'admin' ? '/admin' : '/inspector')
  }
  return profile
}
