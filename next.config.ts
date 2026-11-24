import type { NextConfig } from "next";

// A strict nonce-based CSP would need the proxy to inject a per-request
// nonce into every response (a bigger change than this pass covers), so this
// is a pragmatic policy: same-origin by default, Supabase allowed for
// API/storage calls, framing blocked. No XSS sink was found in the app, but
// these headers give real defense-in-depth against one being introduced —
// especially given the Supabase auth cookie is necessarily `httpOnly: false`.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

const nextConfig: NextConfig = {
  devIndicators: false,
  deploymentId:
    process.env.COOLIFY_DEPLOYMENT_ID ||
    process.env.COOLIFY_RESOURCE_UUID ||
    process.env.GIT_SHA ||
    process.env.SOURCE_COMMIT ||
    undefined,
  async headers() {
    return [
      {
        source: '/(login|forgot-password|reset-password)(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=(self)' },
        ],
      },
    ]
  },
};

export default nextConfig;
