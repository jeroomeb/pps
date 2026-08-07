// Declared weekly inspection days for a property.
//
// Stored on properties.required_schedule as a jsonb array of ScheduleEntry.
// Through session 11 this drove an auto-scheduler that derived "due"/"overdue"
// rows on the admin dashboard (first-of-month-only, dismissible per
// occurrence). The client found that panel confusing and asked for it to be
// removed entirely (session 12) — this is now purely a **declared reference
// list** ("this property is inspected Mondays/Wednesdays"), shown to the
// admin and the assigned specialist. Nothing derives due dates from it
// anymore; inspections are scheduled the normal way (admin picks a date).
// The `ordinal` field is retained on-disk for compatibility with data written
// before session 9 but is unused — parseSchedule() ignores it and dedupes by
// weekday only.
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
  return WEEKDAY_LABELS[entry.weekday] ?? ''
}

// Accepts unknown jsonb and returns a clean, validated ScheduleEntry[] with
// one entry per weekday at most.
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

function startOfDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
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

