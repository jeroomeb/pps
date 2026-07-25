'use client'

import { useEffect, useState } from 'react'
import { useToast } from '@/components/ui/Toast'

export function ResendEmailButton({ inspectionId }: { inspectionId: string }) {
  const showToast = useToast()
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  // Reset "Sent ✓" back to idle after a moment so a second click doesn't read
  // as a no-op — resending is a real, repeatable action (e.g. after fixing a
  // bad property email), not a one-shot confirmation.
  useEffect(() => {
    if (status !== 'sent') return
    const t = setTimeout(() => setStatus('idle'), 4000)
    return () => clearTimeout(t)
  }, [status])

  async function handleClick() {
    setStatus('sending')
    try {
      const res = await fetch(`/api/inspections/${inspectionId}/resend`, { method: 'POST' })
      if (res.ok) {
        setStatus('sent')
        showToast('success', 'Report email sent.')
        return
      }
      setStatus('error')
      let message = 'Failed to resend the email.'
      try {
        const data = (await res.json()) as { error?: string }
        if (data.error) message = data.error
      } catch {
        // response wasn't JSON — keep the generic message
      }
      showToast('error', message)
    } catch {
      setStatus('error')
      showToast('error', 'Network error — check your connection and try again.')
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
