-- 0010_specialist_payouts.sql
-- Specialist (OCS) Compensation & Payouts Ledger with Tenant Feature Flag Toggle
-- Idempotent — safe to re-run on existing databases.

-- ============================================================
-- 1. Tenant Payout Feature Flag & Baseline Rates
-- ============================================================

alter table public.tenants
  add column if not exists enable_payouts boolean not null default false;

alter table public.tenants
  add column if not exists default_payout_rate numeric(10, 2) not null default 75.00;

-- Optional property-level payout override rate
alter table public.properties
  add column if not exists custom_payout_rate numeric(10, 2);

-- ============================================================
-- 2. Specialist Payouts Ledger Table
-- ============================================================

create table if not exists public.specialist_payouts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants (id) on delete cascade,
  inspection_id uuid not null references public.inspections (id) on delete cascade,
  specialist_id uuid not null references public.profiles (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  amount numeric(10, 2) not null default 0.00,
  status text not null default 'pending' check (status in ('pending', 'approved', 'paid', 'cancelled')),
  approved_at timestamptz,
  approved_by uuid references public.profiles (id) on delete set null,
  paid_at timestamptz,
  payment_reference text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint specialist_payouts_inspection_id_unique unique (inspection_id)
);

create index if not exists specialist_payouts_tenant_id_idx on public.specialist_payouts (tenant_id);
create index if not exists specialist_payouts_specialist_id_idx on public.specialist_payouts (specialist_id);
create index if not exists specialist_payouts_property_id_idx on public.specialist_payouts (property_id);
create index if not exists specialist_payouts_status_idx on public.specialist_payouts (status);

-- ============================================================
-- 3. Row Level Security on specialist_payouts
-- ============================================================

alter table public.specialist_payouts enable row level security;

drop policy if exists "payouts_select" on public.specialist_payouts;
create policy "payouts_select" on public.specialist_payouts
  for select using (
    current_user_is_global_admin()
    or specialist_id = auth.uid()
    or (current_role_is_admin() and tenant_id = current_user_tenant_id())
  );

drop policy if exists "payouts_admin_write" on public.specialist_payouts;
create policy "payouts_admin_write" on public.specialist_payouts
  for all using (
    current_user_is_global_admin()
    or (current_role_is_admin() and tenant_id = current_user_tenant_id())
  ) with check (
    current_user_is_global_admin()
    or (current_role_is_admin() and tenant_id = current_user_tenant_id())
  );
