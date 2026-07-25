export function Card({
  children,
  className = '',
  padded = true,
  id,
}: {
  children: React.ReactNode
  className?: string
  padded?: boolean
  id?: string
}) {
  return (
    <div
      id={id}
      className={`rounded-xl border border-outline-variant bg-surface-container-lowest ${padded ? 'p-4 lg:p-5' : ''} ${className}`}
    >
      {children}
    </div>
  )
}
