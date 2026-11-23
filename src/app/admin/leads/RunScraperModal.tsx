'use client'

import React, { useState } from 'react'
import { X, Search, Sparkles, CheckCircle2, Building, RefreshCw, Flame } from 'lucide-react'
import type { CommunityType, GrowthLead } from '@/types/growth-leads'
import { COMMUNITY_TYPE_CONFIG } from '@/types/growth-leads'
import { runScraperPipeline } from '@/lib/actions/leads'

interface RunScraperModalProps {
  isOpen: boolean
  onClose: () => void
  onDiscoveryComplete: (newLeads: GrowthLead[]) => void
}

export function RunScraperModal({ isOpen, onClose, onDiscoveryComplete }: RunScraperModalProps) {
  const [targetType, setTargetType] = useState<CommunityType | 'all'>('all')
  const [targetCounty, setTargetCounty] = useState<string>('all')
  const [batchLimit, setBatchLimit] = useState<number>(5)

  const [isRunning, setIsRunning] = useState(false)
  const [stepIndex, setStepIndex] = useState<number>(0)
  const [result, setResult] = useState<{ count: number; duplicates: number } | null>(null)

  if (!isOpen) return null

  const steps = [
    'Scanning Indeed & ZipRecruiter for night manager & auditor posts...',
    'Mining municipal building violations and off-hours complaints...',
    'Parsing student housing and boutique motel directories...',
    'Applying 5-Tier Intent Scoring and decision-maker enrichment...',
  ]

  const handleLaunch = async () => {
    setIsRunning(true)
    setStepIndex(0)
    setResult(null)

    // Simulate animated step progression
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev < steps.length - 1 ? prev + 1 : prev))
    }, 500)

    try {
      const res = await runScraperPipeline({
        communityType: targetType === 'all' ? undefined : targetType,
        county: targetCounty === 'all' ? undefined : targetCounty,
        limit: batchLimit,
      })

      clearInterval(interval)
      setResult({
        count: res.newLeads.length,
        duplicates: res.duplicateCount,
      })
      onDiscoveryComplete(res.newLeads)
    } catch (err) {
      console.error('Failed to run scraper pipeline:', err)
      clearInterval(interval)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="w-full max-w-xl bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-2xl overflow-hidden flex flex-col my-8">
        {/* Header */}
        <div className="px-6 py-5 border-b border-outline-variant flex items-center justify-between bg-surface-container-low/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold font-headline text-on-surface">
                Launch Multi-Source Discovery Scraper
              </h2>
              <p className="text-xs text-on-surface-variant">
                Scrapes off-hours operational pain, night hiring triggers, and contacts
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

        {/* Body */}
        <div className="p-6 space-y-4">
          {result ? (
            <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2">
              <CheckCircle2 size={36} className="text-emerald-500 mx-auto" />
              <h3 className="text-base font-bold text-emerald-800 dark:text-emerald-200">
                Discovery Complete!
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                Discovered and enriched <strong>{result.count}</strong> new qualifying properties.{' '}
                {result.duplicates > 0 && (
                  <span>({result.duplicates} already existing properties deduplicated).</span>
                )}
              </p>
            </div>
          ) : isRunning ? (
            <div className="p-8 text-center space-y-4">
              <RefreshCw size={36} className="text-primary mx-auto animate-spin" />
              <div>
                <p className="text-sm font-bold text-on-surface">Discovery In Progress...</p>
                <p className="text-xs text-primary font-medium mt-1 animate-pulse">
                  {steps[stepIndex]}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Target Class Filter */}
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Target Asset Category
                </label>
                <select
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value as CommunityType | 'all')}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-outline-variant bg-surface-container-low text-on-surface focus:outline-hidden focus:border-primary transition"
                >
                  <option value="all">All Asset Classes</option>
                  <option value="student_housing">Off-Campus Student Housing</option>
                  <option value="motel">Motels &amp; Boutique Hospitality</option>
                  <option value="active_adult_55_plus">55+ Active Adult Communities</option>
                  <option value="luxury_multifamily">Luxury Multi-Family Towers</option>
                  <option value="commercial_multitenant">Commercial Multi-Tenant</option>
                </select>
              </div>

              {/* Target County */}
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Target County / Geographic Metro
                </label>
                <select
                  value={targetCounty}
                  onChange={(e) => setTargetCounty(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-outline-variant bg-surface-container-low text-on-surface focus:outline-hidden focus:border-primary transition"
                >
                  <option value="all">All Target Corridors</option>
                  <option value="Middlesex">Middlesex (Rutgers / New Brunswick Corridor)</option>
                  <option value="Ocean">Ocean (Point Pleasant &amp; Seaside Motel Shoreline)</option>
                  <option value="Hudson">Hudson (Gold Coast Luxury High-Rises)</option>
                  <option value="Gloucester">Gloucester (Rowan University Student Hub)</option>
                  <option value="Essex">Essex (Montclair State Student Hub)</option>
                  <option value="Mercer">Mercer (Princeton &amp; Route 1 Commercial)</option>
                </select>
              </div>

              {/* Batch Limit */}
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Batch Discovery Size
                </label>
                <div className="flex gap-3">
                  {[3, 5, 10].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setBatchLimit(size)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition ${
                        batchLimit === size
                          ? 'bg-primary text-on-primary border-primary'
                          : 'bg-surface-container-low text-on-surface border-outline-variant hover:border-primary/50'
                      }`}
                    >
                      {size} Properties
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-outline-variant bg-surface-container-low/40 p-3.5 space-y-2 text-xs text-on-surface-variant">
                <div className="flex items-center gap-1.5 font-bold text-red-600 dark:text-red-400">
                  <Flame size={14} />
                  <span>5-Tier Intent Engine Enabled</span>
                </div>
                <p>
                  Candidates displaying active night shift hiring or negative reviews regarding night noise,
                  unattended lobbies, or broken gates will automatically be assigned <strong>Tier 1 Active Pain</strong>.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-outline-variant flex items-center justify-end gap-3 bg-surface-container-low/40">
          <button
            type="button"
            onClick={onClose}
            disabled={isRunning}
            className="px-4 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-high rounded-lg transition"
          >
            {result ? 'Done' : 'Cancel'}
          </button>

          {!result && (
            <button
              type="button"
              disabled={isRunning}
              onClick={handleLaunch}
              className="px-5 py-2 text-xs font-bold bg-primary text-on-primary rounded-lg hover:opacity-90 transition flex items-center gap-1.5 shadow-xs"
            >
              <Sparkles size={14} />
              <span>{isRunning ? 'Scraping...' : 'Run Discovery'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

