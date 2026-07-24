function esc(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export function reportEmailHtml({
  propertyName: rawPropertyName,
  checklistName: rawChecklistName,
  inspectorName: rawInspectorName,
  completedAt: rawCompletedAt,
  logoCid,
}: {
  propertyName: string
  checklistName: string
  inspectorName: string
  completedAt: string
  logoCid: string
}) {
  const propertyName = esc(rawPropertyName)
  const checklistName = esc(rawChecklistName)
  const inspectorName = esc(rawInspectorName)
  const completedAt = esc(rawCompletedAt)
  return `
  <div style="font-family: Inter, Arial, sans-serif; background:#f8f9fa; padding:32px;">
    <table role="presentation" width="100%" style="max-width:520px; margin:0 auto; background:#ffffff; border-radius:8px; overflow:hidden; border:1px solid #e0e0e0;">
      <tr>
        <td style="background:#191c1d; padding:24px; text-align:center;">
          <img src="cid:${logoCid}" alt="Amenity Op's" width="48" height="48" style="border-radius:6px; margin-bottom:8px;" />
          <div style="color:#ffffff; font-size:20px; font-weight:700; letter-spacing:0.02em;">
            Amenity Op&#39;s
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding:32px;">
          <p style="font-size:12px; text-transform:uppercase; letter-spacing:0.05em; color:#6b7280; margin:0 0 4px;">
            Operations, Asset and Logistics Report
          </p>
          <h1 style="font-size:22px; margin:0 0 16px; color:#191c1d;">${propertyName}</h1>
          <table role="presentation" width="100%" style="font-size:14px; color:#191c1d;">
            <tr>
              <td style="padding:6px 0; color:#4b5563;">Checklist</td>
              <td style="padding:6px 0; font-weight:600; text-align:right;">${checklistName}</td>
            </tr>
            <tr>
              <td style="padding:6px 0; color:#4b5563;">Specialist</td>
              <td style="padding:6px 0; font-weight:600; text-align:right;">${inspectorName}</td>
            </tr>
            <tr>
              <td style="padding:6px 0; color:#4b5563;">Completed</td>
              <td style="padding:6px 0; font-weight:600; text-align:right;">${completedAt}</td>
            </tr>
          </table>
          <p style="font-size:14px; color:#4b5563; margin-top:24px;">
            The full inspection report is attached as a PDF, including item-by-item
            Pass / Fail / N/A results, specialist comments, and photos of any failed items.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 32px; background:#f3f4f5; font-size:11px; color:#6b7280; text-align:center;">
          This is an automated message from Amenity Op&#39;s.
        </td>
      </tr>
    </table>
  </div>
  `
}
