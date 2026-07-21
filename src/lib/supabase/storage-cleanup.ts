import { createAdminClient } from '@/lib/supabase/server'

/**
 * Best-effort removal of an inspection's storage objects (item photos +
 * generated report PDF). Failures are swallowed — orphaned files are
 * preferable to blocking a delete.
 */
export async function cleanupInspectionStorage(inspectionIds: string[]) {
  if (!inspectionIds.length) return
  const admin = createAdminClient()

  try {
    for (const inspectionId of inspectionIds) {
      const { data: photos } = await admin.storage.from('photos').list(inspectionId)
      if (photos?.length) {
        await admin.storage
          .from('photos')
          .remove(photos.map((file) => `${inspectionId}/${file.name}`))
      }
    }
    await admin.storage.from('reports').remove(inspectionIds.map((id) => `${id}.pdf`))
  } catch {
    // best effort only
  }
}
