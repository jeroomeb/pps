# Task 5: Specialist (OCS) Compensation & Payouts Section — Development Record

## 1. Overview & Objectives Completed
Engineered and verified **Task 5: Operations Continuity Specialist Payment & Payouts Section**, strictly implementing the client's directive:
> *"Task 5 should also have the enable/disable feature."*

The module enables organizations with 1099 independent contractor models to automatically calculate audit compensation, review work, batch-approve payments, and track disbursement references, while allowing corporate property clients employing salaried or hourly W-2 staff to completely disable and hide financial ledgers.

---

## 2. Changes Summary

### A. Database Layer (`supabase/migrations/0010_specialist_payouts.sql`)
1. **Tenant Feature Flag & Baseline Rate**:
   - `tenants.enable_payouts boolean not null default false`
   - `tenants.default_payout_rate numeric(10,2) not null default 75.00`
2. **Property Custom Rate Override**:
   - `properties.custom_payout_rate numeric(10,2)`
3. **Specialist Payouts Ledger Table (`specialist_payouts`)**:
   - `id uuid primary key default gen_random_uuid()`
   - `tenant_id uuid references tenants(id) on delete cascade`
   - `inspection_id uuid not null references inspections(id) on delete cascade unique`
   - `specialist_id uuid not null references profiles(id) on delete cascade`
   - `property_id uuid not null references properties(id) on delete cascade`
   - `amount numeric(10,2) not null default 0.00`
   - `status text not null default 'pending' check in ('pending', 'approved', 'paid', 'cancelled')`
   - `approved_at timestamptz`, `approved_by uuid references profiles(id)`
   - `paid_at timestamptz`, `payment_reference text`, `notes text`
4. **Row Level Security**:
   - Specialists can only view their own records (`specialist_id = auth.uid()`).
   - Admins can view, approve, and settle payouts within their tenant organization.
   - Global Admins retain multi-tenant oversight.
5. **Schema & Types**:
   - Synced with `supabase/schema.sql` and `src/lib/database.types.ts`.

### B. Business Logic & Server Actions
1. **Data Access Layer (`src/lib/auth/dal.ts`)**:
   - Updated `TenantInfo` and `getProfile()` to select `enable_payouts` and `default_payout_rate`.
2. **Server Actions (`src/lib/actions/payouts.ts`)**:
   - `toggleTenantPayouts(tenantId, enablePayouts)`: Organization-level feature flag toggle.
   - `updateTenantDefaultRate(prevState, formData)`: Adjusts baseline compensation rate.
   - `updatePropertyPayoutRate(propertyId, customRate)`: Sets property-specific rate overrides.
   - `approvePayout(payoutId)`: Moves single payout from `pending` to `approved`.
   - `batchApprovePayouts(payoutIds[])`: Bulk approves multiple pending audit payouts.
   - `markPayoutPaid(prevState, formData)`: Records transaction reference (ACH, Stripe, Check #), logs settlement date, and transitions status to `paid`.
3. **Audit Completion Hook (`/api/inspections/[id]/complete/route.ts`)**:
   - When an inspection is submitted, checks if the tenant has `enable_payouts === true`.
   - Resolves rate hierarchy: `property.custom_payout_rate` $\rightarrow$ `tenant.default_payout_rate` $\rightarrow$ `$75.00`.
   - Automatically inserts a `pending` ledger item in `specialist_payouts`.

### C. Dynamic Navigation & User Interface
1. **Dynamic Navigation (`src/lib/nav-items.ts`, `AppShell.tsx`, `BottomNav.tsx`)**:
   - **Admins & Super Admins**: The **"Payouts"** tab is always available in the navigation bar (`/admin/payouts`) so administrators can always access settings, review historical settlements, adjust default rates, or toggle the module on/off at will.
   - **Specialists (OCS)**: The **"Earnings"** tab (`/inspector/payouts`) is dynamically toggled:
     - When `enable_payouts === true`: Appears in the specialist navigation menu.
     - When `enable_payouts === false`: Completely hidden from the specialist navigation menu, and direct URL access redirects to their dashboard.
2. **Administrator Portal (`src/app/admin/payouts/page.tsx` & `src/components/AdminPayoutsManager.tsx`)**:
   - Organization toggle switch: turns Payouts module On/Off instantly.
   - Configurable baseline per-audit rate input.
   - KPI Strip: *Pending Approval*, *Approved / Ready to Pay*, *Total Paid Out*.
   - Filterable ledger table with multi-select checkboxes.
   - Batch approval action ("Approve Selected").
   - Settlement modal to capture payment transaction reference (e.g., ACH, Stripe, Check ID) and accounting notes.
3. **Specialist Portal (`src/app/inspector/payouts/page.tsx`)**:
   - Guarded: redirects out if the tenant organization has disabled the module.
   - Personal KPI cards: *Pending Review*, *Approved for Payout*, *Total Paid Out*.
   - Inspection ledger table with audit dates, property names, compensation amounts, and direct links to view completed audit reports.

---

## 3. Verification & Build
- `npx tsc --noEmit`: Completed with **0 errors**.
- `npm run build`: Production build succeeded with all 24 routes compiled cleanly (including `/admin/payouts` and `/inspector/payouts`).
