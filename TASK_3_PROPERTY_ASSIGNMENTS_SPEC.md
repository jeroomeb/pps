# Task 3 Planning & Development Specification: Property-Centric Staff Assignment & Scheduling Logic

**Task Title:** Property-Centric Staff Assignment, Multi-Inspector Roster & ID Verification Toggle  
**Target Phase:** Phase 2 (Following Multi-Tenancy Foundation)  
**Status:** In Progress / Ready for Implementation  
**Date:** September 18, 2026  

---

## 1. Executive Summary & Objective

In the current version of Amenity Op's, inspections are manually scheduled one-by-one by choosing a property, checklist template, and individual inspector each time. Furthermore, specialists are not scoped at the property level, and there is no mechanism to bind multiple inspectors to a single property or control photo ID requirements.

**Task 3 transforms the platform into a Property-Centric Operation:**
1. **Multi-Inspector Property Roster:** Corporate clients can assign multiple specialists (Primary, Backup, On-Site Staff) directly to a property.
2. **Automated Audit Routing:** When an inspection is scheduled or started for a property, the system automatically pulls from its assigned roster or pre-selects the primary specialist.
3. **Strict Property Access Control (Row Level Security & Query Scoping):** Specialists only see and access properties (and audits) they are actively assigned to on the property roster.
4. **Client-Requested Feature: Photo Identification (ID) Enable/Disable Toggle:**
   * A per-property (and per-tenant default) toggle: `require_id_photo`.
   * **When Enabled (1099 Contractor Vetting):** Specialists must upload driver's license ID photos (front & back) before conducting audits.
   * **When Disabled (Corporate Internal Staff):** Internal W-2 facilities/maintenance staff do not have to upload personal driver's licenses, removing friction and respecting privacy.
5. **Cross-Tenant Contractor Pool Support:** External independent marketplace contractors (`is_contractor = true`) can be explicitly assigned to specific property rosters without gaining access to any other properties or data within the corporate tenant.

---

## 2. Incorporating Client Feedback & Strategic Features

Based on Jerome's latest questions and requirements, Task 3 directly addresses:

| Client Requirement | Implementation in Task 3 |
| :--- | :--- |
| **"How many inspectors can be assigned to a property? Is it possible to add a mechanism to assign multiple inspectors to 1 property?"** | Implemented via `property_specialist_assignments` junction table. Supports an unlimited or tiered roster of specialists per property with roles (`primary`, `backup`, `team`). |
| **"Photo of Identification on Inspector Profile to have an enable/disable feature for properties. Is it possible to add such feature?"** | Implemented via `require_id_photo` boolean flag on `properties` (and `tenants`). When disabled, the ID upload UI and gating checks are suppressed. |
| **"Deactivate/Reassign before Deletion" (Pre-requisite completed in Task 1 follow-up)** | Roster assignments work in lockstep with the deactivation modal: when an inspector is deactivated, open property audits are cleanly reassigned. |

---

## 3. Database Schema Design (Migration 0008)

### Migration Script: `supabase/migrations/0008_property_staff_assignment.sql`

```sql
-- 1. Property-Specialist Assignment Junction Table
create table if not exists property_specialist_assignments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade,
  property_id uuid not null references properties(id) on delete cascade,
  specialist_id uuid not null references profiles(id) on delete cascade,
  role text not null default 'primary' check (role in ('primary', 'backup', 'staff')),
  created_at timestamptz not null default now(),
  unique(property_id, specialist_id)
);

create index if not exists prop_assign_property_idx on property_specialist_assignments(property_id);
create index if not exists prop_assign_specialist_idx on property_specialist_assignments(specialist_id);
create index if not exists prop_assign_tenant_idx on property_specialist_assignments(tenant_id);

-- 2. Photo ID Verification Toggle on Properties and Tenants
alter table tenants add column if not exists require_id_photo boolean not null default true;
alter table properties add column if not exists require_id_photo boolean not null default true;

-- 3. Row Level Security Policies
alter table property_specialist_assignments enable row level security;

-- Admins can view/manage assignments within their tenant; Global Admin has apex access
create policy "prop_assign_select" on property_specialist_assignments
  for select using (
    current_user_is_global_admin()
    or specialist_id = auth.uid()
    or (current_role_is_admin() and tenant_id = current_user_tenant_id())
  );

create policy "prop_assign_admin_write" on property_specialist_assignments
  for all using (
    current_user_is_global_admin()
    or (current_role_is_admin() and tenant_id = current_user_tenant_id())
  ) with check (
    current_user_is_global_admin()
    or (current_role_is_admin() and tenant_id = current_user_tenant_id())
  );

-- 4. Update Properties Select Policy for Strict Property-Level Scoping:
-- Specialists can only select properties if they are explicitly assigned in property_specialist_assignments
-- OR assigned to an existing inspection at that property
drop policy if exists "properties_select_all" on properties;
create policy "properties_select_all" on properties
  for select using (
    current_user_is_global_admin()
    or (
      tenant_id = current_user_tenant_id()
      and (
        current_role_is_admin()
        or exists (
          select 1 from property_specialist_assignments psa
          where psa.property_id = properties.id and psa.specialist_id = auth.uid()
        )
        or exists (
          select 1 from inspections i
          where i.property_id = properties.id and i.inspector_id = auth.uid()
        )
      )
    )
    or exists (
      select 1 from property_specialist_assignments psa
      where psa.property_id = properties.id and psa.specialist_id = auth.uid()
    )
  );
```

---

## 4. Application Architecture & Implementation Plan

### A. Server Actions (`src/lib/actions/property-assignments.ts`)
* `assignSpecialistToProperty(propertyId, specialistId, role)`:
  * Adds an inspector to the property roster.
  * Validates that the specialist is active and belongs to the tenant or is an approved contractor.
* `removeSpecialistFromProperty(assignmentId)`:
  * Removes specialist from the property roster.
* `togglePropertyIdRequirement(propertyId, requireIdPhoto)`:
  * Updates the `require_id_photo` setting for that property.

### B. UI Components
1. **Property Assigned Specialists Manager (`PropertyRosterManager.tsx`):**
   * Located on `/admin/properties/[id]`.
   * Shows currently assigned specialists (Primary, Backup, Staff chips).
   * "Add Specialist to Roster" selector with real-time assignment.
   * Remove specialist button with confirmation.
2. **Photo ID Enable/Disable Toggle:**
   * Embedded in `PropertyForm.tsx` (during property creation/editing) and on the property detail page.
   * Checkbox/switch: *"Require Driver's License ID Verification for Specialists"*.
3. **Inspector Profile ID Upload Visibility (`src/app/inspector/profile/page.tsx`):**
   * Checks if any assigned properties or tenant requires photo ID.
   * If all assigned properties have `require_id_photo = false`, hides the Driver's License upload card and displays *"ID verification not required by your organization"*.
4. **Smart Inspection Dispatching (`src/app/admin/inspections/new/page.tsx`):**
   * When an admin selects a property, the specialist dropdown automatically filters and highlights the **Assigned Roster for this Property** with the Primary Specialist pre-selected.

---

## 5. Development Steps & Execution Order

1. **Step 1:** Create `supabase/migrations/0008_property_staff_assignment.sql` and update `src/lib/database.types.ts`.
2. **Step 2:** Implement `src/lib/actions/property-assignments.ts`.
3. **Step 3:** Build `src/components/PropertyRosterManager.tsx` and integrate it into `/admin/properties/[id]`.
4. **Step 4:** Add the `require_id_photo` toggle to `PropertyForm.tsx` and `/admin/properties/[id]/edit`.
5. **Step 5:** Update `/inspector/profile` to respect the `require_id_photo` toggle.
6. **Step 6:** Update `NewInspectionForm` to auto-populate from the property's assigned specialist roster.
7. **Step 7:** Verify with linter, test flows, and update development records.

---

## 6. Migration Schedule Note

* **Task 2 (Production VPS Migration):** Confirmed by client/user to be executed at the end once all SaaS features are built and verified.
* **Task 3 execution begins immediately.**
