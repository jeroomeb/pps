// Validates storage object paths that arrive from the client before any
// server code — especially service-role code, which bypasses RLS entirely —
// acts on them. Without this, a client-supplied `photo_path`/`id_front_path`
// like `../documents/<victim-uid>/id-front-123.jpg` would resolve (via
// ordinary URL dot-segment collapsing) to a different bucket/owner once
// concatenated into a Supabase Storage request.

const SAFE_FILENAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,180}$/

/**
 * True if `path` is exactly `${expectedFolder}/<safe-filename>` — no `..`,
 * no extra path segments, no leading slash, filename restricted to a safe
 * character set.
 */
export function isSafeObjectPath(path: string, expectedFolder: string): boolean {
  if (typeof path !== 'string' || !path) return false
  if (path.includes('..') || path.startsWith('/') || path.includes('\\')) return false
  const parts = path.split('/')
  if (parts.length !== 2) return false
  const [folder, filename] = parts
  return folder === expectedFolder && SAFE_FILENAME.test(filename)
}

/** True if `path` is `<uuid>/<safe-filename>` for any UUID folder — used where
 * the caller doesn't know the expected inspection id up front (PDF pipeline). */
export function isSafeInspectionPhotoPath(path: string): boolean {
  if (typeof path !== 'string' || !path) return false
  if (path.includes('..') || path.startsWith('/') || path.includes('\\')) return false
  const match = /^([0-9a-fA-F-]{36})\/([A-Za-z0-9][A-Za-z0-9._-]{0,180})$/.exec(path)
  return match !== null
}
