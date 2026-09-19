'use client'

import { useState, useTransition, useActionState } from 'react'
import {
  DollarSign,
  CheckCircle2,
  Clock,
  CheckCheck,
  CreditCard,
  SlidersHorizontal,
  ChevronRight,
  AlertCircle,
  FileText,
  Building,
  User,
} from 'lucide-react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import {
  toggleTenantPayouts,
  updateTenantDefaultRate,
  updateTenantPayoutMatrix,
  approvePayout,
  batchApprovePayouts,
  markPayoutPaid,
  type PayoutActionState,
} from '@/lib/actions/payouts'
import { formatDate } from '@/lib/timezone'
import type { PayoutStatus, PayoutMatrix } from '@/lib/database.types'

export type AdminPayoutRow = {
  id: string
  inspectionId: string
  specialistId: string
  specialistName: string
  specialistHumanId: string | null
  propertyId: string
  propertyName: string
  amount: number
  status: PayoutStatus
  approvedAt: string | null
  paidAt: string | null
  paymentReference: string | null
  notes: string | null
  createdAt: string
}

export function AdminPayoutsManager({
  tenantId,
  initialEnabled,
  initialDefaultRate,
  initialTier1Rate = 50.0,
  initialTier2Rate = 75.0,
  initialTier3Rate = 100.0,
  initialMatrix,
  payouts,
}: {
  tenantId: string
  initialEnabled: boolean
  initialDefaultRate: number
  initialTier1Rate?: number
  initialTier2Rate?: number
  initialTier3Rate?: number
  initialMatrix?: PayoutMatrix | null
  payouts: AdminPayoutRow[]
}) {
  const showToast = useToast()
  const [pending, startTransition] = useTransition()
  const [enabled, setEnabled] = useState(initialEnabled)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [statusFilter, setStatusFilter] = useState<'all' | PayoutStatus>('all')
  const [payingPayout, setPayingPayout] = useState<AdminPayoutRow | null>(null)

  const matrix = initialMatrix ?? {
    luxury_condo: { tier_1: initialTier1Rate, tier_2: initialTier2Rate, tier_3: initialTier3Rate },
    adult_community: { tier_1: 55.0, tier_2: 80.0, tier_3: 110.0 },
    commercial_multi: { tier_1: 65.0, tier_2: 95.0, tier_3: 130.0 },
  }

  // Rate action state
  const [rateState, rateAction] = useActionState<PayoutActionState, FormData>(
    async (prev, formData) => {
      const res = await updateTenantDefaultRate(prev, formData)
      if (res?.success) {
        showToast('success', 'Default audit compensation rate updated.')
      } else if (res?.error) {
        showToast('error', res.error)
      }
      return res
    },
    undefined
  )

  // 3-Tier Property Category x Service Tier Matrix action state
  const [matrixState, matrixAction] = useActionState<PayoutActionState, FormData>(
    async (prev, formData) => {
      const res = await updateTenantPayoutMatrix(prev, formData)
      if (res?.success) {
        showToast('success', '3-Tier Property Compensation Matrix saved successfully.')
      } else if (res?.error) {
        showToast('error', res.error)
      }
      return res
    },
    undefined
  )

  // Payment settlement action state
  const [payState, payAction] = useActionState<PayoutActionState, FormData>(
    async (prev, formData) => {
      const res = await markPayoutPaid(prev, formData)
      if (res?.success) {
        setPayingPayout(null)
        showToast('success', 'Payout marked as paid.')
      } else if (res?.error) {
        showToast('error', res.error)
      }
      return res
    },
    undefined
  )

  function handleToggleModule(e: React.ChangeEvent<HTMLInputElement>) {
    const nextVal = e.target.checked
    setEnabled(nextVal)
    startTransition(async () => {
      const res = await toggleTenantPayouts(tenantId, nextVal)
      if (res?.error) {
        setEnabled(!nextVal)
        showToast('error', res.error)
      } else {
        showToast(
          'success',
          `Specialist Payouts module ${nextVal ? 'enabled' : 'disabled'}.`
        )
      }
    })
  }

  function handleApprove(id: string) {
    startTransition(async () => {
      const res = await approvePayout(id)
      if (res?.error) {
        showToast('error', res.error)
      } else {
        showToast('success', 'Audit payout approved.')
      }
    })
  }

  function handleBatchApprove() {
    const ids = Array.from(selectedIds)
    if (!ids.length) return

    startTransition(async () => {
      const res = await batchApprovePayouts(ids)
      if (res?.error) {
        showToast('error', res.error)
      } else {
        setSelectedIds(new Set())
        showToast('success', `${ids.length} audit payouts approved.`)
      }
    })
  }

  const filteredPayouts = payouts.filter((p) => {
    if (statusFilter === 'all') return true
    return p.status === statusFilter
  })

  // Financial aggregates
  const pendingItems = payouts.filter((p) => p.status === 'pending')
  const approvedItems = payouts.filter((p) => p.status === 'approved')
  const paidItems = payouts.filter((p) => p.status === 'paid')

  const pendingTotal = pendingItems.reduce((acc, p) => acc + Number(p.amount), 0)
  const approvedTotal = approvedItems.reduce((acc, p) => acc + Number(p.amount), 0)
  const paidTotal = paidItems.reduce((acc, p) => acc + Number(p.amount), 0)

  return (
    <div className="flex flex-col gap-6">
      {/* Module Configuration & Feature Flag Banner */}
      <Card className="flex flex-col gap-4 border-primary/30">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-container text-on-primary-container">
              <SlidersHorizontal size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="font-headline text-base font-bold">Specialist Payouts &amp; Compensation Module</h2>
              <p className="text-xs text-on-surface-variant">
                Toggle financial tracking on for 1099 contractor models, or off for internal salaried/W-2 facilities teams.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-on-surface">
              {enabled ? 'Module Enabled' : 'Module Disabled'}
            </span>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={enabled}
                onChange={handleToggleModule}
                disabled={pending}
                className="sr-only peer"
              />
              <div className="peer h-6 w-11 rounded-full bg-surface-container-highest after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-focus:outline-none" />
            </label>
          </div>
        </div>

        {enabled && (
          <div className="flex flex-col gap-5 pt-2 border-t border-outline-variant">
            {/* 3x3 Property Category x Service Tier Compensation Matrix */}
            <form action={matrixAction} className="flex flex-col gap-4 rounded-lg border border-primary/20 bg-surface-container-low p-4">
              <input type="hidden" name="tenant_id" value={tenantId} />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-headline text-xs font-bold uppercase tracking-wider text-primary">
                    3-Tier Property Compensation Matrix
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Grid rates by Property Type and Service Tier. When an audit is completed, payout is automatically calculated from this matrix.
                  </p>
                </div>
              </div>

              {/* Desktop / Tablet Matrix Grid View */}
              <div className="hidden sm:block overflow-x-auto rounded border border-outline-variant/60 bg-surface">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant/60 bg-surface-container-highest/40">
                      <th className="py-2.5 px-3.5 font-semibold text-on-surface">Property Type / Category</th>
                      <th className="py-2.5 px-3.5 font-semibold text-on-surface text-center">
                        Tier 1 (Baseline)
                      </th>
                      <th className="py-2.5 px-3.5 font-semibold text-on-surface text-center">
                        Tier 2 (Premier)
                      </th>
                      <th className="py-2.5 px-3.5 font-semibold text-on-surface text-center">
                        Tier 3 (Sovereign)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/40">
                    {/* Row 1: Luxury Condominium */}
                    <tr>
                      <td className="py-3 px-3.5 font-medium text-on-surface">
                        <span className="font-semibold text-on-surface block">Luxury Condominium</span>
                        <span className="text-[10px] text-on-surface-variant">High-end residential towers &amp; HOAs</span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <div className="relative inline-block w-28">
                          <span className="absolute left-2.5 top-2 text-xs text-on-surface-variant">$</span>
                          <input
                            name="luxury_tier_1"
                            type="number"
                            step="0.01"
                            min="0"
                            defaultValue={matrix.luxury_condo.tier_1}
                            required
                            className="h-8 w-full rounded border border-outline-variant bg-surface pl-6 pr-2 text-xs font-mono text-center focus:border-primary focus:outline-none"
                          />
                        </div>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <div className="relative inline-block w-28">
                          <span className="absolute left-2.5 top-2 text-xs text-on-surface-variant">$</span>
                          <input
                            name="luxury_tier_2"
                            type="number"
                            step="0.01"
                            min="0"
                            defaultValue={matrix.luxury_condo.tier_2}
                            required
                            className="h-8 w-full rounded border border-outline-variant bg-surface pl-6 pr-2 text-xs font-mono text-center focus:border-primary focus:outline-none"
                          />
                        </div>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <div className="relative inline-block w-28">
                          <span className="absolute left-2.5 top-2 text-xs text-on-surface-variant">$</span>
                          <input
                            name="luxury_tier_3"
                            type="number"
                            step="0.01"
                            min="0"
                            defaultValue={matrix.luxury_condo.tier_3}
                            required
                            className="h-8 w-full rounded border border-outline-variant bg-surface pl-6 pr-2 text-xs font-mono text-center focus:border-primary focus:outline-none"
                          />
                        </div>
                      </td>
                    </tr>

                    {/* Row 2: 55+ Active Adult Community */}
                    <tr>
                      <td className="py-3 px-3.5 font-medium text-on-surface">
                        <span className="font-semibold text-on-surface block">55+ Active Adult Community</span>
                        <span className="text-[10px] text-on-surface-variant">Senior living, clubhouses &amp; recreational assets</span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <div className="relative inline-block w-28">
                          <span className="absolute left-2.5 top-2 text-xs text-on-surface-variant">$</span>
                          <input
                            name="adult_tier_1"
                            type="number"
                            step="0.01"
                            min="0"
                            defaultValue={matrix.adult_community.tier_1}
                            required
                            className="h-8 w-full rounded border border-outline-variant bg-surface pl-6 pr-2 text-xs font-mono text-center focus:border-primary focus:outline-none"
                          />
                        </div>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <div className="relative inline-block w-28">
                          <span className="absolute left-2.5 top-2 text-xs text-on-surface-variant">$</span>
                          <input
                            name="adult_tier_2"
                            type="number"
                            step="0.01"
                            min="0"
                            defaultValue={matrix.adult_community.tier_2}
                            required
                            className="h-8 w-full rounded border border-outline-variant bg-surface pl-6 pr-2 text-xs font-mono text-center focus:border-primary focus:outline-none"
                          />
                        </div>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <div className="relative inline-block w-28">
                          <span className="absolute left-2.5 top-2 text-xs text-on-surface-variant">$</span>
                          <input
                            name="adult_tier_3"
                            type="number"
                            step="0.01"
                            min="0"
                            defaultValue={matrix.adult_community.tier_3}
                            required
                            className="h-8 w-full rounded border border-outline-variant bg-surface pl-6 pr-2 text-xs font-mono text-center focus:border-primary focus:outline-none"
                          />
                        </div>
                      </td>
                    </tr>

                    {/* Row 3: Commercial Multi-Tenant */}
                    <tr>
                      <td className="py-3 px-3.5 font-medium text-on-surface">
                        <span className="font-semibold text-on-surface block">Commercial Multi-Tenant</span>
                        <span className="text-[10px] text-on-surface-variant">Office parks, retail strips &amp; industrial suites</span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <div className="relative inline-block w-28">
                          <span className="absolute left-2.5 top-2 text-xs text-on-surface-variant">$</span>
                          <input
                            name="commercial_tier_1"
                            type="number"
                            step="0.01"
                            min="0"
                            defaultValue={matrix.commercial_multi.tier_1}
                            required
                            className="h-8 w-full rounded border border-outline-variant bg-surface pl-6 pr-2 text-xs font-mono text-center focus:border-primary focus:outline-none"
                          />
                        </div>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <div className="relative inline-block w-28">
                          <span className="absolute left-2.5 top-2 text-xs text-on-surface-variant">$</span>
                          <input
                            name="commercial_tier_2"
                            type="number"
                            step="0.01"
                            min="0"
                            defaultValue={matrix.commercial_multi.tier_2}
                            required
                            className="h-8 w-full rounded border border-outline-variant bg-surface pl-6 pr-2 text-xs font-mono text-center focus:border-primary focus:outline-none"
                          />
                        </div>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <div className="relative inline-block w-28">
                          <span className="absolute left-2.5 top-2 text-xs text-on-surface-variant">$</span>
                          <input
                            name="commercial_tier_3"
                            type="number"
                            step="0.01"
                            min="0"
                            defaultValue={matrix.commercial_multi.tier_3}
                            required
                            className="h-8 w-full rounded border border-outline-variant bg-surface pl-6 pr-2 text-xs font-mono text-center focus:border-primary focus:outline-none"
                          />
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Mobile View: Category-based Cards */}
              <div className="sm:hidden flex flex-col gap-3">
                {/* Mobile: Luxury Condominium */}
                <div className="rounded border border-outline-variant/60 bg-surface p-3 flex flex-col gap-2.5">
                  <div>
                    <span className="text-xs font-bold text-on-surface block">Luxury Condominium</span>
                    <span className="text-[10px] text-on-surface-variant">High-end residential towers</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-semibold text-on-surface-variant">Tier 1 (Base)</label>
                      <div className="relative">
                        <span className="absolute left-2 top-2 text-[10px] text-on-surface-variant">$</span>
                        <input
                          name="luxury_tier_1"
                          type="number"
                          step="0.01"
                          min="0"
                          defaultValue={matrix.luxury_condo.tier_1}
                          required
                          className="h-8 w-full rounded border border-outline-variant bg-surface pl-4 pr-1 text-[11px] font-mono text-center"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-semibold text-on-surface-variant">Tier 2 (Prem)</label>
                      <div className="relative">
                        <span className="absolute left-2 top-2 text-[10px] text-on-surface-variant">$</span>
                        <input
                          name="luxury_tier_2"
                          type="number"
                          step="0.01"
                          min="0"
                          defaultValue={matrix.luxury_condo.tier_2}
                          required
                          className="h-8 w-full rounded border border-outline-variant bg-surface pl-4 pr-1 text-[11px] font-mono text-center"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-semibold text-on-surface-variant">Tier 3 (Sov)</label>
                      <div className="relative">
                        <span className="absolute left-2 top-2 text-[10px] text-on-surface-variant">$</span>
                        <input
                          name="luxury_tier_3"
                          type="number"
                          step="0.01"
                          min="0"
                          defaultValue={matrix.luxury_condo.tier_3}
                          required
                          className="h-8 w-full rounded border border-outline-variant bg-surface pl-4 pr-1 text-[11px] font-mono text-center"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile: 55+ Active Adult */}
                <div className="rounded border border-outline-variant/60 bg-surface p-3 flex flex-col gap-2.5">
                  <div>
                    <span className="text-xs font-bold text-on-surface block">55+ Active Adult Community</span>
                    <span className="text-[10px] text-on-surface-variant">Senior living &amp; recreational</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-semibold text-on-surface-variant">Tier 1 (Base)</label>
                      <div className="relative">
                        <span className="absolute left-2 top-2 text-[10px] text-on-surface-variant">$</span>
                        <input
                          name="adult_tier_1"
                          type="number"
                          step="0.01"
                          min="0"
                          defaultValue={matrix.adult_community.tier_1}
                          required
                          className="h-8 w-full rounded border border-outline-variant bg-surface pl-4 pr-1 text-[11px] font-mono text-center"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-semibold text-on-surface-variant">Tier 2 (Prem)</label>
                      <div className="relative">
                        <span className="absolute left-2 top-2 text-[10px] text-on-surface-variant">$</span>
                        <input
                          name="adult_tier_2"
                          type="number"
                          step="0.01"
                          min="0"
                          defaultValue={matrix.adult_community.tier_2}
                          required
                          className="h-8 w-full rounded border border-outline-variant bg-surface pl-4 pr-1 text-[11px] font-mono text-center"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-semibold text-on-surface-variant">Tier 3 (Sov)</label>
                      <div className="relative">
                        <span className="absolute left-2 top-2 text-[10px] text-on-surface-variant">$</span>
                        <input
                          name="adult_tier_3"
                          type="number"
                          step="0.01"
                          min="0"
                          defaultValue={matrix.adult_community.tier_3}
                          required
                          className="h-8 w-full rounded border border-outline-variant bg-surface pl-4 pr-1 text-[11px] font-mono text-center"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile: Commercial Multi-Tenant */}
                <div className="rounded border border-outline-variant/60 bg-surface p-3 flex flex-col gap-2.5">
                  <div>
                    <span className="text-xs font-bold text-on-surface block">Commercial Multi-Tenant</span>
                    <span className="text-[10px] text-on-surface-variant">Office parks &amp; retail</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-semibold text-on-surface-variant">Tier 1 (Base)</label>
                      <div className="relative">
                        <span className="absolute left-2 top-2 text-[10px] text-on-surface-variant">$</span>
                        <input
                          name="commercial_tier_1"
                          type="number"
                          step="0.01"
                          min="0"
                          defaultValue={matrix.commercial_multi.tier_1}
                          required
                          className="h-8 w-full rounded border border-outline-variant bg-surface pl-4 pr-1 text-[11px] font-mono text-center"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-semibold text-on-surface-variant">Tier 2 (Prem)</label>
                      <div className="relative">
                        <span className="absolute left-2 top-2 text-[10px] text-on-surface-variant">$</span>
                        <input
                          name="commercial_tier_2"
                          type="number"
                          step="0.01"
                          min="0"
                          defaultValue={matrix.commercial_multi.tier_2}
                          required
                          className="h-8 w-full rounded border border-outline-variant bg-surface pl-4 pr-1 text-[11px] font-mono text-center"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-semibold text-on-surface-variant">Tier 3 (Sov)</label>
                      <div className="relative">
                        <span className="absolute left-2 top-2 text-[10px] text-on-surface-variant">$</span>
                        <input
                          name="commercial_tier_3"
                          type="number"
                          step="0.01"
                          min="0"
                          defaultValue={matrix.commercial_multi.tier_3}
                          required
                          className="h-8 w-full rounded border border-outline-variant bg-surface pl-4 pr-1 text-[11px] font-mono text-center"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-outline-variant/40">
                {matrixState?.error ? (
                  <p className="text-xs text-error">{matrixState.error}</p>
                ) : (
                  <span className="text-[11px] text-on-surface-variant">
                    Specific properties can also specify custom flat rate overrides on their edit form.
                  </span>
                )}
                <button
                  type="submit"
                  disabled={pending}
                  className="min-h-9 rounded bg-primary-container px-4 text-xs font-semibold uppercase tracking-wide text-on-primary-container hover:brightness-95 transition"
                >
                  Save Matrix Rates
                </button>
              </div>
            </form>

            {/* Fallback Base Rate */}
            <form action={rateAction} className="flex flex-wrap items-end gap-3">
              <input type="hidden" name="tenant_id" value={tenantId} />
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="default_rate"
                  className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant"
                >
                  Fallback Unclassified Property Rate ($ USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-on-surface-variant">$</span>
                  <input
                    id="default_rate"
                    name="default_rate"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={initialDefaultRate}
                    required
                    className="min-h-9 w-40 rounded border border-outline-variant bg-surface-container-lowest pl-6 pr-3 text-xs font-mono focus:border-primary-container focus:outline-none"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={pending}
                className="min-h-9 rounded bg-surface-container px-3 text-xs font-semibold uppercase tracking-wide text-on-surface hover:bg-surface-container-high transition"
              >
                Update Fallback Rate
              </button>
              {rateState?.error && <p className="text-xs text-error">{rateState.error}</p>}
            </form>
          </div>
        )}
      </Card>

      {!enabled ? (
        <Card className="flex flex-col items-center justify-center py-12 text-center">
          <DollarSign size={36} className="mb-2 text-on-surface-variant/40" />
          <h3 className="font-headline text-base font-bold text-on-surface">Payouts Module is Currently Disabled</h3>
          <p className="max-w-md text-xs text-on-surface-variant mt-1">
            Turn on the module switch above to enable compensation tracking, automatic earnings ledger generation, and payout disbursement workflows.
          </p>
        </Card>
      ) : (
        <>
          {/* Financial KPI Summary Strip */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="flex items-center justify-between">
              <div>
                <p className="label-tracked text-on-surface-variant">Pending Approval</p>
                <p className="mt-1 font-headline text-2xl font-bold">${pendingTotal.toFixed(2)}</p>
                <p className="text-[11px] text-on-surface-variant">{pendingItems.length} audit(s) awaiting review</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-700">
                <Clock size={20} />
              </div>
            </Card>

            <Card className="flex items-center justify-between">
              <div>
                <p className="label-tracked text-on-surface-variant">Approved / Ready to Pay</p>
                <p className="mt-1 font-headline text-2xl font-bold text-primary">${approvedTotal.toFixed(2)}</p>
                <p className="text-[11px] text-on-surface-variant">{approvedItems.length} audit(s) ready for disbursement</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-container text-on-primary-container">
                <CheckCircle2 size={20} className="text-primary" />
              </div>
            </Card>

            <Card className="flex items-center justify-between">
              <div>
                <p className="label-tracked text-on-surface-variant">Total Paid Out</p>
                <p className="mt-1 font-headline text-2xl font-bold text-success">${paidTotal.toFixed(2)}</p>
                <p className="text-[11px] text-on-surface-variant">{paidItems.length} completed disbursement(s)</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-container/40 text-success">
                <CreditCard size={20} />
              </div>
            </Card>
          </div>

          {/* Action Toolbar & Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container-low p-1">
              {(['all', 'pending', 'approved', 'paid'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={`rounded px-3 py-1.5 text-xs font-semibold capitalize transition ${
                    statusFilter === s
                      ? 'bg-surface-container-lowest text-primary shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {selectedIds.size > 0 && (
              <button
                type="button"
                onClick={handleBatchApprove}
                disabled={pending}
                className="flex items-center gap-1.5 rounded-lg bg-primary-container px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-on-primary-container hover:brightness-95 disabled:opacity-50"
              >
                <CheckCheck size={14} />
                Approve Selected ({selectedIds.size})
              </button>
            )}
          </div>

          {/* Payouts Table */}
          {filteredPayouts.length ? (
            <Card padded={false}>
              <table className="hidden w-full text-sm lg:table">
                <thead>
                  <tr className="border-b border-outline-variant text-left label-tracked text-on-surface-variant">
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={
                          selectedIds.size > 0 &&
                          selectedIds.size ===
                            filteredPayouts.filter((p) => p.status === 'pending').length
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(
                              new Set(
                                filteredPayouts
                                  .filter((p) => p.status === 'pending')
                                  .map((p) => p.id)
                              )
                            )
                          } else {
                            setSelectedIds(new Set())
                          }
                        }}
                        className="rounded accent-[#ee8a4b]"
                      />
                    </th>
                    <th className="px-4 py-3 font-semibold">Specialist</th>
                    <th className="px-4 py-3 font-semibold">Property</th>
                    <th className="px-4 py-3 font-semibold">Date Completed</th>
                    <th className="px-4 py-3 font-semibold">Amount</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Payment Details</th>
                    <th className="px-4 py-3 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayouts.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-outline-variant transition last:border-0 hover:bg-surface-container-low"
                    >
                      <td className="px-4 py-3">
                        {row.status === 'pending' && (
                          <input
                            type="checkbox"
                            checked={selectedIds.has(row.id)}
                            onChange={(e) => {
                              const next = new Set(selectedIds)
                              if (e.target.checked) next.add(row.id)
                              else next.delete(row.id)
                              setSelectedIds(next)
                            }}
                            className="rounded accent-[#ee8a4b]"
                          />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 font-semibold">
                          <User size={13} className="text-on-surface-variant" />
                          <span>{row.specialistName}</span>
                          {row.specialistHumanId && (
                            <span className="font-mono text-xs text-on-surface-variant">
                              ({row.specialistHumanId})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/properties/${row.propertyId}`}
                          className="flex items-center gap-1.5 hover:underline text-on-surface"
                        >
                          <Building size={13} className="text-on-surface-variant" />
                          <span>{row.propertyName}</span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-xs text-on-surface-variant">
                        {formatDate(new Date(row.createdAt))}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-on-surface">
                        ${Number(row.amount).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                            row.status === 'paid'
                              ? 'bg-success-container/40 text-success'
                              : row.status === 'approved'
                                ? 'bg-primary-container text-on-primary-container'
                                : 'bg-amber-500/10 text-amber-700'
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-on-surface-variant">
                        {row.paymentReference ? (
                          <div className="font-mono font-medium">Ref: {row.paymentReference}</div>
                        ) : row.approvedAt ? (
                          <span>Approved {formatDate(new Date(row.approvedAt))}</span>
                        ) : (
                          <span>—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/reports/${row.inspectionId}`}
                            title="View Audit Report"
                            className="flex h-8 w-8 items-center justify-center rounded border border-outline-variant text-on-surface-variant hover:bg-surface-container transition"
                          >
                            <FileText size={14} />
                          </Link>

                          {row.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => handleApprove(row.id)}
                              disabled={pending}
                              className="rounded bg-primary-container px-2.5 py-1 text-xs font-semibold text-on-primary-container hover:brightness-95 transition"
                            >
                              Approve
                            </button>
                          )}

                          {row.status === 'approved' && (
                            <button
                              type="button"
                              onClick={() => setPayingPayout(row)}
                              className="rounded bg-success px-2.5 py-1 text-xs font-semibold text-white hover:brightness-95 transition"
                            >
                              Mark Paid
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile View Cards */}
              <div className="flex flex-col divide-y divide-outline-variant lg:hidden">
                {filteredPayouts.map((row) => (
                  <div key={row.id} className="flex flex-col gap-2 p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{row.specialistName}</p>
                      <span className="font-mono font-bold text-sm">
                        ${Number(row.amount).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant">{row.propertyName}</p>
                    <div className="flex items-center justify-between pt-1">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                          row.status === 'paid'
                            ? 'bg-success-container/40 text-success'
                            : row.status === 'approved'
                              ? 'bg-primary-container text-on-primary-container'
                              : 'bg-amber-500/10 text-amber-700'
                        }`}
                      >
                        {row.status}
                      </span>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/reports/${row.inspectionId}`}
                          title="View Audit Report"
                          className="flex h-7 w-7 items-center justify-center rounded border border-outline-variant text-on-surface-variant hover:bg-surface-container"
                        >
                          <FileText size={13} />
                        </Link>

                        {row.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => handleApprove(row.id)}
                            disabled={pending}
                            className="rounded bg-primary-container px-2.5 py-1 text-[11px] font-semibold text-on-primary-container"
                          >
                            Approve
                          </button>
                        )}
                        {row.status === 'approved' && (
                          <button
                            type="button"
                            onClick={() => setPayingPayout(row)}
                            className="rounded bg-success px-2.5 py-1 text-[11px] font-semibold text-white"
                          >
                            Mark Paid
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <Card className="flex flex-col items-center justify-center py-8 text-center text-on-surface-variant">
              <AlertCircle size={24} className="mb-1 text-on-surface-variant/70" />
              <p className="text-xs font-semibold">No payout records found in this category.</p>
              <p className="text-[11px]">Completed audits will appear here automatically.</p>
            </Card>
          )}

          {/* Mark Paid Modal */}
          {payingPayout && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
              <div className="w-full max-w-md rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-xl">
                <h3 className="font-headline text-lg font-bold">Record Payout Disbursement</h3>
                <p className="mt-1 text-xs text-on-surface-variant">
                  Mark ${Number(payingPayout.amount).toFixed(2)} payout as paid to{' '}
                  <strong>{payingPayout.specialistName}</strong>.
                </p>

                <form action={payAction} className="mt-4 flex flex-col gap-3">
                  <input type="hidden" name="payout_id" value={payingPayout.id} />

                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="payment_reference"
                      className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant"
                    >
                      Payment Reference / Transaction ID *
                    </label>
                    <input
                      id="payment_reference"
                      name="payment_reference"
                      type="text"
                      required
                      placeholder="e.g. ACH-9082, Stripe ch_3Lpx, Check #402"
                      className="min-h-10 rounded border border-outline-variant bg-surface-container-lowest px-3 text-xs focus:border-primary-container focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="notes"
                      className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant"
                    >
                      Optional Settlement Notes
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      rows={2}
                      placeholder="Notes for accounting records"
                      className="rounded border border-outline-variant bg-surface-container-lowest p-2.5 text-xs focus:border-primary-container focus:outline-none"
                    />
                  </div>

                  {payState?.error && (
                    <p className="rounded bg-error-container p-2 text-xs text-on-error-container">
                      {payState.error}
                    </p>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setPayingPayout(null)}
                      className="rounded border border-outline-variant px-3 py-1.5 text-xs font-semibold text-on-surface-variant hover:bg-surface-container"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={pending}
                      className="rounded bg-success px-4 py-1.5 text-xs font-semibold text-white hover:brightness-95 disabled:opacity-50"
                    >
                      Confirm Paid
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
