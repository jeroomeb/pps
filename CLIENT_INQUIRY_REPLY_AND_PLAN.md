# Client Inquiry Analysis, Official Response & Development Plan

**Date:** September 19, 2026  
**Client:** Jerome Bermudez (Amenity Op's)  
**Subject:** Responses to Inquiries on Data Overview, Master HQ Access, Tenant Profiles/Access (Q3), and 3-Tier Property Payouts (Q4).

---

## 1. Client Question & Status Assessment Matrix

| # | Client Inquiry | Current Status | Technical Explanation & Implementation Scope |
|---|---|---|---|
| **1** | **Data Tab Overall Summary**<br>*(The data tab when clicked should lead to the overall summary.)* | **COMPLETED** | `/admin/analytics` displays the organization-wide executive dashboard by default, aggregating throughput, punctuality, dwell duration, and discovery rate. |
| **2** | **Amenity Op's HQ Master Access**<br>*(Does Amenity Op's HQ have access to all "Tenants & Licenses"?)* | **COMPLETED** | Verified. Amenity Op's HQ possesses master `is_global_admin = true` privileges, granting exclusive administrative oversight over all tenant accounts, building licenses, and quotas. |
| **3** | **Provisional Tenant Access & Profile Onboarding**<br>*(How does a provisional tenant like "Sample Towers" log in and manage their properties & inspectors?)* | **TO IMPLEMENT (Q3)** | **Implementation Plan:**<br>1. **Direct Admin Provisioning**: When Super Admin creates a tenant, capture the Tenant Admin's Name, Email, and temporary password. Automatically provision their `auth.users` & `profiles` row scoped to that `tenant_id`.<br>2. **HQ Tenant Context / Assignment**: Allow Super Admins to create and assign properties/inspectors under specific corporate tenant profiles. |
| **4** | **3-Tier Property Compensation Matrix**<br>*(Tiered payout system based on property tiers e.g., Tier 1, 2, 3 where payouts automatically adjust per property.)* | **TO IMPLEMENT (Q4)** | **Implementation Plan:**<br>1. **Tiered Property Rate Structure**: Add `payout_tier_1_rate`, `payout_tier_2_rate`, `payout_tier_3_rate` to `tenants` (customizable in Payout settings).<br>2. **Property Tier Assignment**: Add `payout_tier` (`tier_1` \| `tier_2` \| `tier_3` \| `custom`) to `properties`.<br>3. **Dynamic Computation**: In the inspection completion pipeline, automatically evaluate the property's designated tier and record the exact tiered payout amount in the ledger. |

---

## 2. Client-Ready Response

```markdown
Hello Jerome,

Thank you for the detailed feedback! Here is the breakdown for each of your points:

1. Data & Analytics Summary Tab:
• This is already set up and working. Clicking the Analytics / Data tab takes you directly to the Executive Overall Summary dashboard, providing high-level KPIs across all operations (Total Audits Completed, On-Time Punctuality, Average Dwell Times, Quality Discovery Rates, Specialist Leaderboards, and Property Activity).

2. Amenity Op's HQ Access:
• Yes, Amenity Op's HQ has master Super Admin access across the entire platform. HQ has exclusive permissions to view all tenants, adjust building license caps, and monitor all corporate organizations under the "Tenants & Licenses" section.

3. Tenant Access & Onboarding (e.g., Sample Towers):
• How it works: When a tenant like "Sample Towers" is provisioned, it creates the isolated organization container.
• Next Step to Implement: We are adding two seamless workflows:
  1. Primary Admin Creation: When you provision a new tenant, you will enter the tenant manager's Name & Email so their admin account is automatically created and sent setup access. Once logged in, they can only see and add properties/inspectors under Sample Towers.
  2. HQ Tenant Switcher: For you as HQ Super Admin, you will be able to select a tenant from a dropdown to add properties or specialists directly under that tenant's profile on their behalf.

4. 3-Tier Specialist Payout System:
• Yes, absolutely! We can implement a 3-Tier Compensation Matrix in the Payouts settings (e.g., Tier 1: $50, Tier 2: $75, Tier 3: $100 — fully customizable by you). 
• Each property will have a designated tier. When an inspector audits Property A (Tier 1) in the morning and Property B (Tier 3) in the afternoon, the system will automatically calculate and log the exact tiered payout for each audit.

Let us know if you would like us to proceed with implementing the Tenant Admin onboarding flow and the 3-Tier compensation system!
```

---

## 3. Engineering Implementation Roadmap (Q3 & Q4)

### Step 1: Database Schema & Migration (`0013_tenant_onboarding_and_tiered_payouts.sql`)
- Add `payout_tier_1_rate numeric(10,2) not null default 50.00`, `payout_tier_2_rate numeric(10,2) not null default 75.00`, `payout_tier_3_rate numeric(10,2) not null default 100.00` to `tenants`.
- Add `payout_tier text not null default 'tier_2'` check in `('tier_1', 'tier_2', 'tier_3', 'custom')` to `properties`.
- Update master `supabase/schema.sql` and `src/lib/database.types.ts`.

### Step 2: Backend Server Actions
- Enhance `createTenant` action in `src/lib/actions/tenants.ts` to optionally create the primary Tenant Admin user (`supabase.auth.admin.createUser`) linked to `tenant_id` with `role = 'admin'` and `must_reset_password = true`.
- Enhance `updateTenantDefaultRate` or add `updateTenantTierRates` in `src/lib/actions/payouts.ts` for the 3-Tier rates.
- Update `createProperty` and `updateProperty` in `src/lib/actions/properties.ts` with `payout_tier` selection and `tenant_id` assignment for Super Admins.
- Update `/api/inspections/[id]/complete/route.ts` to calculate the payout dynamically: `custom_payout_rate ?? (tier === 'tier_1' ? tier_1_rate : tier === 'tier_3' ? tier_3_rate : tier_2_rate)`.

### Step 3: Frontend UI Components
- **Question 3 UI**:
  - Update `CreateTenantForm.tsx` to include "Initial Admin Account" credentials (Admin Name, Email, Password).
  - Update `PropertyForm.tsx` with a Tenant Selector if the current user is a Super Admin (`is_global_admin`).
- **Question 4 UI**:
  - Update `AdminPayoutsManager.tsx` to display and configure the **3-Tier Compensation Matrix** (Tier 1, Tier 2, Tier 3 base rates).
  - Update `PropertyForm.tsx` to allow selecting the Property Payout Tier (Tier 1 / Tier 2 / Tier 3 / Custom Override).

### Step 4: Verification & Documentation
- Test TypeScript compilation, Next.js build, and create `CLIENT_ENHANCEMENTS_Q3_Q4_GUIDE.md`.
