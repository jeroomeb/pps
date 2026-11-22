'use client'

import React, { useState } from 'react'
import {
  X,
  Building,
  MapPin,
  User,
  Phone,
  Mail,
  AlertTriangle,
  Send,
  Calendar,
  CheckCircle,
  Copy,
  ExternalLink,
} from 'lucide-react'
import type { GrowthLead, OutreachStatus } from '@/types/growth-leads'
import {
  COMMUNITY_TYPE_CONFIG,
  INTENT_TIER_CONFIG,
  OUTREACH_STATUS_CONFIG,
} from '@/types/growth-leads'

interface LeadDrawerProps {
  lead: GrowthLead | null
  onClose: () => void
  onStatusChange: (id: string, status: OutreachStatus) => Promise<void>
}

export function LeadDrawer({ lead, onClose, onStatusChange }: LeadDrawerProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  if (!lead) return null

  const communityConfig = COMMUNITY_TYPE_CONFIG[lead.community_type] || COMMUNITY_TYPE_CONFIG.other
  const tierConfig = INTENT_TIER_CONFIG[lead.intent_tier] || INTENT_TIER_CONFIG[3]
  const statusConfig = OUTREACH_STATUS_CONFIG[lead.outreach_status] || OUTREACH_STATUS_CONFIG.new

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldName)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleStatusSelect = async (newStatus: OutreachStatus) => {
    try {
      setIsUpdating(true)
      await onStatusChange(lead.id, newStatus)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-xl bg-surface-container-lowest shadow-2xl border-l border-outline-variant flex flex-col">
          {/* Header */}
          <div className="border-b border-outline-variant px-6 py-5 flex items-center justify-between bg-surface-container-low/30">
            <div className="min-w-0 pr-4">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border ${communityConfig.badgeClass}`}
                >
                  {communityConfig.label}
                </span>
                <span
                  className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs border ${tierConfig.badgeClass}`}
                >
                  {tierConfig.label}
                </span>
              </div>
              <h2 className="text-xl font-bold font-headline text-on-surface truncate">
                {lead.property_name}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-on-surface-variant hover:bg-surface-container-high transition"
              aria-label="Close panel"
            >
              <X size={20} />
            </button>
          </div>

          {/* Drawer Body (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Quick Status Control */}
            <div className="rounded-xl border border-outline-variant bg-surface-container-low/40 p-4">
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant block mb-2">
                Outreach Lifecycle Status
              </label>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    'new',
                    'enriched',
                    'in_sequence',
                    'replied',
                    'demo_scheduled',
                    'disqualified',
                  ] as OutreachStatus[]
                ).map((st) => {
                  const cfg = OUTREACH_STATUS_CONFIG[st]
                  const isCurrent = lead.outreach_status === st
                  return (
                    <button
                      key={st}
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleStatusSelect(st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                        isCurrent
                          ? 'bg-primary text-on-primary border-primary shadow-xs'
                          : 'bg-surface-container-lowest text-on-surface border-outline-variant hover:border-primary/50'
                      }`}
                    >
                      {cfg.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Target Decision Maker Contact Card */}
            <div className="rounded-xl border border-outline-variant p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User size={18} className="text-primary" />
                  <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">
                    Target Gatekeeper / Contact
                  </h3>
                </div>
                <span className="text-xs text-on-surface-variant">Verified</span>
              </div>

              <div className="bg-surface-container-low/50 rounded-lg p-3.5 space-y-2">
                <div>
                  <div className="text-sm font-bold text-on-surface">
                    {lead.target_gatekeeper_name || 'No gatekeeper assigned'}
                  </div>
                  <div className="text-xs text-on-surface-variant">
                    {lead.target_gatekeeper_title || 'Title pending verification'}
                  </div>
                </div>

                <div className="pt-2 border-t border-outline-variant/60 flex flex-col gap-2">
                  {lead.email ? (
                    <div className="flex items-center justify-between text-xs">
                      <a
                        href={`mailto:${lead.email}`}
                        className="flex items-center gap-2 text-primary hover:underline font-medium truncate"
                      >
                        <Mail size={14} className="shrink-0" />
                        <span className="truncate">{lead.email}</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => handleCopy(lead.email!, 'email')}
                        className="text-on-surface-variant hover:text-on-surface p-1"
                        title="Copy email"
                      >
                        {copiedField === 'email' ? (
                          <CheckCircle size={14} className="text-emerald-500" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs text-on-surface-variant italic">Email: Pending discovery</div>
                  )}

                  {lead.phone ? (
                    <div className="flex items-center justify-between text-xs">
                      <a
                        href={`tel:${lead.phone.replace(/[^0-9+]/g, '')}`}
                        className="flex items-center gap-2 text-primary hover:underline font-medium"
                      >
                        <Phone size={14} className="shrink-0" />
                        <span>{lead.phone}</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => handleCopy(lead.phone!, 'phone')}
                        className="text-on-surface-variant hover:text-on-surface p-1"
                        title="Copy phone"
                      >
                        {copiedField === 'phone' ? (
                          <CheckCircle size={14} className="text-emerald-500" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs text-on-surface-variant italic">Phone: Pending discovery</div>
                  )}
                </div>
              </div>
            </div>

            {/* Property Location & Jurisdiction */}
            <div className="rounded-xl border border-outline-variant p-5 space-y-3">
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-primary" />
                <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">
                  Location &amp; Municipality
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-on-surface-variant block mb-0.5">Street Address</span>
                  <span className="font-semibold text-on-surface">{lead.address}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant block mb-0.5">Municipality / City</span>
                  <span className="font-semibold text-on-surface">{lead.municipality_town}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant block mb-0.5">County Jurisdiction</span>
                  <span className="font-semibold text-on-surface">{lead.county} County</span>
                </div>
                <div>
                  <span className="text-on-surface-variant block mb-0.5">Category Class</span>
                  <span className="font-semibold text-on-surface">{communityConfig.label}</span>
                </div>
              </div>
            </div>

            {/* Key Amenities & Scraped Pain Triggers */}
            <div className="rounded-xl border border-outline-variant p-5 space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-500" />
                <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">
                  Key Amenities &amp; Pain Signals
                </h3>
              </div>
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 text-xs leading-relaxed text-on-surface">
                {lead.key_amenities_notes || 'No specific pain signals or amenities noted.'}
              </div>

              {lead.intent_signals && lead.intent_signals.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">
                    Detected Trigger Events ({lead.intent_signals.length})
                  </span>
                  {lead.intent_signals.map((sig, idx) => (
                    <div
                      key={idx}
                      className="text-xs bg-surface-container-low p-2.5 rounded-lg border border-outline-variant/60 flex items-start gap-2"
                    >
                      <span className="font-bold text-primary uppercase shrink-0">
                        [{sig.source}]:
                      </span>
                      <span className="text-on-surface">{sig.note}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cadence Progress */}
            <div className="rounded-xl border border-outline-variant p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Send size={18} className="text-primary" />
                  <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">
                    4-Touch Sales Sequence
                  </h3>
                </div>
                <span className="text-xs font-semibold text-primary">
                  Step {lead.current_sequence_step} of 4
                </span>
              </div>

              {/* Sequence Progress Bar */}
              <div className="grid grid-cols-4 gap-2 pt-1">
                {[1, 2, 3, 4].map((step) => {
                  const isDone = lead.current_sequence_step >= step
                  return (
                    <div key={step} className="space-y-1">
                      <div
                        className={`h-2 rounded-full ${
                          isDone ? 'bg-primary' : 'bg-surface-container-high'
                        }`}
                      />
                      <span className="text-[10px] text-on-surface-variant block text-center font-medium">
                        Touch {step}
                      </span>
                    </div>
                  )
                })}
              </div>

              <div className="text-xs text-on-surface-variant pt-2 flex items-center justify-between border-t border-outline-variant/60">
                <span>
                  Discovered:{' '}
                  {new Date(lead.created_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
                <span>Source: {lead.source}</span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="border-t border-outline-variant p-4 bg-surface-container-low/40 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

