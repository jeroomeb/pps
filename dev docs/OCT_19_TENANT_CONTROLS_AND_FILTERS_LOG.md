# Engineering Change Log: Provisional Tenant Controls & Geographic Filtering

**Date:** October 19, 2026  
**Project:** Amenity Ops (`amenityops`)  
**Status:** Implemented, Tested & Verified Clean Production Build (`npm run build` exited with code 0)

---

## 1. Overview of Client Requirements Implemented

This update addresses the 4 specific operational refinements requested by Jerome (Platform Owner / Super Admin):

1. **Predictive Score Toggle Permission Gating (Super Admin Only):**
   - Restricted the per-property `enable_predictive_scoring` toggle so only Platform Owner / Super Admin can enable or disable predictive modeling.
   - Added tenant-level `enable_predictive_scoring` setting to `public.tenants` so Super Admin can control predictive modeling platform-wide per tenant organization.
   - Non-super admins viewing property forms see a read-only badge indicating it is managed by Super Admin.
   - Server-side mutations in `properties.ts` enforce that non-super admins cannot alter the predictive scoring flag.
   - The nightly scoring cron job (`risk-score-job.ts`) respects both the property-level and tenant-level toggle.

2. **Strict Tenant Isolation in Properties & Team Filters:**
   - Isolated the organization filter dropdown to HQ master view only (`isHQ = profile.is_global_admin && !scope.isViewingTenant && !scope.tenantId`).
   - When viewing under a provisional tenant (including Super Admin's "Open Dashboard as Tenant" session), the organization dropdown is completely omitted.
   - Properties queries, location dataset queries, and team profile queries strictly enforce `tenant_id` scoping to prevent any cross-tenant data leakage.

3. **Checklist Management Permission Switch for Provisional Tenants:**
   - Added `allow_checklist_management boolean not null default false` to `public.tenants`.
   - In `CreateTenantForm.tsx` and `TenantLicenseCard.tsx`, Super Admin can toggle *"Allow Checklist Management"* per tenant.
   - By default, all provisional tenants are strictly locked to Read-Only mode with a *"Managed by Super Admin (Read-Only)"* badge.
   - If enabled by Super Admin for a specific tenant:
     - Tenant admins can create new checklists (`/admin/checklists/new`).
     - Tenant admins can clone checklists (`CloneChecklistButton`).
     - Tenant admins can rename, add items, reorder items, and delete checklists.
     - Checklists created or cloned by a tenant admin are automatically granted to that tenant's checklist access table (`tenant_checklist_access`).
   - Server-side mutations in `src/lib/actions/checklists.ts` are guarded by `requireChecklistManagementPermission()`.

4. **Dedicated State Filter under Teams (Located Prior to County Filter):**
   - Added `src/lib/constants/states.ts` defining standard US states.
   - In `src/app/admin/team/page.tsx`, ensured the State filter is populated from member states or standard states fallback, ensuring the dropdown is always rendered.
   - In `AddressFilterBar.tsx`, the layout order is strictly:
     1. Search input
     2. "Filter" badge
     3. Organization dropdown (HQ only)
     4. **State dropdown** (`name="state"`)
     5. **County dropdown** (`name="county"`)
     6. **ZIP dropdown** (`name="zip"`, if applicable)
     7. Apply & Clear buttons

---

## 2. Byte-by-Byte File Modifications

### Database & Migrations
* `supabase/migrations/0019_provisional_tenant_controls_and_filters.sql`
  - Idempotent migration adding `allow_checklist_management` (default `false`) and `enable_predictive_scoring` (default `true`) to `public.tenants`.
* `src/lib/database.types.ts`
  - Updated `tenants` Row, Insert, and Update types with `allow_checklist_management` and `enable_predictive_scoring`.

### Authentication & Authorization
* `src/lib/auth/checklist-permissions.ts` (New)
  - Created `canManageChecklists()` and `requireChecklistManagementPermission()` to securely verify whether a user is Super Admin or belongs to an authorized provisional tenant.

### Tenant Management & Administration
* `src/lib/actions/tenants.ts`
  - Updated `tenantSchema` and `updateLicenseSchema` to validate and persist `allow_checklist_management` and `enable_predictive_scoring`.
* `src/components/CreateTenantForm.tsx`
  - Added Super Admin feature control checkboxes for `allow_checklist_management` and `enable_predictive_scoring`.
* `src/components/TenantLicenseCard.tsx`
  - Displayed permission status badges in view mode (*"Checklists: Full Access"* vs *"Checklists: HQ Managed"* and *"Scoring: On"* vs *"Scoring: Off"*).
  - Added Super Admin Feature Controls in edit mode.
* `src/app/admin/tenants/page.tsx`
  - Selected and passed `allow_checklist_management` and `enable_predictive_scoring` to `tenantItems`.

### Properties & Nightly Scoring
* `src/components/PropertyForm.tsx`
  - Added `isSuperAdmin?: boolean` prop.
  - Rendered editable checkbox only for Super Admin; rendered clean read-only badge for non-super admins.
* `src/app/admin/properties/new/page.tsx` & `src/app/admin/properties/[id]/edit/page.tsx`
  - Passed `isSuperAdmin={profile.is_global_admin && !scope.isViewingTenant}` to `PropertyForm`.
* `src/lib/actions/properties.ts`
  - Guarded `enable_predictive_scoring` so non-super-admins cannot alter the predictive modeling flag on properties.
* `src/lib/risk-score-job.ts`
  - Query now checks both property-level and tenant-level `enable_predictive_scoring` before running calculations.
* `src/app/admin/properties/page.tsx`
  - Isolated `organizations` filter to `isHQ` only.
  - Enforced strict tenant isolation on properties query and location data queries.

### Team Members & Geographic Filters
* `src/lib/constants/states.ts` (New)
  - Defined standard US states list for quick geographic scanning and filtering.
* `src/app/admin/team/page.tsx`
  - Isolated `organizations` filter to `isHQ` only.
  - Scoped `allMembers` location query to the active tenant.
  - Provided `teamStates` so the State filter is always rendered directly before County filter.

### Checklists & Access Controls
* `src/lib/actions/checklists.ts`
  - Gated mutations with `requireChecklistManagementPermission()`.
  - Added auto-enrollment in `tenant_checklist_access` for checklists created or cloned by authorized provisional tenants.
* `src/app/admin/checklists/page.tsx`
  - Gated New Checklist and Clone buttons using `canManageChecklists()`.
* `src/app/admin/checklists/[id]/page.tsx`
  - Gated editing controls, clone button, rename form, delete button, and item reordering with `canManageChecklists()`.
  - Kept checklist predictive scoring toggle strictly Super Admin only (`isSuperAdmin`).
* `src/app/admin/checklists/new/page.tsx` & `src/components/ChecklistTemplateForm.tsx`
  - Gated access with `requireChecklistManagementPermission()` and passed `isSuperAdmin` to `ChecklistTemplateForm`.

---

## 3. QA & Verification Results

1. **Automated Risk Scoring Unit Tests:**
   - Command: `npm run test:risk`
   - Result: 8/8 tests passed (100% assertions satisfied).
2. **Production Compilation:**
   - Command: `npm run build`
   - Result: Turbopack production compilation completed with zero TypeScript errors, zero route errors, and exit code 0.
