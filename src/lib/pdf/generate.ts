import { readFileSync } from 'node:fs'
import path from 'node:path'
import { renderToBuffer } from '@react-pdf/renderer'
import sharp from 'sharp'
import { createAdminClient } from '@/lib/supabase/server'
import { InspectionReport } from '@/lib/pdf/InspectionReport'
import { isSafeInspectionPhotoPath } from '@/lib/storage-paths'
import { formatDateTime } from '@/lib/timezone'

type ReportItem = {
  service_category: string
  item_name: string
  description: string | null
  status: 'pass' | 'fail' | 'na' | null
  comment: string | null
  photoUrl: string | null
}

const MIME_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
}

/**
 * Maps with at most `limit` in-flight calls at once. A 40+ item checklist
 * downloading and sharp-processing every photo via a single `Promise.all`
 * held all of them in memory simultaneously — this caps peak memory/socket
 * usage on the PDF pipeline without changing the output order.
 */
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let next = 0
  async function worker() {
    while (next < items.length) {
      const index = next++
      results[index] = await fn(items[index], index)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}

/**
 * Downloads a stored photo and returns it as a base64 data URI ready for
 * `@react-pdf`'s `<Image>`.
 *
 * Two things were breaking PDF photos:
 *   1. Passing Supabase *signed URLs* to `<Image>` — @react-pdf fetches those
 *      itself on the Node server and the fetch fails silently. Embedding the
 *      bytes inline (like the logo) fixes that.
 *   2. Phone/browser captures are frequently **WebP** (and sometimes HEIC),
 *      which @react-pdf cannot decode at all — so those photos rendered as
 *      nothing even once inlined.
 *
 * So every image is normalized through sharp to a **JPEG** (a format @react-pdf
 * reliably renders), which also auto-applies EXIF rotation and downsizes to
 * keep the PDF small. If sharp can't decode it (e.g. HEIC without heif
 * support), we fall back to embedding the original only when it's already a
 * JPEG/PNG; otherwise we skip it rather than emit a broken image.
 */
export async function photoDataUri(
  admin: ReturnType<typeof createAdminClient>,
  photoPath: string | null
): Promise<string | null> {
  if (!photoPath) return null
  // This runs on the service-role client, which bypasses RLS entirely — a
  // malformed/traversal path here (e.g. `../documents/<uid>/id-front.jpg`)
  // would otherwise let it read any object in any bucket. Reject anything
  // that isn't `<inspectionId>/<safe-filename>` before ever touching storage.
  if (!isSafeInspectionPhotoPath(photoPath)) return null
  const { data, error } = await admin.storage.from('photos').download(photoPath)
  if (error || !data) return null
  const buffer = Buffer.from(await data.arrayBuffer())

  try {
    // The PDF only ever displays these at 240×180pt (photo) or 180×135pt
    // (photoSmall) — 900px is already several times that resolution at print
    // DPI. The old 1600px/q78 setting was producing 15-25MB PDFs on a
    // 40-photo checklist, close to or over Gmail's attachment limit and
    // risking the serverless function's time/memory budget.
    const jpeg = await sharp(buffer)
      .rotate() // honor EXIF orientation so phone photos aren't sideways
      .resize({ width: 900, withoutEnlargement: true })
      .jpeg({ quality: 72 })
      .toBuffer()
    return `data:image/jpeg;base64,${jpeg.toString('base64')}`
  } catch {
    const ext = photoPath.split('.').pop()?.toLowerCase() ?? ''
    const mime = MIME_BY_EXT[ext]
    if (!mime) return null
    return `data:${mime};base64,${buffer.toString('base64')}`
  }
}

let cachedLogoDataUri: string | null = null
function getLogoDataUri() {
  if (!cachedLogoDataUri) {
    const logoBuffer = readFileSync(path.join(process.cwd(), 'public', 'logo-sm.png'))
    cachedLogoDataUri = `data:image/png;base64,${logoBuffer.toString('base64')}`
  }
  return cachedLogoDataUri
}

export async function renderInspectionPdf(input: {
  reportId?: string
  propertyName: string
  propertyAddress: string
  checklistName: string
  inspectorName: string
  completedAt: string
  items: ReportItem[]
}): Promise<Buffer> {
  return renderToBuffer(InspectionReport({ logoUrl: getLogoDataUri(), ...input }))
}

/**
 * Re-renders and re-uploads the PDF for a completed inspection from current
 * DB state. Used as a fallback when the stored PDF is missing or unreadable
 * (storage/RLS hiccup), so "view report" never dead-ends.
 */
export async function regenerateInspectionPdf(
  inspectionId: string
): Promise<{ pdfBuffer: Buffer; pdfPath: string } | null> {
  const admin = createAdminClient()

  const { data: inspection, error } = await admin
    .from('inspections')
    .select(
      'id, completed_at, properties(name, address), checklist_templates(name), profiles(full_name)'
    )
    .eq('id', inspectionId)
    .single()

  if (error || !inspection) return null

  const { data: items } = await admin
    .from('inspection_items')
    .select('id, service_category, item_name, description, status, comment, photo_path, sort_order')
    .eq('inspection_id', inspectionId)
    .order('sort_order')

  const itemsWithPhotoUrls = await mapWithConcurrency(items ?? [], 4, async (item) => ({
    ...item,
    photoUrl: await photoDataUri(admin, item.photo_path),
  }))

  const property = inspection.properties as unknown as { name: string; address: string }
  const template = inspection.checklist_templates as unknown as { name: string }
  const inspectorProfile = inspection.profiles as unknown as { full_name: string }
  const completedAtLabel = inspection.completed_at
    ? formatDateTime(inspection.completed_at)
    : ''

  const pdfBuffer = await renderInspectionPdf({
    reportId: inspectionId.slice(0, 8).toUpperCase(),
    propertyName: property.name,
    propertyAddress: property.address,
    checklistName: template.name,
    inspectorName: inspectorProfile.full_name,
    completedAt: completedAtLabel,
    items: itemsWithPhotoUrls,
  })

  const pdfPath = `${inspectionId}.pdf`
  const { error: uploadError } = await admin.storage
    .from('reports')
    .upload(pdfPath, pdfBuffer, { contentType: 'application/pdf', upsert: true })

  if (uploadError) return null

  await admin.from('inspections').update({ pdf_path: pdfPath }).eq('id', inspectionId)

  return { pdfBuffer, pdfPath }
}
