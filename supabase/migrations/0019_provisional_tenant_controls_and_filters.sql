-- Migration: 0019_provisional_tenant_controls_and_filters.sql
-- Idempotent schema updates for client feedback:
-- 1. allow_checklist_management toggle on tenants (default: false)
--    Provisional tenants cannot modify, clone, or create checklists unless enabled by Super Admin.
-- 2. enable_predictive_scoring toggle on tenants (default: true)
--    Super admin can enable/disable predictive risk modeling at the tenant level.

-- 1. Checklist management permission per tenant (default: false = read-only for provisional tenants)
alter table public.tenants
  add column if not exists allow_checklist_management boolean not null default false;

-- 2. Predictive risk scoring toggle per tenant (default: true)
alter table public.tenants
  add column if not exists enable_predictive_scoring boolean not null default true;
