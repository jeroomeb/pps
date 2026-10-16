-- Migration: 0018_client_review_enhancements.sql
-- Idempotent schema updates for 10-point client review:
-- 1. Per-property predictive scoring toggle
-- 2. Per-checklist predictive scoring toggle
-- 3. Storing recurring item failure tracking in property_risk_scores

-- 1. Per-property predictive scoring toggle (default: true)
alter table public.properties
  add column if not exists enable_predictive_scoring boolean not null default true;

-- 2. Per-checklist predictive scoring toggle (default: true)
alter table public.checklist_templates
  add column if not exists enable_predictive_scoring boolean not null default true;

-- 3. Add recurring_items column to property_risk_scores (jsonb array of recurring failed question titles)
alter table public.property_risk_scores
  add column if not exists recurring_items jsonb not null default '[]'::jsonb;

-- 4. Add recurring_items column to inspections (frozen alongside predicted_score)
alter table public.inspections
  add column if not exists predicted_recurring_items jsonb not null default '[]'::jsonb;
