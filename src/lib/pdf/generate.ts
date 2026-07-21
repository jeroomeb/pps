import { readFileSync } from 'node:fs'
import path from 'node:path'
import { renderToBuffer } from '@react-pdf/renderer'
import { createAdminClient } from '@/lib/supabase/server'
import { InspectionReport } from '@/lib/pdf/InspectionReport'

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
 * Downloads a stored photo and returns it as a base64 data URI.
 *
 * `@react-pdf/renderer` renders on the Node server and, given a remote URL,
 * fetches it itself — but that fetch fails silently against Supabase signed
 * URLs (redirects / auth quirks), which is why photos were missing from PDFs.
 * Embedding the raw bytes as a data URI (same as the logo) makes them render
 * deterministically. `@react-pdf` only decodes JPEG/PNG, so anything else is
 * skipped rather than producing a broken image.
 */
export async function photoDataUri(
  admin: ReturnType<typeof createAdminClient>,
  photoPath: string | null
): Promise<string | null> {
  if (!photoPath) return null
  const ext = photoPath.split('.').pop()?.toLowerCase() ?? ''
  const mime = MIME_BY_EXT[ext]
  if (!mime) return null
  const { data, error } = await admin.storage.from('photos').download(photoPath)
  if (error || !data) return null
  const buffer = Buffer.from(await data.arrayBuffer())
  return `data:${mime};base64,${buffer.toString('base64')}`
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

  const itemsWithPhotoUrls = await Promise.all(
    (items ?? []).map(async (item) => ({
      ...item,
      photoUrl: await photoDataUri(admin, item.photo_path),
    }))
  )

  const property = inspection.properties as unknown as { name: string; address: string }
  const template = inspection.checklist_templates as unknown as { name: string }
  const inspectorProfile = inspection.profiles as unknown as { full_name: string }
  const completedAtLabel = inspection.completed_at
    ? new Date(inspection.completed_at).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
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
