import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/lib/database.types'

// Reachable while logged out.
const ALLOW_LOGGED_OUT = [
  '/login',
  '/forgot-password',
  '/reset-password',
  '/auth/callback',
]
// Of those, the ones a logged-in user should be bounced away from. NOT
// reset-password — a recovery link establishes a session, and the user must
// stay on that page to actually set a new password.
const REDIRECT_IF_LOGGED_IN = ['/login', '/forgot-password']

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  if (!user && !ALLOW_LOGGED_OUT.includes(path)) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && REDIRECT_IF_LOGGED_IN.includes(path)) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // Forward verified user id and email to downstream Server Components
  // so getSessionUser() doesn't need to make an extra remote HTTP call to Supabase auth!
  const requestHeaders = new Headers(request.headers)
  if (user) {
    requestHeaders.set('x-user-id', user.id)
    if (user.email) {
      requestHeaders.set('x-user-email', user.email)
    }
  }

  const nextResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  // Retain any session cookies refreshed during createServerClient
  response.cookies.getAll().forEach((cookie) => {
    nextResponse.cookies.set(cookie.name, cookie.value, cookie)
  })

  return nextResponse
}
