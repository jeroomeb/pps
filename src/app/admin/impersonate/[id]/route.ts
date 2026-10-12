import { NextRequest, NextResponse } from 'next/server'
import { getProfile } from '@/lib/auth/dal'
import { createAdminClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { getSafeRedirectUrl } from '@/lib/urls'
import { TENANT_VIEW_COOKIE } from '@/lib/auth/tenant-view'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const profile = await getProfile()

  // Only admins can view user panels or impersonate specialists
  if (profile.role !== 'admin') {
    return NextResponse.redirect(getSafeRedirectUrl('/login', request))
  }

  const admin = createAdminClient()
  const { data: targetUser } = await admin
    .from('profiles')
    .select('id, role, tenant_id')
    .eq('id', id)
    .single()

  if (!targetUser) {
    return NextResponse.redirect(getSafeRedirectUrl('/admin/team', request))
  }

  const cookieStore = await cookies()

  // If target user is an administrator:
  if (targetUser.role === 'admin') {
    // Clear specialist impersonation so it does not leak into admin views
    cookieStore.delete('amenity_impersonate_id')

    // If tenant admin and caller is Global HQ Admin, switch into that tenant's admin dashboard
    if (targetUser.tenant_id && profile.is_global_admin) {
      cookieStore.set(TENANT_VIEW_COOKIE, targetUser.tenant_id, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 4,
      })
      return NextResponse.redirect(getSafeRedirectUrl('/admin', request))
    }

    // Otherwise (HQ admin or same-tenant admin), open the admin dashboard
    cookieStore.delete(TENANT_VIEW_COOKIE)
    return NextResponse.redirect(getSafeRedirectUrl('/admin', request))
  }

  // If target user is an inspector / specialist:
  // Clear tenant view override so they view specialist portal cleanly
  cookieStore.delete(TENANT_VIEW_COOKIE)
  cookieStore.set('amenity_impersonate_id', id, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 4, // 4 hours
  })

  // Redirect to the specialist dashboard root preserving the public domain
  return NextResponse.redirect(getSafeRedirectUrl('/inspector', request))
}
