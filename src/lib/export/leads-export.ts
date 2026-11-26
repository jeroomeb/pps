import * as XLSX from 'xlsx'
import type { GrowthLead } from '@/types/growth-leads'
import { COMMUNITY_TYPE_CONFIG, INTENT_TIER_CONFIG, OUTREACH_STATUS_CONFIG } from '@/types/growth-leads'

/**
 * Standard column headers mapping for the 9 client fields + lifecycle tracking
 */
export const LEAD_EXPORT_COLUMNS = [
  { key: 'property_name', header: 'Property Name' },
  { key: 'community_type', header: 'Community / Property Type' },
  { key: 'address', header: 'Street Address' },
  { key: 'municipality_town', header: 'Municipality / Town' },
  { key: 'state', header: 'State' },
  { key: 'county', header: 'County' },
  { key: 'key_amenities_notes', header: 'Key Amenities & Pain Signals' },
  { key: 'target_gatekeeper_name', header: 'Target Gatekeeper / Contact' },
  { key: 'target_gatekeeper_title', header: 'Contact Title' },
  { key: 'phone', header: 'Phone Number' },
  { key: 'email', header: 'Email Address' },
  { key: 'intent_tier', header: 'Intent Priority Tier' },
  { key: 'outreach_status', header: 'Outreach Status' },
  { key: 'current_sequence_step', header: 'Sequence Step (0-4)' },
  { key: 'source', header: 'Lead Source' },
  { key: 'created_at', header: 'Discovered Date (UTC)' },
] as const

/**
 * Normalizes raw lead objects into a formatted data row suitable for Excel or CSV
 */
export function formatLeadForExport(lead: GrowthLead): Record<string, string | number> {
  const communityLabel = COMMUNITY_TYPE_CONFIG[lead.community_type]?.label ?? lead.community_type
  const tierLabel = INTENT_TIER_CONFIG[lead.intent_tier]?.label ?? `Tier ${lead.intent_tier}`
  const statusLabel = OUTREACH_STATUS_CONFIG[lead.outreach_status]?.label ?? lead.outreach_status

  // Combine gatekeeper name and title if both exist
  const contactName = lead.target_gatekeeper_name?.trim() || 'Unassigned / Needs Discovery'
  const contactTitle = lead.target_gatekeeper_title?.trim() || '—'

  return {
    'Property Name': lead.property_name,
    'Community / Property Type': communityLabel,
    'Street Address': lead.address,
    'Municipality / Town': lead.municipality_town,
    State: lead.state || 'NJ',
    County: lead.county,
    'Key Amenities & Pain Signals': lead.key_amenities_notes || 'None noted',
    'Target Gatekeeper / Contact': contactName,
    'Contact Title': contactTitle,
    'Phone Number': lead.phone || '—',
    'Email Address': lead.email || '—',
    'Intent Priority Tier': tierLabel,
    'Outreach Status': statusLabel,
    'Sequence Step (0-4)': lead.current_sequence_step,
    'Lead Source': lead.source,
    'Discovered Date (UTC)': lead.created_at ? new Date(lead.created_at).toISOString().split('T')[0] : '—',
  }
}

/**
 * Generates an Excel (.xlsx) workbook buffer with styling and auto-column widths
 */
export function generateLeadsXlsx(leads: GrowthLead[]): Buffer {
  const formattedData = leads.map(formatLeadForExport)

  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(formattedData)

  // Calculate dynamic column widths based on maximum content length
  const colWidths = Object.keys(formattedData[0] || {}).map((key) => {
    const maxLen = Math.max(
      key.length,
      ...formattedData.map((row) => String(row[key] ?? '').length)
    )
    return { wch: Math.min(Math.max(maxLen + 3, 14), 50) }
  })
  ws['!cols'] = colWidths

  // Create workbook
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Discovered Leads')

  // Generate buffer
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer
}

/**
 * Generates a clean CSV (.csv) string adhering strictly to RFC-4180
 */
export function generateLeadsCsv(leads: GrowthLead[]): string {
  const formattedData = leads.map(formatLeadForExport)
  if (formattedData.length === 0) {
    return LEAD_EXPORT_COLUMNS.map((col) => `"${col.header}"`).join(',') + '\r\n'
  }

  const headers = Object.keys(formattedData[0])
  const csvLines: string[] = []

  // Header row
  csvLines.push(headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(','))

  // Data rows
  for (const row of formattedData) {
    const values = headers.map((h) => {
      const val = row[h] ?? ''
      const strVal = String(val).replace(/"/g, '""')
      return `"${strVal}"`
    })
    csvLines.push(values.join(','))
  }

  return csvLines.join('\r\n')
}

