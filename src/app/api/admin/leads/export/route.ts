import { NextResponse } from 'next/server'
import { getProfile } from '@/lib/auth/dal'
import { getGrowthLeads } from '@/lib/actions/leads'
import { generateLeadsXlsx, generateLeadsCsv } from '@/lib/export/leads-export'
import type { CommunityType, IntentTier, OutreachStatus } from '@/types/growth-leads'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const profile = await getProfile()
    if (!profile || (profile.role !== 'admin' && !profile.is_global_admin)) {
      return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const format = (searchParams.get('format') || 'xlsx').toLowerCase()
    const communityType = searchParams.get('communityType') as CommunityType | 'all' | null
    const intentTier = searchParams.get('intentTier')
      ? (Number(searchParams.get('intentTier')) as IntentTier)
      : 'all'
    const outreachStatus = searchParams.get('outreachStatus') as OutreachStatus | 'all' | null
    const county = searchParams.get('county') || 'all'
    const search = searchParams.get('search') || ''

    // Fetch filtered leads up to high limit for full export
    const { leads } = await getGrowthLeads({
      communityType: communityType || 'all',
      intentTier: intentTier || 'all',
      outreachStatus: outreachStatus || 'all',
      county,
      search,
      pageSize: 5000,
    })

    const dateStr = new Date().toISOString().split('T')[0]

    if (format === 'csv') {
      const csvString = generateLeadsCsv(leads)
      return new NextResponse(csvString, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="amenityops-leads-${dateStr}.csv"`,
          'Cache-Control': 'no-store',
        },
      })
    }

    // Default to Excel .xlsx
    const xlsxBuffer = generateLeadsXlsx(leads)
    return new NextResponse(new Uint8Array(xlsxBuffer), {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="amenityops-leads-${dateStr}.xlsx"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('[Leads Export API Error]:', error)
    return NextResponse.json(
      { error: 'Failed to generate leads export.' },
      { status: 500 }
    )
  }
}
