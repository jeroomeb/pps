# Client Feedback Resolution: Dashboard & Reports Platform-Wide Restoral & Organization Filtering

**Date:** October 14, 2026  
**Status:** Completed & Tested Locally (Production Ready)  
**Reference:** Client Feedback on Spreadsheet Items & Multi-Tenant Views

---

## 1. Context & Client Request

Following the initial delivery of the Multi-Tenant Isolation features, the client provided the following feedback:

> *"The dashboard put back as it was and for the dashboard upcoming inspections sections and reports tab can we put it back but simply add a filter/search as you did on the other tabs? (That’s a great feature). The summaries were great and provided an overall status of things and I should have been more conscious of that. My deepest apologies for this.*
> 
> *But the dropdown feature to filter by ‘All Organizations’ or ‘Specific Organizations’ that’s a HUGE GAME CHANGER!!! Love that feature.*
> 
> *Thanks you,"*

The client appreciated the dropdown filter bar introduced on other tabs (e.g. Properties, Team), but wanted the default view on the **Dashboard** and **Reports** tabs restored so that by default, Global HQ Admins see the overall, platform-wide summaries and lists across all organizations, with the option to filter down to a specific organization or HQ using the dropdown.

---

## 2. Point 1: Admin Dashboard Restoral & Organization Filter

### Objectives
1. **Default Platform Overview:** When visiting `/admin`, display total properties, pending inspections, in-progress inspections, upcoming inspections, and active now inspections across **all organizations** by default.
2. **Organization Filter Bar:** Add the `AddressFilterBar` component directly under the page header with the Organization dropdown (`defaultTenant="all"`).
3. **Filtering Capabilities:**
   - **All Organizations (Default):** Platform-wide totals and feeds.
   - **Amenity Op's HQ (Master):** Only Master HQ records (`tenant_id IS NULL`).
   - **Specific Organization:** Only records belonging to the selected tenant (`tenant_id = <tenant_id>`).
4. **Visual Organization Context:** When viewing "All Organizations", each item in **Upcoming Inspections** and **Active Now** displays an organization badge (e.g. `[Building Icon] Tenant Name` or `[Shield Icon] HQ`), giving instant clarity into which organization each inspection belongs to.
5. **Contextual Navigation:** Dashboard stat cards dynamically carry the active organization filter forward when navigating to the Properties and Inspections tabs.

### Files Modified
- [`src/app/admin/page.tsx`](file:///d:/Nextjs%20Projects/amenityops/src/app/admin/page.tsx)
- [`src/components/AddressFilterBar.tsx`](file:///d:/Nextjs%20Projects/amenityops/src/components/AddressFilterBar.tsx)

---

## 3. Point 2: Reports Tab Restoral & Organization Filter + Search

### Objectives
1. **Default Platform Overview:** When visiting `/admin/reports`, display all completed inspection reports across **all organizations** by default.
2. **Integrated Search & Organization Filter:** Render `AddressFilterBar` with:
   - **Search Input:** Search across property name, property human ID, checklist template name, specialist name, and organization name.
   - **Organization Dropdown:** Filter by "All Organizations" (default), "Amenity Op's HQ (Master)", or specific tenant organizations.
3. **Visual Organization Badges:** In the "All Organizations" view, completed report cards display an organization badge alongside property names (`[Building Icon] Tenant Name` or `[Shield Icon] HQ`).
4. **Empty State Experience:** Clean empty states distinguishing between a platform with no completed reports and an active filter with no matching results.

### Files Modified
- [`src/app/admin/reports/page.tsx`](file:///d:/Nextjs%20Projects/amenityops/src/app/admin/reports/page.tsx)
- [`src/components/AddressFilterBar.tsx`](file:///d:/Nextjs%20Projects/amenityops/src/components/AddressFilterBar.tsx)

---

## 4. Architectural Implementation Details

### A. Flexible `AddressFilterBar` (`src/components/AddressFilterBar.tsx`)
- Made `states` and `counties` optional arrays (defaulting to `[]`), allowing pages like the Dashboard and Reports to render only the search bar and/or organization dropdown without dummy location parameters.
- Added a `defaultTenant` prop (defaulting to `'hq'`, but configurable to `'all'`).
- Adjusted the `hasAny` active-filter check so that when `defaultTenant="all"`, the "Clear" button only displays when a specific filter is applied (e.g. searching or filtering to a single tenant), and clicking "Clear" cleanly resets back to the platform-wide view.

### B. Dashboard Server Component (`src/app/admin/page.tsx`)
- Accepts `searchParams: Promise<{ tenant?: string }>`.
- Evaluates `getAdminScope()` and `getProfile()`:
  - If a user is a Tenant Admin or currently viewing a specific tenant via a tenant-view cookie (`scope.tenantId`), strictly confines queries to `tenant_id = scope.tenantId`.
  - If in HQ Master mode (`!scope.tenantId`):
    - `tenant === 'hq'` -> filters `.is('tenant_id', null)`
    - `tenant && tenant !== 'all'` -> filters `.eq('tenant_id', tenant)`
    - Default (`!tenant` or `tenant === 'all'`) -> **no tenant filter applied**, fetching all platform records simultaneously.

### C. Reports Server Component (`src/app/admin/reports/page.tsx`)
- Accepts `searchParams: Promise<{ q?: string; tenant?: string }>`.
- Queries completed inspections and joins `properties`, `checklist_templates`, `profiles`, and `tenants`.
- Applies the exact same tenant-scoping rule (defaulting to all organizations for Global HQ admins).
- Executes robust case-insensitive search across joined property names, IDs, checklist templates, specialist names, and tenant names.

---

## 5. Verification & Validation

| Test / Check | Tool / Command | Result |
| :--- | :--- | :--- |
| TypeScript Typecheck | `npx tsc --noEmit` | **Exit code 0 (Pass)** |
| Risk Engine Regression Suite | `npm run test:risk` | **6 / 6 tests passing** |
| Git Status & Tree Integrity | `git status` | Clean working tree with exact file edits |

---

## 6. How the Client Can Test

1. **Test Dashboard (`/admin`):**
   - Navigate to `/admin`.
   - Observe the Total Properties, Pending, and In Progress counters: they reflect all properties and inspections across the platform.
   - Look at the Organization dropdown at the top: it defaults to **"All Organizations"**.
   - Review the **Upcoming Inspections** and **Active Now** lists: each inspection has a pill badge indicating either its tenant name or `HQ`.
   - Select a specific organization from the dropdown and click **Apply**: the stats, upcoming inspections, and active now lists update to that organization only.
   - Click **Clear** to return to the overall dashboard.

2. **Test Reports (`/admin/reports`):**
   - Navigate to `/admin/reports`.
   - Observe the completed reports feed: all completed inspections across all organizations are displayed by default.
   - Use the **Search bar** to type a property name, inspection ID, checklist name, or specialist name.
   - Use the **Organization dropdown** to isolate reports to a specific organization or Master HQ.
   - Click **Clear** to reset the filters.
