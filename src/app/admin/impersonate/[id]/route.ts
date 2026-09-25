import { NextRequest, NextResponse } from 'next/server'
import { getProfile } from '@/lib/auth/dal'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const profile = await getProfile()

  // Only admins can impersonate a specialist account
  if (profile.role !== 'admin') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const cookieStore = await cookies()
  cookieStore.set('amenity_impersonate_id', id, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 4, // 4 hours
  })

  // Redirect to the specialist dashboard root
  return NextResponse.redirect(new URL('/inspector', request.url))
}
