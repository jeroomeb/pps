# Task 6: GPS Tracking & Geo-Fencing Capabilities — Architecture & Development Plan

## 1. Executive Summary & Goals
The objective of Task 6 is to equip the Amenity Op's platform with on-site location verification, audit duration tracking (dwell time), continuous field telemetry (breadcrumbs), and virtual geofencing per property.

Key capabilities:
1. **Per-Property Toggle & Geofence Boundary**:
   - Each property has `enable_gps_geofencing` (boolean), `latitude`, `longitude`, and `geofence_radius_meters` (default 100m).
   - Allows clients to enforce rigorous physical presence verification on critical luxury/commercial assets while disabling it for exempt or remote sites.
2. **Automatic Geofence Event Detection**:
   - **Arrival Timestamp (`arrived_at`)**: Automatically captured the moment the specialist enters the virtual boundary ($d \le r$).
   - **Departure Timestamp (`departed_at`)**: Automatically recorded when the specialist exits the perimeter or concludes the audit.
   - **Dwell Time (`dwell_time_seconds`)**: Total elapsed time spent actively on-site within the property perimeter.
3. **Continuous Field Telemetry & Breadcrumb Logs**:
   - Streams periodic coordinate points (`latitude`, `longitude`, `speed`, `accuracy`, `distance_to_center`) to `inspection_geo_logs` during active audits.
4. **Visual On-Site Status Indicator & Audit Telemetry Report**:
   - Real-time indicator banner in the specialist's checklist (e.g., 🟢 *On-Site & Verified • Within 45m*).
   - Telemetry analytics card in the final inspection report displaying arrival, departure, total dwell duration, coordinate logs, and geofence verification badge.

---

## 2. Mathematical Model: Haversine Formula
The system calculates the great-circle distance between the specialist's device coordinates $(\phi_1, \lambda_1)$ and the property center coordinates $(\phi_2, \lambda_2)$ using the **Haversine formula**:

$$\Delta \phi = \phi_2 - \phi_1$$
$$\Delta \lambda = \lambda_2 - \lambda_1$$
$$a = \sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)$$
$$c = 2 \cdot \text{atan2}\left(\sqrt{a}, \sqrt{1 - a}\right)$$
$$d = R \cdot c$$

Where:
- $R = 6,371,000 \text{ meters}$ (mean Earth radius).
- The specialist is **Inside Geofence** if $d \le \text{geofence\_radius\_meters}$.

---

## 3. Database Architecture & Schema Design

### A. Schema Enhancements (`0011_gps_geofencing_telemetry.sql`)
1. **Properties Table**:
   - `enable_gps_geofencing boolean not null default true`
   - `latitude double precision`
   - `longitude double precision`
   - `geofence_radius_meters integer not null default 100`
2. **Inspections Table**:
   - `arrived_at timestamptz`
   - `departed_at timestamptz`
   - `dwell_time_seconds integer`
   - `geofence_status text not null default 'pending' check (geofence_status in ('pending', 'verified', 'outside', 'exempt'))`
3. **`inspection_geo_logs` Table**:
   ```sql
   create table if not exists inspection_geo_logs (
     id uuid primary key default gen_random_uuid(),
     tenant_id uuid references tenants(id) on delete cascade,
     inspection_id uuid not null references inspections(id) on delete cascade,
     specialist_id uuid not null references profiles(id) on delete cascade,
     property_id uuid not null references properties(id) on delete cascade,
     latitude double precision not null,
     longitude double precision not null,
     speed_meters_per_sec double precision,
     accuracy_meters double precision,
     distance_to_center_meters double precision,
     is_inside_geofence boolean not null default false,
     logged_at timestamptz not null default now()
   );
   ```

---

## 4. UI/UX Workflows

1. **Property Setup (`/admin/properties/new` & `/admin/properties/[id]/edit`)**:
   - Add GPS toggle: "Enable GPS Tracking & Virtual Geofencing".
   - Latitude and Longitude fields.
   - Convenient "Use Current Device Location" button to auto-fill coordinates while on-site.
   - Geofence radius selector (50m, 100m, 200m, 500m).

2. **Specialist Checklist (`/inspector/inspections/[id]`)**:
   - Mounted `GpsTelemetryTracker`:
     - Requests geolocation permission via HTML5 `navigator.geolocation.watchPosition`.
     - Displays live status chip:
       - 🟢 **On-Site & Verified** (e.g. *28m from center • Geofence active*).
       - 🟡 **Outside Perimeter** (e.g. *350m away • 100m radius*).
       - ⚪ **GPS Verification Exempt** (if property has GPS turned off).
     - Periodically streams breadcrumbs to `logInspectionGeoBreadcrumb`.
     - Automatically logs `arrived_at` when specialist enters the geofence.

3. **Report View (`/admin/reports/[id]` & specialist completed view)**:
   - Dedicated **Audit On-Site & Geo Telemetry Card**:
     - *Arrival Time*, *Departure Time*, *Total Dwell Time*.
     - Verification badge (*"Verified On-Site via GPS Geofence"*).
     - Coordinate point log summary showing sample telemetry points, speed, and accuracy.

---

## 5. Step-by-Step Implementation Roadmap

| Step | Component | Description |
|---|---|---|
| **1** | Database Migration | Write `0011_gps_geofencing_telemetry.sql`, sync `schema.sql` and `database.types.ts`. |
| **2** | Geo Utilities | Build `src/lib/geo.ts` with Haversine distance, boundary checks, and formatters. |
| **3** | Server Actions | Build `src/lib/actions/geo.ts` for logging breadcrumbs and capturing arrival/departure events; update property actions. |
| **4** | Telemetry Client | Build `src/components/GpsTelemetryTracker.tsx` and integrate into `ActiveInspectionChecklist.tsx`. |
| **5** | Property Management Form | Update `PropertyForm.tsx` with coordinate inputs, GPS toggle, and current-location picker. |
| **6** | Audit Report Telemetry View | Build `InspectionGeoTelemetryCard.tsx` and integrate into admin and specialist report views. |
| **7** | Verification & Build | Verify zero TypeScript errors (`npx tsc --noEmit`) and successful Next.js production build (`npm run build`). |
