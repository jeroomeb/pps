# Amenity Ops — Platform Controls & Filtering Update

**Client:** Jerome  
**Project:** Amenity Ops Platform  
**Date:** October 19, 2026  
**Status:** Completed & Ready for Review  

---

## Executive Summary

This update delivers the 4 operational refinements requested for permission gating, tenant isolation, and geographic filtering. All items have been implemented, tested, and verified in production build.

---

## Summary Table

| # | Item | What Was Built | Status |
| :---: | :--- | :--- | :---: |
| **1** | **Predictive Score Permission** | Restricted toggle to Platform Owner / Super Admin only. Provisional tenants see a read-only status badge. Added tenant-level toggle in Tenant Licensing. | **Delivered** |
| **2** | **Filter Isolation (Properties & Team)** | Organization dropdown is strictly restricted to HQ master view. When viewing under a provisional tenant, the dropdown is removed and data is isolated to that tenant. | **Delivered** |
| **3** | **Provisional Tenant Checklist Controls** | Provisional tenants are locked to Read-Only checklists by default. Super Admin can selectively enable *"Allow Checklist Management"* per tenant. | **Delivered** |
| **4** | **State Filter on Team Page** | Added a dedicated **State** dropdown filter under Team Members, positioned directly before the **County** filter. | **Delivered** |

---

## Point-by-Point Delivery

### 1. Predictive Score Toggle Permission (Super Admin Only)
* **What Was Built:**
  * **Property-Level Gating:** On property create/edit forms, the *Predictive Risk Scoring & Analytics* toggle is now editable **only** by Platform Owner / Super Admin. Provisional tenant admins see a clean read-only status badge (*"Controlled exclusively by Platform Owner / Super Admin"*).
  * **Tenant-Level Toggle:** Super Admin can also enable or disable predictive scoring across an entire tenant organization under **Tenants & Licensing**.
  * **Nightly Engine Enforcement:** The background scoring calculation automatically checks both property-level and tenant-level settings before computing scores.
* **Where to Verify:**
  * Property Edit Screen (`/admin/properties/[id]/edit`)
  * Tenants Management (`/admin/tenants`)

---

### 2. Tenant Filter Isolation (Properties & Team)
* **What Was Built:**
  * The **Organization** dropdown filter is now exclusively available to **Amenity Op's Master HQ**.
  * When viewing the platform under a provisional tenant (or when using *"Open Dashboard as Tenant"*), the organization dropdown is completely omitted.
  * All search queries, location filters (State, County, ZIP), and roster lists are strictly scoped to the active tenant.
* **Where to Verify:**
  * Properties List (`/admin/properties`)
  * Team Members List (`/admin/team`)

---

### 3. Provisional Tenant Checklist Permissions
* **What Was Built:**
  * **Default Read-Only Lock:** Provisional tenants cannot create, modify, or clone checklist templates by default. They see a *"Managed by Super Admin (Read-Only)"* badge.
  * **Super Admin Control Switch:** Under **Tenants & Licensing**, Super Admin has an **"Allow Checklist Management"** toggle for each tenant organization.
  * **Self-Service When Enabled:** If enabled by Super Admin, that tenant's admins gain full self-service permissions to create, clone, and customize checklists. Checklists created by them are automatically assigned to their organization.
* **Where to Verify:**
  * Checklist Templates List & Detail (`/admin/checklists` & `/admin/checklists/[id]`)
  * Tenant License Card Edit (`/admin/tenants`)

---

### 4. Dedicated 'State' Filter Under Teams
* **What Was Built:**
  * Added a dedicated **State** dropdown filter on the Team Members page.
  * Positioned directly prior to the **County** filter: `Search -> [Organization (HQ)] -> State -> County -> Actions`.
  * Allows rapid geographic filtering of inspectors and specialists by state.
* **Where to Verify:**
  * Team Members List (`/admin/team`)

---

## Verification & Deployment Status

* **Production Build:** Next.js Turbopack build succeeded with 0 errors.
* **Unit Tests:** Risk scoring test suite passing (8/8).
* **Database Migration:** Idempotent migration script (`0019_provisional_tenant_controls_and_filters.sql`) prepared for deployment.
