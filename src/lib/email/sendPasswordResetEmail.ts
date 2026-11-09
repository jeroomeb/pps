import { Resend } from 'resend'

interface SendPasswordResetEmailParams {
  email: string
  resetUrl: string
  otpCode?: string
}

export async function sendPasswordResetEmail({
  email,
  resetUrl,
  otpCode,
}: SendPasswordResetEmailParams): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[sendPasswordResetEmail] RESEND_API_KEY is not configured; skipping email dispatch.')
    return false
  }

  const resend = new Resend(apiKey)
  const fromAddress = process.env.EMAIL_FROM || "Amenity Op's <noreply@amenityops.app>"
  const replyTo = process.env.EMAIL_REPLY_TO || 'hello@amenityops.com'

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reset Your Amenity Op's Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #0f172a; padding: 28px 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.02em;">Amenity Op's</h1>
              <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 13px;">Property Inspections &amp; Audits</p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px 32px 24px 32px;">
              <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 18px; font-weight: 600;">Reset your password</h2>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #334155;">
                We received a request to reset the password for your Amenity Op's account. Click the button below to choose a new password:
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0 28px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" style="display: inline-block; background-color: #ea580c; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 14px 32px; border-radius: 8px; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              ${
                otpCode
                  ? `
              <!-- Verification Code Box -->
              <div style="background-color: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
                <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em;">Or enter this one-time verification code</p>
                <div style="font-family: monospace; font-size: 24px; font-weight: 700; letter-spacing: 0.25em; color: #0f172a;">${otpCode}</div>
              </div>
              `
                  : ''
              }

              <p style="margin: 24px 0 0 0; font-size: 12px; line-height: 1.6; color: #64748b;">
                If you did not request this password reset, you can safely ignore this email. Your password will remain unchanged.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 32px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                &copy; ${new Date().getFullYear()} Amenity Op's. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

  try {
    const { error } = await resend.emails.send({
      from: fromAddress,
      to: email,
      replyTo,
      subject: "Reset your Amenity Op's password",
      html,
    })

    if (error) {
      console.error('[sendPasswordResetEmail] Resend API error:', error)
      return false
    }

    return true
  } catch (err) {
    console.error('[sendPasswordResetEmail] Exception sending email:', err)
    return false
  }
}

