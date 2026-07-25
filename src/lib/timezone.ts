// Business timezone for schedule math, "due" wording, and admin-entered
// datetimes. Without this, every date computation ran in the *server's*
// timezone (UTC on Vercel) — so "today" flipped over at 8pm Eastern, dismissals
// keyed the wrong calendar day, and admin-entered times shifted by the UTC
// offset. No date library is installed, so these are dependency-free
// Intl-based conversions — accurate for civil-time math; DST-transition
// instants (the one hour a year a wall-clock time is ambiguous/skipped) are
// not specially handled, which matches what this app needs.

export const APP_TIMEZONE = process.env.APP_TIMEZONE || 'America/New_York'

/**
 * Returns a Date whose *UTC* getters (getUTCFullYear/getUTCMonth/getUTCDate/
 * getUTCHours/getUTCDay/...) reflect the wall-clock time in `timeZone` for the
 * given instant. This is a calendar-math shim, not a real instant — never
 * serialize it or compare it against another Date's `.getTime()` directly.
 */
export function zonedDate(instant: Date = new Date(), timeZone: string = APP_TIMEZONE): Date {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(instant)
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0)
  // Hour "24" shows up for midnight with hour12:false in some environments —
  // normalize it to 0.
  const hour = get('hour') % 24
  return new Date(
    Date.UTC(get('year'), get('month') - 1, get('day'), hour, get('minute'), get('second'))
  )
}

/**
 * Inverse of `zonedDate`: given wall-clock parts as lived in `timeZone`,
 * returns the real UTC instant. Used to interpret admin-entered
 * `datetime-local` values (which carry no timezone of their own) as the
 * business timezone rather than the server's.
 */
export function zonedTimeToInstant(
  year: number,
  month: number, // 0-11
  day: number,
  hour: number,
  minute: number,
  timeZone: string = APP_TIMEZONE
): Date {
  let guess = Date.UTC(year, month, day, hour, minute)
  // One correction pass is enough outside DST-transition instants: find what
  // wall-clock the guess produces in the target zone, and shift by the
  // difference between that and what we actually wanted.
  for (let i = 0; i < 2; i++) {
    const asZoned = zonedDate(new Date(guess), timeZone)
    const wanted = Date.UTC(year, month, day, hour, minute)
    const producedWallClock = Date.UTC(
      asZoned.getUTCFullYear(),
      asZoned.getUTCMonth(),
      asZoned.getUTCDate(),
      asZoned.getUTCHours(),
      asZoned.getUTCMinutes()
    )
    const diff = wanted - producedWallClock
    if (diff === 0) break
    guess += diff
  }
  return new Date(guess)
}

/** Parses a `datetime-local` input value ("2026-08-01T09:00") as a wall-clock
 * time in `timeZone`, returning the real UTC instant. Returns null on bad input. */
export function parseZonedDateTimeLocal(
  value: string,
  timeZone: string = APP_TIMEZONE
): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value)
  if (!match) return null
  const [, y, mo, d, h, mi] = match
  return zonedTimeToInstant(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), timeZone)
}

/** Formats an instant as a `datetime-local` input value in `timeZone`. */
export function formatZonedDateTimeLocal(instant: Date, timeZone: string = APP_TIMEZONE): string {
  const z = zonedDate(instant, timeZone)
  const pad = (n: number) => `${n}`.padStart(2, '0')
  return `${z.getUTCFullYear()}-${pad(z.getUTCMonth() + 1)}-${pad(z.getUTCDate())}T${pad(z.getUTCHours())}:${pad(z.getUTCMinutes())}`
}
