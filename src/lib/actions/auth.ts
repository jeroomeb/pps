'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { isRecoverySession } from '@/lib/auth/session'

export type SignInState = { error?: string } | undefined
export type ResetState = { error?: string; sent?: boolean } | undefined

export async function signIn(
  _prevState: SignInState,
  formData: FormData
): Promise<SignInState> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  const supabase = await createClient()
  const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'Invalid email or password.' }
  }

  if (authData.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', authData.user.id)
      .single()

    if (profile?.status === 'inactive' || profile?.status === 'suspended') {
      await supabase.auth.signOut()
      return { error: 'Your account has been deactivated. Please contact your organization administrator.' }
    }
  }

  redirect('/')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

// Sends a password-recovery email. The link lands on /auth/callback, which
// exchanges the code for a session and forwards to /reset-password.
// NOTE: delivery depends on Supabase Auth SMTP being configured in the
// Supabase dashboard (the built-in email has very low sending limits).
export async function requestPasswordReset(
  _prevState: ResetState,
  formData: FormData
): Promise<ResetState> {
  const email = String(formData.get('email') ?? '').trim()
  if (!email) {
    return { error: 'Enter your email address.' }
  }

  // Prefer the canonical site URL so reset links always point at the primary
  // domain (portal.amenityops.app), regardless of which host was used to
  // request the reset. Falls back to the request origin if unset.
  const h = await headers()
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ||
    h.get('origin') ||
    (h.get('host') ? `https://${h.get('host')}` : '')

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  })

  // Don't reveal whether an account exists — always report "sent".
  if (error) {
    console.error('resetPasswordForEmail error:', error.message)
  }
  return { sent: true }
}

// Sets a new password for the currently-authenticated session. A genuine
// password-reset (recovery) session may do this with no other proof; any
// other session must additionally supply the current password.
export async function updatePassword(
  _prevState: SignInState,
  formData: FormData
): Promise<SignInState> {
  const password = String(formData.get('password') ?? '')
  const confirm = String(formData.get('confirm') ?? '')
  const currentPassword = String(formData.get('current_password') ?? '')

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' }
  }
  if (password !== confirm) {
    return { error: 'Passwords do not match.' }
  }

  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.user?.email) {
    return { error: 'Your session has expired. Request a new reset link.' }
  }

  if (!isRecoverySession(session.access_token)) {
    if (!currentPassword) {
      return { error: 'Enter your current password to confirm this change.' }
    }
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: session.user.email,
      password: currentPassword,
    })
    if (reauthError) {
      return { error: 'Current password is incorrect.' }
    }
  }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) {
    return { error: error.message }
  }

  // Evict any other active sessions (e.g. a stolen cookie elsewhere) now
  // that the password has changed.
  await supabase.auth.signOut({ scope: 'others' })

  redirect('/')
}
