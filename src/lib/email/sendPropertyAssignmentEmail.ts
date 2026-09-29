import { Resend } from 'resend'

function esc(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export async function sendPropertyAssignmentEmail({
  to,
  specialistName,
  propertyName,
  propertyAddress,
  checklistNames,
  alwaysAvailable,
}: {
  to: string
  specialistName: string
  propertyName: string
  propertyAddress: string
  checklistNames: string[]
  alwaysAvailable: boolean
}) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const from =
    process.env.EMAIL_FROM_ASSIGNMENTS ||
    process.env.EMAIL_FROM ||
    "Amenity Op's <inspections@amenityops.app>"
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://amenityops.app'
  const replyTo = process.env.EMAIL_REPLY_TO || 'hello@amenityops.com'

  const checklistLabel = checklistNames.length
    ? checklistNames.map((name) => esc(name)).join(', ')
    : 'Checklists will appear once they are enabled for this property'
  const availability = alwaysAvailable
    ? 'These checklists stay on your board. After you submit one, a new pending copy is ready for the next visit.'
    : 'Complete the open checklist for this property from your dashboard.'

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
          <h1 style="font-size:20px; margin:0 0 16px;">You were assigned to a property</h1>
          <p style="font-size:14px; color:#4b5563; margin:0 0 16px;">
            Hi ${esc(specialistName)}, you now have access to this property and its checklists.
          </p>
          <table role="presentation" width="100%" style="font-size:14px;">
            <tr><td style="padding:6px 0; color:#4b5563;">Property</td><td style="padding:6px 0; font-weight:600; text-align:right;">${esc(propertyName)}</td></tr>
            <tr><td style="padding:6px 0; color:#4b5563;">Address</td><td style="padding:6px 0; font-weight:600; text-align:right;">${esc(propertyAddress)}</td></tr>
            <tr><td style="padding:6px 0; color:#4b5563;">Checklists</td><td style="padding:6px 0; font-weight:600; text-align:right;">${checklistLabel}</td></tr>
          </table>
          <p style="font-size:14px; color:#4b5563; margin-top:24px;">${esc(availability)}</p>
          <a href="${siteUrl}/login" style="display:inline-block; margin-top:8px; background:#ee8a4b; color:#2b3742; text-decoration:none; font-weight:700; font-size:14px; padding:10px 20px; border-radius:8px;">
            Open Amenity Op&#39;s
          </a>
        </td>
      </tr>
    </table>
  </div>
  `

  const result = await resend.emails.send({
    from,
    to,
    replyTo,
    subject: `Property assigned — ${propertyName}`,
    html,
  })

  if (result.error) {
    throw new Error(result.error.message)
  }
}
