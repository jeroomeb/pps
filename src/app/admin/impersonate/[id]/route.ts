import { NextRequest, NextResponse } from 'next/server'
import { getProfile } from '@/lib/auth/dal'
import { cookies } from 'next/headers'
import { getSafeRedirectUrl } from '@/lib/urls'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const profile = await getProfile()

  // Only admins can impersonate a specialist account
  if (profile.role !== 'admin') {
    return NextResponse.redirect(getSafeRedirectUrl('/login', request))
  }

  const cookieStore = await cookies()
  cookieStore.set('amenity_impersonate_id', id, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 4, // 4 hours
  })

  // Redirect to the specialist dashboard root preserving the public domain
  return NextResponse.redirect(getSafeRedirectUrl('/inspector', request))
}
