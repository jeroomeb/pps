'use client'

import { useState, useTransition } from 'react'
import { Copy, Loader2, X, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cloneTemplate } from '@/lib/actions/checklists'
import { useToast } from '@/components/ui/Toast'

export function CloneChecklistButton({
  templateId,
  templateName,
  compact = false,
}: {
  templateId: string
  templateName: string
  compact?: boolean
}) {
  const router = useRouter()
  const showToast = useToast()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(`${templateName} (Copy)`)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleClone = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const res = await cloneTemplate(templateId, name)
      if (res?.success && res.newId) {
        showToast('success', `Checklist "${name}" created successfully.`)
        setOpen(false)
        router.push(`/admin/checklists/${res.newId}`)
      } else {
        setError(res?.error || 'Failed to clone checklist.')
        showToast('error', res?.error || 'Failed to clone checklist.')
      }
    })
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setName(`${templateName} (Copy)`)
          setOpen(true)
        }}
        className={
          compact
            ? 'flex items-center gap-1 rounded border border-outline-variant px-2 py-1 text-[11px] font-semibold text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            : 'flex min-h-10 items-center gap-1.5 rounded-lg border border-outline-variant px-3 text-xs font-semibold uppercase tracking-wide hover:bg-surface-container'
        }
        title="Duplicate checklist template"
      >
        <Copy size={compact ? 13 : 14} />
        <span>Clone</span>
      </button>
    )
  }

  return (
    <form
      onSubmit={handleClone}
      onClick={(e) => e.stopPropagation()}
      className="flex flex-wrap items-center gap-2 rounded-lg border border-primary-container bg-surface p-1.5 shadow-sm"
    >
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        disabled={isPending}
        autoFocus
        placeholder="New checklist name"
        className="min-h-8 min-w-[200px] rounded border border-outline-variant px-2 text-xs focus:border-primary-container focus:outline-none"
      />
      <button
        type="submit"
        disabled={isPending}
        className="flex min-h-8 items-center gap-1 rounded bg-primary-container px-2.5 text-xs font-semibold text-on-primary-container hover:brightness-95 disabled:opacity-50"
      >
        {isPending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
        <span>Duplicate</span>
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          setOpen(false)
          setError(null)
        }}
        className="flex h-8 w-8 items-center justify-center rounded border border-outline-variant text-on-surface-variant hover:bg-surface-container"
      >
        <X size={14} />
      </button>
      {error && <span className="w-full text-[11px] text-error">{error}</span>}
    </form>
  )
}
