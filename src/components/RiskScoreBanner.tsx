'use client'

import { useState } from 'react'
import {
  AlertTriangle,
  Info,
  ShieldAlert,
  ShieldCheck,
  Flame,
  CloudRain,
  ChevronDown,
  X,
  HelpCircle,
} from 'lucide-react'
import {
  getRiskTier,
  RISK_TIERS,
  type RecurringItem,
  type RiskTierId,
} from '@/lib/risk-score'
import { RISK_DOMAIN_LABELS, type RiskDomain } from '@/lib/risk-domain'

export function RiskScoreBanner({
  score,
  summary,
  areas = [],
  recurringItems = [],
  weather,
}: {
  score: number
  summary: string
  areas?: string[]
  recurringItems?: RecurringItem[] | { itemName: string; domain: string; count: number }[]
  weather?: string | null
}) {
  const currentTier = getRiskTier(score)
  const [activeTooltipTier, setActiveTooltipTier] = useState<RiskTierId | null>(null)
  const [showModal, setShowModal] = useState(false)

  // Determine clamped percentage for the indicator pin (0 to 100)
  const clampedPct = Math.min(100, Math.max(0, score))

  const tierKeys: RiskTierId[] = [1, 2, 3, 4]

  return (
    <div
      className={`relative mb-6 overflow-hidden rounded-xl border p-4 sm:p-5 transition-all shadow-sm ${
        score >= 76
          ? 'border-red-500/40 bg-gradient-to-br from-red-500/10 via-surface-container-low to-surface'
          : score >= 51
            ? 'border-orange-500/40 bg-gradient-to-br from-orange-500/10 via-surface-container-low to-surface'
            : score >= 26
              ? 'border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-surface-container-low to-surface'
              : 'border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-surface-container-low to-surface'
      }`}
    >
      {/* Top Header: Score, Tier Badge, and Tooltip Trigger */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Predictive Evening Risk Score
            </span>
            {weather === 'rain' && (
              <span className="inline-flex items-center gap-1 rounded bg-blue-500/15 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:text-blue-300">
                <CloudRain size={12} /> Rain Forecast Active (+25% Asset Weight)
              </span>
            )}
          </div>

          <div className="mt-1.5 flex items-baseline gap-3">
            <span className="font-headline text-4xl font-extrabold tracking-tight text-on-surface">
              {score}
            </span>
            <span className="text-sm font-semibold text-on-surface-variant">/ 100</span>

            {/* Tier Badge with Hover Tooltip */}
            <div
              className="relative inline-block"
              onMouseEnter={() => setActiveTooltipTier(currentTier.tier)}
              onMouseLeave={() => setActiveTooltipTier(null)}
            >
              <button
                type="button"
                onClick={() => setShowModal((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition hover:opacity-90 ${currentTier.bgClass} text-white shadow-sm`}
                aria-label="Risk score interval information"
              >
                {currentTier.tier === 4 ? (
                  <Flame size={13} />
                ) : currentTier.tier === 3 ? (
                  <ShieldAlert size={13} />
                ) : currentTier.tier === 2 ? (
                  <AlertTriangle size={13} />
                ) : (
                  <ShieldCheck size={13} />
                )}
                <span>
                  {currentTier.name} ({currentTier.label})
                </span>
                <HelpCircle size={12} className="opacity-80" />
              </button>

              {/* Hover Tooltip for Active Tier */}
              {activeTooltipTier === currentTier.tier && !showModal && (
                <div className="absolute left-0 top-full z-30 mt-2 w-80 rounded-lg border border-outline-variant bg-surface-container-lowest p-3 shadow-xl text-xs text-on-surface">
                  <div className="flex items-center justify-between border-b border-outline-variant pb-1.5 mb-1.5">
                    <span className="font-bold text-on-surface">
                      Tier {currentTier.tier}: {currentTier.name} ({currentTier.range[0]}–{currentTier.range[1]})
                    </span>
                    <span className={`text-[10px] font-bold ${currentTier.textClass}`}>
                      {currentTier.label}
                    </span>
                  </div>
                  <p className="text-on-surface-variant leading-relaxed">
                    <span className="font-semibold text-on-surface">What it means: </span>
                    {currentTier.meaning}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Breakdown Button for Mobile or Quick View */}
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1 rounded-lg border border-outline-variant bg-surface px-2.5 py-1.5 text-xs font-semibold text-on-surface-variant transition hover:bg-surface-container"
        >
          <Info size={13} />
          <span>Interval Breakdown</span>
        </button>
      </div>

      {/* Point 1: 4-Tier Breakdown Visual Progress Bar (Green to Red) */}
      <div className="mt-4">
        <div className="relative mb-2">
          {/* Segmented Track */}
          <div className="flex h-3.5 w-full overflow-hidden rounded-full border border-black/10 bg-surface-container-high shadow-inner">
            {tierKeys.map((tierId) => {
              const tier = RISK_TIERS[tierId]
              const isCurrent = currentTier.tier === tierId
              return (
                <div
                  key={tierId}
                  className={`relative h-full flex-1 transition-opacity ${tier.bgClass} ${
                    isCurrent ? 'opacity-100 ring-2 ring-inset ring-white/40' : 'opacity-70 hover:opacity-90'
                  }`}
                  onMouseEnter={() => setActiveTooltipTier(tierId)}
                  onMouseLeave={() => setActiveTooltipTier(null)}
                  onClick={() => setShowModal(true)}
                  title={`${tier.name} (${tier.range[0]}–${tier.range[1]}): ${tier.label}`}
                />
              )
            })}
          </div>

          {/* Score Indicator Pin */}
          <div
            className="pointer-events-none absolute -top-1 -ml-2 flex flex-col items-center transition-all duration-500"
            style={{ left: `${clampedPct}%` }}
          >
            <div className="h-5 w-4 rounded-sm bg-black dark:bg-white shadow-md ring-2 ring-white dark:ring-black" />
            <ChevronDown size={14} className="-mt-1 text-black dark:text-white" />
          </div>
        </div>

        {/* Labels below the progress bar */}
        <div className="grid grid-cols-4 text-center text-[11px] font-medium text-on-surface-variant">
          <div>
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">0–25</span>
            <span className="hidden sm:inline"> (Low)</span>
          </div>
          <div>
            <span className="font-semibold text-amber-700 dark:text-amber-400">26–50</span>
            <span className="hidden sm:inline"> (Moderate)</span>
          </div>
          <div>
            <span className="font-semibold text-orange-700 dark:text-orange-400">51–75</span>
            <span className="hidden sm:inline"> (High)</span>
          </div>
          <div>
            <span className="font-semibold text-red-700 dark:text-red-400">76–100</span>
            <span className="hidden sm:inline"> (Critical)</span>
          </div>
        </div>
      </div>

      {/* Operational Summary */}
      <div className="mt-4 rounded-lg bg-surface-container-low/80 p-3 text-sm text-on-surface">
        <p className="font-medium">{summary}</p>
        {areas.length > 0 && (
          <p className="mt-1 text-xs font-semibold text-on-surface-variant">
            High-Risk Priority Areas: <span className="text-on-surface">{areas.join(', ')}</span>
          </p>
        )}
      </div>

      {/* Point 2: Highlight Item Titles within the Banner (Regular Occurrence) */}
      {recurringItems && recurringItems.length > 0 && (
        <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/5 p-3">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-red-700 dark:text-red-300">
            <AlertTriangle size={13} className="shrink-0" />
            <span>Regular Occurrence Items Flagged For This Shift:</span>
          </div>
          <p className="mt-0.5 text-[11px] text-on-surface-variant">
            These specific inspection checklist questions have shown repeated anomalies during recent audits:
          </p>

          <div className="mt-2 flex flex-wrap gap-2">
            {recurringItems.map((item, idx) => {
              const domainLabel =
                item.domain in RISK_DOMAIN_LABELS
                  ? RISK_DOMAIN_LABELS[item.domain as RiskDomain]
                  : item.domain
              return (
                <div
                  key={idx}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-400/30 bg-surface px-2.5 py-1 text-xs shadow-xs"
                >
                  <span className="font-bold text-on-surface">{item.itemName}</span>
                  <span className="rounded bg-red-100 dark:bg-red-950/60 px-1.5 py-0.2 text-[10px] font-bold text-red-700 dark:text-red-300">
                    {item.count}× failed
                  </span>
                  <span className="rounded bg-surface-container-high px-1.5 py-0.2 text-[10px] text-on-surface-variant">
                    {domainLabel}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Breakdown Modal: Operational Mandates & Definitions */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl border border-outline-variant bg-surface p-5 shadow-2xl">
            <div className="flex items-start justify-between border-b border-outline-variant pb-3">
              <div>
                <h3 className="font-headline text-lg font-bold text-on-surface">
                  Risk Score Interval Breakdown
                </h3>
                <p className="text-xs text-on-surface-variant">
                  Operational mandates and workflow adjustments for overnight continuity teams.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-on-surface-variant hover:bg-surface-container-high"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {tierKeys.map((tierId) => {
                const tier = RISK_TIERS[tierId]
                const isCurrent = currentTier.tier === tierId
                return (
                  <div
                    key={tierId}
                    className={`rounded-xl border p-3.5 transition ${
                      isCurrent
                        ? `${tier.borderClass} bg-surface-container ring-2 ring-primary/40`
                        : 'border-outline-variant/60 bg-surface-container-lowest'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-block h-3 w-3 rounded-full ${tier.bgClass}`}
                        />
                        <span className="font-headline text-sm font-bold text-on-surface">
                          {tier.range[0]} – {tier.range[1]}: {tier.name}
                        </span>
                        {isCurrent && (
                          <span className="rounded bg-primary-container px-2 py-0.5 text-[10px] font-bold text-on-primary-container">
                            Current Score ({score})
                          </span>
                        )}
                      </div>
                      <span className={`text-xs font-semibold ${tier.textClass}`}>
                        {tier.label}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-on-surface-variant leading-relaxed">
                      <span className="font-semibold text-on-surface">What it means: </span>
                      {tier.meaning}
                    </p>
                  </div>
                )
              })}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg bg-primary-container px-4 py-2 text-xs font-bold uppercase tracking-wide text-on-primary-container hover:brightness-95"
              >
                Close Breakdown
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
