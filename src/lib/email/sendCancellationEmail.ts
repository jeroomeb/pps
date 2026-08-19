import { Resend } from 'resend'
import { formatDateTimeLong } from '@/lib/timezone'

function esc(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

// Tells a specialist an inspection assigned to them has been cancelled. They
// already received an assignment email for it — without this they'd show up at
// the property. Same sender as the assignment notice so the two thread together
// in the specialist's inbox.
export async function sendCancellationEmail({
  to,
  specialistName,
  propertyName,
  propertyAddress,
  checklistName,
  scheduledFor,
  reason,
}: {
  to: string
  specialistName: string
  propertyName: string
  propertyAddress: string
  checklistName: string
  scheduledFor: string | null
  reason: string | null
}) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const from =
    process.env.EMAIL_FROM_ASSIGNMENTS ||
    process.env.EMAIL_FROM ||
    "Amenity Op's <inspections@amenityops.app>"
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://portal.amenityops.app'
  // amenityops.app is send-only (no MX records) — a reply to `from` above has
  // nowhere to land. hello@amenityops.com is a real mailbox.
  const replyTo = process.env.EMAIL_REPLY_TO || 'hello@amenityops.com'

  const scheduledLabel = scheduledFor ? formatDateTimeLong(scheduledFor) : 'As soon as possible'

  const html = `
  <div style="font-family: Inter, Arial, sans-serif; background:#f8f9fa; padding:32px;">
    <table role="presentation" width="100%" style="max-width:520px; margin:0 auto; background:#ffffff; border-radius:8px; overflow:hidden; border:1px solid #e0e0e0;">
      <tr>
        <td style="background:#191c1d; padding:24px; text-align:center;">
          <div style="color:#ffffff; font-size:20px; font-weight:700;">Amenity Op&#39;s</div>
        </td>
      </tr>
      <tr>
        <td style="padding:32px; color:#191c1d;">
          <h1 style="font-size:20px; margin:0 0 16px;">Inspection cancelled</h1>
          <p style="font-size:14px; color:#4b5563; margin:0 0 16px;">
            Hi ${esc(specialistName)}, an inspection previously assigned to you has been
            cancelled. <strong>No action is needed</strong> — please do not attend.
          </p>
          <table role="presentation" width="100%" style="font-size:14px;">
            <tr><td style="padding:6px 0; color:#4b5563;">Property</td><td style="padding:6px 0; font-weight:600; text-align:right;">${esc(propertyName)}</td></tr>
            <tr><td style="padding:6px 0; color:#4b5563;">Address</td><td style="padding:6px 0; font-weight:600; text-align:right;">${esc(propertyAddress)}</td></tr>
            <tr><td style="padding:6px 0; color:#4b5563;">Checklist</td><td style="padding:6px 0; font-weight:600; text-align:right;">${esc(checklistName)}</td></tr>
            <tr><td style="padding:6px 0; color:#4b5563;">Was scheduled</td><td style="padding:6px 0; font-weight:600; text-align:right;">${esc(scheduledLabel)}</td></tr>
          </table>
          ${
            reason
              ? `<p style="font-size:14px; color:#191c1d; margin:20px 0 0; padding:12px 16px; background:#f8f9fa; border-left:3px solid #ee8a4b; border-radius:4px;">
            <span style="color:#4b5563;">Reason:</span> ${esc(reason)}
          </p>`
              : ''
          }
          <p style="font-size:14px; color:#4b5563; margin-top:24px;">
            It has been removed from your assignments. Log in to see your current work.
          </p>
          <a href="${siteUrl}/login" style="display:inline-block; margin-top:8px; background:#ee8a4b; color:#2b3742; text-decoration:none; font-weight:700; font-size:14px; padding:10px 20px; border-radius:8px;">
            Open Amenity Op&#39;s
          </a>
        </td>
      </tr>
    </table>
  </div>
  `

  // Resend's SDK resolves with { data, error } instead of throwing, so turn an
  // API error into a real exception for the caller's try/catch.
  const result = await resend.emails.send({
    from,
    to,
    replyTo,
    subject: `Inspection cancelled — ${propertyName}`,
    html,
  })

  if (result.error) {
    throw new Error(`Resend rejected the cancellation email: ${result.error.message}`)
  }
  return result
}
