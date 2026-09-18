/**
 * Geographic Telemetry, Haversine Distance & Geofencing Calculation Utilities
 */

const EARTH_RADIUS_METERS = 6371000 // WGS84 mean earth radius in meters

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

/**
 * Calculates the great-circle distance between two geographic coordinate points
 * using the Haversine formula.
 *
 * @returns distance in meters
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)

  const rLat1 = toRadians(lat1)
  const rLat2 = toRadians(lat2)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return EARTH_RADIUS_METERS * c
}

export type GeofenceEvaluation = {
  isInside: boolean
  distanceMeters: number
  radiusMeters: number
}

/**
 * Checks if a given device position is inside a property's virtual geofence perimeter.
 */
export function evaluateGeofence(
  deviceLat: number,
  deviceLon: number,
  propertyLat: number | null,
  propertyLon: number | null,
  radiusMeters: number = 100
): GeofenceEvaluation | null {
  if (
    typeof propertyLat !== 'number' ||
    typeof propertyLon !== 'number' ||
    isNaN(propertyLat) ||
    isNaN(propertyLon)
  ) {
    return null
  }

  const distanceMeters = calculateHaversineDistance(
    deviceLat,
    deviceLon,
    propertyLat,
    propertyLon
  )

  return {
    isInside: distanceMeters <= radiusMeters,
    distanceMeters: Math.round(distanceMeters),
    radiusMeters,
  }
}

/**
 * Formats distance in a human-friendly format (meters or feet/miles).
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m (${Math.round(meters * 3.28084)} ft)`
  }
  const miles = (meters / 1609.34).toFixed(2)
  return `${(meters / 1000).toFixed(1)} km (${miles} mi)`
}

/**
 * Formats speed from meters/sec to mph and km/h.
 */
export function formatSpeed(metersPerSec: number | null): string {
  if (typeof metersPerSec !== 'number' || isNaN(metersPerSec) || metersPerSec <= 0) {
    return 'Stationary'
  }
  const mph = (metersPerSec * 2.23694).toFixed(1)
  return `${mph} mph`
}

/**
 * Formats elapsed dwell time in seconds to human readable duration.
 */
export function formatDwellDuration(seconds: number | null): string {
  if (typeof seconds !== 'number' || isNaN(seconds) || seconds <= 0) {
    return '—'
  }
  const mins = Math.floor(seconds / 60)
  if (mins < 60) {
    return `${mins} min${mins === 1 ? '' : 's'}`
  }
  const hrs = Math.floor(mins / 60)
  const remainingMins = mins % 60
  return `${hrs} hr${hrs === 1 ? '' : 's'}${remainingMins > 0 ? ` ${remainingMins}m` : ''}`
}

/**
 * Formats decimal coordinates into standard notation (e.g. 40.7128° N, 74.0060° W).
 */
export function formatCoordinates(lat: number | null, lon: number | null): string {
  if (typeof lat !== 'number' || typeof lon !== 'number') {
    return 'Not Set'
  }
  const latDir = lat >= 0 ? 'N' : 'S'
  const lonDir = lon >= 0 ? 'E' : 'W'
  return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lon).toFixed(4)}° ${lonDir}`
}
