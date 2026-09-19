-- 0013_tenant_onboarding_and_tiered_payouts.sql
-- Multi-Tier Specialist Compensation Matrix (3x3 Grid) & Property Tier Assignment
-- Idempotent — safe to re-run on existing databases.

-- ============================================================
-- 1. Add 3-Tier Compensation Rates & Matrix to Tenants
-- ============================================================

alter table public.tenants
  add column if not exists payout_tier_1_rate numeric(10, 2) not null default 50.00;

alter table public.tenants
  add column if not exists payout_tier_2_rate numeric(10, 2) not null default 75.00;

alter table public.tenants
  add column if not exists payout_tier_3_rate numeric(10, 2) not null default 100.00;

-- Full 3x3 Property Category x Service Tier Matrix
alter table public.tenants
  add column if not exists payout_matrix jsonb not null default '{
    "luxury_condo": { "tier_1": 50.00, "tier_2": 75.00, "tier_3": 100.00 },
    "adult_community": { "tier_1": 55.00, "tier_2": 80.00, "tier_3": 110.00 },
    "commercial_multi": { "tier_1": 65.00, "tier_2": 95.00, "tier_3": 130.00 }
  }'::jsonb;

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
