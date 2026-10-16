'use client'

import { useState, useTransition } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { updateTemplatePredictiveScoring } from '@/lib/actions/checklists'
import { useToast } from '@/components/ui/Toast'

export function ChecklistScoringToggle({
  templateId,
  initialEnabled,
  disabled = false,
}: {
  templateId: string
  initialEnabled: boolean
  disabled?: boolean
}) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [isPending, startTransition] = useTransition()
  const showToast = useToast()

  const handleToggle = () => {
    if (disabled || isPending) return
    const nextState = !enabled

    startTransition(async () => {
      setEnabled(nextState)
      const res = await updateTemplatePredictiveScoring(templateId, nextState)
      if (res?.success) {
        showToast(
          'success',
          nextState
            ? 'Predictive risk scoring enabled for this checklist.'
            : 'Predictive risk scoring disabled for this checklist.'
        )
      } else {
        setEnabled(!nextState) // rollback
        showToast('error', res?.error || 'Failed to update scoring toggle.')
      }
    })
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-outline-variant bg-surface-container-low p-3">
      <div className="flex items-center gap-2.5">
        <Sparkles size={16} className={enabled ? 'text-primary' : 'text-on-surface-variant'} />
        <div>
          <p className="text-xs font-semibold text-on-surface">Predictive Risk Scoring</p>
          <p className="text-[11px] text-on-surface-variant">
            {enabled
              ? 'Active: Generates pre-shift 4-tier risk scores & recurrence alerts.'
              : 'Disabled: Inspections will bypass risk model calculations.'}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled || isPending}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          enabled ? 'bg-primary-container' : 'bg-surface-container-highest'
        } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
        role="switch"
        aria-checked={enabled}
        title={disabled ? 'Only Super Admin can change this setting' : 'Toggle predictive scoring'}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            enabled ? 'translate-x-5' : 'translate-x-0'
          } flex items-center justify-center`}
        >
          {isPending && <Loader2 size={10} className="animate-spin text-primary" />}
        </span>
      </button>
    </div>
  )
}
