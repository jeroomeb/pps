'use client'

import { useState } from 'react'

export function ResendEmailButton({ inspectionId }: { inspectionId: string }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function handleClick() {
    setStatus('sending')
    try {
      const res = await fetch(`/api/inspections/${inspectionId}/resend`, { method: 'POST' })
      setStatus(res.ok ? 'sent' : 'error')
    } catch {
      setStatus('error')
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={status === 'sending'}
      className="rounded border border-outline-variant px-3 py-2 text-xs font-semibold uppercase tracking-wide hover:bg-surface-container disabled:opacity-50"
    >
      {status === 'idle' && 'Resend Email'}
      {status === 'sending' && 'Sending…'}
      {status === 'sent' && 'Sent ✓'}
      {status === 'error' && 'Failed — Retry'}
    </button>
  )
}
