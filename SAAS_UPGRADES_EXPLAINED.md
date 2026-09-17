# Amenity Op's — SaaS Upgrades: "What Is It & How It Works" Guide

This guide provides an executive and technical breakdown of the 8 major upgrades requested for the **Amenity Op's** platform. For each task, it explains:
1. **What Is It?** (Plain-language business purpose and user experience)
2. **Current State vs. Future State** (Where the app is today vs. where it needs to be)
3. **How It Works** (Technical architecture, workflow steps, database models, and components)
4. **Key Edge Cases & Considerations**

---

## Table of Contents
- [Task 1: Multi-Tenant Architecture & License-Based Access](#task-1-multi-tenant-architecture--license-based-access)
- [Task 2: Migrate to Hostinger VPS Hosting](#task-2-migrate-to-hostinger-vps-hosting)
- [Task 3: Property-Centric Staff Assignment & Scheduling Logic](#task-3-property-centric-staff-assignment--scheduling-logic)
- [Task 4: Mandatory Password Reset on First Login](#task-4-mandatory-password-reset-on-first-login)
- [Task 5: Specialist (OCS) Payment & Payouts Section](#task-5-specialist-ocs-payment--payouts-section)
- [Task 6: GPS Tracking & Geo-Fencing Capabilities](#task-6-gps-tracking--geo-fencing-capabilities)
- [Task 7: Specialist In-App Chat & Messaging Section](#task-7-specialist-in-app-chat--messaging-section)
- [Task 8: Specialist Performance Tracking & Operational Metrics](#task-8-specialist-performance-tracking--operational-metrics)
- [Suggested Implementation Roadmap](#suggested-implementation-roadmap)

---

## Task 1: Multi-Tenant Architecture & License-Based Access

### 1. What Is It?
Currently, Amenity Op's operates as a single private business tool for Jerome and his direct team. This upgrade turns Amenity Op's into a **B2B SaaS platform** where multiple independent property management companies (tenants) can create accounts, purchase licenses, and use the software for their own buildings and internal staff—with absolute data privacy between companies.

### 2. Current State vs. Future State
* **Current State**:
  * One single organization. All properties, templates, inspections, and users share the same unpartitioned namespace.
* **Future State**:
  * **Shared Database, Shared Schema (Logical Isolation)**: All clients use the same database, but every record is strictly segregated by `tenant_id`.
  * **Licensing Model**: A corporate account buys a license tier (e.g., 5 Properties, 20 Properties, Unlimited). The platform enforces SKU license limits when adding buildings.
  * **Global Management Layer**: Amenity Op's owners (SaaS Super Admins) have an apex view across all corporate accounts, billing status, and platform health.

### 3. How It Works

```
┌────────────────────────────────────────────────────────┐
│   Global System Admins (Amenity Op's Super Admin)      │
│   - Manage corporate subscriptions, billing & vetting │
└───────────────────────────┬────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        ▼                                       ▼
┌───────────────────────────┐       ┌───────────────────────────┐
│ Tenant A (e.g. Apex Living)│      │ Tenant B (e.g. Metro PM)  │
│ - tenant_id = "tenant_1"  │       │ - tenant_id = "tenant_2"  │
│ - 5 Property Licenses     │       │ - 12 Property Licenses    │
│ - Isolated In-House Staff │       │ - Isolated In-House Staff │
│ - Isolated Checklists     │       │ - Isolated Checklists     │
└───────────────────────────┘       └───────────────────────────┘
```

1. **Database Schema**:
   * Create a `tenants` table (`id`, `name`, `license_tier`, `max_properties`, `subscription_status`, `created_at`).
   * Add `tenant_id UUID REFERENCES tenants(id)` to `profiles`, `properties`, `inspections`, `checklist_templates`.
2. **Row Level Security (RLS)**:
   * Policies verify `tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())`.
   * Tenant A users cannot query, read, or mutate Tenant B rows under any condition.
   * System Admins bypass the tenant check via `is_global_admin() = true`.
3. **License Gate**:
   * When creating a property, the server checks:
     `current_property_count < tenant.max_properties`.
   * If the limit is reached, the UI displays an "Upgrade License" prompt.

---

## Task 2: Migrate to Hostinger VPS Hosting

### 1. What Is It?
The app currently runs on Vercel's serverless Hobby infrastructure. This upgrade moves the web application to a dedicated **Hostinger Virtual Private Server (VPS)** running Linux (Ubuntu), giving full control over the runtime environment, background processes, and compute resources.

### 2. Current State vs. Future State
* **Current State**:
  * Vercel serverless functions with 10s–60s execution limits, strict memory boundaries, and Hobby account author restrictions.
* **Future State**:
  * Dedicated Virtual Private Server on Hostinger running continuously with Docker or PM2, Nginx reverse proxy, automatic SSL certificates (Let's Encrypt), and GitHub Actions auto-deployment.

### 3. How It Works
1. **Server Environment Setup**:
   * Install Ubuntu 24.04 LTS, Node.js runtime, Docker, Nginx, and UFW firewall.
2. **Reverse Proxy & SSL**:
   * Nginx listens on port 80/443 and reverse-proxies requests to `http://localhost:3000` (the Next.js app).
   * Certbot manages automated SSL renewals for `portal.amenityops.app`.
3. **Process Management**:
   * The Next.js application runs as a containerized Docker service or managed via PM2 (`pm2 start npm --name "amenityops" -- start`).
4. **CI/CD Pipeline**:
   * GitHub Actions workflow triggers on push to `main`: runs tests/build, pushes Docker image or executes SSH deploy script on Hostinger VPS, and runs database migrations.
5. **Database & Storage**:
   * Supabase PostgreSQL, Auth, and Storage buckets continue running seamlessly via the Supabase client without needing to be physically relocated.

---

## Task 3: Property-Centric Staff Assignment & Scheduling Logic

### 1. What Is It?
Instead of an administrator manually picking an inspector every time a single inspection checklist is scheduled, **inspectors/specialists are assigned directly to the property itself**. Any audits that take place at that property automatically route to the assigned specialist(s).

### 2. Current State vs. Future State
* **Current State**:
  * Properties exist on their own. When an admin clicks "Start Inspection," they must manually select both a Checklist Type and an Inspector for that specific run.
* **Future State**:
  * Properties have designated assigned specialists (Primary, Backup, or In-House Staff).
  * Inspectors only see and access properties they are actively assigned to.
  * External vetted contractors (marketplace) can be dynamically linked to designated property licenses without gaining access to the rest of the corporate tenant.

### 3. How It Works

```
┌─────────────────┐       Assigned Via       ┌──────────────────────┐
│    Property     │ ───────────────────────> │ Specialist (OCS)     │
│ (Luxury Towers) │  property_assignments    │ (John Doe - OCS-1042)│
└────────┬────────┘                          └──────────┬───────────┘
         │                                              │
         │ Automatically Scoped & Dispatched            │
         ▼                                              ▼
┌───────────────────────────────────────────────────────────────────┐
│ Active / Scheduled Inspections for Luxury Towers                   │
│ - Assigned to John Doe automatically                              │
│ - Visible on John Doe's "My Assignments" board                     │
└───────────────────────────────────────────────────────────────────┘
```

1. **Junction Table (`property_specialist_assignments`)**:
   * Tracks `property_id`, `specialist_id`, `assignment_type` (`'primary'`, `'backup'`, `'in_house'`).
2. **Access Control**:
   * A specialist's dashboard queries only inspections where:
     `inspector_id = auth.uid()` OR `property_id IN (SELECT property_id FROM property_specialist_assignments WHERE specialist_id = auth.uid())`.
3. **Workflow**:
   * In Property Settings, an admin manages the "Assigned Specialists" list.
   * When a routine audit is generated or started, it auto-assigns the primary specialist.

---

## Task 4: Mandatory Password Reset on First Login

### 1. What Is It?
When an admin provisions a new team member or contractor account from `/admin/team`, they set a temporary initial password. For security and compliance, the specialist must be **forced to change their password on their very first sign-in** before they can view assignments or access any property data.

### 2. Current State vs. Future State
* **Current State**:
  * Specialists keep using the admin-assigned password forever unless they voluntarily visit the profile or forgot-password page.
* **Future State**:
  * After logging in with the temporary password, the user is immediately intercepted and redirected to `/force-password-change`. Navigation to any other page is blocked until completed.

### 3. How It Works
1. **Database Flag**:
   * Add `must_reset_password boolean DEFAULT true` to `profiles`.
2. **Next.js Proxy Interception (`src/proxy.ts`)**:
   * When an authenticated session is detected, the proxy checks the user's `must_reset_password` flag.
   * If `true` and the current path is NOT `/force-password-change` or `/api/auth/signout`:
     $\rightarrow$ Immediately 307 Redirect to `/force-password-change`.
3. **Password Update Screen**:
   * The specialist enters their new password twice (validated for length and complexity).
   * Upon successful update, the server action updates the user in Supabase Auth and sets `must_reset_password = false` on their `profiles` row.
   * The user is redirected to their dashboard (`/inspector`).

---

## Task 5: Specialist (OCS) Payment & Payouts Section

### 1. What Is It?
A dedicated financial tracking and compensation module for Operations Continuity Specialists. Specialists can see how much they have earned from completed audits, track payout statuses, and view past payouts. Admins can review completed work, approve payouts, and log disbursements.

### 2. Current State vs. Future State
* **Current State**:
  * No financial tracking. Compensation is calculated and handled entirely outside the application.
* **Future State**:
  * An integrated ledger that calculates earnings upon inspection completion, tracks payment status (`pending`, `approved`, `paid`), and provides payout statements.

### 3. How It Works
1. **Rate Configuration**:
   * Admin sets a compensation rate (e.g. flat rate per completed inspection, e.g. $75/audit, or custom rate per specialist/property).
2. **Automatic Ledger Entry**:
   * When `/api/inspections/[id]/complete` marks an inspection as completed, it automatically generates a record in `specialist_payouts`:
     * `specialist_id`: assigned inspector
     * `inspection_id`: completed inspection
     * `amount`: configured rate
     * `status`: `'pending'`
3. **Specialist Portal View (`/inspector/payouts`)**:
   * KPI Cards: *Earned This Month*, *Pending Approval*, *Total Paid Out*.
   * Detailed breakdown list with audit date, property name, checklist type, amount, and payment status.
4. **Admin Approval View (`/admin/payouts`)**:
   * Admins can filter by specialist, select pending items, click "Approve Payout", and record payment references (e.g., Stripe, ACH, check reference).

---

## Task 6: GPS Tracking & Geo-Fencing Capabilities

### 1. What Is It?
A comprehensive location-verification and shift-telemetry suite that verifies specialists are physically on-site, records breadcrumbs of their route, and automatically captures entry, exit, and dwell times at client properties. Each property can have GPS/geofencing individually enabled or disabled.

### 2. Current State vs. Future State
* **Current State**:
  * No location services. Verification relies solely on timestamped photos.
* **Future State**:
  * Per-property toggle for GPS/Geofencing.
  * Real-time GPS breadcrumbs, transit speed calculation, and coordinate logs.
  * Geofenced virtual perimeters with automatic arrival, duration, and departure timestamps.

### 3. How It Works

```
                   Property Virtual Perimeter
                 ┌─────────────────────────────┐
                 │       Geofence Radius       │
   Inspector     │          (e.g. 100m)        │
   Approaching   │      ┌───────────────┐      │
       ● ──────> │ ───> │   Building    │      │
 (Speed logged)  │      └───────────────┘      │
                 │                             │
                 └─────────────────────────────┘
                  ▲                           ▲
                  │                           │
          Arrival Event:             Departure Event:
       - Log exact timestamp      - Log exact timestamp
       - Verify specialist on-site - Calculate total dwell time
```

1. **Per-Property Configuration**:
   * Property settings include:
     * `enable_gps_geofencing` (boolean)
     * `latitude` & `longitude` (property GPS coordinates)
     * `geofence_radius_meters` (default 100m)
2. **Geofencing & Boundary Detection**:
   * The client device uses HTML5 Geolocation (`navigator.geolocation.watchPosition`).
   * Uses the **Haversine formula** to calculate distance between current position and the property coordinates:
     $$d = 2r \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$$
   * **Arrival**: When distance $\le$ radius, automatically set `inspections.arrived_at = now()`.
   * **Departure**: When specialist completes inspection and leaves boundary, record `inspections.departed_at = now()`.
   * **Duration**: Total dwell time calculated as `departed_at - arrived_at`.
3. **Continuous GPS Breadcrumbs**:
   * During an in-progress shift, the app streams periodic breadcrumb points (`latitude`, `longitude`, `speed`, `accuracy`, `timestamp`) into `inspection_geo_logs`.
   * Admins can view the specialist's route on a map in the dashboard.

---

## Task 7: Specialist In-App Chat & Messaging Section

### 1. What Is It?
A built-in communication system allowing Operations Continuity Specialists on the ground to communicate directly with administrators, dispatchers, or property managers in real time, especially when dealing with on-site emergencies, locked doors, or questions.

### 2. Current State vs. Future State
* **Current State**:
  * No in-app communication. Teams must use external phone calls, SMS, or WhatsApp.
* **Future State**:
  * Direct 1-on-1 chat between specialists and management.
  * Context-aware incident chats linked directly to active inspections.
  * Real-time message streaming with photo attachment support.

### 3. How It Works
1. **Channel Architecture**:
   * `chat_channels`: Defines chat context (`type: 'direct' | 'inspection_incident'`, `inspection_id`, `property_id`).
   * `chat_messages`: Stores `sender_id`, `channel_id`, `message_text`, `attachment_url`, `created_at`.
2. **Real-Time Engine**:
   * Powered by **Supabase Realtime (Postgres Changes / Broadcast)**.
   * Client subscribes to the channel topic; new messages appear instantly without refreshing.
3. **User Experience**:
   * **Floating Chat Trigger** on the Active Checklist screen: Specialist taps "Contact Dispatch / Admin" to open a drawer and send a note with a quick photo of an obstruction.
   * **Specialist Messaging Tab**: An inbox showing active conversations.
   * **Admin Messaging Hub**: Central dashboard to monitor all active field conversations.

---

## Task 8: Specialist Performance Tracking & Operational Metrics

### 1. What Is It?
An analytics engine and reporting dashboard that tracks specialist productivity, audit quality, punctuality, and throughput across the entire platform.

### 2. Current State vs. Future State
* **Current State**:
  * Simple counts of Total, Pending, In Progress, and Completed inspections on `/admin` and `/inspector`. No quality, punctuality, or checklist-type breakdowns.
* **Future State**:
  * Dedicated metrics view reflecting:
    * Total inspections completed by checklist type (Luxury Condominium vs. 55+ Community vs. Commercial Multi-Tenant).
    * Punctuality rate (scheduled time vs. geofence arrival time).
    * Failure discovery rate and photo compliance.
    * Average inspection completion duration.

### 3. How It Works
1. **Aggregations & Analytics Queries**:
   * Group completed inspections by `checklist_templates.name` and count volume per specialist.
   * Compare `inspections.scheduled_for` with `inspections.arrived_at` to compute on-time percentage.
   * Calculate average visit duration: `AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 60)`.
   * Count total flagged failure items (`inspection_items WHERE status = 'fail'`).
2. **Visualization Screens**:
   * **Admin View (`/admin/team/[id]`)**: Deep-dive analytics for a specific specialist before assigning high-value properties.
   * **Specialist View (`/inspector/metrics`)**: Personal scorecard motivating specialists with performance milestones and completion statistics.

---

## Suggested Implementation Roadmap

```
┌────────────────────────────────────────────────────────────────────────┐
│ Phase 1: Authentication, Scheduling & Lifecycle (Tasks 4 & 3)          │
│ • Task 4: Mandatory password reset on first login                      │
│ • Task 3: Property-centric specialist assignments                      │
│ • Account active/inactive lifecycle & inspection reassignment prompts │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Phase 2: Location Services & Real-Time Communications (Tasks 6 & 7)    │
│ • Task 6: GPS breadcrumb logging & Geofence entry/exit detection       │
│ • Task 7: Specialist-to-Admin real-time in-app messaging               │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Phase 3: Financials & Operational Performance Metrics (Tasks 5 & 8)    │
│ • Task 8: Analytics dashboard (completed by type, on-time rates)       │
│ • Task 5: Specialist compensation ledger and payout portal             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Phase 4: SaaS Multi-Tenancy & VPS Infrastructure (Tasks 1 & 2)         │
│ • Task 1: Tenant schema partitioning (tenant_id) & license tier gates  │
│ • Task 2: Hostinger VPS provisioning (Docker/PM2, Nginx, SSL, CI/CD)   │
└────────────────────────────────────────────────────────────────────────┘
```

---
*Created for the Amenity Op's project repository.*
