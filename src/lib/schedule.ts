// Monthly nth-weekday inspection schedules, e.g. "First Monday of every month".
// Stored on properties.required_schedule as a jsonb array of ScheduleEntry.
//   ordinal: 1..4 = first..fourth, 5 = last
//   weekday: 0 = Sunday .. 6 = Saturday

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

export const ORDINAL_LABELS: Record<number, string> = {
  1: 'First',
  2: 'Second',
  3: 'Third',
  4: 'Fourth',
  5: 'Last',
}

export function scheduleEntryLabel(entry: ScheduleEntry): string {
  const ord = ORDINAL_LABELS[entry.ordinal] ?? ''
  const day = WEEKDAY_LABELS[entry.weekday] ?? ''
  return `${ord} ${day}`.trim()
}

// Accepts unknown jsonb and returns a clean, validated ScheduleEntry[].
export function parseSchedule(value: unknown): ScheduleEntry[] {
  if (!Array.isArray(value)) return []
  const out: ScheduleEntry[] = []
  for (const raw of value) {
    if (raw && typeof raw === 'object') {
      const ordinal = Number((raw as Record<string, unknown>).ordinal)
      const weekday = Number((raw as Record<string, unknown>).weekday)
      if (ordinal >= 1 && ordinal <= 5 && weekday >= 0 && weekday <= 6) {
        out.push({ ordinal, weekday })
      }
    }
  }
  return out
}

// Concrete calendar date for an entry within a given month (month is 0-11).
// Returns null if that ordinal weekday doesn't exist in the month.
export function occurrenceDate(year: number, month: number, entry: ScheduleEntry): Date | null {
  if (entry.ordinal === 5) {
    const lastDay = new Date(year, month + 1, 0)
    const offset = (lastDay.getDay() - entry.weekday + 7) % 7
    return new Date(year, month, lastDay.getDate() - offset)
  }
  const first = new Date(year, month, 1)
  const offset = (entry.weekday - first.getDay() + 7) % 7
  const day = 1 + offset + (entry.ordinal - 1) * 7
  const d = new Date(year, month, day)
  return d.getMonth() === month ? d : null
}

export function occurrencesForMonth(
  schedule: ScheduleEntry[],
  year: number,
  month: number
): Date[] {
  return schedule
    .map((entry) => occurrenceDate(year, month, entry))
    .filter((d): d is Date => d !== null)
    .sort((a, b) => a.getTime() - b.getTime())
}

function sameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export type DueEntry = {
  propertyId: string
  propertyName: string
  date: Date
  label: string
}

// Properties with a schedule occurrence in `today`'s month that has no
// inspection created for that occurrence date yet. Once an inspection is
// scheduled for that date, the entry drops off.
export function dueEntries(
  properties: { id: string; name: string; required_schedule: unknown }[],
  inspections: { property_id: string; scheduled_for: string | null }[],
  today: Date = new Date()
): DueEntry[] {
  const year = today.getFullYear()
  const month = today.getMonth()
  const results: DueEntry[] = []

  for (const property of properties) {
    const schedule = parseSchedule(property.required_schedule)
    for (const entry of schedule) {
      const date = occurrenceDate(year, month, entry)
      if (!date) continue
      const covered = inspections.some(
        (i) =>
          i.property_id === property.id &&
          i.scheduled_for &&
          sameCalendarDay(new Date(i.scheduled_for), date)
      )
      if (!covered) {
        results.push({
          propertyId: property.id,
          propertyName: property.name,
          date,
          label: scheduleEntryLabel(entry),
        })
      }
    }
  }

  return results.sort((a, b) => a.date.getTime() - b.date.getTime())
}
