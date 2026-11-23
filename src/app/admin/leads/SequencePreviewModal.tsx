'use client'

import React, { useState } from 'react'
import { X, Send, Mail, CheckCircle2, Clock, ShieldCheck, ArrowRight, Building } from 'lucide-react'
import type { GrowthLead } from '@/types/growth-leads'
import {
  B2B_SEQUENCE_TEMPLATES,
  renderEmailTemplate,
  isSendingWindowOpen,
  SECONDARY_SENDING_DOMAINS,
} from '@/lib/leads/outreach-sequencer'
import { advanceOutreachSequence } from '@/lib/actions/outreach'

interface SequencePreviewModalProps {
  isOpen: boolean
  lead: GrowthLead | null
  onClose: () => void
  onAdvanced: (leadId: string, nextStep: number) => void
}

export function SequencePreviewModal({
  isOpen,
  lead,
  onClose,
  onAdvanced,
}: SequencePreviewModalProps) {
  const [selectedStep, setSelectedStep] = useState<number>(1)
  const [isAdvancing, setIsAdvancing] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  if (!isOpen || !lead) return null

  const template = B2B_SEQUENCE_TEMPLATES.find((t) => t.step === selectedStep) || B2B_SEQUENCE_TEMPLATES[0]
  const subject = renderEmailTemplate(template.subjectTemplate, lead)
  const body = renderEmailTemplate(template.bodyTemplate, lead)
  const windowStatus = isSendingWindowOpen()

  const handleAdvanceStep = async () => {
    setIsAdvancing(true)
    setNotice(null)
    try {
      const res = await advanceOutreachSequence(lead.id)
      setNotice(`Advanced ${lead.property_name} to Touch ${res.nextStep}!`)
      onAdvanced(lead.id, res.nextStep)
      setSelectedStep(res.nextStep)
    } catch (err) {
      console.error('Failed to advance sequence:', err)
    } finally {
      setIsAdvancing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="w-full max-w-3xl bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-2xl overflow-hidden flex flex-col my-8">
        {/* Header */}
        <div className="px-6 py-5 border-b border-outline-variant flex items-center justify-between bg-surface-container-low/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-600">
              <Send size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-headline text-on-surface">
                  4-Touch B2B Sales Sequence
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] bg-primary/10 text-primary font-bold">
                  Step {lead.current_sequence_step || 1} of 4
                </span>
              </div>
              <p className="text-xs text-on-surface-variant truncate max-w-md">
                Active Prospect: <strong>{lead.property_name}</strong> ({lead.target_gatekeeper_name || 'Team'})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step Selector Tabs */}
        <div className="border-b border-outline-variant px-6 pt-3 bg-surface-container-low/20">
          <div className="flex space-x-2">
            {B2B_SEQUENCE_TEMPLATES.map((t) => {
              const isSelected = selectedStep === t.step
              const isCurrentOrPast = (lead.current_sequence_step || 1) >= t.step
              return (
                <button
                  key={t.step}
                  type="button"
                  onClick={() => setSelectedStep(t.step)}
                  className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
                    isSelected
                      ? 'border-primary text-primary'
                      : 'border-transparent text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                      isCurrentOrPast ? 'bg-primary text-on-primary' : 'bg-surface-container-high'
                    }`}
                  >
                    {t.step}
                  </span>
                  <span>Touch {t.step}</span>
                  <span className="text-[10px] font-normal opacity-70">
                    (Day {t.dayInterval})
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {notice && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-bold flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>{notice}</span>
            </div>
          )}

          {/* Delivery Window & Sender Domain Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg border border-outline-variant bg-surface-container-low/30 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-on-surface">
                <Clock size={14} className="text-primary" />
                <span>Delivery Window</span>
              </div>
              <p className="text-[11px] text-on-surface-variant">{windowStatus.windowStatus}</p>
            </div>

            <div className="p-3 rounded-lg border border-outline-variant bg-surface-container-low/30 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-on-surface">
                <ShieldCheck size={14} className="text-emerald-600" />
                <span>Domain Reputation Isolation</span>
              </div>
              <p className="text-[11px] text-on-surface-variant">
                Dispatches via: <code className="text-primary font-bold">{SECONDARY_SENDING_DOMAINS[0]}</code> (50/day cap)
              </p>
            </div>
          </div>

          {/* Rendered Email Preview Container */}
          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest overflow-hidden shadow-xs">
            {/* Email Header Simulation */}
            <div className="bg-surface-container-low/60 p-3.5 border-b border-outline-variant text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-on-surface-variant font-semibold">To:</span>
                  <span className="font-bold text-on-surface">
                    {lead.target_gatekeeper_name || 'Property General Manager'}{' '}
                    &lt;{lead.email || 'lead@prospect.com'}&gt;
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-surface-container-high text-on-surface font-semibold">
                  {template.focus}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-on-surface-variant font-semibold">Subject:</span>
                <span className="font-bold text-primary">{subject}</span>
              </div>
            </div>

            {/* Email Body Simulation */}
            <div className="p-5 text-xs text-on-surface whitespace-pre-line leading-relaxed font-sans bg-surface-container-lowest">
              {body}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-outline-variant flex items-center justify-between bg-surface-container-low/40">
          <span className="text-xs text-on-surface-variant">
            Halts permanently on any prospect reply or opt-out
          </span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-high rounded-lg transition"
            >
              Close
            </button>
            <button
              type="button"
              disabled={isAdvancing || lead.current_sequence_step >= 4}
              onClick={handleAdvanceStep}
              className="px-5 py-2 text-xs font-bold bg-primary text-on-primary rounded-lg hover:opacity-90 transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              <span>{isAdvancing ? 'Advancing...' : `Simulate Advance to Touch ${Math.min((lead.current_sequence_step || 1) + 1, 4)}`}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

