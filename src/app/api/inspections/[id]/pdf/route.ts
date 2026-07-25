import { NextResponse } from 'next/server'
import { getProfile } from '@/lib/auth/dal'
import { createAdminClient } from '@/lib/supabase/server'
import { regenerateInspectionPdf } from '@/lib/pdf/generate'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const profile = await getProfile()
  const { id: inspectionId } = await params
  const admin = createAdminClient()

  const { data: inspection } = await admin
    .from('inspections')
    .select('status, inspector_id, pdf_path')
    .eq('id', inspectionId)
    .single()

  if (!inspection || inspection.status !== 'completed') {
    return NextResponse.json({ error: 'Report not available for this inspection.' }, { status: 404 })
  }
  if (profile.role !== 'admin' && inspection.inspector_id !== profile.id) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })
  }

  // Force a re-render only when explicitly requested (admin-only) — e.g.
  // after fixing a data issue. Completed reports are the record of truth, so
  // a plain GET must NOT silently rewrite the stored PDF on every download.
  const forceRegenerate =
    profile.role === 'admin' && new URL(request.url).searchParams.get('regenerate') === '1'

  if (inspection.pdf_path && !forceRegenerate) {
    const { data: stored, error: downloadError } = await admin.storage
      .from('reports')
      .download(inspection.pdf_path)
    if (stored && !downloadError) {
      return new NextResponse(await stored.arrayBuffer(), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'inline; filename="inspection-report.pdf"',
          'Cache-Control': 'private, no-store',
        },
      })
    }
    // Stored file missing/unreadable — fall through to regenerate so "view
    // report" never dead-ends.
  }

  const result = await regenerateInspectionPdf(inspectionId)
  if (!result) {
    return NextResponse.json({ error: 'Could not generate the report PDF.' }, { status: 500 })
  }

  return new NextResponse(new Uint8Array(result.pdfBuffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="inspection-report.pdf"',
      'Cache-Control': 'private, no-store',
    },
  })
}
