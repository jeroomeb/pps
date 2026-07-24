// Human-readable IDs surfaced in the UI (the DB still keys on uuids).

// Random, e.g. "PROP-7F3K9Q" — client asked for random property IDs.
export function genPropertyId(): string {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `PROP-${rand}`
}

// "OCS-4821" — a random-but-sequential-looking 4-digit specialist number.
export function genSpecialistId(): string {
  const n = Math.floor(1000 + Math.random() * 9000)
  return `OCS-${n}`
}
