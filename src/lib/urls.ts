import type { NextRequest } from 'next/server'

/**
 * Resolves the real public origin URL for incoming requests.
 * Handles Nginx reverse proxy headers (X-Forwarded-Host, X-Forwarded-Proto, Host)
 * so redirects never leak internal 'localhost:3000' addresses in production.
 */
export function getRequestOrigin(request: NextRequest): string {
  const forwardedHost = request.headers.get('x-forwarded-host')
  const host = forwardedHost || request.headers.get('host')
  const proto =
    request.headers.get('x-forwarded-proto') ||
    (request.url.startsWith('https') ? 'https' : 'http')

  // If host is the public domain (e.g. amenityops.app), use it directly
  if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
    return `${proto}://${host}`
  }

  // If running in production behind a proxy that stripped host headers, use configured URL
  if (process.env.NEXT_PUBLIC_SITE_URL && process.env.NODE_ENV === 'production') {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  }

  // Local development fallback
  if (host) {
    return `${proto}://${host}`
  }

  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://amenityops.app'
}

/**
 * Returns a fully qualified URL for safe redirects behind reverse proxies.
 */
export function getSafeRedirectUrl(path: string, request: NextRequest): URL {
  const origin = getRequestOrigin(request)
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return new URL(cleanPath, origin)
}
