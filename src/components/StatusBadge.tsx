type Tone = 'neutral' | 'gold' | 'success' | 'error'

const TONE_STYLES: Record<Tone, string> = {
  neutral: 'bg-secondary-container text-on-surface-variant',
  gold: 'bg-primary-container text-on-primary-container',
  success: 'bg-success-container text-on-success-container',
  error: 'bg-error-container text-on-error-container',
}

const DOT_STYLES: Record<Tone, string> = {
  neutral: 'bg-secondary',
  gold: 'bg-primary',
  success: 'bg-success',
  error: 'bg-error',
}

const INSPECTION_STATUS: Record<string, { label: string; tone: Tone }> = {
  pending: { label: 'Pending', tone: 'neutral' },
  in_progress: { label: 'In Progress', tone: 'gold' },
  completed: { label: 'Completed', tone: 'success' },
}

export function StatusBadge({ status }: { status: string }) {
  const config = INSPECTION_STATUS[status] ?? { label: status, tone: 'neutral' as Tone }
  return <Badge label={config.label} tone={config.tone} />
}

export function Badge({ label, tone }: { label: string; tone: Tone }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${TONE_STYLES[tone]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOT_STYLES[tone]}`} />
      {label}
    </span>
  )
}
