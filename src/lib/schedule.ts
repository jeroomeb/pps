// Monthly inspection schedules — "First Monday of every month".
//
// Stored on properties.required_schedule as a jsonb array of ScheduleEntry.
// The `ordinal` field is retained for on-disk compatibility with data written
// before session 9 (which allowed First..Fourth/Last), but the model is now
// **first-of-month only**: parseSchedule() coerces every entry to ordinal 1 and
// dedupes by weekday. That collapses legacy pairs like "Fourth Sunday" +
// "Last Sunday" — which resolved to the SAME date in any month with only four
// Sundays, and rendered as duplicate dashboard rows — into one entry.
//   ordinal: always 1 (first occurrence of that weekday in the month)
//   weekday: 0 = Sunday .. 6 = Saturday

import { zonedDate } from '@/lib/timezone'

export type ScheduleEntry = { ordinal: number; weekday: number }

export const WEEKDAY_LABELS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

// Business-week-first ordering for the property form's weekday toggles.
export const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

export function scheduleEntryLabel(entry: ScheduleEntry): string {
  return `First ${WEEKDAY_LABELS[entry.weekday] ?? ''}`.trim()
}

// Accepts unknown jsonb and returns a clean, validated, first-of-month
// ScheduleEntry[] with one entry per weekday at most.
export function parseSchedule(value: unknown): ScheduleEntry[] {
  if (!Array.isArray(value)) return []
  const weekdays = new Set<number>()
  for (const raw of value) {
    if (raw && typeof raw === 'object') {
      const weekday = Number((raw as Record<string, unknown>).weekday)
      if (Number.isInteger(weekday) && weekday >= 0 && weekday <= 6) {
        weekdays.add(weekday)
      }
    }
  }
  return [...weekdays].sort((a, b) => a - b).map((weekday) => ({ ordinal: 1, weekday }))
}

// All Date values in this module (except raw instants like `scheduled_for`
// timestamps, which callers must run through `zonedDate()` first) are "zoned
// shim" dates: their UTC getters encode the wall-clock calendar day in
// APP_TIMEZONE, regardless of the server's own local timezone. That's why
// every function below reads/writes via getUTC*/Date.UTC rather than the
// local getters — using local getters here is exactly the bug that made
// "today" and "Overdue by N days" drift by the server's UTC offset.

// Concrete calendar date of the first `weekday` in a given month (month 0-11).
export function occurrenceDate(year: number, month: number, entry: ScheduleEntry): Date {
  const first = new Date(Date.UTC(year, month, 1))
  const offset = (entry.weekday - first.getUTCDay() + 7) % 7
  return new Date(Date.UTC(year, month, 1 + offset))
}

export function occurrencesForMonth(
  schedule: ScheduleEntry[],
  year: number,
  month: number
): Date[] {
  return schedule
    .map((entry) => occurrenceDate(year, month, entry))
    .sort((a, b) => a.getTime() - b.getTime())
}

function startOfDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

function sameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  )
}

/** Zoned-date key (YYYY-MM-DD) — matches a Postgres `date` column's text form. */
export function dateKey(d: Date): string {
  const m = `${d.getUTCMonth() + 1}`.padStart(2, '0')
  const day = `${d.getUTCDate()}`.padStart(2, '0')
  return `${d.getUTCFullYear()}-${m}-${day}`
}

export function daysBetween(from: Date, to: Date): number {
  const ms = startOfDay(to).getTime() - startOfDay(from).getTime()
  return Math.round(ms / 86_400_000)
}

export type DueTone = 'overdue' | 'today' | 'soon' | 'future'

/**
 * Relative due wording shared by the dashboards, assignment cards and
 * inspection lists — "Overdue by 2 days" / "Due today" / "Due in 3 days".
 * `soon` covers the next 7 days; beyond that an absolute date reads better.
 * `today` defaults to "now" in APP_TIMEZONE, not the server's own zone.
 */
export function dueLabel(
  date: Date,
  today: Date = zonedDate()
): { text: string; tone: DueTone } {
  const diff = daysBetween(today, date)
  if (diff < 0) {
    const n = Math.abs(diff)
    return { text: `Overdue by ${n} day${n === 1 ? '' : 's'}`, tone: 'overdue' }
  }
  if (diff === 0) return { text: 'Due today', tone: 'today' }
  if (diff === 1) return { text: 'Due tomorrow', tone: 'soon' }
  if (diff <= 7) return { text: `Due in ${diff} days`, tone: 'soon' }
  return {
    // `date` is a zoned shim (its UTC fields hold the wall-clock day), so
    // format it with `timeZone: 'UTC'` — otherwise the runtime's own zone
    // would re-interpret it and could shift the printed day.
    text: `Due ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}`,
    tone: 'future',
  }
}

export type DueEntry = {
  propertyId: string
  propertyName: string
  date: Date
  /** ISO local date key, used as the dismissal identity. */
  dateKey: string
  label: string
  tone: DueTone
  dueText: string
}

// How far back overdue occurrences keep surfacing. Missed days carry forward
// (rather than vanishing at month rollover) until an inspection is scheduled
// for them or an admin dismisses them — but only for this long. On a monthly
// cadence 45 days gives every occurrence a full cycle of visibility while
// keeping the dashboard from filling with months of pre-feature history that
// was never actionable.
const OVERDUE_WINDOW_DAYS = 45

/**
 * Required inspection days that still need an inspection scheduled.
 *
 * Scans LOOKBACK_MONTHS back through the end of next month, and drops any
 * occurrence that either (a) already has an inspection whose `scheduled_for`
 * falls on that calendar day, or (b) has been dismissed by an admin.
 * Sorted overdue-first, then chronologically.
 */
export function dueEntries(
  properties: { id: string; name: string; required_schedule: unknown }[],
  inspections: {
    property_id: string
    scheduled_for: string | null
    status?: string
    completed_at?: string | null
  }[],
  today: Date = zonedDate(),
  dismissed: { property_id: string; occurrence_date: string }[] = []
): DueEntry[] {
  const dismissedKeys = new Set(
    dismissed.map((d) => `${d.property_id}|${d.occurrence_date.slice(0, 10)}`)
  )
  const earliest = startOfDay(today)
  earliest.setUTCDate(earliest.getUTCDate() - OVERDUE_WINDOW_DAYS)
  const results: DueEntry[] = []

  for (const property of properties) {
    const schedule = parseSchedule(property.required_schedule)
    if (!schedule.length) continue

    // Two months back covers the window even at its month boundary; the
    // `earliest` check below is what actually bounds it.
    for (let offset = -2; offset <= 1; offset++) {
      const cursor = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + offset, 1))
      for (const entry of schedule) {
        const date = occurrenceDate(cursor.getUTCFullYear(), cursor.getUTCMonth(), entry)
        if (date < earliest) continue
        const key = dateKey(date)

        if (dismissedKeys.has(`${property.id}|${key}`)) continue

        // Covered either by an inspection scheduled for that exact calendar
        // day, or by any inspection for this property completed on/after
        // that day and before the next monthly occurrence (~35-day grace) —
        // so an unscheduled inspection that gets completed still clears the
        // requirement instead of leaving it "overdue" forever.
        const scheduledMatch = inspections.some(
          (i) =>
            i.property_id === property.id &&
            i.scheduled_for &&
            sameCalendarDay(zonedDate(new Date(i.scheduled_for)), date)
        )
        const completedMatch = inspections.some((i) => {
          if (i.property_id !== property.id || i.status !== 'completed' || !i.completed_at) {
            return false
          }
          const completedDay = zonedDate(new Date(i.completed_at))
          const daysSince = daysBetween(date, completedDay)
          return daysSince >= 0 && daysSince < 35
        })
        if (scheduledMatch || completedMatch) continue

        const { text, tone } = dueLabel(date, today)
        results.push({
          propertyId: property.id,
          propertyName: property.name,
          date,
          dateKey: key,
          label: scheduleEntryLabel(entry),
          tone,
          dueText: text,
        })
      }
    }
  }

  // Overdue first, then today, then upcoming; chronological within each group.
  const rank: Record<DueTone, number> = { overdue: 0, today: 1, soon: 2, future: 3 }
  return results.sort(
    (a, b) => rank[a.tone] - rank[b.tone] || a.date.getTime() - b.date.getTime()
  )
}
