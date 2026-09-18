'use client'

import {
  Award,
  CheckCircle2,
  Clock,
  Navigation,
  AlertTriangle,
  Camera,
  Layers,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import type { SpecialistPerformanceMetric, TemplateDistribution } from '@/lib/analytics'

interface SpecialistScorecardProps {
  scorecard: SpecialistPerformanceMetric
  templateBreakdown?: TemplateDistribution[]
  isSelfView?: boolean
}

export function SpecialistScorecard({
  scorecard,
  templateBreakdown = [],
  isSelfView = false,
}: SpecialistScorecardProps) {
  // Determine performance badge based on completion and on-time score
  let tierLabel = 'Standard Specialist'
  let tierBadgeClass = 'bg-surface-container-high text-on-surface'
  if (scorecard.completedCount >= 10 && scorecard.onTimeRate >= 90) {
    tierLabel = 'Elite Operations Specialist'
    tierBadgeClass = 'bg-amber-100 text-amber-900 border border-amber-300'
  } else if (scorecard.completedCount >= 5 && scorecard.onTimeRate >= 80) {
    tierLabel = 'Senior Specialist'
    tierBadgeClass = 'bg-emerald-100 text-emerald-900 border border-emerald-300'
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner Card */}
      <Card className="border border-outline-variant bg-surface-container-lowest">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-outline-variant pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-container text-primary font-bold">
              <Award size={26} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-headline text-lg font-bold text-on-surface">
                  {scorecard.fullName}
                </h2>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${tierBadgeClass}`}>
                  <ShieldCheck size={12} />
                  {tierLabel}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant font-mono">
                {scorecard.humanId || 'OCS Specialist'} • {scorecard.email}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <p className="label-tracked text-on-surface-variant">
              {isSelfView ? 'Your All-Time Audits' : 'Total Audits Completed'}
            </p>
            <p className="font-headline text-2xl font-bold text-primary">
              {scorecard.completedCount}
            </p>
          </div>
        </div>

        {/* 4-KPI Grid */}
        <div className="grid grid-cols-2 gap-4 pt-4 lg:grid-cols-4">
          {/* On-Time Arrival */}
          <div className="rounded-xl border border-outline-variant bg-surface-container-low p-3.5">
            <div className="flex items-center justify-between text-on-surface-variant mb-1">
              <span className="label-tracked text-[11px]">On-Time Punctuality</span>
              <Clock size={15} className="text-primary" />
            </div>
            <p className="font-headline text-2xl font-bold text-on-surface">
              {scorecard.onTimeRate}%
            </p>
            <p className="mt-1 text-[11px] text-on-surface-variant">
              {scorecard.onTimeCount} of {scorecard.scheduledCount || scorecard.completedCount} on-time starts
            </p>
          </div>

          {/* Average Duration */}
          <div className="rounded-xl border border-outline-variant bg-surface-container-low p-3.5">
            <div className="flex items-center justify-between text-on-surface-variant mb-1">
              <span className="label-tracked text-[11px]">Avg Audit Duration</span>
              <Navigation size={15} className="text-blue-600" />
            </div>
            <p className="font-headline text-2xl font-bold text-on-surface">
              {scorecard.avgDurationMinutes}m
            </p>
            <p className="mt-1 text-[11px] text-on-surface-variant">
              {scorecard.avgDwellMinutes > 0 ? `${scorecard.avgDwellMinutes}m on-site dwell (GPS)` : 'Avg time per audit'}
            </p>
          </div>

          {/* Issues Discovered */}
          <div className="rounded-xl border border-outline-variant bg-surface-container-low p-3.5">
            <div className="flex items-center justify-between text-on-surface-variant mb-1">
              <span className="label-tracked text-[11px]">Issue Discovery</span>
              <AlertTriangle size={15} className="text-error" />
            </div>
            <p className="font-headline text-2xl font-bold text-on-surface">
              {scorecard.failuresFlagged}
            </p>
            <p className="mt-1 text-[11px] text-on-surface-variant">
              {scorecard.failureDiscoveryRate}% of {scorecard.totalItemsChecked} items audited
            </p>
          </div>

          {/* Photo Documentation Compliance */}
          <div className="rounded-xl border border-outline-variant bg-surface-container-low p-3.5">
            <div className="flex items-center justify-between text-on-surface-variant mb-1">
              <span className="label-tracked text-[11px]">Photo Compliance</span>
              <Camera size={15} className="text-amber-600" />
            </div>
            <p className="font-headline text-2xl font-bold text-on-surface">
              {scorecard.photoComplianceRate}%
            </p>
            <p className="mt-1 text-[11px] text-on-surface-variant">
              Evidence compliance score
            </p>
          </div>
        </div>
      </Card>

      {/* Experience by Checklist Category */}
      {templateBreakdown.length > 0 && (
        <Card>
          <div className="mb-4 flex items-center justify-between border-b border-outline-variant pb-3">
            <div className="flex items-center gap-2">
              <Layers size={18} className="text-primary" />
              <h3 className="font-headline text-base font-bold text-on-surface">
                Checklist Template Experience Breakdown
              </h3>
            </div>
            <span className="text-xs font-semibold text-on-surface-variant">
              {templateBreakdown.length} Template Types Audited
            </span>
          </div>

          <div className="flex flex-col gap-3.5">
            {templateBreakdown.map((item) => (
              <div key={item.templateId} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-on-surface">{item.templateName}</span>
                  <span className="font-semibold text-primary">
                    {item.count} audit{item.count === 1 ? '' : 's'} ({item.percentage}%)
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-container-high">
                  <div
                    className="h-full rounded-full bg-[#ee8a4b] transition-all duration-500"
                    style={{ width: `${Math.max(item.percentage, 5)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
