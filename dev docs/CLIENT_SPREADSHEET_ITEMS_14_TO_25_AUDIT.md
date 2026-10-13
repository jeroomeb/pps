# Client Spreadsheet Audit & Technical Roadmap (Items 14–25)

**Date:** October 13, 2026  
**Status:** Audit Completed / Implementation Blueprint Ready  
**Scope:** Client Spreadsheet Feedback Items 14 to 25

---

## 1. Executive Summary Table

| # | Feature / Context | Client Requirement | Current Status | Impacted Files |
|:---:|:---|:---|:---:|:---|
| **14** | **Provisional Tenant / Properties** | Isolate provisional tenant properties from HQ's count | ⚠️ **Partially Solved** (Needs HQ default isolation) | `src/app/admin/properties/page.tsx` |
| **15** | **Provisional Tenant / Team** | Isolate provisional tenant staff from HQ's count | ⚠️ **Partially Solved** (Filter added; needs default isolation) | `src/app/admin/team/page.tsx` |
| **16** | **Provisional Tenant / Team Add** | Auto-lock Assigned Organization to provisional tenant (hide/lock dropdown) | ❌ **Remaining** | `src/components/InspectorForm.tsx`, `src/app/admin/team/page.tsx` |
| **17** | **Property** | Add text search bar to easily locate properties | ❌ **Remaining** | `src/components/AddressFilterBar.tsx`, `src/app/admin/properties/page.tsx` |
| **18** | **Teams** | Add text search bar to easily locate team members | ❌ **Remaining** | `src/components/AddressFilterBar.tsx`, `src/app/admin/team/page.tsx` |
| **19** | **Property Profile** | Make "Required Inspection Days" optional with enable/disable toggle | ❌ **Remaining** | `src/components/PropertyForm.tsx` |
| **20** | **Staff Roster** | Assign multiple (unlimited) inspectors to a single property | ✅ **SOLVED / LIVE** | `src/components/PropertyRosterManager.tsx`, `src/lib/actions/property-assignments.ts` |
| **21** | **Overdue Notifications** | Disable "Overdue" status when checklist is set to 24/7 available | ❌ **Remaining** | `src/lib/schedule.ts`, `src/app/admin/inspections/page.tsx` |
| **22** | **HQ Dashboard Upcoming** | Hide provisional tenant upcoming inspections on HQ dashboard | ❌ **Remaining** | `src/app/admin/page.tsx` |
| **23** | **Reports** | Hide provisional tenant historical reports on HQ dashboard | ❌ **Remaining** | `src/app/admin/reports/page.tsx` |
| **24** | **Provisional Tenant Payout** | Disable the Payouts tab for provisional corporate tenants | ❌ **Remaining** | `src/lib/nav-items.ts`, `src/app/admin/payouts/page.tsx` |
| **25** | **Tenant Staff Profile** | Disable Driver's License photo ID upload for provisional tenant staff | ❌ **Remaining** | `src/app/inspector/profile/page.tsx`, `src/components/InspectorProfileForm.tsx` |

---

## 2. Detailed Technical Audit & Resolution Plan

### Item 14 & 15: Isolate Provisional Tenant Data from HQ Counts
- **Client Requirement:** When a provisional tenant creates properties or adds team members, those items should not inflate the primary HQ counts or crowd the default HQ views.
- **Current Root Cause:**
  - In `src/app/admin/properties/page.tsx` (line 39) and `src/app/admin/team/page.tsx` (line 46), filtering uses `if (scope.tenantId) query.eq('tenant_id', scope.tenantId)`.
  - When HQ admins are logged in without switching into a specific tenant, `scope.tenantId` is `null`, resulting in a query for all records across all tenants combined.
- **Resolution Plan:**
  - Default the HQ view to `query.is('tenant_id', null)` so the primary view displays only HQ-managed entities.
  - Maintain the Organization filter dropdown (`AddressFilterBar`) so HQ admins can deliberately view specific tenants or select "All Organizations" on demand.

---

### Item 16: Lock Organization Dropdown for Provisional Tenants
- **Client Requirement:** When a provisional tenant adds a team member, the "Assigned Organization / Tenant" field must automatically be locked to that tenant rather than showing a dropdown of all tenants in the system.
- **Current Root Cause:**
  - In `src/components/InspectorForm.tsx` (lines 44–62), the `<select>` of all tenants renders whenever `tenants` is provided, even if an admin is in tenant-specific view mode.
- **Resolution Plan:**
  - Pass `currentTenantId` and `currentTenantName` to `InspectorForm`.
  - If a tenant is active, replace the select element with a read-only badge and a hidden input `<input type="hidden" name="tenant_id" value={currentTenantId} />`.

---

### Items 17 & 18: Add Search Bars to Properties and Team Lists
- **Client Requirement:** Provide a text search input on both the Properties and Teams pages so users can quickly locate records as volume scales.
- **Current Root Cause:**
  - `AddressFilterBar.tsx` only offers location dropdowns (State, County, Zip, Organization). It lacks a freeform text input matching names, addresses, or human IDs.
- **Resolution Plan:**
  - Extend `AddressFilterBar` with an optional `searchPlaceholder` and `q?: string` parameter.
  - In `PropertiesPage`, add search filtering:
    ```typescript
    if (q) query = query.or(`name.ilike.%${q}%,address.ilike.%${q}%,human_id.ilike.%${q}%`)
    ```
  - In `TeamPage`, add search filtering:
    ```typescript
    if (q) query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,human_id.ilike.%${q}%`)
    ```

---

### Item 19: Optional "Required Inspection Days" Toggle on Property Form
- **Client Requirement:** Make "Required Inspection Days" an optional feature with an enable/disable toggle under property creation and editing.
- **Current Root Cause:**
  - In `src/components/PropertyForm.tsx` (lines 438–462), the 7 weekday checkboxes are always displayed unconditionally.
- **Resolution Plan:**
  - Add a toggle switch `Enable Required Inspection Schedule`.
  - When switched off, collapse the weekday checkboxes and submit an empty schedule array (`[]`) or `null`.

---

### Item 20: Staff Roster — Unlimited Specialist Assignments
- **Client Requirement:** Provide the ability to assign multiple (unlimited) inspectors to a single property.
- **Current Status:** ✅ **Already Completed & Functional**
- **Verification:**
  - `src/components/PropertyRosterManager.tsx` provides multi-specialist assignments with role tags (`Primary`, `Backup`, `Staff`).
  - The database table `property_specialist_assignments` permits unlimited assignments per property.

---

### Item 21: Suppress Overdue Notification on 24/7 Checklists
- **Client Requirement:** If a checklist is configured as "Available 24/7", overdue alerts should be disabled.
- **Current Root Cause:**
  - In `src/lib/schedule.ts`, `dueLabel()` computes overdue purely by checking if `scheduled_for < now`, without checking `property.checklist_always_available`.
- **Resolution Plan:**
  - Pass `isAlwaysAvailable?: boolean` into `dueLabel()` or inspect the property flag before rendering.
  - When true, suppress the red `overdue` badge and label the item as `"24/7 Standing"` or standard status.

---

### Items 22 & 23: Hide Provisional Tenant Data on HQ Dashboard and Reports
- **Client Requirement:** Upcoming inspections and historical reports from provisional tenants should not appear on the main HQ dashboard.
- **Current Root Cause:**
  - `src/app/admin/page.tsx` (lines 40–43) and `src/app/admin/reports/page.tsx` (line 25) query all inspections when `scope.tenantId === null`.
- **Resolution Plan:**
  - When HQ is logged in (`!scope.tenantId`), scope the queries to `query.is('tenant_id', null)`.
  - Ensure provisional tenant activity is only shown when HQ explicitly switches into that tenant's dashboard via the Tenant View mode.

---

### Item 24: Disable Payouts Tab for Provisional Tenants
- **Client Requirement:** The Payouts navigation tab should be disabled for provisional corporate tenants.
- **Current Root Cause:**
  - In `src/lib/nav-items.ts` (lines 32 & 86), `ADMIN_NAV_ITEMS` unconditionally displays `{ href: '/admin/payouts', label: 'Payouts' }`.
- **Resolution Plan:**
  - Update `getNavItems()` to only include `/admin/payouts` if `isGlobalAdmin === true` (or if the tenant has explicitly been granted payout permissions).
  - Add a redirect guard in `src/app/admin/payouts/page.tsx` blocking access for non-global tenant admins.

---

### Item 25: Disable Driver's License ID Upload for Provisional Tenant Staff
- **Client Requirement:** Photo ID front/back upload should be disabled for provisional tenant staff, applying only to HQ 1099 specialists.
- **Current Root Cause:**
  - In `src/app/inspector/profile/page.tsx` and `src/components/InspectorProfileForm.tsx`, the ID upload section is rendered for all specialists.
- **Resolution Plan:**
  - In `InspectorProfilePage`, check `profile.tenant_id`. If assigned to a tenant, pass `allowIdUpload = false` to `InspectorProfileForm`.
  - When `allowIdUpload` is false, hide the Driver's License upload card entirely.
