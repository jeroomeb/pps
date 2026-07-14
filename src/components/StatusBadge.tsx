const STYLES: Record<string, string> = {
  pending: 'bg-secondary-container text-on-surface-variant',
  in_progress: 'bg-primary-container text-on-primary-container',
  completed: 'bg-success-container text-on-success-container',
}

const LABELS: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${STYLES[status] ?? ''}`}
    >
      {LABELS[status] ?? status}
    </span>
  )
}
