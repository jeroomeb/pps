/**
 * Shared client & server password validation utilities.
 * Enforces enterprise standards:
 * - Minimum 8 characters
 * - At least one uppercase letter (A-Z)
 * - At least one lowercase letter (a-z)
 * - At least one number (0-9)
 * - At least one special character (e.g. !@#$%&*+)
 */

export interface PasswordRequirements {
  minLength: boolean
  hasUpper: boolean
  hasLower: boolean
  hasNumber: boolean
  hasSpecial: boolean
}

export function checkPasswordRequirements(password: string): PasswordRequirements {
  return {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  }
}

export function isPasswordValid(password: string): boolean {
  const reqs = checkPasswordRequirements(password)
  return reqs.minLength && reqs.hasUpper && reqs.hasLower && reqs.hasNumber && reqs.hasSpecial
}

export function getPasswordValidationError(password: string): string | null {
  const reqs = checkPasswordRequirements(password)
  if (!reqs.minLength) return 'Password must be at least 8 characters long.'
  if (!reqs.hasUpper) return 'Password must include at least one uppercase letter (A-Z).'
  if (!reqs.hasLower) return 'Password must include at least one lowercase letter (a-z).'
  if (!reqs.hasNumber) return 'Password must include at least one number (0-9).'
  if (!reqs.hasSpecial) return 'Password must include at least one special character (e.g. !@#$%&*).'
  return null
}

