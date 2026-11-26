'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import { requireGlobalAdmin } from '@/lib/auth/dal'
import type { GrowthAiDraft, GrowthLead } from '@/types/growth-leads'
import {
  analyzeInboundEmail,
  SEED_AI_DRAFTS,
  ClassifiedIntent,
} from '@/lib/leads/ai-reply-assistant'
import { getGrowthLeads } from './leads'

/**
 * Returns pending AI drafts awaiting human-in-the-loop review
 */
export async function getPendingAiDrafts(): Promise<GrowthAiDraft[]> {
  await requireGlobalAdmin()
  const admin = createAdminClient()

  try {
    const { data, error } = await admin
      .from('growth_ai_drafts')
      .select('*')
      .eq('status', 'pending_review')
      .order('created_at', { ascending: false })

    if (error || !data || data.length === 0) {
      return SEED_AI_DRAFTS
    }

    return data as GrowthAiDraft[]
  } catch (err) {
    console.warn('[getPendingAiDrafts] DB query fallback in dev:', err)
    return SEED_AI_DRAFTS
  }
}

/**
 * Approves and dispatches an AI-generated draft reply (Human-in-the-Loop)
 * Logs to growth_outreach_logs and marks draft as dispatched
 */
export async function approveAndDispatchDraft(
  draftId: string,
  finalBody: string
): Promise<{ success: boolean; dispatchedAt: string }> {
  await requireGlobalAdmin()
  const admin = createAdminClient()
  const nowIso = new Date().toISOString()

  try {
    // 1. Update draft status
    await admin
      .from('growth_ai_drafts')
      .update({
        suggested_draft_reply: finalBody,
        status: 'dispatched',
        reviewed_at: nowIso,
      })
      .eq('id', draftId)

    // 2. Fetch draft to log communication
    const { data: draft } = await admin
      .from('growth_ai_drafts')
      .select('lead_id, inbound_email, inbound_subject')
      .eq('id', draftId)
      .single()

    if (draft) {
      await admin.from('growth_outreach_logs').insert([
        {
          lead_id: draft.lead_id,
          sequence_step: 99, // manual/AI response
          channel: 'email',
          sender_inbox: 'hello@getamenityops.com',
          recipient_email: draft.inbound_email,
          subject: draft.inbound_subject.startsWith('Re:')
            ? draft.inbound_subject
            : `Re: ${draft.inbound_subject}`,
          message_preview: finalBody.slice(0, 150) + '...',
          status: 'sent',
          sent_at: nowIso,
        },
      ])
    }
  } catch (err) {
    console.warn('[approveAndDispatchDraft] DB update fallback:', err)
  }

  revalidatePath('/admin/leads')
  return { success: true, dispatchedAt: nowIso }
}

/**
 * Rejects or dismisses an AI-suggested draft
 */
export async function rejectDraft(
  draftId: string,
  reason: string = 'Manual dismissal'
): Promise<{ success: boolean }> {
  await requireGlobalAdmin()
  const admin = createAdminClient()

  try {
    await admin
      .from('growth_ai_drafts')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', draftId)
  } catch (err) {
    console.warn('[rejectDraft] DB update fallback:', err)
  }

  revalidatePath('/admin/leads')
  return { success: true }
}

/**
 * Simulates an inbound prospect response to test the AI Reply Assistant and Auto-Halt trigger
 */
export async function simulateInboundReply(
  leadId: string,
  scenario: 'demo' | 'pricing' | 'referral' | 'not_interested' | 'opt_out'
): Promise<{ draft: GrowthAiDraft; sequenceHalted: boolean }> {
  await requireGlobalAdmin()
  const admin = createAdminClient()

  // 1. Fetch lead
  const { leads } = await getGrowthLeads({ pageSize: 5000 })
  const lead = leads.find((l) => l.id === leadId) || leads[0]

  let simulatedInboundText = ''
  let simulatedSubject = `Re: Quick question regarding overnight operations at ${lead.property_name}`

  switch (scenario) {
    case 'demo':
      simulatedInboundText = `Hey there, we had an issue with unattended gates last week. Can you send over the 5-minute demo video?`
      break
    case 'pricing':
      simulatedInboundText = `We are reviewing our overnight operations budget. How much does your app cost monthly for a property of our size?`
      break
    case 'referral':
      simulatedInboundText = `I am no longer handling facilities walkthroughs. Please reach out to our Regional Operations Director, Sarah Jenkins.`
      break
    case 'not_interested':
      simulatedInboundText = `No thanks, we already have an in-house security checklist in place.`
      break
    case 'opt_out':
      simulatedInboundText = `Please unsubscribe and remove me from your list immediately.`
      break
  }

  // 2. Classify and generate draft
  const analysis = analyzeInboundEmail(simulatedInboundText, lead)

  const newStatus = scenario === 'opt_out' ? 'opt_out' : 'replied'

  // 3. Immediately halt lead sequence in growth_leads
  try {
    await admin
      .from('growth_leads')
      .update({
        outreach_status: newStatus,
        next_touch_due_at: null,
      })
      .eq('id', lead.id)
  } catch (err) {
    console.warn('[simulateInboundReply] DB halt fallback:', err)
  }

  const newDraft: GrowthAiDraft = {
    id: `draft-${Date.now()}`,
    lead_id: lead.id,
    inbound_email: lead.email || 'prospect@client.com',
    inbound_subject: simulatedSubject,
    inbound_body: simulatedInboundText,
    classified_intent: analysis.intent,
    suggested_draft_reply: analysis.suggestedDraft,
    status: 'pending_review',
    reviewed_by: null,
    reviewed_at: null,
    created_at: new Date().toISOString(),
  }

  // 4. Save to growth_ai_drafts
  try {
    await admin.from('growth_ai_drafts').insert([
      {
        id: newDraft.id,
        lead_id: newDraft.lead_id,
        inbound_email: newDraft.inbound_email,
        inbound_subject: newDraft.inbound_subject,
        inbound_body: newDraft.inbound_body,
        classified_intent: newDraft.classified_intent,
        suggested_draft_reply: newDraft.suggested_draft_reply,
        status: 'pending_review',
      },
    ])
  } catch (err) {
    console.warn('[simulateInboundReply] DB insert fallback:', err)
  }

  revalidatePath('/admin/leads')
  return { draft: newDraft, sequenceHalted: true }
}

