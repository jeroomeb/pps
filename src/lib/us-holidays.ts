import { addCalendarDays, weekdayIndex } from '@/lib/property-timezones'

function ymd(year: number, month: number, day: number): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${year}-${pad(month)}-${pad(day)}`
}

/** nth weekday in a month. weekday: 0 Sunday … 6 Saturday. n is 1-based. */
function nthWeekday(year: number, month: number, weekday: number, n: number): string {
  const first = new Date(Date.UTC(year, month - 1, 1))
  const shift = (weekday - first.getUTCDay() + 7) % 7
  const day = 1 + shift + (n - 1) * 7
  return ymd(year, month, day)
}

function lastWeekday(year: number, month: number, weekday: number): string {
  const last = new Date(Date.UTC(year, month, 0))
  const shift = (last.getUTCDay() - weekday + 7) % 7
  return ymd(year, month, last.getUTCDate() - shift)
}

/** If a fixed holiday falls on Saturday, observe Friday. Sunday observes Monday. */
function observed(date: string): string {
  const weekday = weekdayIndex(date)
  if (weekday === 6) return addCalendarDays(date, -1)
  if (weekday === 0) return addCalendarDays(date, 1)
  return date
}

function observedFederalHolidays(year: number): string[] {
  const fixed = [
    observed(ymd(year, 1, 1)),
    observed(ymd(year, 6, 19)),
    observed(ymd(year, 7, 4)),
    observed(ymd(year, 11, 11)),
    observed(ymd(year, 12, 25)),
  ]
  const floating = [
    nthWeekday(year, 1, 1, 3),
    nthWeekday(year, 2, 1, 3),
    lastWeekday(year, 5, 1),
    nthWeekday(year, 9, 1, 1),
    nthWeekday(year, 10, 1, 2),
    nthWeekday(year, 11, 4, 4),
  ]
  return [...fixed, ...floating]
}

/**
 * True on an observed US federal holiday, and on the weekend attached to one
 * (Friday through Monday when the holiday sits on that weekend).
 */
export function isHolidayWeekend(localDate: string): boolean {
  const year = Number(localDate.slice(0, 4))
  const holidays = new Set([
    ...observedFederalHolidays(year - 1),
    ...observedFederalHolidays(year),
    ...observedFederalHolidays(year + 1),
  ])
  if (holidays.has(localDate)) return true

  const weekday = weekdayIndex(localDate)
  const neighbors =
    weekday === 5
      ? [1, 2]
      : weekday === 6
        ? [-1, 1, 2]
        : weekday === 0
          ? [-2, -1, 1]
          : weekday === 1
            ? [-2, -1]
            : []
  return neighbors.some((offset) => holidays.has(addCalendarDays(localDate, offset)))
}
