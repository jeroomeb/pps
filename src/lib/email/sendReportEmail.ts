import { readFileSync } from 'node:fs'
import path from 'node:path'
import { Resend } from 'resend'
import { reportEmailHtml } from './reportEmail'

export async function sendReportEmail({
  to,
  propertyName,
  checklistName,
  inspectorName,
  completedAt,
  pdfBuffer,
  pdfFilename,
}: {
  to: string
  propertyName: string
  checklistName: string
  inspectorName: string
  completedAt: string
  pdfBuffer: Buffer
  pdfFilename: string
}) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const logoBuffer = readFileSync(path.join(process.cwd(), 'public', 'logo-sm.png'))
  const logoCid = 'pps-logo'

  const from = process.env.EMAIL_FROM || "Amenity Op's <reports@amenityops.app>"
  const cc = process.env.ADMIN_EMAIL ? [process.env.ADMIN_EMAIL] : undefined
  // amenityops.app is send-only (no MX records) — a reply to `from` above has
  // nowhere to land. hello@amenityops.com is a real mailbox.
  const replyTo = process.env.EMAIL_REPLY_TO || 'hello@amenityops.com'

  // Resend's SDK resolves with { data, error } instead of throwing on API
  // errors (e.g. the sandbox-mode 403) — turn those into real exceptions so
  // callers' try/catch actually fires.
  const result = await resend.emails.send({
    from,
    to,
    cc,
    replyTo,
    subject: `Operations, Asset and Logistics Report — ${propertyName} (${checklistName})`,
    html: reportEmailHtml({ propertyName, checklistName, inspectorName, completedAt, logoCid }),
    attachments: [
      {
        filename: 'logo.png',
        content: logoBuffer,
        contentId: logoCid,
      },
      {
        filename: pdfFilename,
        content: pdfBuffer,
      },
    ],
  })

  if (result.error) {
    throw new Error(`Resend rejected the email: ${result.error.message}`)
  }

  return result
}
