export default function InspectorLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-2 h-3 w-24 rounded bg-surface-container-high" />
      <div className="mb-8 h-8 w-64 rounded bg-surface-container-high" />
      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl border border-outline-variant bg-surface-container-low" />
        ))}
      </div>
      <div className="h-64 rounded-xl border border-outline-variant bg-surface-container-low" />
    </div>
  )
}
