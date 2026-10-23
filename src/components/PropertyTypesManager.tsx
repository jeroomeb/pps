'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Check, Building2, Tag, Loader2, Sparkles, Layers } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { createPropertyType, togglePropertyTypeActive } from '@/lib/actions/property-types'
import type { PropertyTypeRecord } from '@/lib/property-types'

export function PropertyTypesManager({
  initialPropertyTypes,
}: {
  initialPropertyTypes: PropertyTypeRecord[]
}) {
  const [types, setTypes] = useState<PropertyTypeRecord[]>(initialPropertyTypes)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [label, setLabel] = useState('')
  const [key, setKey] = useState('')
  const [description, setDescription] = useState('')
  const [payoutMatrixKey, setPayoutMatrixKey] = useState<'luxury_condo' | 'adult_community' | 'commercial_multi'>('luxury_condo')
  const [sortOrder, setSortOrder] = useState<number>(() => types.length + 1)
  const [isPending, startTransition] = useTransition()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const showToast = useToast()
  const router = useRouter()

  // Helper to auto-generate slug code from label
  const handleLabelChange = (val: string) => {
    setLabel(val)
    const slug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
    setKey(slug)
  }

  const handleToggleActive = (id: string, currentActive: boolean) => {
    setPendingId(id)
    const nextActive = !currentActive
    startTransition(async () => {
      // Optimistic update
      setTypes((prev) =>
        prev.map((t) => (t.id === id ? { ...t, is_active: nextActive } : t))
      )
      const res = await togglePropertyTypeActive(id, nextActive)
      setPendingId(null)
      if (res?.success) {
        showToast(
          'success',
          nextActive
            ? 'Property type activated.'
            : 'Property type deactivated.'
        )
        router.refresh()
      } else {
        // Rollback
        setTypes((prev) =>
          prev.map((t) => (t.id === id ? { ...t, is_active: currentActive } : t))
        )
        showToast('error', res?.error || 'Failed to update property type.')
      }
    })
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!label.trim()) {
      showToast('error', 'Property type name is required.')
      return
    }
    if (!key.trim()) {
      showToast('error', 'Key / identifier is required.')
      return
    }

    startTransition(async () => {
      const res = await createPropertyType({
        label: label.trim(),
        key: key.trim(),
        description: description.trim() || undefined,
        payout_matrix_key: payoutMatrixKey,
        sort_order: Number(sortOrder) || 0,
        is_active: true,
      })

      if (res?.success) {
        showToast('success', `Property type "${label}" created successfully.`)
        if (res.data) {
          setTypes((prev) => [...prev, res.data as PropertyTypeRecord].sort((a, b) => a.sort_order - b.sort_order))
        }
        setLabel('')
        setKey('')
        setDescription('')
        setSortOrder(types.length + 2)
        setIsModalOpen(false)
        router.refresh()
      } else {
        showToast('error', res?.error || 'Failed to create property type.')
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Super Admin Notice Card */}
      <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="space-y-1">
          <p className="font-semibold text-on-surface">Super Admin Master Registry</p>
          <p className="text-xs text-on-surface-variant">
            Property types configured here appear dynamically in the Property Creation & Edit flows.
            Provisional Tenant Admins are restricted from creating or altering these definitions to preserve platform data consistency.
          </p>
        </div>
      </div>

      {/* Header with Action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-on-surface">Configured Property Types</h2>
          <p className="text-xs text-on-surface-variant">
            {types.length} total types ({types.filter((t) => t.is_active).length} active)
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary shadow hover:bg-primary/90 transition-colors"
        >
          <Plus size={16} />
          Add Property Type
        </button>
      </div>

      {/* Property Types List */}
      <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-outline-variant bg-surface-container-low text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              <tr>
                <th scope="col" className="px-4 py-3">Property Type</th>
                <th scope="col" className="px-4 py-3">Key / Slug</th>
                <th scope="col" className="px-4 py-3">Payout Matrix Baseline</th>
                <th scope="col" className="px-4 py-3">Order</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {types.map((item) => (
                <tr key={item.id} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Building2 size={16} />
                      </div>
                      <div>
                        <div className="font-semibold text-on-surface">{item.label}</div>
                        {item.description && (
                          <div className="text-xs text-on-surface-variant line-clamp-1">
                            {item.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs text-on-surface-variant">
                    <span className="inline-flex items-center gap-1 rounded bg-surface-container-high px-2 py-0.5">
                      <Tag size={12} />
                      {item.key}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-on-surface-variant">
                    <span className="capitalize font-medium text-on-surface">
                      {item.payout_matrix_key.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-on-surface-variant font-mono">
                    {item.sort_order}
                  </td>
                  <td className="px-4 py-3.5">
                    {item.is_active ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        <Check size={12} />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      type="button"
                      disabled={isPending && pendingId === item.id}
                      onClick={() => handleToggleActive(item.id, item.is_active)}
                      className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium transition-colors ${item.is_active
                          ? 'border border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
                          : 'bg-primary text-on-primary hover:bg-primary/90'
                        }`}
                    >
                      {isPending && pendingId === item.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : item.is_active ? (
                        'Deactivate'
                      ) : (
                        'Activate'
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-outline-variant bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-outline-variant pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Layers size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-on-surface">Add New Property Type</h3>
                  <p className="text-xs text-on-surface-variant">
                    Platform Master Registry (Super Admin Only)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
                  Type Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Student Housing, Mixed-Use Resort"
                  value={label}
                  onChange={(e) => handleLabelChange(e.target.value)}
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
                  Key / Slug (Database Identifier) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. student_housing"
                  value={key}
                  onChange={(e) => setKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className="w-full font-mono rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-on-surface-variant">
                  Used as unique ID across API integrations and database records. Lowercase letters and underscores only.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
                  Payout Matrix Baseline *
                </label>
                <select
                  value={payoutMatrixKey}
                  onChange={(e) =>
                    setPayoutMatrixKey(e.target.value as 'luxury_condo' | 'adult_community' | 'commercial_multi')
                  }
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
                >
                  <option value="luxury_condo">Luxury Condo (Standard residential tier baseline)</option>
                  <option value="adult_community">55+ Active Adult Community baseline</option>
                  <option value="commercial_multi">Commercial Multi-Tenant baseline</option>
                </select>
                <p className="mt-1 text-[11px] text-on-surface-variant">
                  Determines which inspector payout matrix rates apply for this building type when standard rate cards are used.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  min={1}
                  value={sortOrder}
                  onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief note or operational guidance for this property classification..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-outline-variant">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-outline-variant px-4 py-2 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary shadow hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isPending && <Loader2 size={16} className="animate-spin" />}
                  Save Property Type
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
