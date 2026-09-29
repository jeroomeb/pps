import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSafeRedirectUrl } from '@/lib/urls'
import { TENANT_VIEW_COOKIE } from '@/lib/auth/tenant-view'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  cookieStore.delete(TENANT_VIEW_COOKIE)
  return NextResponse.redirect(getSafeRedirectUrl('/admin/tenants', request))
}
