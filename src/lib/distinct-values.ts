/** Sorted, de-duplicated non-null values for a filter dropdown. */
export function distinctValues(rows: ({ [k: string]: unknown } | null)[], key: string): string[] {
  const set = new Set<string>()
  for (const row of rows) {
    const v = row?.[key]
    if (typeof v === 'string' && v.trim()) set.add(v.trim())
  }
  return [...set].sort((a, b) => a.localeCompare(b))
}
