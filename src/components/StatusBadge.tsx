type Tone = 'neutral' | 'accent' | 'success' | 'error'

const TONE_STYLES: Record<Tone, string> = {
  neutral: 'bg-secondary-container text-on-surface-variant',
  accent: 'bg-primary-container text-on-primary-container',
  success: 'bg-success-container text-on-success-container',
  error: 'bg-error-container text-on-error-container',
}

const DOT_STYLES: Record<Tone, string> = {
  neutral: 'bg-secondary',
  accent: 'bg-primary',
  success: 'bg-success',
  error: 'bg-error',
}

// Vocabulary the client asked to clarify: Pending = assigned but not started,
// In Progress = started but not finished (both are "open"), Resolved & Closed =
// completed. The DB enum (pending/in_progress/completed) is unchanged.
const INSPECTION_STATUS: Record<string, { label: string; tone: Tone }> = {
  pending: { label: 'Pending', tone: 'neutral' },
  in_progress: { label: 'In Progress', tone: 'accent' },
  completed: { label: 'Resolved & Closed', tone: 'success' },
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
