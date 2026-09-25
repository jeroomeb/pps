import crypto from 'crypto'

/**
 * Generates a cryptographically secure random temporary password.
 * Combines uppercase, lowercase, numbers, and symbols with high entropy.
 * Default length: 14 characters.
 */
export function generateSecureTemporaryPassword(length = 14): string {
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ' // Removed easily confused characters (I, O)
  const lowercase = 'abcdefghjkmnpqrstuvwxyz' // Removed easily confused characters (i, l, o)
  const numbers = '23456789'                   // Removed easily confused numbers (0, 1)
  const symbols = '!@#$%&*+'

  const allChars = uppercase + lowercase + numbers + symbols

  // Ensure at least one of each character class
  const passwordChars: string[] = [
    uppercase[crypto.randomInt(0, uppercase.length)],
    lowercase[crypto.randomInt(0, lowercase.length)],
    numbers[crypto.randomInt(0, numbers.length)],
    symbols[crypto.randomInt(0, symbols.length)],
  ]

  // Fill remaining characters from random pool
  const randomBytes = crypto.randomBytes(length - passwordChars.length)
  for (let i = 0; i < randomBytes.length; i++) {
    passwordChars.push(allChars[randomBytes[i] % allChars.length])
  }

  // Shuffle array securely using Fisher-Yates
  for (let i = passwordChars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1)
    const temp = passwordChars[i]
    passwordChars[i] = passwordChars[j]
    passwordChars[j] = temp
  }

  return passwordChars.join('')
}
