/**
 * True if a Supabase access token carries a `recovery` AMR entry — i.e. the
 * session was established via the password-reset email link, not an
 * ordinary sign-in. Used to decide whether `/reset-password` should ask for
 * the current password before allowing a change (see updatePassword in
 * src/lib/actions/auth.ts and its comment for why this matters).
 */
export function isRecoverySession(accessToken: string): boolean {
  try {
    const payload = accessToken.split('.')[1]
    const json = Buffer.from(payload, 'base64url').toString('utf8')
    const decoded = JSON.parse(json) as { amr?: { method?: string }[] }
    return (decoded.amr ?? []).some((entry) => entry.method === 'recovery')
  } catch {
    return false
  }
}
