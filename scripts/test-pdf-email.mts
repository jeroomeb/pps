// Smoke test for the PDF + email pipeline, exercising the same code the
// /api/inspections/[id]/complete route uses, without needing a full browser
// session. Delete this file once the real end-to-end flow has been verified
// through the UI.
// Usage: npx tsx scripts/test-pdf-email.mts <recipient-email>

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { renderToBuffer } from '@react-pdf/renderer'
import { InspectionReport } from '../src/lib/pdf/InspectionReport'
import { sendReportEmail } from '../src/lib/email/sendReportEmail'

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local')
  const contents = readFileSync(envPath, 'utf8')
  for (const line of contents.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    if (!process.env[key]) process.env[key] = value
  }
}

async function main() {
  loadEnvLocal()
  const to = process.argv[2]
  if (!to) {
    console.error('Usage: npx tsx scripts/test-pdf-email.mts <recipient-email>')
    process.exit(1)
  }

  const logoBuffer = readFileSync(path.join(process.cwd(), 'public', 'logo.png'))
  const logoDataUri = `data:image/png;base64,${logoBuffer.toString('base64')}`

  console.log('Rendering PDF...')
  const pdfBuffer = await renderToBuffer(
    InspectionReport({
      logoUrl: logoDataUri,
      propertyName: 'Test Property — Oakwood Heights',
      propertyAddress: '1284 Silver Maple Drive, Suite 402',
      checklistName: '55+ Community Checklist Master',
      inspectorName: 'Hassan (Test)',
      completedAt: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
      items: [
        {
          service_category: 'Common Area Fire & Life Safety',
          item_name: 'Path Obstructions',
          description: 'Corridor width check.',
          status: 'pass',
          comment: 'Clear.',
          photoUrl: null,
        },
        {
          service_category: 'Common Area Fire & Life Safety',
          item_name: 'Exit Sign Deficiencies',
          description: 'Emergency exit sign check.',
          status: 'fail',
          comment: 'Sign unlit near stairwell B.',
          photoUrl:
            'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400',
        },
        {
          service_category: 'Aesthetic Compliance & Waste',
          item_name: 'Terrain Ice Formations',
          description: null,
          status: 'na',
          comment: null,
          photoUrl: null,
        },
      ],
    })
  )
  console.log(`PDF rendered: ${pdfBuffer.length} bytes`)

  console.log(`Sending email to ${to}...`)
  const result = await sendReportEmail({
    to,
    propertyName: 'Test Property — Oakwood Heights',
    checklistName: '55+ Community Checklist Master',
    inspectorName: 'Hassan (Test)',
    completedAt: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
    pdfBuffer,
    pdfFilename: 'test-inspection.pdf',
  })

  console.log('Resend response:', JSON.stringify(result, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
