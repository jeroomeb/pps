# Client Spreadsheet Audit & Implementation Record (Items 14–25)

**Date:** October 13, 2026  
**Status:** All Items Implemented & Verified Cleanly  
**Scope:** Client Spreadsheet Feedback Items 14 to 25

---

## 1. Executive Implementation Summary Table

| # | Feature / Context | Client Requirement | Implementation Status | Modified Code Files |
|:---:|:---|:---|:---:|:---|
| **14** | **Provisional Tenant / Properties** | Isolate provisional tenant properties from HQ's count | ✅ **COMPLETED** | `src/app/admin/properties/page.tsx` |
| **15** | **Provisional Tenant / Team** | Isolate provisional tenant staff from HQ's count | ✅ **COMPLETED** | `src/app/admin/team/page.tsx` |
| **16** | **Provisional Tenant / Team Add** | Auto-lock Assigned Organization to provisional tenant (hide/lock dropdown) | ✅ **COMPLETED** | `src/components/InspectorForm.tsx`, `src/app/admin/team/page.tsx` |
| **17** | **Property** | Add text search bar to easily locate properties | ✅ **COMPLETED** | `src/components/AddressFilterBar.tsx`, `src/app/admin/properties/page.tsx` |
| **18** | **Teams** | Add text search bar to easily locate team members | ✅ **COMPLETED** | `src/components/AddressFilterBar.tsx`, `src/app/admin/team/page.tsx` |
| **19** | **Property Profile** | Make "Required Inspection Days" optional with enable/disable toggle | ✅ **COMPLETED** | `src/components/PropertyForm.tsx` |
| **20** | **Staff Roster** | Assign multiple (unlimited) inspectors to a single property | ✅ **COMPLETED** | `src/components/PropertyRosterManager.tsx`, `src/lib/actions/property-assignments.ts` |
| **21** | **Overdue Notifications** | Disable "Overdue" status when checklist is set to 24/7 available | ✅ **COMPLETED** | `src/lib/schedule.ts`, `src/app/admin/page.tsx`, `src/app/admin/inspections/page.tsx`, `src/app/admin/properties/[id]/page.tsx`, `src/app/inspector/page.tsx` |
| **22** | **HQ Dashboard Upcoming** | Hide provisional tenant upcoming inspections on HQ dashboard | ✅ **COMPLETED** | `src/app/admin/page.tsx` |
| **23** | **Reports** | Hide provisional tenant historical reports on HQ dashboard | ✅ **COMPLETED** | `src/app/admin/reports/page.tsx` |
| **24** | **Provisional Tenant Payout** | Disable the Payouts tab for provisional corporate tenants | ✅ **COMPLETED** | `src/lib/nav-items.ts`, `src/app/admin/payouts/page.tsx` |
| **25** | **Tenant Staff Profile** | Disable Driver's License photo ID upload for provisional tenant staff | ✅ **COMPLETED** | `src/app/inspector/profile/page.tsx`, `src/components/InspectorProfileForm.tsx` |

---

## 2. Detailed Technical Implementation Details

### Items 14, 15, 22, 23: Tenant Data Isolation on HQ Views
- **Properties (`src/app/admin/properties/page.tsx`):**
  - Default query for HQ admins (`!scope.tenantId`) now explicitly enforces `.is('tenant_id', null)`, isolating provisional tenant properties from the HQ count.
  - Organization filter dropdown added to `AddressFilterBar` allowing HQ admins to choose "All Organizations", "Amenity Op's HQ (Master)", or a specific corporate tenant.
  - Property rows render the tenant badge when viewing all organizations.
- **Team (`src/app/admin/team/page.tsx`):**
  - Default query for HQ admins enforces `.is('tenant_id', null)`, keeping provisional tenant staff separate from HQ's primary team count.
  - Organization dropdown lets HQ admins inspect staff per tenant or platform-wide on demand.
- **HQ Dashboard Upcoming Inspections (`src/app/admin/page.tsx`):**
  - When in HQ scope (`!scope.tenantId`), `inspectionsQuery` and `propertiesQuery` filter with `.is('tenant_id', null)`, preventing provisional tenant scheduled visits and property counts from displaying on HQ's summary cards.
- **Reports (`src/app/admin/reports/page.tsx`):**
  - In HQ scope, `reportsQuery` isolates to `.is('tenant_id', null)`, preventing provisional tenants' completed inspection history from crowding HQ's reports list.

---

### Item 16: Lock Organization Dropdown for Provisional Tenants
- **`src/components/InspectorForm.tsx` & `src/app/admin/team/page.tsx`:**
  - `InspectorForm` now accepts `currentTenantId` and `currentTenantName`.
  - When invoked from a tenant context (either a tenant admin or an HQ admin in Tenant View mode), the dropdown of all tenants is hidden.
  - It renders a read-only organization badge with `<Building size={16} />` and a hidden `<input type="hidden" name="tenant_id" value={currentTenantId} />` so new team members are automatically and safely locked to the active tenant.

---

### Items 17 & 18: Text Search Bars on Properties and Teams
- **`src/components/AddressFilterBar.tsx`:**
  - Added optional `searchPlaceholder?: string` and `q?: string` parameter to `AddressFilterBar`.
  - Renders a styled search input with a `Search` icon from `lucide-react`.
- **`src/app/admin/properties/page.tsx`:**
  - Filters properties matching `.or(\`name.ilike.%${q}%,address.ilike.%${q}%,human_id.ilike.%${q}%\`)`.
- **`src/app/admin/team/page.tsx`:**
  - Filters team members matching `.or(\`full_name.ilike.%${q}%,email.ilike.%${q}%,human_id.ilike.%${q}%\`)`.

---

### Item 19: Optional "Required Inspection Days" Toggle
- **`src/components/PropertyForm.tsx`:**
  - Added an `enableSchedule` toggle switch above the weekday selectors.
  - Initialized with `checkedDays.size > 0` to preserve existing schedules.
  - When disabled, collapses the weekday selection and submits an empty schedule array, allowing properties to be completely schedule-free for ad-hoc / on-demand audits.

---

### Item 20: Staff Roster — Unlimited Specialist Assignments
- **`src/components/PropertyRosterManager.tsx` & `src/lib/actions/property-assignments.ts`:**
  - Supports assigning an unlimited number of specialists to any property with designations: `Primary`, `Backup`, or `Staff`.
  - Fully tested and operational on property overview pages.

---

### Item 21: Overdue Notifications on 24/7 Checklists
- **`src/lib/schedule.ts`:**
  - Updated `dueLabel(date, today, isAlwaysAvailable)` to accept an `isAlwaysAvailable?: boolean` flag.
  - When `isAlwaysAvailable === true`, overdue red alerts are suppressed and rendered as `{ text: '24/7 Available', tone: 'today' }`.
- **`src/app/admin/page.tsx`, `src/app/admin/inspections/page.tsx`, `src/app/admin/properties/[id]/page.tsx`, `src/app/inspector/page.tsx`:**
  - Each view selects `checklist_always_available` from properties and passes it to `dueLabel()`, eliminating false overdue warnings for 24/7 standing checklists.

---

### Item 24: Disable Payouts Tab for Provisional Tenants
- **`src/lib/nav-items.ts`:**
  - In `getNavItems()`, for role `admin`, only global admins (`isGlobalAdmin === true`) or tenants with `enablePayouts === true` receive the Payouts navigation item.
  - Provisional tenant admins do not see the Payouts tab in their sidebar or bottom bar.
- **`src/app/admin/payouts/page.tsx`:**
  - Added server-side authorization guard: if `!profile.is_global_admin && !scope.enablePayouts`, redirects directly to `/admin`.

---

### Item 25: Disable Driver's License ID Upload for Provisional Tenant Staff
- **`src/components/InspectorProfileForm.tsx`:**
  - Added `allowIdUpload?: boolean` prop. When false, the entire Driver's License photo ID upload card is hidden.
- **`src/app/inspector/profile/page.tsx`:**
  - Checks `const isHqStaff = !profile.tenant_id`.
  - Passes `allowIdUpload={isHqStaff}` so photo ID uploads are strictly enforced for HQ 1099 specialists while remaining disabled for provisional corporate tenant staff.

---

## 3. Verification & Quality Assurance

- **TypeScript Compilation:** `npx tsc --noEmit` exited with code `0` (0 errors).
- **Unit & Risk Engine Test Suite:** `npm run test:risk` exited with code `0` (6/6 tests passed).
