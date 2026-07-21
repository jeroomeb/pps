import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/dal'
import { createAdminClient } from '@/lib/supabase/server'
import { regenerateInspectionPdf } from '@/lib/pdf/generate'

export const runtime = 'nodejs'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireRole('admin')
  const { id: inspectionId } = await params
  const admin = createAdminClient()

  const { data: inspection } = await admin
    .from('inspections')
    .select('status')
    .eq('id', inspectionId)
    .single()

  if (!inspection || inspection.status !== 'completed') {
    return NextResponse.json({ error: 'Report not available for this inspection.' }, { status: 404 })
  }

  // Always re-render from current DB state so the served PDF reflects the
  // latest report template; the result is re-uploaded so email/resend match.
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
