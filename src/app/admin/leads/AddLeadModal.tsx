'use client'

import React, { useState } from 'react'
import { X, Building, PlusCircle } from 'lucide-react'
import type { GrowthLeadInput, CommunityType, IntentTier } from '@/types/growth-leads'
import { growthLeadSchema, COMMUNITY_TYPE_CONFIG } from '@/types/growth-leads'

interface AddLeadModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: GrowthLeadInput) => Promise<void>
}

export function AddLeadModal({ isOpen, onClose, onSubmit }: AddLeadModalProps) {
  const [formData, setFormData] = useState<GrowthLeadInput>({
    property_name: '',
    community_type: 'motel',
    address: '',
    municipality_town: '',
    county: '',
    key_amenities_notes: '',
    target_gatekeeper_name: '',
    target_gatekeeper_title: '',
    phone: '',
    email: '',
    intent_tier: 3,
    outreach_status: 'new',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const result = growthLeadSchema.safeParse(formData)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        fieldErrors[issue.path[0] as string] = issue.message
      }
      setErrors(fieldErrors)
      return
    }

    try {
      setIsSubmitting(true)
      await onSubmit(result.data)
      onClose()
      setFormData({
        property_name: '',
        community_type: 'motel',
        address: '',
        municipality_town: '',
        county: '',
        key_amenities_notes: '',
        target_gatekeeper_name: '',
        target_gatekeeper_title: '',
        phone: '',
        email: '',
        intent_tier: 3,
        outreach_status: 'new',
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create lead'
      setErrors({ form: msg })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="w-full max-w-2xl bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-2xl overflow-hidden flex flex-col my-8">
        {/* Header */}
        <div className="px-6 py-5 border-b border-outline-variant flex items-center justify-between bg-surface-container-low/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Building size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold font-headline text-on-surface">Add Discovered Property</h2>
              <p className="text-xs text-on-surface-variant">
                Enter asset details matching the 9 standard outreach fields
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errors.form && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 rounded-lg text-xs font-semibold">
              {errors.form}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Property Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Property Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Pine Ridge Manor or Seaside Motel"
                value={formData.property_name}
                onChange={(e) => setFormData({ ...formData, property_name: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-outline-variant bg-surface-container-low text-on-surface focus:outline-hidden focus:border-primary transition"
              />
              {errors.property_name && (
                <p className="text-red-500 text-xs mt-1">{errors.property_name}</p>
              )}
            </div>

            {/* Community Type */}
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Community / Property Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.community_type}
                onChange={(e) =>
                  setFormData({ ...formData, community_type: e.target.value as CommunityType })
                }
                className="w-full px-3 py-2 text-sm rounded-lg border border-outline-variant bg-surface-container-low text-on-surface focus:outline-hidden focus:border-primary transition"
              >
                {Object.entries(COMMUNITY_TYPE_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>
                    {cfg.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Intent Tier */}
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Intent Priority Tier <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.intent_tier}
                onChange={(e) =>
                  setFormData({ ...formData, intent_tier: Number(e.target.value) as IntentTier })
                }
                className="w-full px-3 py-2 text-sm rounded-lg border border-outline-variant bg-surface-container-low text-on-surface focus:outline-hidden focus:border-primary transition"
              >
                <option value={1}>Tier 1 — Highest (Active Pain / Hiring)</option>
                <option value={2}>Tier 2 — High (Violations &amp; Citations)</option>
                <option value={3}>Tier 3 — Targeted Portal (Motel / Student)</option>
                <option value={4}>Tier 4 — Enterprise Portfolio</option>
                <option value={5}>Tier 5 — CRE Public Record</option>
              </select>
            </div>

            {/* Street Address */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Street Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 120 College Avenue"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-outline-variant bg-surface-container-low text-on-surface focus:outline-hidden focus:border-primary transition"
              />
              {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
            </div>

            {/* Municipality / Town */}
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Municipality / City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. New Brunswick"
                value={formData.municipality_town}
                onChange={(e) => setFormData({ ...formData, municipality_town: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-outline-variant bg-surface-container-low text-on-surface focus:outline-hidden focus:border-primary transition"
              />
              {errors.municipality_town && (
                <p className="text-red-500 text-xs mt-1">{errors.municipality_town}</p>
              )}
            </div>

            {/* County */}
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                County <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Middlesex"
                value={formData.county}
                onChange={(e) => setFormData({ ...formData, county: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-outline-variant bg-surface-container-low text-on-surface focus:outline-hidden focus:border-primary transition"
              />
              {errors.county && <p className="text-red-500 text-xs mt-1">{errors.county}</p>}
            </div>

            {/* Target Gatekeeper Name */}
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Target Contact Name
              </label>
              <input
                type="text"
                placeholder="e.g. Jane Doe"
                value={formData.target_gatekeeper_name || ''}
                onChange={(e) =>
                  setFormData({ ...formData, target_gatekeeper_name: e.target.value })
                }
                className="w-full px-3 py-2 text-sm rounded-lg border border-outline-variant bg-surface-container-low text-on-surface focus:outline-hidden focus:border-primary transition"
              />
            </div>

            {/* Target Gatekeeper Title */}
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Target Contact Title
              </label>
              <input
                type="text"
                placeholder="e.g. General Manager or Community Director"
                value={formData.target_gatekeeper_title || ''}
                onChange={(e) =>
                  setFormData({ ...formData, target_gatekeeper_title: e.target.value })
                }
                className="w-full px-3 py-2 text-sm rounded-lg border border-outline-variant bg-surface-container-low text-on-surface focus:outline-hidden focus:border-primary transition"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Direct / Leasing Phone
              </label>
              <input
                type="text"
                placeholder="e.g. (555) 234-5678"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-outline-variant bg-surface-container-low text-on-surface focus:outline-hidden focus:border-primary transition"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Verified Business Email
              </label>
              <input
                type="email"
                placeholder="e.g. jdoe@pine-ridge.com"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-outline-variant bg-surface-container-low text-on-surface focus:outline-hidden focus:border-primary transition"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Key Amenities & Pain Notes */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Key Amenities &amp; Pain Notes
              </label>
              <textarea
                rows={3}
                placeholder="Describe off-hours risks, amenities (pools, parking, front desk), or scraped pain signals (hiring, complaints)..."
                value={formData.key_amenities_notes || ''}
                onChange={(e) =>
                  setFormData({ ...formData, key_amenities_notes: e.target.value })
                }
                className="w-full px-3 py-2 text-sm rounded-lg border border-outline-variant bg-surface-container-low text-on-surface focus:outline-hidden focus:border-primary transition"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-outline-variant flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-high rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold bg-primary text-on-primary rounded-lg hover:opacity-90 transition flex items-center gap-1.5"
            >
              <PlusCircle size={15} />
              {isSubmitting ? 'Saving...' : 'Add Property'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

