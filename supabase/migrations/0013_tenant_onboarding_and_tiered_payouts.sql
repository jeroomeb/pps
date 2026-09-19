-- 0013_tenant_onboarding_and_tiered_payouts.sql
-- Multi-Tier Specialist Compensation Matrix & Property Tier Assignment
-- Idempotent — safe to re-run on existing databases.

-- ============================================================
-- 1. Add 3-Tier Compensation Rates to Tenants
-- ============================================================

alter table public.tenants
  add column if not exists payout_tier_1_rate numeric(10, 2) not null default 50.00;

alter table public.tenants
  add column if not exists payout_tier_2_rate numeric(10, 2) not null default 75.00;

alter table public.tenants
  add column if not exists payout_tier_3_rate numeric(10, 2) not null default 100.00;

-- ============================================================
-- 2. Add Payout Tier Classification to Properties
-- ============================================================

alter table public.properties
  add column if not exists payout_tier text not null default 'tier_2';

-- Add check constraint for valid payout tiers if not already present
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'properties_payout_tier_check'
  ) then
    alter table public.properties
      add constraint properties_payout_tier_check
      check (payout_tier in ('tier_1', 'tier_2', 'tier_3', 'custom'));
  end if;
end $$;

-- Index on property payout tier for analytical grouping
create index if not exists properties_payout_tier_idx on public.properties (payout_tier);
