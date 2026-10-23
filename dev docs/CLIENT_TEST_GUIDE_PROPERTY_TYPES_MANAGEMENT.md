# Property Types Dynamic Management & Platform Owner Lock: Testing Guide

**Date:** October 24, 2026  
**Audience:** Platform Owner / Super Admin  
**Production Domain:** `https://amenityops.app`  

---

## Overview

Per your request (Option B), we have added dynamic **Property Types Management** controlled exclusively by the Platform Owner / Super Admin. 

### Key Highlights
- **Dynamic Catalog**: Add, edit, activate, or deactivate custom property types (e.g., *Student Housing*, *Industrial Logistics*, *Resort Hospitality*) at any time without code changes.
- **Strict Super Admin Lock**: Property type selection is completely locked for Provisional Tenant Admins. They see a secure, read-only status badge and cannot create or reclassify property types.
- **Payout Matrix Integration**: Custom property types seamlessly map to an inspector payout baseline (`luxury_condo`, `adult_community`, or `commercial_multi`) for automated rate calculations.

---

## Step-by-Step Testing Guide

Follow these steps to test and verify the implementation:

### Step 1: Open the Property Types Management Console (Super Admin)
1. Log in to the Admin Dashboard as **Super Admin** (`https://amenityops.app/login` or local dev).
2. In the navigation, go to **Properties** (`/admin/properties`).
3. In the header next to the **New Property** button, click the new **Property Types** button (or navigate directly to `/admin/property-types`).
4. You will see the **Configured Property Types** registry with default platform types:
   - *Luxury Condominium* (`luxury`)
   - *55+ Active Adult Community* (`adult`)
   - *Commercial Multi-Tenant* (`commercial`)

### Step 2: Add and Toggle Property Types
1. On the `/admin/property-types` page, click **+ Add Property Type**.
2. In the modal form, fill out:
   - **Type Name**: e.g., `Student Housing` or `Industrial Logistics`
   - **Key / Slug**: automatically generated as `student_housing` (lowercase database identifier)
   - **Payout Matrix Baseline**: select the rate card tier baseline (e.g., *Luxury Condo*)
   - **Display Order**: e.g., `4`
   - **Description**: optional operational note (e.g., *Multi-building student residential campus*)
3. Click **Save Property Type**.
   - *Verification*: A success toast notification appears and the new property type immediately displays in the registry table.
4. Test the status toggle:
   - Click **Deactivate** on any property type &rarr; badge switches to **Inactive**.
   - Click **Activate** &rarr; badge switches back to **Active**.

### Step 3: Test Property Creation & Editing (Super Admin View)
1. Navigate to **New Property** (`/admin/properties/new`) or edit an existing property (`/admin/properties/[id]/edit`).
2. Scroll to the **Operational Configurations** section &rarr; **Property Classification / Type**.
   - *Verification*:
     - The dropdown dynamically lists all active property types, including the newly created `Student Housing`.
     - Above the dropdown, a **"Manage Types"** link is present for quick access back to the catalog.
3. Select your new property type and save the property to confirm it persists properly.

### Step 4: Verify the Strict Lock for Provisional Tenants
*This step confirms that provisional tenant admins cannot create or change property types.*

1. In the Super Admin navigation, go to **Tenants & Licenses** (`/admin/tenants`).
2. Click **Open Dashboard** next to any provisional tenant to switch your session into provisional tenant view.
3. Check the navigation:
   - Go to **Properties** (`/admin/properties`):
     - *Verification*: The **Property Types** management button is completely **hidden**.
   - Try navigating directly to `/admin/property-types`:
     - *Verification*: Access is denied/blocked because only Super Admins can access this master catalog.
4. Click **New Property** (`/admin/properties/new`) or open any tenant property's edit page:
   - Scroll to **Property Classification / Type**:
     - *Verification*:
       - The interactive dropdown is replaced with a locked card showing a lock icon.
       - The assigned type is displayed as a read-only badge.
       - A system notice confirms:  
         *"Managed by Platform Owner (Super Admin). Contact platform support to request property reclassification."*
5. In the top banner, click **"Exit Tenant View"** to return to your primary Super Admin dashboard.

---

## Technical Summary of Changes

| Component / File | Purpose |
| :--- | :--- |
| `supabase/migrations/0020_dynamic_property_types.sql` | Table definition, seeds, dropped check constraint, and RLS policies. |
| `/src/app/admin/property-types/page.tsx` | Super Admin page guarded with `requireGlobalAdmin()`. |
| `/src/components/PropertyTypesManager.tsx` | Client management console with creation modal and live activation toggles. |
| `/src/components/PropertyForm.tsx` | Dynamic dropdown for Super Admin; locked read-only card for tenant admins. |
| `/src/lib/actions/property-types.ts` | Server actions to create, update, and toggle property types with admin authorization. |
| `/src/lib/property-types.ts` | Dynamic fetching helpers with graceful fallback to defaults. |
