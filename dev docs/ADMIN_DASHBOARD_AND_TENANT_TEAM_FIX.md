# Admin Dashboard Viewing & Multi-Tenant Team Resolution

**Date:** October 12, 2026  
**Author:** Engineering Team  
**Status:** Implemented & Verified (Committed Locally)

---

## 1. Executive Summary & Context

A review was conducted with the client regarding user roles and administrative dashboards. The client reported two critical usability discrepancies:

1. **Issue 1 (HQ Admin Dashboard Routing):**  
   When a user was added as an administrator under *Amenity Op's HQ (Master/Global)*, the Team list correctly identified them as an "Admin". However, clicking "View Dashboard" or the action link opened the Operations Continuity Specialist (OCS) inspector panel (`/inspector`) instead of the administrative dashboard (`/admin`).

2. **Issue 2 (Provisional Corporate Tenant Admin in Team List):**  
   When a provisional corporate tenant account was provisioned, the admin appeared in the HQ team list without clear tenant distinction, and clicking "View Dashboard" also routed to the specialist portal rather than the tenant's administrative dashboard.

3. **Roadmap Alignment (Excel List Status):**  
   The client also requested an update regarding the roadmap milestones from the provided Excel specifications (Parent-Child Multi-Tenancy, Property Assignment Checklists, Forced First-Time Password Reset, Geofencing, Chatbot Assistant, and Predictive Risk Scoring Engine).

---

## 2. Root Cause Analysis

### A. Hardcoded Specialist Impersonation in Route Handler
- In `src/app/admin/impersonate/[id]/route.ts`, the endpoint unconditionally set the `amenity_impersonate_id` cookie and issued a `307 Redirect` to `/inspector`.
- Because the route did not inspect the target profile's `role`, administrators were subjected to inspector session cookies.

### B. Specialist Impersonation Leak in Auth DAL
- In `src/lib/auth/dal.ts`, `getImpersonatedSpecialist` did not validate whether the fetched user was an actual inspector (`role === 'inspector'`). If an admin ID was stored in the cookie, it returned that admin profile, leading the specialist layout (`/inspector/layout.tsx`) and `AppShell` to display "Operations Continuity Specialist".

### C. Missing Role-Aware Navigation in Team Profile Page
- In `src/app/admin/team/[id]/page.tsx`, the action button header had a hardcoded label `"Open Specialist Panel"` linking to `/admin/impersonate/${member.id}` regardless of whether the profile was an Admin or a Specialist.

### D. Lack of Organization Badges and Filter in Team View
- In `src/app/admin/team/page.tsx`, HQ Global administrators viewed all accounts across the entire platform. Without organization badges and tenant filtering, corporate tenant administrators and global HQ administrators were grouped together with identical labels, causing ambiguity.

### E. HQ Global Admin Flag Assignment
- In `src/lib/actions/team.ts`, `createTeamMember` set `patch.role = 'admin'`, but did not explicitly set `patch.is_global_admin = true` when `targetTenantId` was null/empty.

---

## 3. Engineering Fixes & Architecture

### 1. Role-Aware Dashboard & Impersonation Routing (`src/app/admin/impersonate/[id]/route.ts`)
The impersonation route now queries the target profile before taking action:
- **If the target user is an Administrator (`role === 'admin'`):**
  - Clears `amenity_impersonate_id` to prevent session bleeding.
  - If the target belongs to a corporate tenant (`tenant_id`) and the caller is an HQ Global Admin, it sets the `TENANT_VIEW_COOKIE` (`amenity_view_tenant_id`) to that tenant's ID and redirects to `/admin`. This switches the active view into that tenant's corporate administrative dashboard.
  - If the target is an HQ Administrator or belongs to the current scope, it removes any tenant view cookie and redirects to `/admin`.
- **If the target user is a Specialist (`role === 'inspector'`):**
  - Clears `TENANT_VIEW_COOKIE`.
  - Sets `amenity_impersonate_id` to the specialist's ID.
  - Redirects to `/inspector`.

### 2. Guarding Impersonated Specialist Resolution (`src/lib/auth/dal.ts`)
Updated `getImpersonatedSpecialist`:
```typescript
if (!targetProfile || targetProfile.role !== 'inspector') return null
```
Ensures administrative accounts are never evaluated as specialist impersonations.

### 3. Clear Organization Badges & Filters (`src/app/admin/team/page.tsx`)
- Updated the profiles query to fetch `tenant_id, tenants(id, name)`.
- Added visual organization badges:
  - Corporate Tenant: `<Building size={11} /> {tenantName}` (styled with primary container token).
  - HQ Global: `<ShieldCheck size={11} /> Amenity Op's HQ` (styled with secondary container token).
- Updated role titles:
  - `HQ Administrator` for master/global staff.
  - `{TenantName} Administrator` for corporate tenant staff.
  - `Operations Continuity Specialist` for field specialists.
- Added Organization filtering to `AddressFilterBar`:
  - When viewed by HQ Global Admins, a dropdown selector provides filtering by "All Organizations", "Amenity Op's HQ (Master)", or individual corporate tenants.

### 4. Dynamic Action Button on Member Profile (`src/app/admin/team/[id]/page.tsx`)
- Evaluates `member.role`:
  - For Administrators: Displays `"Open {TenantName} Dashboard"` or `"Open HQ Dashboard"`.
  - For Specialists: Displays `"Open Specialist Panel"`.
- Displays tenant association badges in the profile header subtitle.

### 5. Automated Global Admin Flagging (`src/lib/actions/team.ts`)
- In `createTeamMember`, when an administrator is created without a `targetTenantId`, `patch.is_global_admin = true` is set automatically.

---

## 4. Verification & Validation

1. **TypeScript Typecheck:**
   - Command: `npx tsc --noEmit`
   - Result: 0 errors. All imports, types, and JSX structures validated.

2. **Predictive Risk Scoring & Engine Tests:**
   - Command: `npm run test:risk`
   - Result: 6/6 test suites passed with 0 failures:
     - `no score when history spans fewer than 30 days`
     - `Thursday waste failures flag appearance on Thursday and not on Monday`
     - `one life-safety failure outranks many appearance failures`
     - `rain raises asset protection and leaves life-safety unchanged`
     - `the score stays inside 1 to 100`
     - `a single failing area is not padded with empty flags`

---

## 5. Summary of Modified Files

- `src/app/admin/impersonate/[id]/route.ts` — Role-aware routing between tenant admin dashboard, HQ admin dashboard, and specialist portal.
- `src/lib/auth/dal.ts` — Security guard preventing admin accounts from resolving as specialist impersonations.
- `src/components/AddressFilterBar.tsx` — Added tenant/organization dropdown filtering support.
- `src/app/admin/team/page.tsx` — Tenant query filtering, organization badges, distinct role labeling, and JSX structure.
- `src/app/admin/team/[id]/page.tsx` — Role-aware view dashboard button and tenant metadata header.
- `src/lib/actions/team.ts` — Auto-assigns `is_global_admin = true` for HQ admins.
