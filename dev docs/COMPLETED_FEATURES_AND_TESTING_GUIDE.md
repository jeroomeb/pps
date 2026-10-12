# Amenity Op's — Completed Features & Testing Guide

This document summarizes the functionality delivered across Tasks 1, 3, 4, 5, 6, and 8, along with clear and concise instructions on how to test each feature.

---

## Task 1: Multi-Tenancy & Platform Licensing

### What Was Built
* **Tenant Isolation**: Shared database architecture isolating data (properties, templates, team, inspections) by organization (`tenant_id`).
* **Licensing SKU Tiers**: Tier-based property caps (`max_property_licenses` — Starter, Standard, Pro, Enterprise) preventing creation beyond license limit.
* **Global Super-Admin Portal (`/admin/tenants`)**: Manage organizations, adjust tiers, modify property capacity, and control organization active/suspended status.
* **Team Lifecycle & Inspection Reassignment**: Deactivate team members with a prompt to automatically reassign their open audits.

### How to Test
1. **License Limits**: Log in as Admin $\rightarrow$ Go to `/admin/properties/new` $\rightarrow$ Create properties until your tier limit is reached $\rightarrow$ Verify the license limit warning blocks further creation.
2. **Tenants Portal**: Log in as Super Admin $\rightarrow$ Navigate to `/admin/tenants` $\rightarrow$ Edit an organization's property capacity or tier $\rightarrow$ Confirm changes apply instantly.
3. **Deactivate & Reassign**: Go to `/admin/team` $\rightarrow$ Click **Deactivate** on a specialist with open inspections $\rightarrow$ Pick a replacement specialist in the modal $\rightarrow$ Confirm account is deactivated and audits are reassigned.

---

## Task 3: Property Staff Rosters & Photo ID Requirements

### What Was Built
* **Property Staff Rosters**: Assign multiple specialists (Primary, Backup, Staff) to a single property.
* **Specialist Selection Prioritization**: Scheduled inspection dropdowns prioritize and highlight assigned roster members.
* **Photo ID Verification Toggle**: Per-property switch to enforce Driver's License ID submission for 1099 contractors while exempting W-2 staff.

### How to Test
1. **Manage Staff Roster**: Go to `/admin/properties/[id]` $\rightarrow$ Scroll to **Staff Roster Manager** $\rightarrow$ Assign specialists and set roles (Primary/Backup) $\rightarrow$ Verify assigned members appear on the property roster.
2. **Prioritized Assignment**: Create or edit an inspection for that property $\rightarrow$ Verify assigned roster specialists appear at the top of the specialist dropdown.
3. **Photo ID Toggle**: Edit property $\rightarrow$ Toggle **"Require Driver's License ID Verification"** On/Off $\rightarrow$ Log in as an assigned specialist at `/inspector/profile` $\rightarrow$ Verify mandatory vs. optional ID upload banner updates accordingly.

---

## Task 4: Forced Password Reset on First Login

### What Was Built
* **Mandatory First-Login Setup**: Newly provisioned accounts are required to change their temporary password upon initial login.
* **Authentication Interception Guard**: Unactivated accounts attempting to access `/admin` or `/inspector` are automatically redirected to `/force-password-change`.
* **Team Status Visibility**: Admin team listing displays an amber **"Setup Pending"** badge until the user completes their password change.

### How to Test
1. **Create Team Member**: Go to `/admin/team` $\rightarrow$ Add a new specialist with a temporary password $\rightarrow$ Verify their row displays **"Setup Pending"**.
2. **First Login**: Log out $\rightarrow$ Log in with the new user's temporary credentials $\rightarrow$ Confirm you are redirected to `/force-password-change`.
3. **Set New Password**: Enter the temporary password and choose a new 8+ character password $\rightarrow$ Submit $\rightarrow$ Verify you are routed to your dashboard and the badge in `/admin/team` clears.

---

## Task 5: Specialist Compensation & Payouts Section

### What Was Built
* **Organization Enable/Disable Toggle**: Turn the payouts ledger on for contractor models or off for salaried/W-2 staff.
* **Tiered Payout Rates**: Property custom rate overrides tenant baseline rate.
* **Automatic Ledger on Audit Submit**: Submitting an inspection creates a pending payout record.
* **Admin Payouts Portal (`/admin/payouts`)**: Filter, batch-approve, and mark payouts as paid with payment reference numbers.
* **Specialist Earnings Portal (`/inspector/payouts`)**: Personal earnings KPIs and payment history.

### How to Test
1. **Enable & Set Rates**: Go to `/admin/payouts` $\rightarrow$ Toggle Payouts **ON** $\rightarrow$ Set default rate (e.g., $85.00).
2. **Automatic Payout Generation**: Submit an inspection as a specialist $\rightarrow$ Check `/admin/payouts` $\rightarrow$ Confirm a new **Pending Approval** record appeared with the correct rate.
3. **Approval & Payment**: In `/admin/payouts`, select the payout $\rightarrow$ Click **Approve** $\rightarrow$ Click **Mark as Paid** $\rightarrow$ Enter transaction reference $\rightarrow$ Confirm status transitions to **Paid**.
4. **Specialist View**: Log in as the specialist $\rightarrow$ Go to `/inspector/payouts` $\rightarrow$ Verify the audit appears in personal earnings.

---

## Task 6: GPS Tracking & Virtual Geofencing

### What Was Built
* **Per-Property Geofencing Toggle**: Enable/disable GPS tracking per property with custom boundary radius (50m, 100m, 200m, 500m).
* **Location Detection Helper**: "Set to Current Device Location" button on property form.
* **Real-Time Checklist Indicator**: Live banner showing on-site verification status (🟢 On-Site vs 🟡 Outside Perimeter), distance to center, and speed.
* **Automatic Arrival & Dwell Tracking**: Captures entry timestamp and computes total on-site dwell duration upon submission.
* **Audit Telemetry Report**: Displays arrival/departure times, dwell duration, coordinates, and collapsible GPS breadcrumb log table.

### How to Test
1. **Set Property Coordinates**: Go to `/admin/properties/[id]/edit` $\rightarrow$ Enable GPS Geofencing $\rightarrow$ Click **"Set to Current Device Location"** (or enter coordinates) $\rightarrow$ Save.
2. **Checklist Telemetry**: Open the inspection at `/inspector/inspections/[id]` on a mobile device or browser with location permissions $\rightarrow$ Observe the live indicator displaying proximity to the perimeter.
3. **View Report Telemetry**: Submit inspection $\rightarrow$ Open report at `/admin/reports/[id]` $\rightarrow$ Review the **On-Site Audit & Geo-Telemetry Verification** card showing arrival time, departure time, dwell duration, and the breadcrumb log table.

---

## Task 8: Specialist Performance & Operational Metrics

### What Was Built
* **Admin Analytics Hub (`/admin/analytics`)**: Organization-wide dashboard with time-horizon filters (7D, 30D, 90D, All-Time).
* **Core KPI Metrics**: Total completed audits, completion %, on-time arrival punctuality %, avg audit duration, avg GPS dwell time, issue discovery rate, and photo evidence compliance %.
* **Checklist Distribution**: Volume breakdown by template (e.g. Luxury Condominium, 55+ Community, Commercial Multi-Tenant).
* **Specialist Leaderboard**: Ranks specialists with metrics and tier badges (*Elite*, *Senior*, *Standard*).
* **Specialist Personal Scorecard (`/inspector/metrics` & `/admin/team/[id]`)**: Scorecard tracking personal milestones, punctuality streaks, and checklist experience.

### How to Test
1. **Admin Analytics**: Go to `/admin/analytics` $\rightarrow$ Switch between **7 Days**, **30 Days**, **90 Days**, and **All-Time** $\rightarrow$ Verify KPI strip, template distribution bars, and specialist rankings update.
2. **Specialist Scorecard**: Log in as a specialist $\rightarrow$ Go to `/inspector/metrics` $\rightarrow$ Check personal performance tier badge, on-time punctuality rate, and checklist breakdown.
3. **Team Member Deep Dive**: Go to `/admin/team/[id]` for any specialist $\rightarrow$ Confirm their full performance scorecard renders at the top of their profile.
