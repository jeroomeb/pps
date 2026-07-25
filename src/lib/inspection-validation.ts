// Single source of truth for "can this inspection be submitted?" — shared by
// the client (enables/disables Submit, lists every blocker) and the server
// (rejects the POST). Having two copies of this logic is what let the Submit
// button enable on a checklist the API would reject.

export type InspectionItemForValidation = {
  id: string
  item_name: string
  status: 'pass' | 'fail' | 'na' | null
  comment?: string | null
  photo_path?: string | null
}

export type ValidationIssue = {
  itemId: string
  itemName: string
  reason: string
}

/**
 * Every reason a checklist item blocks submission:
 *  - no status yet
 *  - a photo is required on every answered item except N/A
 *  - a Fail must have a comment explaining it
 * Returns ALL blocking issues (not just the first), in item order, so the UI
 * can show a complete list instead of one-error-per-round-trip.
 */
export function validateInspectionItems(
  items: InspectionItemForValidation[]
): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  for (const item of items) {
    if (!item.status) {
      issues.push({
        itemId: item.id,
        itemName: item.item_name,
        reason: 'Needs a Pass / Fail / N-A status.',
      })
      continue
    }
    if (item.status !== 'na' && !item.photo_path) {
      issues.push({
        itemId: item.id,
        itemName: item.item_name,
        reason: 'Needs a photo (mark N/A if it does not apply).',
      })
    }
    if (item.status === 'fail' && !item.comment?.trim()) {
      issues.push({
        itemId: item.id,
        itemName: item.item_name,
        reason: 'Marked Fail — needs a comment explaining the failure.',
      })
    }
  }

  return issues
}
