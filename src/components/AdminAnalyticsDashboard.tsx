'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Navigation,
  AlertTriangle,
  Camera,
  Calendar,
  ChevronRight,
  TrendingUp,
  Award,
  Building2,
  Users,
  Layers,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import type {
  OperationalAnalyticsSummary,
  TimeRange,
  RawInspectionForAnalytics,
  RawItemForAnalytics,
} from '@/lib/analytics'
import { computeOperationalAnalytics } from '@/lib/analytics'
import { formatDateTime } from '@/lib/timezone'

interface AdminAnalyticsDashboardProps {
  initialSummary: OperationalAnalyticsSummary
  rawInspections: RawInspectionForAnalytics[]
  rawItems: RawItemForAnalytics[]
}

const TIME_RANGES: { id: TimeRange; label: string }[] = [
  { id: '7d', label: 'Last 7 Days' },
  { id: '30d', label: 'Last 30 Days' },
  { id: '90d', label: 'Last 90 Days' },
  { id: 'all', label: 'All-Time' },
]

export function AdminAnalyticsDashboard({
  initialSummary,
  rawInspections,
  rawItems,
}: AdminAnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>(initialSummary.timeRange)
  const [summary, setSummary] = useState<OperationalAnalyticsSummary>(initialSummary)
  const [isPending, startTransition] = useTransition()

  function handleRangeChange(range: TimeRange) {
    setTimeRange(range)
    startTransition(() => {
      const updated = computeOperationalAnalytics(rawInspections, rawItems, range)
      setSummary(updated)
    })
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Time Range Selector Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
          <Calendar size={14} className="text-primary" />
          <span>Analytics Time Horizon:</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {TIME_RANGES.map((r) => (
            <button
              key={r.id}
              onClick={() => handleRangeChange(r.id)}
              className={`min-h-9 rounded-lg px-3.5 text-xs font-semibold transition-all ${
                timeRange === r.id
                  ? 'bg-primary-container text-on-primary-container shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {/* Total Completed */}
        <Card className="flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <p className="label-tracked text-on-surface-variant">Completed Audits</p>
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-800">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="mt-4">
            <p className="font-headline text-3xl font-bold text-on-surface">
              {summary.totalCompleted}
            </p>
            <p className="mt-1 text-xs text-on-surface-variant">
              {summary.completionRate}% completion rate ({summary.totalInProgress} active, {summary.totalPending} pending)
            </p>
          </div>
        </Card>

        {/* On-Time Punctuality */}
        <Card className="flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <p className="label-tracked text-on-surface-variant">On-Time Arrival</p>
            <div className="rounded-lg bg-primary-container/40 p-2 text-primary">
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-4">
            <p className="font-headline text-3xl font-bold text-on-surface">
              {summary.onTimeRate}%
            </p>
            <p className="mt-1 text-xs text-on-surface-variant">
              {summary.onTimeCount} of {summary.scheduledTotalCount || summary.totalCompleted} on-time arrivals
            </p>
          </div>
        </Card>

        {/* Audit Duration & Dwell */}
        <Card className="flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <p className="label-tracked text-on-surface-variant">Avg Duration & Dwell</p>
            <div className="rounded-lg bg-blue-100 p-2 text-blue-800">
              <Navigation size={18} />
            </div>
          </div>
          <div className="mt-4">
            <p className="font-headline text-3xl font-bold text-on-surface">
              {summary.avgDurationMinutes}m
            </p>
            <p className="mt-1 text-xs text-on-surface-variant">
              {summary.avgDwellMinutes > 0 ? `${summary.avgDwellMinutes}m avg on-site dwell (GPS)` : 'Avg audit turnaround'}
            </p>
          </div>
        </Card>

        {/* Flagged Critical Failures */}
        <Card className="flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <p className="label-tracked text-on-surface-variant">Issue Discovery Rate</p>
            <div className="rounded-lg bg-error-container/40 p-2 text-error">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="mt-4">
            <p className="font-headline text-3xl font-bold text-on-surface">
              {summary.failureDiscoveryRate}%
            </p>
            <p className="mt-1 text-xs text-on-surface-variant">
              {summary.totalFailures} failures across {summary.totalItemsChecked} items
            </p>
          </div>
        </Card>

        {/* Photo Evidence Compliance */}
        <Card className="flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <p className="label-tracked text-on-surface-variant">Photo Compliance</p>
            <div className="rounded-lg bg-amber-100 p-2 text-amber-900">
              <Camera size={18} />
            </div>
          </div>
          <div className="mt-4">
            <p className="font-headline text-3xl font-bold text-on-surface">
              {summary.photoComplianceRate}%
            </p>
            <p className="mt-1 text-xs text-on-surface-variant">
              Evidence compliance for audited items
            </p>
          </div>
        </Card>
      </div>

      {/* Checklist Template / Asset Volume Breakdown */}
      <Card>
        <div className="mb-4 flex items-center justify-between border-b border-outline-variant pb-3">
          <div className="flex items-center gap-2">
            <Layers size={18} className="text-primary" />
            <h3 className="font-headline text-base font-bold text-on-surface">
              Audit Volume by Checklist Template / Asset Category
            </h3>
          </div>
          <span className="text-xs font-semibold text-on-surface-variant">
            {summary.templateBreakdown.length} Active Checklist Types
          </span>
        </div>

        {summary.templateBreakdown.length === 0 ? (
          <p className="py-6 text-center text-sm text-on-surface-variant">
            No completed audits recorded for this time horizon.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {summary.templateBreakdown.map((item) => (
              <div key={item.templateId} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-on-surface">{item.templateName}</span>
                  <span className="font-semibold text-primary">
                    {item.count} audit{item.count === 1 ? '' : 's'} ({item.percentage}%)
                  </span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-surface-container-high">
                  <div
                    className="h-full rounded-full bg-[#ee8a4b] transition-all duration-500"
                    style={{ width: `${Math.max(item.percentage, 4)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Specialist Performance Scorecard & Leaderboard */}
      <Card padded={false}>
        <div className="flex items-center justify-between border-b border-outline-variant p-4 sm:p-6">
          <div className="flex items-center gap-2">
            <Award size={18} className="text-primary" />
            <div>
              <h3 className="font-headline text-base font-bold text-on-surface">
                Specialist Performance Scorecards & Ranking
              </h3>
              <p className="text-xs text-on-surface-variant">
                Evaluates audit velocity, on-time punctuality, issue discovery, and quality compliance
              </p>
            </div>
          </div>
          <Link
            href="/admin/team"
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            Manage Team
            <ChevronRight size={14} />
          </Link>
        </div>

        {/* Desktop Table View */}
        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full divide-y divide-outline-variant text-left text-sm">
            <thead className="bg-surface-container-high text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              <tr>
                <th className="px-4 py-3 sm:px-6">Specialist (OCS)</th>
                <th className="px-4 py-3">Completed</th>
                <th className="px-4 py-3">On-Time %</th>
                <th className="px-4 py-3">Avg Duration</th>
                <th className="px-4 py-3">Issue Discovery</th>
                <th className="px-4 py-3">Photo Compliance</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant bg-surface">
              {summary.specialistLeaderboard.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-on-surface-variant">
                    No specialist activity recorded for this period.
                  </td>
                </tr>
              ) : (
                summary.specialistLeaderboard.map((s, idx) => (
                  <tr key={s.specialistId} className="hover:bg-surface-container-low transition">
                    <td className="px-4 py-3.5 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-container text-xs font-bold text-on-primary-container">
                          #{idx + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-on-surface">{s.fullName}</p>
                          {s.humanId && (
                            <p className="font-mono text-xs text-on-surface-variant">{s.humanId}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-on-surface">
                      {s.completedCount}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          s.onTimeRate >= 90
                            ? 'bg-emerald-100 text-emerald-900'
                            : s.onTimeRate >= 75
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-error-container text-on-error-container'
                        }`}
                      >
                        {s.onTimeRate}%
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-on-surface-variant">
                      {s.avgDurationMinutes > 0 ? `${s.avgDurationMinutes} mins` : '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-medium text-on-surface">
                        {s.failuresFlagged} failures
                      </span>
                      <span className="ml-1 text-xs text-on-surface-variant">
                        ({s.failureDiscoveryRate}%)
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`font-semibold ${
                          s.photoComplianceRate >= 95 ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {s.photoComplianceRate}%
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        href={`/admin/team/${s.specialistId}`}
                        className="inline-flex items-center gap-1 rounded border border-outline-variant px-2.5 py-1 text-xs font-semibold text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                      >
                        Profile
                        <ChevronRight size={13} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="flex flex-col divide-y divide-outline-variant md:hidden">
          {summary.specialistLeaderboard.length === 0 ? (
            <p className="p-6 text-center text-xs text-on-surface-variant">
              No specialist activity recorded for this period.
            </p>
          ) : (
            summary.specialistLeaderboard.map((s, idx) => (
              <div key={s.specialistId} className="flex flex-col gap-3 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-container text-xs font-bold text-on-primary-container">
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-sm text-on-surface">{s.fullName}</p>
                      {s.humanId && (
                        <p className="font-mono text-[11px] text-on-surface-variant">{s.humanId}</p>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/admin/team/${s.specialistId}`}
                    className="flex min-h-8 items-center gap-1 rounded border border-outline-variant px-2.5 text-xs font-semibold text-on-surface-variant"
                  >
                    Profile
                    <ChevronRight size={12} />
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-2 rounded-lg bg-surface-container-low p-2.5 text-xs">
                  <div>
                    <span className="text-on-surface-variant block text-[10px] uppercase">Completed Audits</span>
                    <span className="font-bold text-on-surface">{s.completedCount}</span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant block text-[10px] uppercase">On-Time Arrival</span>
                    <span
                      className={`inline-block font-bold ${
                        s.onTimeRate >= 90
                          ? 'text-emerald-700'
                          : s.onTimeRate >= 75
                          ? 'text-amber-700'
                          : 'text-error'
                      }`}
                    >
                      {s.onTimeRate}%
                    </span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant block text-[10px] uppercase">Avg Duration</span>
                    <span className="font-semibold text-on-surface">
                      {s.avgDurationMinutes > 0 ? `${s.avgDurationMinutes} mins` : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant block text-[10px] uppercase">Photo Compliance</span>
                    <span className="font-bold text-emerald-700">{s.photoComplianceRate}%</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Property Audit Volume Breakdown */}
      <Card padded={false}>
        <div className="flex items-center justify-between border-b border-outline-variant p-4 sm:p-6">
          <div className="flex items-center gap-2">
            <Building2 size={18} className="text-primary" />
            <div>
              <h3 className="font-headline text-base font-bold text-on-surface">
                Property Inspection Frequency & Issue Rates
              </h3>
              <p className="text-xs text-on-surface-variant">
                Throughput and issue discovery across audited properties
              </p>
            </div>
          </div>
          <Link
            href="/admin/properties"
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            All Properties
            <ChevronRight size={14} />
          </Link>
        </div>

        {/* Desktop Table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full divide-y divide-outline-variant text-left text-sm">
            <thead className="bg-surface-container-high text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              <tr>
                <th className="px-4 py-3 sm:px-6">Property</th>
                <th className="px-4 py-3">Completed Audits</th>
                <th className="px-4 py-3">Critical Issues Flagged</th>
                <th className="px-4 py-3">Latest Audit Date</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant bg-surface">
              {summary.propertyBreakdown.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-on-surface-variant">
                    No property audit history for this period.
                  </td>
                </tr>
              ) : (
                summary.propertyBreakdown.map((p) => (
                  <tr key={p.propertyId} className="hover:bg-surface-container-low transition">
                    <td className="px-4 py-3.5 sm:px-6">
                      <p className="font-semibold text-on-surface">{p.propertyName}</p>
                      {p.humanId && (
                        <p className="font-mono text-xs text-on-surface-variant">{p.humanId}</p>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-on-surface">
                      {p.completedCount}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          p.failureCount > 0
                            ? 'bg-error-container text-on-error-container'
                            : 'bg-emerald-100 text-emerald-900'
                        }`}
                      >
                        {p.failureCount} {p.failureCount === 1 ? 'issue' : 'issues'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-on-surface-variant">
                      {p.latestAuditDate ? formatDateTime(p.latestAuditDate) : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        href={`/admin/properties/${p.propertyId}`}
                        className="inline-flex items-center gap-1 rounded border border-outline-variant px-2.5 py-1 text-xs font-semibold text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                      >
                        View
                        <ChevronRight size={13} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="flex flex-col divide-y divide-outline-variant md:hidden">
          {summary.propertyBreakdown.length === 0 ? (
            <p className="p-6 text-center text-xs text-on-surface-variant">
              No property audit history for this period.
            </p>
          ) : (
            summary.propertyBreakdown.map((p) => (
              <div key={p.propertyId} className="flex flex-col gap-2.5 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm text-on-surface">{p.propertyName}</p>
                    {p.humanId && (
                      <p className="font-mono text-[11px] text-on-surface-variant">{p.humanId}</p>
                    )}
                  </div>
                  <Link
                    href={`/admin/properties/${p.propertyId}`}
                    className="flex min-h-8 items-center gap-1 rounded border border-outline-variant px-2.5 text-xs font-semibold text-on-surface-variant"
                  >
                    View
                    <ChevronRight size={12} />
                  </Link>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <div>
                    <span className="text-on-surface-variant text-[11px]">Audits: </span>
                    <span className="font-bold text-on-surface">{p.completedCount}</span>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      p.failureCount > 0
                        ? 'bg-error-container text-on-error-container'
                        : 'bg-emerald-100 text-emerald-900'
                    }`}
                  >
                    {p.failureCount} issues
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}
