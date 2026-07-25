import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/dal'
import { createAdminClient } from '@/lib/supabase/server'
import { sendReportEmail } from '@/lib/email/sendReportEmail'
import { formatDateTime } from '@/lib/timezone'

export const runtime = 'nodejs'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireRole('admin')
  const { id: inspectionId } = await params
  const admin = createAdminClient()

  const { data: inspection, error } = await admin
    .from('inspections')
    .select(
      'id, pdf_path, completed_at, properties(name, address, email), checklist_templates(name), profiles(full_name)'
    )
    .eq('id', inspectionId)
    .single()

  if (error || !inspection?.pdf_path) {
    return NextResponse.json({ error: 'Report not found for this inspection.' }, { status: 404 })
  }

  const { data: pdfFile, error: downloadError } = await admin.storage
    .from('reports')
    .download(inspection.pdf_path)

  if (downloadError || !pdfFile) {
    return NextResponse.json({ error: 'Could not load the stored PDF.' }, { status: 500 })
  }

  const property = inspection.properties as unknown as {
    name: string
    address: string
    email: string
  }
  const template = inspection.checklist_templates as unknown as { name: string }
  const inspectorProfile = inspection.profiles as unknown as { full_name: string }

  const pdfBuffer = Buffer.from(await pdfFile.arrayBuffer())
  const completedAtLabel = inspection.completed_at
    ? formatDateTime(inspection.completed_at)
    : ''

  try {
    await sendReportEmail({
      to: property.email,
      propertyName: property.name,
      checklistName: template.name,
      inspectorName: inspectorProfile.full_name,
      completedAt: completedAtLabel,
      pdfBuffer,
      pdfFilename: `${property.name.replace(/[^a-z0-9]+/gi, '-')}-inspection.pdf`,
    })
  } catch (emailError) {
    console.error('Failed to resend report email:', emailError)
    const message = emailError instanceof Error ? emailError.message : 'Unknown error'
    await admin
      .from('inspections')
      .update({ email_status: 'failed', email_error: message })
      .eq('id', inspectionId)
    revalidatePath('/admin/reports')
    return NextResponse.json({ error: 'Failed to resend email.' }, { status: 500 })
  }

  await admin
    .from('inspections')
    .update({ email_status: 'sent', email_error: null })
    .eq('id', inspectionId)
  revalidatePath('/admin/reports')

  return NextResponse.json({ success: true })
}
