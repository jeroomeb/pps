export function Card({
  children,
  className = '',
  padded = true,
}: {
  children: React.ReactNode
  className?: string
  padded?: boolean
}) {
  return (
    <div
      className={`rounded-xl border border-outline-variant bg-surface-container-lowest ${padded ? 'p-4 lg:p-5' : ''} ${className}`}
    >
      {children}
    </div>
  )
}
