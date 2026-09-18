# Task 3: Property-Centric Staff Assignment & Scheduling Logic — Development Record

This document records the completed engineering implementation for **Task 3**, including the multi-inspector assignment architecture and the client-requested feature flags (Photo ID verification toggle & multi-staff property rosters).

---

## 1. Architectural Highlights

### A. Property-Specialist Multi-Staff Roster
- **Junction Entity**: `property_specialist_assignments` table with unique constraint on `(property_id, specialist_id)`.
- **Roster Roles**: Specialists can be designated as `primary`, `backup`, or on-site `staff`.
- **Dynamic Prioritization**: When assigning inspections on `/admin/inspections/new`, `/admin/properties/[id]`, or `/admin/inspections/[id]/edit`, specialists assigned to that property's roster are weighted and prioritized at the top of the selection list with distinct indicator badges (`[Property PRIMARY]`, `[Property BACKUP]`, `[Property STAFF]`).
- **Proximity Fallback**: Geographic ranking (ZIP -> County -> State) remains fully active as a secondary sort tier for all available specialists.

### B. Client Feature: Photo ID Verification Toggle
- Added `require_id_photo` (`boolean default true`) to `properties` and `tenants`.
- **Business Purpose**: Allows client admins to enforce Driver's License front/back photo submission for 1099 independent contractors while exempting vetted W-2 maintenance / facilities staff on enterprise properties.
- **Form Controls**: Added toggles on `PropertyForm` (create/edit) and an instant one-tap toggle card inside `PropertyRosterManager` on the property overview screen.
- **Inspector Feedback**: `/inspector/profile` dynamically inspects the specialist's assigned properties to inform them whether ID submission is "Mandatory for assigned properties" or "Optional (Exempt by Property)".

---

## 2. Changes Summary

### 1. Database & Migrations
- **Created Migration `supabase/migrations/0008_property_staff_assignment.sql`**:
  - `property_specialist_assignments` table with FKs to `tenants`, `properties`, and `profiles`.
  - Added `require_id_photo` to `tenants` and `properties`.
  - Configured strict RLS policies (`prop_assign_select`, `prop_assign_admin_write`) preventing cross-tenant leakage.
  - Updated `properties_select_all` RLS policy to allow specialists to view properties they are assigned to via the roster junction table, even before an inspection is scheduled.
- **Updated `supabase/schema.sql`**: Full sync of the master schema with migration 0008.
- **Updated `src/lib/database.types.ts`**: Generated types for `SpecialistAssignmentRole`, `property_specialist_assignments`, and updated `properties` / `tenants` columns.

### 2. Server Actions & Business Logic
- **Created `src/lib/actions/property-assignments.ts`**:
  - `assignSpecialistToProperty`: Validates specialist status (`neq('status', 'inactive')`), tenant boundaries, and assigns roster roles with an upsert.
  - `removeSpecialistFromProperty`: Cleans up property assignments safely.
  - `updateSpecialistRosterRole`: Promotes/demotes between `primary`, `backup`, and `staff`.
  - `togglePropertyIdRequirement`: Instant toggle for Driver's License requirement.
- **Updated `src/lib/actions/properties.ts`**:
  - Added `require_id_photo` schema parsing in `createProperty` and `updateProperty`.

### 3. Frontend & UI Components
- **Created `src/components/PropertyRosterManager.tsx`**:
  - Interactive staff roster card on `/admin/properties/[id]`.
  - Shows assigned specialists, human-readable IDs, email/phone, contact status, and contractor pool badges.
  - Live role dropdown selector (`Primary`, `Backup`, `Staff`).
  - Delete/Remove action with confirmation.
  - Photo ID verification toggle switch with live optimistic feedback and server sync.
- **Updated `src/components/SpecialistSelect.tsx`**:
  - Supports `rosterRole?: 'primary' | 'backup' | 'staff' | null`.
  - Sorts property roster members above standard proximity matches, appending custom roster labels.
- **Updated `src/components/NewInspectionForm.tsx`**:
  - Accepts `rosterMap` to dynamically prioritize roster specialists when switching between properties.
- **Updated `src/components/PropertyForm.tsx`**:
  - Added Photo ID Verification Toggle card with descriptive copy.
- **Updated `src/app/admin/properties/[id]/page.tsx`**:
  - Integrated `PropertyRosterManager`.
  - Displayed Photo ID status badge in the property header.
  - Passed roster-enhanced inspector list to `NewInspectionForm`.
- **Updated `src/app/admin/properties/[id]/edit/page.tsx`**:
  - Populates `require_id_photo` default values.
- **Updated `src/app/admin/inspections/new/page.tsx` & `[id]/edit/page.tsx`**:
  - Connected `property_specialist_assignments` map to pre-rank roster specialists.
- **Updated `src/app/inspector/profile/page.tsx` & `InspectorProfileForm.tsx`**:
  - Checks if any assigned properties require photo ID verification and displays clear status banners ("Mandatory for assigned properties" vs "Optional (Exempt by Property)").

---

## 3. Verification & Quality Assurance
- **TypeScript Check**: `npx tsc --noEmit` passed with 0 errors.
- **Production Build**: `npm run build` completed successfully (all 21 static and dynamic routes compiled without issue).
- **Linter**: `ReadLints` clean across all modified and created files.

---

## 4. Supabase Migration Action Required
To apply these changes to the Supabase database:
Run the script in `supabase/migrations/0008_property_staff_assignment.sql` in the **Supabase SQL Editor**. It is fully idempotent and safe to execute.
