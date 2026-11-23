'use client'

import React, { useState } from 'react'
import {
  Mail,
  Bot,
  Send,
  X,
  CheckCircle,
  Copy,
  Edit3,
  Sparkles,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react'
import type { GrowthAiDraft } from '@/types/growth-leads'

interface AiDraftReviewCardProps {
  draft: GrowthAiDraft
  onApprove: (draftId: string, finalBody: string) => Promise<void>
  onReject: (draftId: string) => Promise<void>
}

const INTENT_BADGES: Record<
  string,
  { label: string; badgeClass: string; description: string }
> = {
  wants_demo: {
    label: 'Wants Demo Video',
    badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-bold',
    description: 'Prospect requested the 5-minute self-paced demo walkthrough link.',
  },
  pricing_request: {
    label: 'Pricing & Terms Inquiry',
    badgeClass: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30 font-bold',
    description: 'Prospect asked about monthly subscription rates or contract requirements.',
  },
  how_it_works: {
    label: 'Product Implementation',
    badgeClass: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30 font-semibold',
    description: 'Questions regarding mobile device usage, GPS verification, or staff training.',
  },
  referral: {
    label: 'Colleague Referral',
    badgeClass: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30 font-semibold',
    description: 'Prospect routed the message to their regional facilities or operations director.',
  },
  opt_out: {
    label: 'Unsubscribe / Opt-Out',
    badgeClass: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30 font-bold',
    description: 'Permanent suppression requested; sequence halted immediately.',
  },
  not_interested: {
    label: 'Not Interested',
    badgeClass: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-400/20 font-medium',
    description: 'Polite decline; closed gracefully without further proactive sequence emails.',
  },
}

export function AiDraftReviewCard({ draft, onApprove, onReject }: AiDraftReviewCardProps) {
  const [draftBody, setDraftBody] = useState(draft.suggested_draft_reply)
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)

  const intentMeta =
    INTENT_BADGES[draft.classified_intent] || {
      label: draft.classified_intent.replace(/_/g, ' '),
      badgeClass: 'bg-primary/10 text-primary border-primary/20',
      description: 'Incoming prospect communication requiring review.',
    }

  const handleCopy = () => {
    navigator.clipboard.writeText(draftBody)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDispatch = async () => {
    setIsSubmitting(true)
    try {
      await onApprove(draft.id, draftBody)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDismiss = async () => {
    setIsSubmitting(true)
    try {
      await onReject(draft.id)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-lowest overflow-hidden shadow-xs space-y-0">
      {/* Top Banner: Inbound Email Header */}
      <div className="p-4 bg-surface-container-low/50 border-b border-outline-variant space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs border ${intentMeta.badgeClass}`}
            >
              {intentMeta.label}
            </span>
            <span className="text-xs text-on-surface-variant">• {intentMeta.description}</span>
          </div>

          <span className="text-[11px] text-on-surface-variant font-medium">
            Received {new Date(draft.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <div className="text-xs text-on-surface space-y-0.5">
          <div className="flex items-center gap-2 font-bold">
            <Mail size={13} className="text-primary" />
            <span>From: {draft.inbound_email}</span>
          </div>
          <div className="text-on-surface-variant font-semibold pl-5">
            Subject: {draft.inbound_subject}
          </div>
        </div>

        {/* Prospect Message Body */}
        <div className="mt-2 p-3 bg-surface-container-lowest rounded-lg border border-outline-variant/60 text-xs text-on-surface font-sans leading-relaxed">
          &quot;{draft.inbound_body}&quot;
        </div>
      </div>

      {/* Suggested Draft Section */}
      <div className="p-4 space-y-3 bg-surface-container-lowest">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
            <Bot size={15} />
            <span>Suggested AI Response (Draft-Only)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-on-surface-variant hover:text-primary transition"
            >
              <Edit3 size={12} />
              <span>{isEditing ? 'Done Editing' : 'Edit Draft'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-on-surface-variant hover:text-on-surface transition"
            >
              {copied ? <CheckCircle size={12} className="text-emerald-500" /> : <Copy size={12} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {isEditing ? (
          <textarea
            rows={7}
            value={draftBody}
            onChange={(e) => setDraftBody(e.target.value)}
            className="w-full p-3 text-xs rounded-lg border border-primary bg-surface-container-low text-on-surface focus:outline-hidden font-sans leading-relaxed"
          />
        ) : (
          <div className="p-3.5 rounded-lg border border-outline-variant bg-surface-container-low/40 text-xs text-on-surface font-sans leading-relaxed whitespace-pre-line">
            {draftBody}
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="p-3.5 bg-surface-container-low/30 border-t border-outline-variant flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-on-surface-variant text-[11px]">
          <ShieldCheck size={14} className="text-emerald-600" />
          <span>Requires Human Approval: zero automated dispatch</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleDismiss}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-on-surface-variant hover:bg-surface-container-high transition"
          >
            Dismiss Draft
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleDispatch}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-primary text-on-primary hover:opacity-90 transition shadow-xs"
          >
            <Send size={13} />
            <span>{isSubmitting ? 'Dispatching...' : 'Approve & Send'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

