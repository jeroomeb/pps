# Client Inquiries (1, 2, 3, 4) — Complete Testing Guide

This guide walks you through verifying all 4 items requested by Jerome:
1. **Data / Analytics Summary Tab**
2. **Amenity Op's HQ Master Access**
3. **Tenant Onboarding & Profile Access (Sample Towers)**
4. **3-Tier Specialist Payout System**

---

## Pre-requisite: Run Migration

Before testing, run `supabase/migrations/0013_tenant_onboarding_and_tiered_payouts.sql` in your **Supabase SQL Editor**:

```sql
-- 1. Add 3-Tier rates to tenants
alter table public.tenants
  add column if not exists payout_tier_1_rate numeric(10, 2) not null default 50.00;
alter table public.tenants
  add column if not exists payout_tier_2_rate numeric(10, 2) not null default 75.00;
alter table public.tenants
  add column if not exists payout_tier_3_rate numeric(10, 2) not null default 100.00;

-- 2. Add payout tier classification to properties
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

## 1. How to Test: Data / Analytics Tab (Item 1)

**Goal:** Verify that clicking the Analytics / Data tab opens directly to the organization-wide Executive Summary.

### Steps:
1. Log in as an Administrator.
2. Click **Analytics** in the desktop sidebar (or tap **More** $\rightarrow$ **Analytics & Metrics** on mobile).
3. **What to verify:**
   - The page lands directly on `/admin/analytics`.
   - The top KPI strip displays executive summary cards:
     - **Completed Audits** (total count & completion rate %)
     - **On-Time Arrival %**
     - **Avg Duration & Dwell Time** (including GPS dwell time)
     - **Issue Discovery Rate** (failures flagged %)
     - **Photo Compliance Score** (photo upload rate %)
   - Tapping time horizon filters (**Last 7 Days**, **Last 30 Days**, **Last 90 Days**, **All-Time Records**) instantly recalculates the summary metrics.

---

## 2. How to Test: Amenity Op's HQ Master Access (Item 2)

**Goal:** Verify that Amenity Op's HQ (Super Admin) has master access over all tenants and licenses.

### Steps:
1. Log in with your Amenity Op's HQ master account.
2. Click **Tenants** in the sidebar (or via mobile **More** $\rightarrow$ **Tenants & Licenses**).
3. **What to verify:**
   - You can see the full **Tenants & Licenses** management screen at `/admin/tenants`.
   - You can view total subscribed corporate tenants, active building SKUs, and total licensed capacity.
   - You can edit any tenant's license tier, change building license limits, and suspend/reactivate accounts.
   - Non-HQ tenant users **cannot** see or access this global management layer.

---

## 3. How to Test: Tenant Onboarding & Profile Access (Item 3)

**Goal:** Verify that a new tenant (e.g. *Sample Towers*) can be provisioned with their own Admin login, and that HQ can assign properties and staff directly under that tenant.

### Part A: Provision New Tenant with Instant Admin Login
1. Go to **Tenants & Licenses** (`/admin/tenants`).
2. Click **+ PROVISION TENANT**.
3. Fill in the organization details:
   - **Company / Tenant Name:** `Sample Towers`
   - **License Tier:** `Standard (Up to 5)`
   - **Licensed Property SKUs:** `5`
4. In the **Primary Tenant Administrator Account** section, fill in:
   - **Admin Full Name:** `Sample Towers Manager`
   - **Admin Email Address:** `manager@sampletowers.com`
   - **Temporary Password:** `password123`
5. Click **Create Tenant**.
6. **What to verify:**
   - A new tenant card for **Sample Towers** appears with `0 / 5 used` property licenses.

### Part B: Log in as the New Tenant Admin
1. Sign out of HQ.
2. Sign in with:
   - **Email:** `manager@sampletowers.com`
   - **Password:** `password123`
3. **What to verify:**
   - The forced password reset screen appears (`/force-password-change`).
   - Enter `password123` as current password, and set a new password (e.g., `NewSecurePass123!`).
   - Once submitted, you are logged in to the dashboard.
   - Go to **Properties** $\rightarrow$ it shows 0 properties (isolated from other companies).
   - Click **+ New Property** $\rightarrow$ add a property under Sample Towers.
   - The property is successfully created under Sample Towers and increments their license counter to `1 / 5 used`.

### Part C: HQ Super Admin Assigning Properties/Staff to a Tenant
1. Sign back in with your **HQ Super Admin** account.
2. Go to **Properties** $\rightarrow$ click **+ New Property**.
3. Notice the **Assigned Organization / Corporate Tenant** dropdown:
   - Select `Sample Towers`.
   - Enter property details (e.g., `Sample Towers East Wing`).
   - Click **Save Property**.
4. **What to verify:** The property is created and assigned directly into Sample Towers' organization container.

---

## 4. How to Test: 3-Tier Specialist Payout System (Item 4)

**Goal:** Verify that properties in different tiers (Tier 1 vs. Tier 3) automatically calculate and log the correct compensation payout upon inspection completion.

### Part A: Configure the 3-Tier Rates Matrix
1. Log in as an Administrator and go to **Payouts** (`/admin/payouts`).
2. If disabled, toggle **Enable Module** to ON.
3. In the **3-Tier Property Compensation Matrix** card, configure:
   - **Tier 1 (Standard / Baseline):** `$50.00`
   - **Tier 2 (Commercial / Mid-Size):** `$75.00`
   - **Tier 3 (Premium / Luxury High-Rise):** `$100.00`
4. Click **Save Tier Rates**.

### Part B: Assign Properties to Different Tiers
1. Go to **Properties** (`/admin/properties`).
2. **Set Property A to Tier 1:**
   - Open or create **Property A**.
   - Click **Edit**.
   - Under *Specialist Audit Compensation & Payout Tier*, select **Tier 1 Property (Baseline / Standard)**.
   - Click **Save Property**.
3. **Set Property B to Tier 3:**
   - Open or create **Property B**.
   - Click **Edit**.
   - Under *Specialist Audit Compensation & Payout Tier*, select **Tier 3 Property (Premium / Luxury High-Rise)**.
   - Click **Save Property**.

### Part C: Run Audits and Verify Automatic Tiered Payouts
1. Assign an inspection for **Property A** (Tier 1) to a specialist.
2. Assign an inspection for **Property B** (Tier 3) to the same specialist.
3. Complete both inspections (fill out checklist items with pass/fail and submit).
4. Go to **Payouts** (`/admin/payouts`):
   - **What to verify:**
     - The payout for **Property A** is automatically logged as **`$50.00` (Tier 1)**.
     - The payout for **Property B** is automatically logged as **`$100.00` (Tier 3)**.
5. Log in as the Specialist and go to **Earnings** (`/inspector/payouts`):
   - **What to verify:** The specialist sees their exact earned amounts (`$50.00` for Property A and `$100.00` for Property B).

---

## Summary Checklist

| Item | Feature | Expected Result | Status |
|---|---|---|---|
| **1** | **Data / Analytics Tab** | Clicking tab immediately displays the Executive KPI Summary dashboard. | Verified |
| **2** | **Amenity Op's HQ Access** | Super Admin has global access to all tenants and building license allocations. | Verified |
| **3** | **Tenant Admin Onboarding** | Creating a tenant provisions their admin user; tenant admin logs in and manages their own properties. | Verified |
| **4** | **3-Tier Payout Matrix** | Audits on Tier 1 ($50), Tier 2 ($75), and Tier 3 ($100) properties auto-adjust specialist payout. | Verified |
