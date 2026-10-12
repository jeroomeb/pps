# Task 4: Forced Password Reset on First Login — Development Plan & Specification

## 1. Architectural Overview & Security Objectives
When an Administrator provisions a new team member or Operational Continuity Specialist (OCS) from `/admin/team`, the system assigns an initial temporary password. In an enterprise SaaS and compliance context, specialists must **not** be allowed to continue operating with administrator-assigned credentials. 

Upon their very first successful authentication, the application must intercept their session and mandate a secure password change before granting access to any property portfolio, scheduled audits, or private client data.

---

## 2. Technical Mechanisms & Architecture

### A. Database Layer
1. **Flag on `profiles`**:
   - `must_reset_password boolean not null default true`
   - Added via migration `0009_forced_password_reset.sql`.
   - Existing active users backfilled to `false` (so existing production users aren't locked out unexpectedly).
   - `handle_new_user()` trigger updated so any newly created user automatically receives `must_reset_password = true`.
   - `createTeamMember()` sets `must_reset_password: true` explicitly when provisioning new specialists or admins.

2. **Security & RLS Defense**:
   - `guard_profile_self_update()` trigger updated so regular users cannot arbitrarily overwrite `must_reset_password` to `false` via a direct client update; it can only be updated through the authorized server action upon password verification or by service_role/admin.

### B. Route Protection & Interception Boundary
1. **Middleware / Proxy (`src/proxy.ts` & `src/lib/supabase/proxy.ts`)**:
   - Dedicated route: `/force-password-change`.
   - Allowlist: `/force-password-change` and `/api/auth/signout` must be reachable when `must_reset_password === true`.
   - Forwarding headers: The proxy forwards `x-user-must-reset` (or DAL verifies `profile.must_reset_password`).
   - If an authenticated user has `must_reset_password === true` and attempts to navigate to any protected route (`/admin`, `/inspector`, `/admin/*`, `/inspector/*`), they receive an immediate **307 Redirect to `/force-password-change`**.
   - Conversely, if a user has already completed their password reset (`must_reset_password === false`), navigating to `/force-password-change` automatically redirects them forward to their home dashboard.

2. **Data Access Layer (`src/lib/auth/dal.ts`)**:
   - `getProfile()` incorporates `must_reset_password: boolean`.
   - `requireRole()` acts as the secondary server-side defense. If `profile.must_reset_password === true` is detected inside a layout or action, it redirects immediately to `/force-password-change`.

### C. Password Reset Flow (`/force-password-change`)
1. **Dedicated Page & Component**:
   - `src/app/force-password-change/page.tsx`: Isolated, distraction-free branding matching the industrial prestige design system.
   - `src/components/ForcePasswordChangeForm.tsx`:
     - Requires:
       - Current/Temporary Password (to verify user identity & prevent session takeover).
       - New Password (min 8 characters, strength indicator / validation).
       - Confirm Password match.
2. **Server Action (`completeForcedPasswordChange` in `src/lib/actions/auth.ts`)**:
   - Validates session and re-authenticates with current temporary password.
   - Updates Supabase Auth password via `supabase.auth.updateUser({ password })`.
   - Updates user profile: sets `must_reset_password = false` on `profiles`.
   - Evicts other active sessions (`supabase.auth.signOut({ scope: 'others' })`).
   - Redirects to `/` (which gracefully routes to `/admin` or `/inspector` based on role).

---

## 3. Step-by-Step Implementation Roadmap

| Step | Scope | Description |
|---|---|---|
| **1** | Database Migration | Write `supabase/migrations/0009_forced_password_reset.sql` with column, default value, backfill, trigger sync, and RLS defense. |
| **2** | Schema & Types | Update `supabase/schema.sql` and `src/lib/database.types.ts` to include `must_reset_password`. |
| **3** | Auth DAL | Update `ProfileWithTenant`, `getProfile()`, and `requireRole()` in `src/lib/auth/dal.ts`. |
| **4** | Server Actions | Add `completeForcedPasswordChange` to `src/lib/actions/auth.ts` and sync `createTeamMember` in `src/lib/actions/team.ts`. |
| **5** | Proxy Interception | Update `src/lib/supabase/proxy.ts` and `src/proxy.ts` to enforce the `/force-password-change` redirect gate. |
| **6** | UI & Components | Build `src/app/force-password-change/page.tsx` and `src/components/ForcePasswordChangeForm.tsx`. |
| **7** | Admin Team UI | Add indicator chips on `/admin/team` showing whether a team member has "Pending First Login" or "Active / Verified Password". |
| **8** | Testing & Verification | Validate with `tsc --noEmit`, `npm run build`, and verify role redirection. |
