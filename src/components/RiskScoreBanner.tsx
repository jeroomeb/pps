export function RiskScoreBanner({
  score,
  summary,
  areas,
}: {
  score: number
  summary: string
  areas: string[]
}) {
  return (
    <div className="mb-4 rounded-lg border border-primary-container bg-primary-container/20 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
        Evening risk score
      </p>
      <p className="font-headline text-3xl font-bold text-on-surface">{score}</p>
      <p className="mt-1 text-sm text-on-surface">{summary}</p>
      {areas.length > 0 && (
        <p className="mt-2 text-sm font-semibold text-on-surface">
          Check first: {areas.join(', ')}
        </p>
      )}
    </div>
  )
}
