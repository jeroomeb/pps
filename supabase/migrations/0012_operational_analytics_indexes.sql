-- 0012_operational_analytics_indexes.sql
-- High-Performance Composite Indexes for Specialist Performance & Operational Tracking Aggregations
-- Idempotent — safe to re-run on existing databases.

-- 1. Index on inspections for tenant-level, status, and completion time lookups
create index if not exists inspections_analytics_completed_idx
  on public.inspections (tenant_id, status, completed_at);

-- 2. Index on inspections for specialist-specific performance lookups
create index if not exists inspections_specialist_perf_idx
  on public.inspections (inspector_id, status, completed_at);

-- 3. Index on inspection_items for rapid status and photo compliance aggregations
create index if not exists inspection_items_status_analytics_idx
  on public.inspection_items (inspection_id, status);

-- 4. Index on inspections for scheduled start and arrival comparisons
create index if not exists inspections_punctuality_idx
  on public.inspections (scheduled_for, arrived_at)
  where scheduled_for is not null;
