/**
 * Crash-safe local draft mirror for an in-progress inspection.
 *
 * The app autosaves every answer to the server as it's given, so anything that
 * reached the server already survives a crash. Two gaps remained:
 *
 *  1. A comment typed but never blurred (the field still focused when the
 *     phone dies) was never sent — `onBlur` was the only trigger.
 *  2. When a save FAILS — no signal in a basement or parking garage —
 *     `ChecklistItemCard.persist()` reverts the UI to the last server value
 *     and the answer is gone with no way back.
 *
 * This module keeps a parallel copy in localStorage so both are recoverable.
 *
 * ── Design rules, in order of importance ────────────────────────────────────
 *
 * A. **It can never break the app.** Every function is wrapped in try/catch and
 *    returns a safe default. Safari private mode, disabled storage and
 *    QuotaExceededError all degrade to exactly the old behavior — no draft, no
 *    banner, no error. Nothing here is allowed to reach the render path.
 *
 * B. **It is never the source of truth.** The server is. A draft is only ever
 *    *offered* back to the specialist, who chooses to restore or discard it,
 *    and a restore replays through the normal `saveInspectionItem` action so
 *    all server validation and the completed/cancelled guards still apply.
 *    Nothing is written to the database without an explicit tap.
 *
 * C. **No photos.** Image blobs would blow the ~5MB localStorage quota after a
 *    couple of items and start throwing on every subsequent write. Photos
 *    already upload straight to Supabase Storage, which is durable — the
 *    genuine gap there is capturing one with NO connectivity, which this does
 *    not solve and is called out as such.
 */

/** Bumping the version retires every old draft rather than trying to migrate
 *  a shape we no longer understand. */
const KEY_PREFIX = 'amenityops:draft:v1:'

export type DraftItem = {
  status: 'pass' | 'fail' | 'na' | null
  comment: string
  savedAt: number
}

export type InspectionDraft = Record<string, DraftItem>

function keyFor(inspectionId: string) {
  return `${KEY_PREFIX}${inspectionId}`
}

/** Storage may be entirely absent (SSR) or throw on access (some privacy
 *  modes throw on the *getter*, not just on use) — hence the try/catch. */
function storage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null
    return window.localStorage
  } catch {
    return null
  }
}

function isDraftItem(value: unknown): value is DraftItem {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  const statusOk =
    v.status === null || v.status === 'pass' || v.status === 'fail' || v.status === 'na'
  return statusOk && typeof v.comment === 'string' && typeof v.savedAt === 'number'
}

/** Returns `{}` for anything unreadable, absent, or malformed. Never throws. */
export function loadDraft(inspectionId: string): InspectionDraft {
  const store = storage()
  if (!store) return {}
  try {
    const raw = store.getItem(keyFor(inspectionId))
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}

    // Keep only entries that still match the expected shape, so one bad record
    // can't take the whole draft (or the screen) down with it.
    const clean: InspectionDraft = {}
    for (const [itemId, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (isDraftItem(value)) clean[itemId] = value
    }
    return clean
  } catch {
    return {}
  }
}

function writeDraft(inspectionId: string, draft: InspectionDraft) {
  const store = storage()
  if (!store) return
  try {
    if (Object.keys(draft).length === 0) {
      store.removeItem(keyFor(inspectionId))
      return
    }
    store.setItem(keyFor(inspectionId), JSON.stringify(draft))
  } catch {
    // Quota exceeded or storage disabled mid-session. Losing the draft is
    // acceptable; throwing here would take the checklist down with it.
  }
}

/** Mirror one item's current answer. Called on every status tap and on every
 *  comment keystroke (debounced) — not just on blur. */
export function saveDraftItem(
  inspectionId: string,
  itemId: string,
  patch: { status?: 'pass' | 'fail' | 'na' | null; comment?: string }
) {
  const draft = loadDraft(inspectionId)
  const existing = draft[itemId]
  draft[itemId] = {
    status: patch.status !== undefined ? patch.status : (existing?.status ?? null),
    comment: patch.comment !== undefined ? patch.comment : (existing?.comment ?? ''),
    savedAt: Date.now(),
  }
  writeDraft(inspectionId, draft)
}

/** Drop one item — called once the server has confirmed that item's save, so
 *  the draft only ever holds what the server does NOT have. */
export function clearDraftItem(inspectionId: string, itemId: string) {
  const draft = loadDraft(inspectionId)
  if (!(itemId in draft)) return
  delete draft[itemId]
  writeDraft(inspectionId, draft)
}

/** Drop the whole draft — on successful submit, or when the specialist
 *  explicitly discards the recovered answers. */
export function clearDraft(inspectionId: string) {
  const store = storage()
  if (!store) return
  try {
    store.removeItem(keyFor(inspectionId))
  } catch {
    // ignore
  }
}

export type RecoverableAnswer = {
  itemId: string
  itemName: string
  status: 'pass' | 'fail' | 'na' | null
  comment: string
}

/**
 * Which drafted answers actually differ from what the server already has.
 *
 * This is what decides whether the recovery banner appears at all: if every
 * draft entry matches the server (the normal case — saves succeeded and the
 * entries just haven't been cleaned up yet), the result is empty and the
 * screen renders exactly as it did before this feature existed.
 */
export function recoverableAnswers(
  draft: InspectionDraft,
  serverItems: { id: string; item_name: string; status: string | null; comment: string | null }[]
): RecoverableAnswer[] {
  const out: RecoverableAnswer[] = []
  for (const item of serverItems) {
    const drafted = draft[item.id]
    if (!drafted) continue

    const serverComment = item.comment ?? ''
    const sameStatus = drafted.status === (item.status ?? null)
    const sameComment = drafted.comment.trim() === serverComment.trim()
    if (sameStatus && sameComment) continue

    // An empty draft with nothing on the server either is not a recovery —
    // it's a no-op the specialist shouldn't be asked about.
    if (drafted.status === null && !drafted.comment.trim() && !item.status && !serverComment) {
      continue
    }

    out.push({
      itemId: item.id,
      itemName: item.item_name,
      status: drafted.status,
      comment: drafted.comment,
    })
  }
  return out
}
