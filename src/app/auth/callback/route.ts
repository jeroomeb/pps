import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSafeRedirectUrl } from '@/lib/urls'
import type { EmailOtpType } from '@supabase/supabase-js'

// Only same-site, absolute-path redirect targets are allowed after an auth
// exchange — an unvalidated `next` (e.g. `.evil.com` or `@evil.com`) is an
// open redirect on a pre-auth endpoint, ideal for phishing.
const ALLOWED_NEXT = new Set(['/reset-password', '/force-password-change', '/admin', '/inspector', '/'])

/**
 * Handles incoming authentication callbacks:
 * 1. Server-side PKCE code exchange (?code=...)
 * 2. Server-side Token Hash verification (?token_hash=...&type=...)
 * 3. Supabase query-string errors (?error=... or ?error_code=...)
 * 4. Client-side hash fragment recovery tokens (#access_token=...&type=recovery)
 *    Browsers never send URL hash fragments to HTTP servers. When no code is
 *    found on the server, we return a lightweight client page that parses
 *    window.location.hash and securely establishes the session via POST /auth/callback.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const errorParam = searchParams.get('error') || searchParams.get('error_code')
  const rawNext = searchParams.get('next') || '/reset-password'
  const next = ALLOWED_NEXT.has(rawNext) ? rawNext : '/reset-password'

  // 1. Explicit error query param emitted by Supabase verify endpoint
  if (errorParam) {
    const isExpired = errorParam === 'otp_expired' || errorParam === 'access_denied'
    return NextResponse.redirect(
      getSafeRedirectUrl(`/forgot-password?error=${isExpired ? 'expired' : encodeURIComponent(errorParam)}`, request)
    )
  }

  // 2. PKCE code exchange
  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(getSafeRedirectUrl(next, request))
    }
    console.warn('[auth/callback] Code exchange error:', error.message)
    return NextResponse.redirect(getSafeRedirectUrl('/forgot-password?error=expired', request))
  }

  // 3. Email OTP / Token Hash flow
  if (tokenHash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    if (!error) {
      return NextResponse.redirect(getSafeRedirectUrl(next, request))
    }
    console.warn('[auth/callback] verifyOtp error:', error.message)
    return NextResponse.redirect(getSafeRedirectUrl('/forgot-password?error=expired', request))
  }

  // 4. Hash fragment fallback:
  // If neither code nor token_hash is in searchParams, the recovery tokens are
  // sitting in the browser's URL hash (#access_token=... or #error=otp_expired).
  // Return an HTML payload so browser JavaScript can parse the hash and establish
  // session cookies via POST /auth/callback.
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verifying Session - Amenity Op's</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #f8fafc;
      color: #0f172a;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 32px 24px;
      text-align: center;
      max-width: 380px;
      width: 90%;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .spinner {
      width: 36px;
      height: 36px;
      border: 3px solid #e2e8f0;
      border-top-color: #ea580c;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 16px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    h2 { font-size: 18px; margin: 0 0 8px; color: #0f172a; font-weight: 600; }
    p { font-size: 13px; margin: 0; color: #64748b; line-height: 1.4; }
  </style>
</head>
<body>
  <div class="card">
    <div class="spinner"></div>
    <h2>Verifying your reset link…</h2>
    <p>Please wait while we secure your recovery session.</p>
  </div>
  <script>
    (function() {
      try {
        var hash = window.location.hash.substring(1);
        var hashParams = new URLSearchParams(hash);
        var searchParams = new URLSearchParams(window.location.search);

        var err = hashParams.get('error') || searchParams.get('error');
        var errCode = hashParams.get('error_code') || searchParams.get('error_code');
        var errDesc = hashParams.get('error_description') || searchParams.get('error_description') || '';

        if (err || errCode) {
          var isExpired = errCode === 'otp_expired' || errDesc.toLowerCase().indexOf('expired') !== -1;
          window.location.replace('/forgot-password?error=' + (isExpired ? 'expired' : encodeURIComponent(errCode || err)));
          return;
        }

        var accessToken = hashParams.get('access_token');
        var refreshToken = hashParams.get('refresh_token');

        if (accessToken) {
          fetch('/auth/callback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              access_token: accessToken,
              refresh_token: refreshToken || ''
            })
          })
          .then(function(res) { return res.json(); })
          .then(function(data) {
            if (data && data.ok) {
              var target = ${JSON.stringify(next)};
              window.location.replace(target);
            } else {
              window.location.replace('/forgot-password?error=expired');
            }
          })
          .catch(function() {
            window.location.replace('/forgot-password?error=network');
          });
          return;
        }

        // Neither server code nor hash token was provided
        window.location.replace('/forgot-password?error=invalid');
      } catch (e) {
        window.location.replace('/forgot-password?error=recovery');
      }
    })();
  </script>
</body>
</html>`

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0',
    },
  })
}

/**
 * Sets session cookies from client-extracted access/refresh tokens.
 * Used when authentication tokens arrive in the URL hash fragment (#access_token=...).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { access_token, refresh_token } = body || {}

    if (!access_token || typeof access_token !== 'string') {
      return NextResponse.json({ ok: false, error: 'Missing access_token' }, { status: 400 })
    }

    const supabase = await createClient()
    const { error } = await supabase.auth.setSession({
      access_token,
      refresh_token: typeof refresh_token === 'string' ? refresh_token : '',
    })

    if (error) {
      console.warn('[auth/callback] setSession failed:', error.message)
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[auth/callback] POST error:', err)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
