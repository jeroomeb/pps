import { Resend } from 'resend'

function esc(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

// Notifies a specialist that a new inspection has been assigned to them.
export async function sendAssignmentEmail({
  to,
  specialistName,
  propertyName,
  propertyAddress,
  checklistName,
  scheduledFor,
}: {
  to: string
  specialistName: string
  propertyName: string
  propertyAddress: string
  checklistName: string
  scheduledFor: string | null
}) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const from =
    process.env.EMAIL_FROM_ASSIGNMENTS ||
    process.env.EMAIL_FROM ||
    "Amenity Op's <inspections@amenityops.app>"

  const scheduledLabel = scheduledFor
    ? new Date(scheduledFor).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })
    : 'As soon as possible'

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
          <h1 style="font-size:20px; margin:0 0 16px;">New inspection assigned</h1>
          <p style="font-size:14px; color:#4b5563; margin:0 0 16px;">
            Hi ${esc(specialistName)}, a new inspection has been assigned to you.
          </p>
          <table role="presentation" width="100%" style="font-size:14px;">
            <tr><td style="padding:6px 0; color:#4b5563;">Property</td><td style="padding:6px 0; font-weight:600; text-align:right;">${esc(propertyName)}</td></tr>
            <tr><td style="padding:6px 0; color:#4b5563;">Address</td><td style="padding:6px 0; font-weight:600; text-align:right;">${esc(propertyAddress)}</td></tr>
            <tr><td style="padding:6px 0; color:#4b5563;">Checklist</td><td style="padding:6px 0; font-weight:600; text-align:right;">${esc(checklistName)}</td></tr>
            <tr><td style="padding:6px 0; color:#4b5563;">Scheduled</td><td style="padding:6px 0; font-weight:600; text-align:right;">${esc(scheduledLabel)}</td></tr>
          </table>
          <p style="font-size:14px; color:#4b5563; margin-top:24px;">
            Log in to Amenity Op&#39;s to view and complete this inspection.
          </p>
        </td>
      </tr>
    </table>
  </div>
  `

  const result = await resend.emails.send({
    from,
    to,
    subject: `New inspection assigned — ${propertyName}`,
    html,
  })

  if (result.error) {
    throw new Error(`Resend rejected the assignment email: ${result.error.message}`)
  }
  return result
}
