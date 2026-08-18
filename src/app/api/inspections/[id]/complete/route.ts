import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/dal'
import { renderInspectionPdf, photoDataUri, mapWithConcurrency } from '@/lib/pdf/generate'
import { sendReportEmail } from '@/lib/email/sendReportEmail'
import { validateInspectionItems } from '@/lib/inspection-validation'
import { formatDateTime } from '@/lib/timezone'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: inspectionId } = await params
  const profile = await getProfile()
  const supabase = await createClient()

  const { data: inspection, error: inspectionError } = await supabase
    .from('inspections')
    .select(
      'id, status, inspector_id, property_id, template_id, properties(name, address, email), checklist_templates(name), profiles!inspections_inspector_id_fkey(full_name)'
    )
    .eq('id', inspectionId)
    .single()

  if (inspectionError || !inspection) {
    return NextResponse.json({ error: 'Inspection not found.' }, { status: 404 })
  }

  if (profile.role !== 'admin' && inspection.inspector_id !== profile.id) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })
  }

  if (inspection.status === 'completed') {
    return NextResponse.json(
      { error: 'This inspection has already been submitted.' },
      { status: 409 }
    )
  }

  // Cancelled after the specialist opened the checklist. Without this they
  // could still submit from a stale page and trigger a real report email for
  // a visit that was called off.
  if (inspection.status === 'cancelled') {
    return NextResponse.json(
      { error: 'This inspection has been cancelled by an administrator and cannot be submitted.' },
      { status: 409 }
    )
  }

  const { data: items, error: itemsError } = await supabase
    .from('inspection_items')
    .select('id, service_category, item_name, description, status, comment, photo_path, sort_order')
    .eq('inspection_id', inspectionId)
    .order('sort_order')

  if (itemsError || !items?.length) {
    return NextResponse.json({ error: 'Could not load checklist items.' }, { status: 500 })
  }

  const issues = validateInspectionItems(items)
  if (issues.length) {
    return NextResponse.json(
      {
        error:
          issues.length === 1
            ? `"${issues[0].itemName}" ${issues[0].reason}`
            : `${issues.length} items still need attention before this inspection can be submitted.`,
        issues,
      },
      { status: 400 }
    )
  }

  const admin = createAdminClient()

  const itemsWithPhotoUrls = await mapWithConcurrency(items, 4, async (item) => ({
    ...item,
    photoUrl: await photoDataUri(admin, item.photo_path),
  }))

  const property = inspection.properties as unknown as {
    name: string
    address: string
    email: string
  }
  const template = inspection.checklist_templates as unknown as { name: string }
  const inspectorProfile = inspection.profiles as unknown as { full_name: string }

  const completedAt = new Date()
  const completedAtLabel = formatDateTime(completedAt)

  const pdfBuffer = await renderInspectionPdf({
    reportId: inspectionId.slice(0, 8).toUpperCase(),
    propertyName: property.name,
    propertyAddress: property.address,
    checklistName: template.name,
    inspectorName: inspectorProfile.full_name,
    completedAt: completedAtLabel,
    items: itemsWithPhotoUrls,
  })

  const pdfPath = `${inspectionId}.pdf`
  const { error: uploadError } = await admin.storage
    .from('reports')
    .upload(pdfPath, pdfBuffer, { contentType: 'application/pdf', upsert: true })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  // Compare-and-set: if a concurrent submit already completed it, bail before
  // sending a duplicate email. Scoped to the two OPEN statuses rather than
  // `.neq('completed')` so an admin cancelling between the status check above
  // and this write also loses the race — this client is the service role, so
  // RLS is bypassed and this is the only thing standing in the way.
  const { data: updatedRows, error: updateError } = await admin
    .from('inspections')
    .update({ status: 'completed', completed_at: completedAt.toISOString(), pdf_path: pdfPath })
    .eq('id', inspectionId)
    .in('status', ['pending', 'in_progress'])
    .select('id')

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }
  if (!updatedRows?.length) {
    return NextResponse.json(
      {
        error:
          'This inspection was already submitted or has been cancelled — it can no longer be submitted.',
      },
      { status: 409 }
    )
  }

  revalidatePath('/admin')
  revalidatePath('/admin/inspections')
  revalidatePath('/admin/reports')
  revalidatePath(`/admin/properties/${inspection.property_id}`)
  revalidatePath('/inspector')

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
    console.error('Failed to send report email:', emailError)
    const message = emailError instanceof Error ? emailError.message : 'Unknown error'
    await admin
      .from('inspections')
      .update({ email_status: 'failed', email_error: message })
      .eq('id', inspectionId)
    revalidatePath('/admin/reports')
    return NextResponse.json({
      success: true,
      warning: 'Inspection completed, but the report email failed to send.',
    })
  }

  await admin
    .from('inspections')
    .update({ email_status: 'sent', email_error: null })
    .eq('id', inspectionId)

  return NextResponse.json({ success: true })
}
