import type { LucideIcon } from 'lucide-react'

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon
  title: string
  description?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-outline-variant bg-surface-container-low px-6 py-12 text-center">
      <Icon size={28} className="text-on-surface-variant" />
      <p className="font-headline text-sm font-semibold">{title}</p>
      {description && <p className="text-xs text-on-surface-variant">{description}</p>}
    </div>
  )
}
