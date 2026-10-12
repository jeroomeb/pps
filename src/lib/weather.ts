const cache = new Map<string, boolean | null>()

/**
 * True when the evening forecast gives at least a 50% chance of precipitation.
 * Null when the property has no coordinates or the forecast cannot be read.
 * A failed lookup must not fail the scoring run.
 */
export async function eveningRainForecast(
  latitude: number | null,
  longitude: number | null,
  localDate: string
): Promise<boolean | null> {
  if (latitude == null || longitude == null) return null
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null

  const key = `${latitude.toFixed(3)},${longitude.toFixed(3)},${localDate}`
  if (cache.has(key)) return cache.get(key) ?? null

  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    daily: 'precipitation_probability_max',
    timezone: 'UTC',
    start_date: localDate,
    end_date: localDate,
  })

  try {
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
      signal: AbortSignal.timeout(8000),
    })
    if (!response.ok) {
      cache.set(key, null)
      return null
    }
    const body = (await response.json()) as {
      daily?: { precipitation_probability_max?: unknown[] }
    }
    const probability = body.daily?.precipitation_probability_max?.[0]
    const raining = typeof probability === 'number' && probability >= 50
    cache.set(key, raining)
    return raining
  } catch {
    cache.set(key, null)
    return null
  }
}
