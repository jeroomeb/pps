// Business timezone for schedule math, "due" wording, admin-entered datetimes,
// and EVERY user-visible timestamp. Without this, every date computation ran in
// the *server's* timezone (UTC on Vercel) — so "today" flipped over at 8pm
// Eastern, dismissals keyed the wrong calendar day, and admin-entered times
// shifted by the UTC offset. No date library is installed, so these are
// dependency-free Intl-based conversions — accurate for civil-time math;
// DST-transition instants (the one hour a year a wall-clock time is
// ambiguous/skipped) are not specially handled, which matches what this app
// needs.
//
// ⚠️ THIS FILE HOLDS THE ONLY TIMEZONE NAME IN THE CODEBASE. Changing the
// business timezone must be a one-variable change: set `APP_TIMEZONE` in the
// environment (Vercel → Settings → Environment Variables) and redeploy. Never
// hardcode an IANA zone anywhere else, and never format a user-visible date
// without going through the formatters below — a bare `toLocaleString()` on
// the server silently renders in UTC, which is the bug this file exists to
// prevent.

export const APP_TIMEZONE = process.env.APP_TIMEZONE || 'America/New_York'

// ============================================================
// Display formatters — take a REAL instant, always render in APP_TIMEZONE.
//
// These include the zone abbreviation (EDT/EST/PKT/...) by default so a
// timestamp is never ambiguous to whoever is reading it — a specialist, an
// admin in another country, or a property owner reading the emailed PDF.
// ============================================================

// NOTE: `dateStyle`/`timeStyle` are mutually exclusive with component options
// like `timeZoneName` — combining them throws "Invalid option : option" at
// runtime (and TypeScript does not catch it). So the zone abbreviation is
// appended separately rather than requested from the same formatter.

/** "Jul 25, 2026, 1:45 PM EDT" — the default for any date+time shown to a user. */
export function formatDateTime(
  value: Date | string | null | undefined,
  { withZone = true }: { withZone?: boolean } = {}
): string {
  const date = toDate(value)
  if (!date) return '—'
  const base = date.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: APP_TIMEZONE,
  })
  return withZone ? `${base} ${timeZoneAbbreviation(date)}` : base
}

/** "Friday, July 25, 2026 at 1:45 PM EDT" — for prominent single-date screens. */
export function formatDateTimeLong(value: Date | string | null | undefined): string {
  const date = toDate(value)
  if (!date) return '—'
  const base = date.toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: APP_TIMEZONE,
  })
  return `${base} ${timeZoneAbbreviation(date)}`
}

/** "Jul 25, 2026" — date only, no time, so no zone label is needed. */
export function formatDate(value: Date | string | null | undefined): string {
  const date = toDate(value)
  if (!date) return '—'
  return date.toLocaleDateString('en-US', { dateStyle: 'medium', timeZone: APP_TIMEZONE })
}

/** The current zone abbreviation, e.g. "EDT" — for labeling time inputs. */
export function timeZoneAbbreviation(at: Date = new Date()): string {
  const part = new Intl.DateTimeFormat('en-US', {
    timeZone: APP_TIMEZONE,
    timeZoneName: 'short',
  })
    .formatToParts(at)
    .find((p) => p.type === 'timeZoneName')
  return part?.value ?? APP_TIMEZONE
}

/**
 * Rough "in about 2 hours" / "in 15 minutes" wording for a near-future instant.
 * Used on the "scheduled ahead" gate so a specialist doesn't have to do
 * timezone arithmetic to work out how long they're waiting.
 */
export function formatRelativeToNow(target: Date, now: Date = new Date()): string {
  const diffMs = target.getTime() - now.getTime()
  if (diffMs <= 0) return 'now'
  const minutes = Math.round(diffMs / 60_000)
  if (minutes < 60) return `in ${minutes} minute${minutes === 1 ? '' : 's'}`
  const hours = Math.round(diffMs / 3_600_000)
  if (hours < 24) return `in about ${hours} hour${hours === 1 ? '' : 's'}`
  const days = Math.round(diffMs / 86_400_000)
  return `in about ${days} day${days === 1 ? '' : 's'}`
}

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

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
