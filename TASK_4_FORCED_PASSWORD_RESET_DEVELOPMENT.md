# Task 4: Forced Password Reset on First Login — Development Record

## 1. Overview & Objectives Completed
- Implemented **Forced Password Reset on First Login** for all newly provisioned accounts (OCS specialists and administrators).
- Prevents specialists from using initial administrative/temporary passwords long-term.
- Enforces an immediate redirection boundary upon authentication, intercepting users and routing them to `/force-password-change`.
- Hardens the flow so regular users cannot bypass or self-escalate their reset status via direct client manipulation.

---

## 2. Changes Summary

### A. Database & Schema
1. **Migration File**: `supabase/migrations/0009_forced_password_reset.sql`
   - Added column `must_reset_password boolean not null default true` to `profiles`.
   - Backfilled existing profiles so existing active users are not locked out.
   - Updated `handle_new_user()` trigger to automatically initialize `must_reset_password: true`.
   - Updated `guard_profile_self_update()` security definer trigger to protect `must_reset_password` from direct non-admin client mutation.
2. **Master Schema Synchronization**:
   - Updated `supabase/schema.sql` with column definition and trigger changes.
3. **Database Types**:
   - Updated `src/lib/database.types.ts` with `must_reset_password` across `Row`, `Insert`, and `Update` interfaces for `profiles`.

### B. Security & Interception Boundary
1. **Data Access Layer (`src/lib/auth/dal.ts`)**:
   - Updated `ProfileWithTenant` to include `must_reset_password: boolean`.
   - Updated `getProfile()` to select `must_reset_password`.
   - Added security check inside `requireRole()`: if `profile.must_reset_password === true`, immediately redirects to `/force-password-change`.
2. **Proxy / Middleware (`src/lib/supabase/proxy.ts` & `src/app/auth/callback/route.ts`)**:
   - Updated `ALLOWED_NEXT` allowlist to permit `/force-password-change`.
   - Updated session proxy configuration.
3. **Layout & Route Guards**:
   - `src/app/page.tsx`: If authenticated user has `must_reset_password === true`, routes to `/force-password-change`.
   - `src/app/inspector/layout.tsx`: Blocks access to the specialist portal and redirects to `/force-password-change` until completed.

### C. Server Actions & Account Provisioning
1. **Account Creation (`src/lib/actions/team.ts`)**:
   - `createTeamMember()` now explicitly sets `must_reset_password: true` when provisioning new accounts.
2. **Forced Reset Action (`src/lib/actions/auth.ts`)**:
   - Created `completeForcedPasswordChange(prevState, formData)`:
     - Verifies current temporary password against Supabase Auth.
     - Validates new password length ($\ge 8$ characters) and confirmation match.
     - Enforces that new password must differ from temporary password.
     - Updates password in Supabase Auth.
     - Sets `must_reset_password = false` on `profiles`.
     - Evicts other active sessions (`supabase.auth.signOut({ scope: 'others' })`).
     - Redirects user to `/` to seamlessly access their home dashboard.
   - Updated `updatePassword` to clear `must_reset_password = false` when resetting passwords.

### D. User Interface
1. **Reset Page (`src/app/force-password-change/page.tsx`)**:
   - Minimalist, distraction-free layout with header branding and sign-out button.
   - Guarded: if user already has `must_reset_password === false`, instantly forwards to their role dashboard.
2. **Reset Form Component (`src/components/ForcePasswordChangeForm.tsx`)**:
   - Client component with temporary password, new password, and confirmation inputs.
   - Error handling and loading states using `useActionState`.
3. **Admin Team Management (`src/app/admin/team/page.tsx` & `[id]/page.tsx`)**:
   - Added amber "Setup Pending" badge next to team members who have not yet completed their first-login password change.

---

## 3. Verification & Build
- `npx tsc --noEmit`: Completed with **0 errors**.
- `npm run build`: Production build and page generation completed successfully with dynamic route `/force-password-change` compiled cleanly.
