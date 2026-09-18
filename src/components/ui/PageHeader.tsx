import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
  backHref,
  backLabel,
}: {
  eyebrow: string
  title: React.ReactNode
  subtitle?: React.ReactNode
  action?: React.ReactNode
  /** Parent page to return to. When set, a back link renders above the title. */
  backHref?: string
  /** Label for the back link, e.g. "Properties". Defaults to "Back". */
  backLabel?: string
}) {
  return (
    <div className="mb-6">
      {backHref && (
        <Link
          href={backHref}
          className="mb-2 inline-flex items-center gap-1.5 text-sm font-semibold text-on-surface-variant hover:text-on-surface"
        >
          <ArrowLeft size={16} />
          {backLabel ? `Back to ${backLabel}` : 'Back'}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="label-tracked text-on-surface-variant">{eyebrow}</p>
          <h1 className="font-headline text-2xl font-bold lg:text-3xl">{title}</h1>
          {subtitle && <div className="mt-1 text-sm text-on-surface-variant">{subtitle}</div>}
        </div>
        {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
      </div>
    </div>
  )
}
