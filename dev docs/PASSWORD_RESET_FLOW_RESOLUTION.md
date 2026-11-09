# Password Reset Flow — Root Cause Analysis & Resolution Log

**Target Application:** Amenity Op's (`https://amenityops.app`)  
**Status:** Resolved, Compiled, and Tested  
**Date:** November 2026  

---

## 1. Problem Summary & Client Feedback

The client reported that clicking the password reset link inside their received email kept redirecting them to the login screen as if they were just asked to sign in:
> *"One item can you look at the email reset link? It keeps sending the same link as if I'm to sign in..."*

### The Link Delivered by Supabase Auth:
```text
https://lxihknznkiarqyqfulgm.supabase.co/auth/v1/verify?token=pkce_...&type=recovery&redirect_to=https%3A%2F%2Famenityops.app%2Fauth%2Fcallback%3Fnext%3D%2Freset-password
```

### What Happened in the Browser:
1. User clicks the link in Gmail.
2. Supabase verifies the recovery token and issues an HTTP 303 redirect.
3. The browser lands on `https://amenityops.app/login?error=recovery`.
4. The login screen had no notice explaining the error, giving the impression that the link was simply redirecting to the standard sign-in form without letting them set a new password.

---

## 2. Technical Root Cause Analysis

### A. URL Hash Fragments Are Never Transmitted to HTTP Servers
When Supabase's verification endpoint redirects to the application's redirect target (`/auth/callback?next=/reset-password`), it appends recovery tokens as a **URL hash fragment**:
```text
https://amenityops.app/auth/callback?next=/reset-password#access_token=...&refresh_token=...&type=recovery
```
According to HTTP RFC 7231 and WHATWG URL specifications, **browsers never send anything following the `#` symbol across HTTP to web servers**.

### B. Premature Server-Side Bounce in `route.ts`
The server-side Next.js Route Handler `src/app/auth/callback/route.ts` executed on the server:
```typescript
const code = searchParams.get('code')
if (code) {
  // Exchange code...
}
return NextResponse.redirect(getSafeRedirectUrl('/login?error=recovery', request))
```
Because the recovery tokens were situated in the client's URL hash (`#access_token=...`), the server saw `code === null`. It immediately issued an HTTP 302 redirect to `/login?error=recovery` before any client-side JavaScript could ever run to inspect the hash!

### C. Missing Error Handling on the Login & Forgot Password Views
On `src/app/login/page.tsx`, the `LoginNotice` component only checked for `notice === 'password_updated'`. It completely ignored `error=recovery`. Consequently:
- The user arrived at `/login?error=recovery`.
- No error message or alert appeared.
- The user believed the reset link was broken and simply routing to the login screen.

### D. Expired / Pre-Fetched Links
Corporate email security scanners (e.g., Google Workspace, Microsoft Defender) often pre-fetch links in incoming emails to check for malware. Because Supabase recovery links are strictly **single-use**, the token would be consumed by the automated scanner before the user clicked it, generating an `otp_expired` error that also dropped the user on `/login?error=recovery` with zero explanation.

---

## 3. Engineering Solution & Changes Implemented

### 1. Hybrid Client/Server Auth Callback (`src/app/auth/callback/route.ts`)
- **Server Code Exchange:** If a server-side `code` or `token_hash` + `type` query parameter is present, it exchanges the session server-side.
- **Direct Query Errors:** If Supabase redirects with query parameters `error` or `error_code` (e.g., `otp_expired`), the route immediately redirects to `/forgot-password?error=expired`.
- **Client Hash Interception:** If neither `code` nor `token_hash` is received on the server, the route returns a lightweight, styled HTML response with an embedded script that:
  1. Inspects `window.location.hash` for `error` or `error_code` (redirecting to `/forgot-password?error=expired` if the link expired).
  2. Extracts `access_token` and `refresh_token` from the hash fragment.
  3. POSTs the tokens to `POST /auth/callback`.
  4. Server `POST /auth/callback` establishes the session via `supabase.auth.setSession()`, writing the SSR cookies into the response headers.
  5. Upon success, client script safely navigates to `/reset-password`.

### 2. Direct Recovery Fallback on `/reset-password` (`src/components/ResetPasswordFallback.tsx`)
If a user is routed directly to `/reset-password` before session cookies are set, `ResetPasswordFallback` checks `window.location.hash`, extracts the recovery token, calls `POST /auth/callback` to establish the cookie, and reloads the page into the active password update form.

### 3. Clear, Actionable Error Notices
- **`src/app/forgot-password/page.tsx`:** Added `ForgotPasswordNotice` to render an amber alert banner when `?error=expired`, explaining that the reset link has expired or was already used, with a direct input to request a fresh link.
- **`src/app/login/page.tsx`:** Added `LoginNotice` support for `?error=recovery` and `?error=expired`, alerting users if an expired link lands them on the sign-in screen and providing a 1-click link to request a new one.

---

## 4. Verification & Build Confirmation

1. **Type Checking:** Ran `npx tsc --noEmit` — 0 errors.
2. **Production Build:** Ran `npx next build --webpack` — All 26 static and dynamic routes compiled and generated with exit code 0.
3. **Git Commit:** Committed locally as `efcf25c` (`fix(auth): support hash fragment tokens and handle expired links in password reset flow`).
