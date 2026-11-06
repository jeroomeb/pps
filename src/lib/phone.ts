/**
 * Standard Phone Number Validation and Formatting Utility
 * Supports US (10-11 digits) and international numbers (up to 15 digits per ITU-T E.164).
 * Permits digits, spaces, hyphens, parentheses, dots, and an optional leading '+'.
 */

export const PHONE_REGEX = /^\+?[\d\s\-().]{7,25}$/

export const PHONE_ERROR_MESSAGE =
  'Please enter a valid phone number with 10 to 15 digits (e.g. (555) 123-4567 or +1 555-123-4567).'

/**
 * Validates whether the given string is a valid phone number.
 * Empty or undefined strings return true (phone numbers are optional fields unless marked required).
 */
export function isValidPhoneNumber(val: string | null | undefined): boolean {
  if (!val || val.trim() === '') return true
  const trimmed = val.trim()
  if (!PHONE_REGEX.test(trimmed)) return false
  const digits = trimmed.replace(/\D/g, '')
  return digits.length >= 10 && digits.length <= 15
}

/**
 * Formats a 10-digit number into standard US (XXX) XXX-XXXX format.
 * Returns the original string if it is international or already formatted.
 */
export function formatPhoneNumber(val: string): string {
  if (!val) return ''
  const trimmed = val.trim()
  const hasPlus = trimmed.startsWith('+')
  const digits = trimmed.replace(/\D/g, '')
  if (!hasPlus && digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
  }
  return trimmed
}

