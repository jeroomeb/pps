import { zonedDate } from './timezone'

export const PROPERTY_TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Phoenix',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
] as const

export type PropertyTimezone = (typeof PROPERTY_TIMEZONES)[number]

export const PROPERTY_TIMEZONE_LABELS: Record<PropertyTimezone, string> = {
  'America/New_York': 'Eastern Time',
  'America/Chicago': 'Central Time',
  'America/Denver': 'Mountain Time',
  'America/Phoenix': 'Arizona Time',
  'America/Los_Angeles': 'Pacific Time',
  'America/Anchorage': 'Alaska Time',
  'Pacific/Honolulu': 'Hawaii Time',
}

export function isPropertyTimezone(value: unknown): value is PropertyTimezone {
  return typeof value === 'string' && (PROPERTY_TIMEZONES as readonly string[]).includes(value)
}

export function propertyTimezoneOrDefault(value: string | null | undefined): PropertyTimezone {
  return isPropertyTimezone(value) ? value : 'America/New_York'
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** Calendar date YYYY-MM-DD in the property's zone. */
export function localDateString(instant: Date, timeZone: string): string {
  const zoned = zonedDate(instant, timeZone)
  return `${zoned.getUTCFullYear()}-${pad(zoned.getUTCMonth() + 1)}-${pad(zoned.getUTCDate())}`
}

export function localHour(instant: Date, timeZone: string): number {
  return zonedDate(instant, timeZone).getUTCHours()
}

export function addCalendarDays(ymd: string, days: number): string {
  const [year, month, day] = ymd.split('-').map(Number)
  const next = new Date(Date.UTC(year, month - 1, day + days))
  return `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}`
}

export function calendarDaysBetween(earlier: string, later: string): number {
  const [y1, m1, d1] = earlier.split('-').map(Number)
  const [y2, m2, d2] = later.split('-').map(Number)
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000)
}

export function weekdayIndex(ymd: string): number {
  const [year, month, day] = ymd.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay()
}

export const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const
