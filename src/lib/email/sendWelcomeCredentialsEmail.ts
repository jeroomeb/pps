import { Resend } from 'resend'
import { readFileSync } from 'fs'
import path from 'path'

export interface WelcomeCredentialsEmailParams {
  recipientEmail: string
  recipientName: string
  temporaryPassword: string
  role: 'admin' | 'inspector'
  organizationName?: string | null
}

export async function sendWelcomeCredentialsEmail({
  recipientEmail,
  recipientName,
  temporaryPassword,
  role,
  organizationName,
}: WelcomeCredentialsEmailParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[WelcomeEmail] RESEND_API_KEY is not configured; skipping email dispatch.')
    return
  }

  const resend = new Resend(apiKey)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://amenityops.app'
  const loginUrl = `${siteUrl.replace(/\/$/, '')}/login`
  const fromAddress = process.env.EMAIL_FROM || "Amenity Op's <reports@amenityops.app>"
  const replyTo = process.env.ADMIN_EMAIL || 'reports@amenityops.app'

  let logoBuffer: Buffer | null = null
  try {
    logoBuffer = readFileSync(path.join(process.cwd(), 'public', 'logo-sm.png'))
  } catch (err) {
    console.warn('[WelcomeEmail] Could not load logo-sm.png:', err)
  }

  const roleTitle = role === 'admin' ? 'Administrator' : 'Operational Continuity Specialist (OCS)'
  const orgLine = organizationName ? `<p style="margin: 0 0 12px 0; color: #475569; font-size: 14px;"><strong>Organization:</strong> ${escapeHtml(organizationName)}</p>` : ''

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your Amenity Op's Credentials</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="background-color: #1e293b; padding: 24px 32px; text-align: left;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    ${logoBuffer ? `<img src="cid:amenity-logo" alt="Amenity Op's" width="40" height="40" style="border-radius: 6px; display: inline-block; vertical-align: middle; margin-right: 12px;" />` : ''}
                    <span style="color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.02em; vertical-align: middle;">Amenity Op's</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #0f172a;">Welcome, ${escapeHtml(recipientName)}</h1>
              <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.5; color: #334155;">
                An account has been created for you on the <strong>Amenity Op's Property Inspection & Operational Continuity Platform</strong> as an <strong>${roleTitle}</strong>.
              </p>

              ${orgLine}

              <!-- Credentials Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; border-radius: 6px; border: 1px solid #cbd5e1; margin: 24px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 8px; letter-spacing: 0.05em;">Your Login Credentials</div>
                    <div style="margin-bottom: 12px; font-size: 14px; color: #0f172a;">
                      <strong>Email:</strong> <span style="font-family: monospace; background: #ffffff; padding: 2px 6px; border-radius: 4px; border: 1px solid #e2e8f0;">${escapeHtml(recipientEmail)}</span>
                    </div>
                    <div style="font-size: 14px; color: #0f172a;">
                      <strong>Temporary Password:</strong> <span style="font-family: monospace; font-size: 15px; font-weight: 700; background: #ffffff; padding: 4px 8px; border-radius: 4px; border: 1px solid #cbd5e1; color: #ea580c;">${escapeHtml(temporaryPassword)}</span>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Action Notice -->
              <div style="background-color: #fff7ed; border-left: 4px solid #ea580c; padding: 12px 16px; margin-bottom: 24px; border-radius: 0 4px 4px 0;">
                <p style="margin: 0; font-size: 13px; line-height: 1.4; color: #9a3412;">
                  <strong>Security Requirement:</strong> You will be required to set a permanent, private password immediately upon your first sign-in.
                </p>
              </div>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 28px 0 16px 0;">
                <tr>
                  <td align="center">
                    <a href="${loginUrl}" target="_blank" style="background-color: #ea580c; color: #ffffff; text-decoration: none; padding: 14px 28px; font-size: 15px; font-weight: 600; border-radius: 6px; display: inline-block;">
                      Log In to Portal &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <p style="text-align: center; font-size: 12px; color: #64748b; margin: 0;">
                Direct URL: <a href="${loginUrl}" style="color: #64748b;">${loginUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8;">
              Amenity Op's LLC &bull; Property Inspections & Operational Audits<br />
              This is an automated system email. Please do not reply directly.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

  const attachments: { filename: string; content: Buffer; contentId: string }[] = []
  if (logoBuffer) {
    attachments.push({
      filename: 'logo.png',
      content: logoBuffer,
      contentId: 'amenity-logo',
    })
  }

  try {
    const result = await resend.emails.send({
      from: fromAddress,
      to: [recipientEmail],
      replyTo,
      subject: `Your Amenity Op's Account Credentials (${recipientName})`,
      html,
      attachments,
    })

    if (result.error) {
      console.error('[WelcomeEmail] Resend error:', result.error)
    }
  } catch (err) {
    console.error('[WelcomeEmail] Failed to send credentials email:', err)
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
