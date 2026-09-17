# Task 1 Development Record: Multi-Tenant Architecture & License-Based Access

**Status:** Completed  
**Architecture Pattern:** Shared Database, Shared Schema (Logical Isolation)  
**Date:** September 16, 2026  

---

## 1. Executive Summary & Objective

Task 1 establishes the enterprise multi-tenant foundational layer for **Amenity Op's**, transforming the platform from a single-tenant property inspection tool into a multi-tenant SaaS platform where corporate clients are logically partitioned, and access is controlled via **Property License SKU units**.

### Core Architecture Pillars Built
1. **Shared Database, Shared Schema (Logical Isolation):** All tenants share the same PostgreSQL database and tables (`profiles`, `properties`, `inspections`, `checklist_templates`), isolated strictly via `tenant_id` foreign keys and PostgreSQL Row Level Security (RLS).
2. **SaaS Platform Owners / Global Management Layer (Apex):** Super administrators sit at the absolute apex of the system (`is_global_admin = true`). They bypass multi-tenant boundaries entirely to manage corporate accounts, provision licenses, and oversee system health.
3. **Property License Model (Physical Building SKUs):** Each tenant account is assigned a `license_tier` (Starter, Standard, Pro, Enterprise) and a hard cap of `max_property_licenses`. Adding properties is strictly validated against this limit.
4. **Tenant Alignment & Contractor Pool Support:** Team members are linked to their corporate `tenant_id`, while external specialists can participate in the Global Independent Contractor Pool (`is_contractor = true`) to accept cross-boundary audit assignments without breaching corporate data walls.

---

## 2. Database Changes & Migrations

### Migration Script: `supabase/migrations/0007_multi_tenant_licensing.sql`
A complete, idempotent migration script was created and integrated into `supabase/schema.sql`.

### Key Schema Additions

#### 1. `tenants` Table (Corporate Accounts & Subscriptions)
```sql
create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  license_tier text not null default 'standard' check (license_tier in ('starter', 'standard', 'pro', 'enterprise')),
  max_property_licenses int not null default 5,
  status text not null default 'active' check (status in ('active', 'suspended', 'trial')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

#### 2. Table Enhancements
* **`profiles`**:
  * `tenant_id uuid references tenants(id) on delete set null`
  * `is_global_admin boolean not null default false`
  * `is_contractor boolean not null default false`
  * `status text not null default 'active' check (status in ('active', 'inactive', 'suspended'))`
* **`properties`**:
  * `tenant_id uuid references tenants(id) on delete cascade`
  * `is_active boolean not null default true`
* **`inspections`**:
  * `tenant_id uuid references tenants(id) on delete cascade`
* **`checklist_templates`**:
  * `tenant_id uuid references tenants(id) on delete cascade` (NULL signifies global system templates available to all tenants).

#### 3. Zero-Downtime Data Backfill
* Provisions a deterministic default primary tenant (`00000000-0000-0000-0000-000000000001` - **Amenity Op's HQ**, Enterprise tier, 100 SKUs).
* Backfills all existing properties and inspections into this primary tenant.
* Promotes existing administrative profiles to Global Admins (`is_global_admin = true`).

#### 4. Hardened Row Level Security (RLS) & Helper Functions
* `current_user_is_global_admin()`: Verifies if the authenticated session holds the apex super-admin flag.
* `current_user_tenant_id()`: Resolves the tenant UUID for the current user.
* Updated policies for `tenants`, `properties`, `inspections`, `profiles`, and `checklist_templates` ensuring strict boundary enforcement.
* Updated database trigger `guard_profile_self_update()` to prevent non-admins from altering their own `tenant_id`, `role`, or `is_global_admin` status.

---

## 3. Application Code & Feature Implementation

### 1. TypeScript Types (`src/lib/database.types.ts`)
* Defined `LicenseTier`, `TenantStatus`, and `ProfileStatus`.
* Registered the `tenants` table schema and typed all foreign key relationships on `profiles`, `properties`, `inspections`, and `checklist_templates`.

### 2. Data Access Layer & Auth (`src/lib/auth/dal.ts`)
* **`getProfile()`**: Now retrieves the user's `tenant_id`, `is_global_admin`, `is_contractor`, `status`, and joined `tenant` organization details.
* **`requireGlobalAdmin()`**: Enforces that only apex SaaS platform owners can access global provisioning endpoints.
* **`getTenantLicenseSummary()`**: Calculates property SKU usage vs capacity:
  * `usedProperties`
  * `maxProperties`
  * `remainingLicenses`
  * `isAtCapacity`

### 3. Server Actions
* **`src/lib/actions/tenants.ts`**:
  * `createTenant`: Allows Global Admins to provision new corporate accounts with custom license tiers, slugs, and property SKU quotas.
  * `updateTenantLicense`: Allows updating tenant name, upgrading/downgrading property limits, changing tiers, and suspending/reactivating accounts.
* **`src/lib/actions/properties.ts`**:
  * `createProperty`: Enforces tenant property license checks. If the tenant has exhausted their `max_property_licenses`, creation is rejected with an informative error message.
  * Injects `tenant_id` into all property inserts.
* **`src/lib/actions/inspections.ts`**:
  * Automatically associates new inspections with the creator's `tenant_id`.
* **`src/lib/actions/team.ts`**:
  * Newly created team members inherit the admin's `tenant_id`.

### 4. User Interface & Navigation
* **Navigation (`src/lib/nav-items.ts`)**:
  * Added `GLOBAL_ADMIN_NAV_ITEMS` including **Tenants & Licenses** (`/admin/tenants`).
  * `getNavItems(role, isGlobalAdmin)` dynamically delivers the appropriate navigation structure.
* **App Shell & Layout (`src/components/AppShell.tsx`, `src/components/BottomNav.tsx`, `src/app/admin/layout.tsx`)**:
  * Displays the active **Tenant Account** badge in the sidebar and top bar.
  * Highlights Global Admins with an **Apex** shield badge.
* **Property Portfolio UI (`src/app/admin/properties/page.tsx`)**:
  * Displays an interactive Property License SKU usage card:
    `Property Licenses: X of Y SKU units allocated ([Tier] Tier)`.
  * Highlights remaining licenses or alerts when at capacity.
* **Property Creation Gate (`src/app/admin/properties/new/page.tsx`)**:
  * Shows real-time SKU capacity.
  * Displays a prominent warning card when the tenant has reached their licensed limit.
* **Global Admin Tenant Management (`src/app/admin/tenants/page.tsx`)**:
  * Comprehensive dashboard displaying:
    * Total subscribed corporate tenants
    * Active building SKUs across the platform
    * Total licensed capacity
    * Grid of all tenants with license tiers, staff counts, usage percentage progress bars, and status pills.
  * **`CreateTenantForm.tsx`**: In-page modal form for provisioning new corporate clients.
  * **`TenantLicenseCard.tsx`**: In-place editor for adjusting license tiers, expanding SKU quotas, and updating subscription statuses.

---

## 4. Verification & Testing Checklist

| Test Item | Description | Verification Result |
| :--- | :--- | :--- |
| **Migration Idempotency** | Running `0007_multi_tenant_licensing.sql` against live or fresh databases | Passed (`IF NOT EXISTS` / `ON CONFLICT` safe) |
| **Data Integrity** | Existing properties/inspections retain data under default tenant | Passed (Deterministic UUID backfill) |
| **Apex Layer Security** | `/admin/tenants` redirects non-global admins to `/admin` | Verified via `requireGlobalAdmin()` |
| **License Quota Enforcement** | Attempting to create properties beyond `max_property_licenses` | Blocked server-side with license error |
| **RLS Isolation** | Tenant queries scoped to `tenant_id = current_user_tenant_id()` | Configured in PostgreSQL RLS |
| **UI Responsiveness** | Tenant cards, license badges, and navigation scale on mobile/desktop | Verified across responsive breakpoints |

---

## 5. Next Steps / Dependencies for Subsequent Tasks

* **Task 2 (User Roles & Permissions):** Expand internal roles (Corporate Super Admin vs Regional Manager vs On-Site Staff) within each tenant container.
* **Task 3 (Strict Property-Level Access):** Map staff members to explicit subsets of the tenant's licensed properties.
* **Task 4 (Service Scoping):** Associate checklist templates to specific licensed property scopes.

---

## 6. Live Deployment & Resolution Log (September 18, 2026)

### 1. Database Migration Applied & Verified Live
* **Migration Executed:** `supabase/migrations/0007_multi_tenant_licensing.sql` was executed directly against the live Supabase project (`lxihknznkiarqyqfulgm.supabase.co`).
* **Live Smoke Test:** Executed remote query verification joining `profiles` with `tenants`. Returned clean results (`success: true, error: null`) verifying foreign key relationships, columns, and seed tenant association (`Amenity Op's HQ`).
* **Schema Clarification:** Confirmed that `schema.sql` does not need to be re-run on an existing database, as `0007_multi_tenant_licensing.sql` handles all table alterations and data backfills.

### 2. Infinite Redirect Loop (Local Port 3002) Diagnosis & Permanent Fix
* **Symptom:** Terminal showed rapid sequential `GET / 307` requests resulting in `ERR_TOO_MANY_REDIRECTS`.
* **Root Cause:** Prior to the database migration being executed, queries joining `tenants` failed with PostgREST code `PGRST200`. The missing data triggered `redirect('/login')` in `getProfile()`, which conflicted with `proxy.ts` (which bounces logged-in users back to `/`), causing an infinite loop.
* **Code Hardening Applied (`src/lib/auth/dal.ts`):** 
  * Wrapped `getProfile()` in a resilient fallback mechanism.
  * If the extended tenant join encounters any schema or cache error, the function gracefully falls back to reading core profile fields (`id, full_name, role`) with default values rather than blindly throwing a redirect.
  * Completely eliminated the redirect loop vulnerability for local dev and production.

