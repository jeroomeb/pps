import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Only same-site, absolute-path redirect targets are allowed after a code
// exchange — an unvalidated `next` (e.g. `.evil.com` or `@evil.com`) is an
// open redirect on a pre-auth endpoint, ideal for phishing.
const ALLOWED_NEXT = new Set(['/reset-password', '/force-password-change', '/admin', '/inspector', '/'])

// Exchanges the recovery/OAuth `code` for a session cookie, then forwards to
// `next` (defaults to the reset-password screen). Route handlers can set
// cookies, so the session persists for the follow-up updateUser call.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const rawNext = searchParams.get('next') || '/reset-password'
  const next = ALLOWED_NEXT.has(rawNext) ? rawNext : '/reset-password'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=recovery`)
}
