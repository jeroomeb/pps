'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'

/**
 * Dismiss a required-inspection day so it stops surfacing as overdue on the
 * dashboard. Identified by (property, calendar day) — the same identity
 * `dueEntries()` uses, so the entry disappears on the next render.
 */
export async function dismissOccurrence(
  propertyId: string,
  occurrenceDate: string
): Promise<{ error?: string } | void> {
  const profile = await requireRole('admin')
  const supabase = await createClient()

  const { error } = await supabase.from('schedule_dismissals').upsert(
    {
      property_id: propertyId,
      occurrence_date: occurrenceDate,
      dismissed_by: profile.id,
    },
    { onConflict: 'property_id,occurrence_date' }
  )

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin')
}

/** Undo a dismissal — the reminder comes back. */
export async function restoreOccurrence(
  propertyId: string,
  occurrenceDate: string
): Promise<{ error?: string } | void> {
  await requireRole('admin')
  const supabase = await createClient()

  const { error } = await supabase
    .from('schedule_dismissals')
    .delete()
    .eq('property_id', propertyId)
    .eq('occurrence_date', occurrenceDate)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin')
}
