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
  const logoBuffer = readFileSync(path.join(process.cwd(), 'public', 'logo.png'))
  const logoCid = 'pps-logo'

  const from = process.env.EMAIL_FROM || 'PPS Inspections <onboarding@resend.dev>'
  const cc = process.env.ADMIN_EMAIL ? [process.env.ADMIN_EMAIL] : undefined

  return resend.emails.send({
    from,
    to,
    cc,
    subject: `Inspection Report — ${propertyName} (${checklistName})`,
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
}
