export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow: string
  title: string
  subtitle?: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="label-tracked text-on-surface-variant">{eyebrow}</p>
        <h1 className="font-headline text-2xl font-bold lg:text-3xl">{title}</h1>
        {subtitle && <div className="mt-1 text-sm text-on-surface-variant">{subtitle}</div>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  )
}
