import type { CommunityType } from '@/types/growth-leads'

const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'aol.com',
  'icloud.com',
  'mail.com',
  'protonmail.com',
])

/**
 * Normalizes phone numbers to standard US format: (XXX) XXX-XXXX
 */
export function sanitizePhoneNumber(phone: string | null | undefined): string | null {
  if (!phone) return null
  const cleaned = phone.replace(/\D/g, '')

  // Remove leading 1 if 11 digits
  const standard = cleaned.length === 11 && cleaned.startsWith('1') ? cleaned.slice(1) : cleaned

  if (standard.length === 10) {
    const area = standard.slice(0, 3)
    const mid = standard.slice(3, 6)
    const last = standard.slice(6, 10)
    return `(${area}) ${mid}-${last}`
  }

  // Return original trimmed if doesn't match standard 10 digits
  return phone.trim()
}

/**
 * Validates email address format and checks whether it is a corporate/business domain
 */
export function validateEmail(email: string | null | undefined): {
  isValid: boolean
  isCorporate: boolean
  domain: string | null
} {
  if (!email || !email.trim()) {
    return { isValid: false, isCorporate: false, domain: null }
  }

  const clean = email.trim().toLowerCase()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(clean)) {
    return { isValid: false, isCorporate: false, domain: null }
  }

  const parts = clean.split('@')
  const domain = parts[1] || null
  const isCorporate = domain ? !FREE_EMAIL_DOMAINS.has(domain) : false

  return {
    isValid: true,
    isCorporate,
    domain,
  }
}

/**
 * Suggests default decision-maker gatekeeper titles based on asset classification
 */
export function suggestGatekeeperTitle(
  communityType: CommunityType,
  currentTitle?: string | null
): string {
  if (currentTitle && currentTitle.trim()) {
    return currentTitle.trim()
  }

  switch (communityType) {
    case 'student_housing':
      return 'Community Director'
    case 'motel':
      return 'Owner & Managing Operator'
    case 'luxury_multifamily':
      return 'Director of Property Management'
    case 'active_adult_55_plus':
      return 'HOA General Manager'
    case 'commercial_multitenant':
      return 'Facilities & Asset Director'
    case 'regional_portfolio':
      return 'Regional Vice President of Operations'
    default:
      return 'General Manager'
  }
}

/**
 * Generates a normalized deduplication key from property name and street address
 */
export function normalizePropertyKey(propertyName: string, address: string): string {
  const normName = propertyName.toLowerCase().replace(/[^a-z0-9]/g, '')
  const normAddr = address.toLowerCase().replace(/[^a-z0-9]/g, '')
  return `${normName}_${normAddr}`
}

