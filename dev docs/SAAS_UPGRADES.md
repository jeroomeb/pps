# Amenity Op's — SaaS Platform Upgrades Specification

This document details the architectural specifications, requirements, data models, and implementation roadmaps for the 8 major platform upgrades requested for Amenity Op's.

---

## Executive Summary & Business Context

Amenity Op's is transitioning from a single-tenant property audit tool into a multi-tenant B2B SaaS platform and operational marketplace. The system serves two primary customers:
1. **Property Managers / Corporate Clients**: Subscribing directly to Amenity Op's software to manage their own properties and deploy digital audit workflows to their internal staff.
2. **Amenity Op's Managed Services**: Supplying vetted external Operations Continuity Specialists (OCS / independent contractors) to properties that require third-party overnight operational oversight.

---

## Upgrade Tasks Breakdown

### Task 1: Multi-Tenant Architecture & License-Based Access (Shared DB, Shared Schema)
* **Goal**: Enable multiple corporate tenant accounts to operate independently within the same database while strictly isolating their data.
* **Architecture**: **Shared Database, Shared Schema (Logical Isolation)** via row-level security and tenant identifiers (`tenant_id` / `organization_id`).
* **Components**:
  * **Tenants / Organizations**: Each corporate subscriber represents a tenant.
  * **Property Licenses**: Properties operate as licensed SKU units allocated to a tenant account. Tenants have a subscription tier defining their licensed property limit.
  * **Row-Level Logical Isolation**:
    * Core tables (`properties`, `inspections`, `checklist_templates`, `profiles`) gain a `tenant_id` column.
    * Supabase Row Level Security (RLS) policies enforce `tenant_id = auth.current_tenant_id()` for tenant managers and staff.
  * **Global Management Layer**: System Admins (Amenity Op's owners) bypass tenant boundaries to monitor billing, platform health, tenant provisioning, and global worker pools.

### Task 2: Infrastructure Migration to Hostinger VPS Hosting
* **Goal**: Move away from Vercel serverless hosting to a dedicated Hostinger VPS (Virtual Private Server).
* **Motivations & Considerations**:
  * Predictable fixed hosting costs, no serverless execution timeout limits (important for long PDF rendering, geo-telemetry streams, background jobs, or WebSocket messaging).
  * Requires setting up a containerized or Node.js runtime environment (Docker / PM2, Nginx reverse proxy, SSL certbot, automated CI/CD via GitHub Actions).
  * Supabase (PostgreSQL, Auth, Storage) can remain on managed Supabase Cloud or be self-hosted if desired.
  * Preserves environment configuration (`APP_TIMEZONE`, Resend credentials, Supabase keys).

### Task 3: Property-Centric Staff Assignment Engine
* **Goal**: Shift from assigning inspectors to individual checklist forms/audits to assigning inspectors directly to entire properties.
* **Current Model**: An admin creates an inspection and assigns a specialist directly to that one inspection (`inspections.inspector_id`).
* **New Model**:
  * Inspectors/OCS are assigned directly to properties via a join table (`property_specialist_assignments`).
  * Any scheduled or recurring inspection for that property automatically defaults to the assigned specialist(s), or is visible to the assigned property team.
  * Hard-scopes internal staff to prevent unauthorized cross-property data access.
  * Supports marketplace contractor streaming: external vetted contractors can be dynamically granted access to specific property licenses without gaining access to other corporate properties.

### Task 4: Forced Password Reset on First Login
* **Goal**: When an admin provisions an inspector or specialist account, the specialist must be forced to set their own secure password immediately upon their first login before accessing any app features.
* **Mechanism**:
  * Add `must_reset_password boolean DEFAULT true` to `profiles` (or track via Supabase user metadata).
  * Next.js proxy/middleware checks if `must_reset_password === true` and redirects all authenticated requests to `/reset-password` or `/force-password-change`.
  * After setting a new password, the flag is flipped to `false`, allowing normal access to `/inspector`.

### Task 5: Operations Continuity Specialist Payment & Payouts Section
* **Goal**: Provide financial tracking, payout visibility, and rate management for Operations Continuity Specialists.
* **Features**:
  * **Rate Management**: Per-inspection, hourly, or per-property compensation rates defined for specialists or inspection types.
  * **Earnings Ledger**: Automatic ledger entry generation when an audit is marked `completed`.
  * **Specialist Portal View**: Dedicated dashboard section showing:
    * Total earnings (current cycle, monthly, year-to-date)
    * Completed inspections eligible for payout
    * Payout status (`pending`, `approved`, `paid`)
    * Payment history and statements / invoice downloads
  * **Admin Payout Management**: Admin approval screen to batch review completed work, approve payouts, and log settlement references (e.g. Stripe Connect, ACH, or manual payroll tracking).

### Task 6: GPS Tracking & Geo-Fencing Capabilities
* **Goal**: Verify specialist presence on-site, log transit telemetry, and record audit timestamps with enable/disable toggles per property.
* **Per-Property Toggle**:
  * Admins can enable or disable GPS/Geofencing per property (`properties.enable_gps_geofencing`).
* **Capabilities**:
  * **Continuous GPS Tracking**:
    * Breadcrumb trail: Logs specialist coordinates while an audit is in progress.
    * Speed and transit monitoring: Calculates movement velocity between scheduled assets.
    * Live positioning: Real-time coordinate updates during active shifts.
  * **Geofencing & Perimeter Monitoring**:
    * Digital boundary around property coordinates (`latitude`, `longitude`, `radius_meters`).
    * **Arrival timestamp**: Automatically captured the exact moment the specialist enters the virtual perimeter.
    * **Duration of visit**: Total elapsed dwell time inside the property perimeter.
    * **Departure timestamp**: Automatically recorded when the specialist crosses back outside the boundary upon audit hand-off.

### Task 7: Specialist Chat & Messaging Section
* **Goal**: In-app communication channel between Operations Continuity Specialists and administrators / dispatch / property managers.
* **Features**:
  * Direct 1-on-1 messaging between assigned specialist and property admin/manager.
  * Inspection/Incident-specific chat threads: Specialists can ask questions or report live on-site blockers (e.g. locked gates, safety alerts) directly tied to an active inspection.
  * Real-time delivery via Supabase Realtime (WebSockets) or polling.
  * Photo & attachment sharing within chat for quick resolution without waiting for formal report generation.

### Task 8: Specialist Performance & Operational Tracking Metrics
* **Goal**: Comprehensive analytics and reporting on specialist performance across the platform.
* **Metrics Provided**:
  * **Volume & Types**: Total inspections completed broken down by checklist template (e.g., Luxury Condominium vs. 55+ Community vs. Commercial Multi-Tenant).
  * **On-Time Performance**: Punctuality vs. scheduled start times (utilizing geofence arrival data).
  * **Audit Thoroughness**: Average audit duration, count of flagged issues/failures, photo documentation rates.
  * **SaaS Platform Aggregates**: View metrics per specialist, per property, and across the entire tenant organization.

---

## Database Schema Enhancements (Planned)

```sql
-- 1. Tenant logical isolation
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  license_tier TEXT NOT NULL DEFAULT 'standard',
  max_property_licenses INT NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Property Staff Assignments (Task 3)
CREATE TABLE IF NOT EXISTS property_specialist_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  specialist_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  role_type TEXT NOT NULL DEFAULT 'primary_inspector', -- 'primary', 'backup', 'staff'
  UNIQUE (property_id, specialist_id)
);

-- 3. Geo-Telemetry & Geofencing (Task 6)
ALTER TABLE properties 
  ADD COLUMN IF NOT EXISTS enable_gps_geofencing BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS geofence_radius_meters INT DEFAULT 100;

CREATE TABLE IF NOT EXISTS inspection_geo_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  inspector_id UUID NOT NULL REFERENCES profiles(id),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  speed_meters_per_sec DOUBLE PRECISION,
  accuracy_meters DOUBLE PRECISION,
  is_inside_geofence BOOLEAN,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Payouts Ledger (Task 5)
CREATE TABLE IF NOT EXISTS specialist_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_id UUID NOT NULL REFERENCES profiles(id),
  inspection_id UUID REFERENCES inspections(id) ON DELETE SET NULL,
  amount_cents INT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')) DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Chat & Messaging (Task 7)
CREATE TABLE IF NOT EXISTS chat_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  inspection_id UUID REFERENCES inspections(id) ON DELETE SET NULL,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  channel_type TEXT NOT NULL DEFAULT 'direct', -- 'direct', 'inspection_incident'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  attachment_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## Suggested Implementation Sequence

1. **Sprint 1 (Core Identity, Scheduling & Authentication)**:
   * Task 4: Forced Password Reset on First Login.
   * Task 3: Shift Property Scheduling logic to direct property assignments.
   * Add account activation / deactivation / deletion flow with reassignment notices.
2. **Sprint 2 (Analytics & Financials)**:
   * Task 8: Specialist Tracking & Performance Metrics dashboard.
   * Task 5: Specialist Payment & Payouts ledger.
3. **Sprint 3 (Location Services & Real-time Communications)**:
   * Task 6: GPS breadcrumb logging & Geofencing arrival/departure verification.
   * Task 7: Chat & Messaging module.
4. **Sprint 4 (SaaS Multi-Tenancy & VPS Migration)**:
   * Task 1: Logical schema isolation (`tenant_id`), license limits.
   * Task 2: Hostinger VPS setup (Docker, Nginx, SSL, CI/CD).
