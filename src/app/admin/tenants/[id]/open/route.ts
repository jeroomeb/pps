import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getProfile } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { getSafeRedirectUrl } from '@/lib/urls'
import { TENANT_VIEW_COOKIE } from '@/lib/auth/tenant-view'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const profile = await getProfile()

  if (!profile.is_global_admin) {
    return NextResponse.redirect(getSafeRedirectUrl('/login', request))
  }

  const supabase = await createClient()
  const { data: tenant } = await supabase.from('tenants').select('id').eq('id', id).maybeSingle()
  if (!tenant) {
    return NextResponse.redirect(getSafeRedirectUrl('/admin/tenants', request))
  }

  const cookieStore = await cookies()
  cookieStore.set(TENANT_VIEW_COOKIE, id, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 4,
  })

  return NextResponse.redirect(getSafeRedirectUrl('/admin', request))
}
