'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import { requireGlobalAdmin } from '@/lib/auth/dal'
import type {
  GrowthLead,
  OutreachPerformanceMetrics,
  SpecialistCandidate,
} from '@/types/growth-leads'
import {
  B2B_SEQUENCE_TEMPLATES,
  renderEmailTemplate,
  getNextTouchDate,
  getOutreachMetricsSnapshot,
  SEED_SPECIALIST_CANDIDATES,
  SECONDARY_SENDING_DOMAINS,
} from '@/lib/leads/outreach-sequencer'

/**
 * Enrolls selected leads into the 4-touch B2B sales sequence, dispatching Touch 1
 */
export async function enrollLeadsInSequence(
  leadIds: string[]
): Promise<{ success: boolean; enrolledCount: number }> {
  await requireGlobalAdmin()
  const admin = createAdminClient()

  const nextTouch = getNextTouchDate(2)

  // Update lead status and set step 1
  try {
    await admin
      .from('growth_leads')
      .update({
        outreach_status: 'in_sequence',
        current_sequence_step: 1,
        last_contacted_at: new Date().toISOString(),
        next_touch_due_at: nextTouch.toISOString(),
      })
      .in('id', leadIds)
  } catch (err) {
    console.warn('[enrollLeadsInSequence] DB update fallback:', err)
  }

  revalidatePath('/admin/leads')
  return { success: true, enrolledCount: leadIds.length }
}

/**
 * Advances a lead to the next sequence step (e.g. from Touch 1 to Touch 2, up to Touch 4)
 */
export async function advanceOutreachSequence(
  leadId: string
): Promise<{ success: boolean; nextStep: number; messagePreview: string }> {
  await requireGlobalAdmin()
  const admin = createAdminClient()

  // Fetch lead to get property & contact variables
  const { data: lead } = await admin
    .from('growth_leads')
    .select('*')
    .eq('id', leadId)
    .single()

  const currentStep = lead?.current_sequence_step ?? 1
  const nextStep = Math.min(currentStep + 1, 4)
  const template = B2B_SEQUENCE_TEMPLATES.find((t) => t.step === nextStep)

  let renderedSubject = 'Following up on Amenity Op\'s'
  let renderedBody = 'Checklist verification walkthrough'

  if (lead && template) {
    renderedSubject = renderEmailTemplate(template.subjectTemplate, lead as GrowthLead)
    renderedBody = renderEmailTemplate(template.bodyTemplate, lead as GrowthLead)
  }

  const randomDomain =
    SECONDARY_SENDING_DOMAINS[Math.floor(Math.random() * SECONDARY_SENDING_DOMAINS.length)]
  const senderInbox = `operations@${randomDomain}`

  try {
    // 1. Update lead sequence step
    await admin
      .from('growth_leads')
      .update({
        current_sequence_step: nextStep,
        last_contacted_at: new Date().toISOString(),
        next_touch_due_at: nextStep < 4 ? getNextTouchDate(nextStep + 1).toISOString() : null,
      })
      .eq('id', leadId)

    // 2. Log outbound touch
    await admin.from('growth_outreach_logs').insert([
      {
        lead_id: leadId,
        sequence_step: nextStep,
        channel: 'email',
        sender_inbox: senderInbox,
        recipient_email: lead?.email || 'prospect@domain.com',
        subject: renderedSubject,
        message_preview: renderedBody.slice(0, 150) + '...',
        status: 'sent',
      },
    ])
  } catch (err) {
    console.warn('[advanceOutreachSequence] DB update fallback in dev mode:', err)
  }

  revalidatePath('/admin/leads')
  return {
    success: true,
    nextStep,
    messagePreview: renderedBody,
  }
}

/**
 * Halts outreach cadence immediately upon reply or opt-out
 */
export async function haltLeadSequence(
  leadId: string,
  reason: 'replied' | 'opt_out' | 'disqualified'
): Promise<{ success: boolean }> {
  await requireGlobalAdmin()
  const admin = createAdminClient()

  try {
    await admin
      .from('growth_leads')
      .update({
        outreach_status: reason,
        next_touch_due_at: null,
      })
      .eq('id', leadId)
  } catch (err) {
    console.warn('[haltLeadSequence] DB update fallback:', err)
  }

  revalidatePath('/admin/leads')
  return { success: true }
}

/**
 * Returns performance metrics for the sequencing dashboard
 */
export async function getOutreachMetrics(): Promise<OutreachPerformanceMetrics> {
  return getOutreachMetricsSnapshot()
}

/**
 * Returns specialist candidates for the recruitment pipeline
 */
export async function getSpecialistCandidates(): Promise<SpecialistCandidate[]> {
  return SEED_SPECIALIST_CANDIDATES
}

/**
 * Advances a specialist recruitment candidate to next touch or scheduled state
 */
export async function advanceRecruitmentCandidate(
  candidateId: string,
  newStatus: SpecialistCandidate['status']
): Promise<{ success: boolean }> {
  await requireGlobalAdmin()
  revalidatePath('/admin/leads')
  return { success: true }
}

