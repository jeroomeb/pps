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

import { z } from 'zod'

/**
 * PostgreSQL-compatible UUID regex (8-4-4-4-12 hex characters).
 * Standard Zod z.string().uuid() enforces RFC-4122 version bits (1-8), which rejects
 * PostgreSQL-valid seed UUIDs like Amenity Op's HQ ('00000000-0000-0000-0000-000000000001').
 */
export const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/

export const uuidSchema = z
  .string()
  .trim()
  .regex(UUID_REGEX, 'Invalid UUID')

