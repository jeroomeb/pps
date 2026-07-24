'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

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
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'Invalid email or password.' }
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

// Sets a new password for the currently-authenticated (recovery) session.
export async function updatePassword(
  _prevState: SignInState,
  formData: FormData
): Promise<SignInState> {
  const password = String(formData.get('password') ?? '')
  const confirm = String(formData.get('confirm') ?? '')

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' }
  }
  if (password !== confirm) {
    return { error: 'Passwords do not match.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Your reset link has expired. Request a new one.' }
  }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) {
    return { error: error.message }
  }

  redirect('/')
}
