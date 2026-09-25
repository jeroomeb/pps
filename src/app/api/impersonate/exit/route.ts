import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSafeRedirectUrl } from '@/lib/urls'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  cookieStore.delete('amenity_impersonate_id')
  return NextResponse.redirect(getSafeRedirectUrl('/admin/team', request))
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  cookieStore.delete('amenity_impersonate_id')
  return NextResponse.redirect(getSafeRedirectUrl('/admin/team', request))
}
