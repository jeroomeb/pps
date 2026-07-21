import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/dal'
import { renderInspectionPdf, photoDataUri } from '@/lib/pdf/generate'
import { sendReportEmail } from '@/lib/email/sendReportEmail'

export const runtime = 'nodejs'

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
      'id, status, inspector_id, property_id, template_id, properties(name, address, email), checklist_templates(name), profiles(full_name)'
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

  const { data: items, error: itemsError } = await supabase
    .from('inspection_items')
    .select('id, service_category, item_name, description, status, comment, photo_path, sort_order')
    .eq('inspection_id', inspectionId)
    .order('sort_order')

  if (itemsError || !items) {
    return NextResponse.json({ error: 'Could not load checklist items.' }, { status: 500 })
  }

  const incomplete = items.find((item) => !item.status)
  if (incomplete) {
    return NextResponse.json(
      { error: `"${incomplete.item_name}" still needs a Pass/Fail/N/A status.` },
      { status: 400 }
    )
  }

  const missingPhoto = items.find((item) => item.status === 'fail' && !item.photo_path)
  if (missingPhoto) {
    return NextResponse.json(
      { error: `"${missingPhoto.item_name}" is marked Fail and needs a photo.` },
      { status: 400 }
    )
  }

  const admin = createAdminClient()

  const itemsWithPhotoUrls = await Promise.all(
    items.map(async (item) => ({
      ...item,
      photoUrl: await photoDataUri(admin, item.photo_path),
    }))
  )

  const property = inspection.properties as unknown as {
    name: string
    address: string
    email: string
  }
  const template = inspection.checklist_templates as unknown as { name: string }
  const inspectorProfile = inspection.profiles as unknown as { full_name: string }

  const completedAt = new Date()
  const completedAtLabel = completedAt.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

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
  // sending a duplicate email.
  const { data: updatedRows, error: updateError } = await admin
    .from('inspections')
    .update({ status: 'completed', completed_at: completedAt.toISOString(), pdf_path: pdfPath })
    .eq('id', inspectionId)
    .neq('status', 'completed')
    .select('id')

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }
  if (!updatedRows?.length) {
    return NextResponse.json(
      { error: 'This inspection has already been submitted.' },
      { status: 409 }
    )
  }

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
    return NextResponse.json({
      success: true,
      warning: 'Inspection completed, but the report email failed to send.',
    })
  }

  return NextResponse.json({ success: true })
}
