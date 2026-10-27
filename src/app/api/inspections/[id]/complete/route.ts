import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/dal'
import { renderInspectionPdf, photoDataUri, mapWithConcurrency } from '@/lib/pdf/generate'
import { sendReportEmail } from '@/lib/email/sendReportEmail'
import { validateInspectionItems } from '@/lib/inspection-validation'
import { formatDateTime } from '@/lib/timezone'
import { isBuildingCategory, payoutMatrixKey } from '@/lib/building-category'
import { renewStandingInspection } from '@/lib/standing-inspections'
import { outcomeCounts, parseRiskFlags, parseRecurringItems } from '@/lib/risk-score'
import type { RiskDomain } from '@/lib/risk-domain'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: inspectionId } = await params
  const profile = await getProfile()
  const supabase = await createClient()

  const { data: inspection, error: inspectionError } = await supabase
    .from('inspections')
    .select(
      'id, status, inspector_id, property_id, template_id, tenant_id, arrived_at, predicted_score, predicted_flags, predicted_summary, predicted_recurring_items, properties(name, address, email, custom_payout_rate, payout_tier, building_category), checklist_templates(name), profiles!inspections_inspector_id_fkey(full_name)'
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
    .select('id, service_category, item_name, description, status, comment, photo_path, sort_order, risk_domain')
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
  const completedAt = new Date()
  const completedAtLabel = formatDateTime(completedAt)

  let dwellTimeSeconds: number | null = null
  if (inspection.arrived_at) {
    dwellTimeSeconds = Math.max(
      0,
      Math.round((completedAt.getTime() - new Date(inspection.arrived_at).getTime()) / 1000)
    )
  }

  // Compare-and-set: mark as completed immediately so the specialist's work is
  // securely recorded and finalized before long-running PDF/email tasks run.
  const { data: updatedRows, error: updateError } = await admin
    .from('inspections')
    .update({
      status: 'completed',
      completed_at: completedAt.toISOString(),
      departed_at: completedAt.toISOString(),
      dwell_time_seconds: dwellTimeSeconds,
    })
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
  revalidatePath('/inspector/payouts')
  revalidatePath('/admin/payouts')

  await renewStandingInspection(
    inspection.property_id,
    inspection.inspector_id,
    inspection.template_id
  )

  const property = inspection.properties as unknown as {
    name: string
    address: string
    email: string
    custom_payout_rate?: number | null
    payout_tier?: string | null
    building_category?: string | null
  }
  const template = inspection.checklist_templates as unknown as { name: string }
  const inspectorProfile = inspection.profiles as unknown as { full_name: string }

  // Automatic Payout Ledger Entry (Task 5 & Question 4 3-Tier Compensation Matrix):
  // If the tenant organization has enabled the payouts module, log an earnings record
  if (inspection.tenant_id) {
    try {
      const { data: tenant } = await admin
        .from('tenants')
        .select('enable_payouts, default_payout_rate, payout_tier_1_rate, payout_tier_2_rate, payout_tier_3_rate, payout_matrix')
        .eq('id', inspection.tenant_id)
        .single()

      if (tenant?.enable_payouts) {
        let payoutAmount: number
        if (typeof property?.custom_payout_rate === 'number' && property.custom_payout_rate > 0) {
          payoutAmount = property.custom_payout_rate
        } else {
          const tName = (template.name || '').toLowerCase()
          let category: 'luxury_condo' | 'adult_community' | 'commercial_multi' = 'luxury_condo'
          if (isBuildingCategory(property?.building_category)) {
            category = payoutMatrixKey(property.building_category)
          } else if (tName.includes('55+') || tName.includes('adult')) {
            category = 'adult_community'
          } else if (tName.includes('commercial')) {
            category = 'commercial_multi'
          }

          const tier = (property?.payout_tier && ['tier_1', 'tier_2', 'tier_3'].includes(property.payout_tier))
            ? (property.payout_tier as 'tier_1' | 'tier_2' | 'tier_3')
            : 'tier_2'

          const matrix = tenant.payout_matrix as unknown as Record<string, Record<string, number>> | null
          const matrixRate = matrix?.[category]?.[tier]

          if (typeof matrixRate === 'number' && matrixRate > 0) {
            payoutAmount = Number(matrixRate)
          } else if (tier === 'tier_1') {
            payoutAmount = Number(tenant.payout_tier_1_rate ?? 50.0)
          } else if (tier === 'tier_3') {
            payoutAmount = Number(tenant.payout_tier_3_rate ?? 100.0)
          } else if (tier === 'tier_2') {
            payoutAmount = Number(tenant.payout_tier_2_rate ?? 75.0)
          } else {
            payoutAmount = Number(tenant.default_payout_rate ?? 75.0)
          }
        }

        await admin.from('specialist_payouts').upsert(
          {
            tenant_id: inspection.tenant_id,
            inspection_id: inspectionId,
            specialist_id: inspection.inspector_id,
            property_id: inspection.property_id,
            amount: payoutAmount,
            status: 'pending',
          },
          { onConflict: 'inspection_id' }
        )
      }
    } catch (payoutErr) {
      console.error('Failed to create automatic payout record:', payoutErr)
    }
  }

  // Generate PDF and dispatch report email safely
  let reportWarning: string | null = null
  try {
    const itemsWithPhotoUrls = await mapWithConcurrency(items, 6, async (item) => ({
      ...item,
      photoUrl: await photoDataUri(admin, item.photo_path),
    }))

    const predictedFlags = parseRiskFlags(inspection.predicted_flags)
    const recurringItems = parseRecurringItems(inspection.predicted_recurring_items)
    const prediction =
      inspection.predicted_score == null || !inspection.predicted_summary
        ? null
        : {
            score: inspection.predicted_score,
            summary: inspection.predicted_summary,
            recurringItems,
            areas: predictedFlags.map((flag) => ({
              label: flag.label,
              ...outcomeCounts(
                items.map((item) => ({
                  riskDomain: item.risk_domain as RiskDomain | null,
                  status: item.status,
                })),
                flag.domain
              ),
            })),
          }

    const pdfBuffer = await renderInspectionPdf({
      reportId: inspectionId.slice(0, 8).toUpperCase(),
      propertyName: property.name,
      propertyAddress: property.address,
      checklistName: template.name,
      inspectorName: inspectorProfile.full_name,
      completedAt: completedAtLabel,
      items: itemsWithPhotoUrls,
      prediction,
    })

    const pdfPath = `${inspectionId}.pdf`
    const { error: uploadError } = await admin.storage
      .from('reports')
      .upload(pdfPath, pdfBuffer, { contentType: 'application/pdf', upsert: true })

    if (uploadError) {
      console.error('Failed to upload PDF report to storage:', uploadError)
    } else {
      await admin.from('inspections').update({ pdf_path: pdfPath }).eq('id', inspectionId)
    }

    if (property?.email) {
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

        await admin
          .from('inspections')
          .update({ email_status: 'sent', email_error: null })
          .eq('id', inspectionId)
      } catch (emailError) {
        console.error('Failed to send report email:', emailError)
        const message = emailError instanceof Error ? emailError.message : 'Unknown email error'
        await admin
          .from('inspections')
          .update({ email_status: 'failed', email_error: message })
          .eq('id', inspectionId)
        reportWarning = 'Inspection completed, but the report email failed to send.'
      }
    } else {
      await admin
        .from('inspections')
        .update({ email_status: 'failed', email_error: 'Property has no email configured.' })
        .eq('id', inspectionId)
    }
  } catch (reportError) {
    console.error('Failed to generate PDF report during submission:', reportError)
    const message = reportError instanceof Error ? reportError.message : 'Unknown report generation error'
    await admin
      .from('inspections')
      .update({ email_status: 'failed', email_error: message })
      .eq('id', inspectionId)
    reportWarning = 'Inspection submitted successfully. PDF report generation is queued and can be viewed or downloaded from Reports.'
  }

  if (reportWarning) {
    return NextResponse.json({ success: true, warning: reportWarning })
  }

    return NextResponse.json({ success: true })
  } catch (fatalErr) {
    console.error('Fatal unhandled error in POST /api/inspections/[id]/complete:', fatalErr)
    return NextResponse.json(
      {
        error:
          fatalErr instanceof Error
            ? fatalErr.message
            : 'An unexpected server error occurred while processing the inspection submission.',
      },
      { status: 500 }
    )
  }
}
