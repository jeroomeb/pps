# Client Enhancements: Tenant Access (Q3) & 3-Tier Payout Matrix (Q4)

**Date:** September 19, 2026  
**Status:** Completed & Verified  

---

## 1. Overview of What Was Built

### A. Question 3: Tenant Access & Profile Onboarding
1. **Instant Admin Account Provisioning:**
   - In `/admin/tenants`, when creating a new corporate account (e.g. *Sample Towers*), you can now enter the primary administrator's Name, Email, and temporary password.
   - The system automatically creates their Supabase Auth user and sets `role = 'admin'`, assigns their `tenant_id = Sample Towers`, and sets `must_reset_password = true` so they configure a private password upon first sign-in.
   - Once logged in, this tenant admin is restricted via Row Level Security (RLS) to manage only their own properties, checklists, and specialists.

2. **HQ Tenant Switcher / Assignment Context:**
   - As Super Admin (Amenity Op's HQ), you now have an **"Assigned Organization / Corporate Tenant"** dropdown when creating properties (`/admin/properties/new`) and adding team members (`/admin/team`).
   - This allows HQ to provision properties and staff directly under any specific tenant profile on their behalf.

---

### B. Question 4: 3-Tier Specialist Payout & Compensation System
1. **3-Tier Compensation Matrix in Payouts Settings:**
   - In `/admin/payouts`, an interactive **3-Tier Property Compensation Matrix** card lets you configure per-tier rates:
     - **Tier 1 (Standard / Baseline):** e.g., `$50.00`
     - **Tier 2 (Commercial / Mid-Size):** e.g., `$75.00`
     - **Tier 3 (Premium / Luxury High-Rise):** e.g., `$100.00`
     - **Fallback Rate:** e.g., `$75.00` for unclassified properties.

2. **Property Tier Assignment & Custom Override:**
   - In `PropertyForm` (`/admin/properties/new` and edit), you can select the property's compensation tier:
     - **Tier 1 Property**
     - **Tier 2 Property**
     - **Tier 3 Property**
     - **Custom Flat Rate Override ($):** specify a custom rate for special contracts.

3. **Automated Audit Completion Ledger:**
   - When a specialist completes an audit at `/inspector/inspections/[id]`, `/api/inspections/[id]/complete` checks the property's designated tier:
     - Property in **Tier 1** $\rightarrow$ Logs a `$50.00` payout.
     - Property in **Tier 3** $\rightarrow$ Logs a `$100.00` payout.
     - Property with a **Custom Override** (e.g. `$120.00`) $\rightarrow$ Logs `$120.00`.
   - If a specialist inspects a Tier 1 building in the morning and a Tier 3 building in the afternoon, their earnings automatically adjust per property.

---

## 2. Database Migration

Run `supabase/migrations/0013_tenant_onboarding_and_tiered_payouts.sql` in your Supabase SQL editor (idempotent and safe):

```sql
-- Adds 3-Tier rates to tenants
alter table public.tenants
  add column if not exists payout_tier_1_rate numeric(10, 2) not null default 50.00;
alter table public.tenants
  add column if not exists payout_tier_2_rate numeric(10, 2) not null default 75.00;
alter table public.tenants
  add column if not exists payout_tier_3_rate numeric(10, 2) not null default 100.00;

-- Adds payout_tier to properties
alter table public.properties
  add column if not exists payout_tier text not null default 'tier_2';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'properties_payout_tier_check') then
    alter table public.properties
      add constraint properties_payout_tier_check
      check (payout_tier in ('tier_1', 'tier_2', 'tier_3', 'custom'));
  end if;
end $$;

create index if not exists properties_payout_tier_idx on public.properties (payout_tier);
```

---

## 3. How to Test

### Step 1: Test Tenant Provisioning & Admin Onboarding (Q3)
1. Go to **Tenants & Licenses** (`/admin/tenants`) as Super Admin.
2. Click **+ PROVISION TENANT**.
3. Fill in:
   - Company Name: `Sample Towers`
   - License Tier: `Standard`
   - Licensed Property SKUs: `5`
   - Admin Full Name: `Sample Admin`
   - Admin Email: `admin@sampletowers.com`
   - Temporary Password: `password123`
4. Click **Create Tenant**.
5. *Verify:* The tenant card appears with 0/5 property licenses.
6. Sign in with `admin@sampletowers.com` / `password123`. The user is prompted to set their new private password, and once in, only sees data scoped to Sample Towers.

---

### Step 2: Test HQ Assigning Property to Tenant (Q3)
1. As Super Admin, go to **Properties** $\rightarrow$ **+ New Property**.
2. In the **"Assigned Organization / Corporate Tenant"** dropdown, choose `Sample Towers`.
3. Set Property Name to `Sample Towers North Building`.
4. Click **Save Property**.
5. *Verify:* The property is created under `Sample Towers` and consumes 1 of its 5 allocated licenses.

---

### Step 3: Test 3-Tier Compensation Matrix (Q4)
1. Go to **Payouts** (`/admin/payouts`).
2. If disabled, toggle **Enable Module**.
3. In the **3-Tier Property Compensation Matrix** card, set:
   - Tier 1: `$50.00`
   - Tier 2: `$75.00`
   - Tier 3: `$100.00`
4. Click **Save Tier Rates**.
5. Go to **Properties** and create/edit two properties:
   - Property A $\rightarrow$ Set Compensation Tier to **Tier 1 Property**.
   - Property B $\rightarrow$ Set Compensation Tier to **Tier 3 Property**.
6. Assign an audit to each property and complete them.
7. Go to `/admin/payouts` (or `/inspector/payouts` as the specialist).
8. *Verify:* Property A's audit created a pending payout of `$50.00`, and Property B's audit created a pending payout of `$100.00`.
