# Task 5: Specialist (OCS) Payment & Payouts Section — Architecture & Development Plan

## 1. Executive Summary & Client Requirement Alignment
Per the client brief and direct messages from Jerome:
> **"Task 5 should also have the enable/disable feature."**

Task 5 introduces an integrated financial ledger, rate management, and compensation tracking module for Operational Continuity Specialists (OCS). Because clients use different operational models (1099 Independent Contractors vs. salaried/hourly W-2 internal property maintenance staff), the system must support an **organization-wide Feature Flag (`enable_payouts`)**.

- **When Enabled (1099 Contractor Model)**:
  - Admins can configure baseline audit compensation rates (e.g. $75/audit) and custom property/specialist rate overrides.
  - Submitting a completed inspection automatically creates an earnings ledger item in `specialist_payouts` with status `'pending'`.
  - Admins can review completed work, approve payouts, and log settlement references (e.g., Stripe, ACH, check reference).
  - Specialists get an `/inspector/payouts` portal displaying total earnings, pending approvals, and historical payouts.
  - Navigation bars (`AppShell`, `BottomNav`) show the Payouts tab for both Admin and Specialist.
- **When Disabled (Corporate W-2 Staff Model)**:
  - The Payouts tab is completely hidden from both Admin and Specialist navigation.
  - Inspection completion skips payout ledger generation.
  - Direct URL access to `/inspector/payouts` or `/admin/payouts` gracefully redirects or shows a disabled state.

---

## 2. Technical Architecture & Database Design

### A. Database Layer (`supabase/migrations/0010_specialist_payouts.sql`)
1. **Tenant Feature Flag & Baseline Rates (`tenants` table)**:
   - `enable_payouts boolean not null default false` (or toggleable on/off).
   - `default_payout_rate numeric(10,2) not null default 75.00`.
2. **Property / Template Custom Rate Overrides**:
   - `properties.custom_payout_rate numeric(10,2)` (optional override per property).
3. **Specialist Payouts Ledger (`specialist_payouts` table)**:
   ```sql
   create table if not exists specialist_payouts (
     id uuid primary key default gen_random_uuid(),
     tenant_id uuid references tenants (id) on delete cascade,
     inspection_id uuid not null references inspections (id) on delete cascade,
     specialist_id uuid not null references profiles (id) on delete cascade,
     property_id uuid not null references properties (id) on delete cascade,
     amount numeric(10, 2) not null default 0.00,
     status text not null default 'pending' check (status in ('pending', 'approved', 'paid', 'cancelled')),
     approved_at timestamptz,
     approved_by uuid references profiles (id) on delete set null,
     paid_at timestamptz,
     payment_reference text, -- e.g. ACH-9021, Stripe Transfer id, Check #
     notes text,
     created_at timestamptz not null default now(),
     updated_at timestamptz not null default now(),
     unique (inspection_id)
   );
   ```
4. **Row Level Security (RLS)**:
   - Specialists can read their own payout records (`specialist_id = auth.uid()`).
   - Admins can read, update, and manage all payout records within their `tenant_id` (or all if `is_global_admin`).
   - Global Admins have platform-wide oversight.

---

### B. Backend Pipeline & Server Actions
1. **Automatic Ledger Entry on Inspection Completion (`/api/inspections/[id]/complete/route.ts`)**:
   - When an inspection completes, check if the tenant has `enable_payouts === true`.
   - Calculate compensation rate:
     1. Check if property has `custom_payout_rate`.
     2. Fall back to tenant `default_payout_rate`.
     3. Default to $75.00.
   - Upsert an entry into `specialist_payouts` with `status: 'pending'`.
2. **Payout Management Server Actions (`src/lib/actions/payouts.ts`)**:
   - `toggleTenantPayouts(tenantId, enabled)`: Enables or disables the payouts module.
   - `updateTenantDefaultRate(tenantId, rate)`: Sets baseline audit rate.
   - `approvePayout(payoutId)`: Moves status from `pending` $\rightarrow$ `approved`.
   - `batchApprovePayouts(payoutIds[])`: Bulk approves pending items.
   - `markPayoutPaid(payoutId, { paymentReference, notes })`: Moves status from `approved` $\rightarrow$ `paid`, records timestamp and reference.

---

### C. Frontend & Navigation Layer
1. **Dynamic Navigation (`src/lib/nav-items.ts`, `AppShell.tsx`, `BottomNav.tsx`)**:
   - Accept `enablePayouts?: boolean`.
   - When `enablePayouts === true`:
     - Admin nav adds `{ href: '/admin/payouts', label: 'Payouts', icon: DollarSign / Wallet }`.
     - Specialist nav adds `{ href: '/inspector/payouts', label: 'Earnings', icon: DollarSign / Wallet }`.
   - When `false`: Payout links are omitted.
2. **Specialist Portal (`/inspector/payouts/page.tsx`)**:
   - KPI Cards: *Earned This Month*, *Pending Approval*, *Total Paid Out*.
   - Filterable ledger list: Date, Property, Audit Report link, Amount, Status Badge.
3. **Admin Portal (`/admin/payouts/page.tsx`)**:
   - Module Toggle Header: Enable/Disable Payouts switch + baseline rate setting.
   - Financial Summary Cards: Pending Approval Total, Approved Total, Paid Year-to-Date.
   - Specialist Filter & Status Filter (`all`, `pending`, `approved`, `paid`).
   - Action controls: Batch approve button, Mark Paid modal with payment reference input.

---

## 3. Step-by-Step Implementation Roadmap

| Step | Scope | Description |
|---|---|---|
| **1** | Database Migration | Write `supabase/migrations/0010_specialist_payouts.sql` with `tenants.enable_payouts`, `default_payout_rate`, `properties.custom_payout_rate`, `specialist_payouts` table, indexes, and RLS policies. |
| **2** | Schema & Database Types | Update `supabase/schema.sql` and `src/lib/database.types.ts` to include `specialist_payouts` types and new tenant columns. |
| **3** | Auth DAL Integration | Update `TenantInfo` in `src/lib/auth/dal.ts` to query `enable_payouts` and `default_payout_rate`. |
| **4** | Completion Hook | Update `/api/inspections/[id]/complete/route.ts` to automatically generate pending payout ledger rows when enabled. |
| **5** | Server Actions | Create `src/lib/actions/payouts.ts` with toggle, rate updates, individual/batch approval, and payment confirmation actions. |
| **6** | Dynamic Nav Bars | Update `src/lib/nav-items.ts`, `AppShell.tsx`, `BottomNav.tsx`, and layout files to conditionally render Payouts items based on the tenant toggle. |
| **7** | Admin Payouts UI | Build `src/app/admin/payouts/page.tsx` with module configuration, ledger table, filters, and payment confirmation dialogs. |
| **8** | Specialist Payouts UI | Build `src/app/inspector/payouts/page.tsx` with earnings cards, audit history, and payout status indicators. |
| **9** | Testing & Verification | Verify clean TypeScript compilation (`npx tsc --noEmit`), build execution (`npm run build`), and test toggle behavior. |
