# AmenityOps REST API Specification: Inspector Portal & Tenant Dashboard

**Document Version:** 1.0.0  
**Target Audience:** Client Engineering Team & Integration Partners  
**Base URL:** `https://<domain>/api/v1` (Production) / `http://localhost:3000/api/v1` (Development)  
**Authentication Scheme:** Bearer Token (`Authorization: Bearer <JWT_ACCESS_TOKEN>`)  

---

## 1. Executive Summary & Client Request Breakdown

The client has requested dedicated REST API endpoints to power two external/portal integrations:
1. **Inspector Portal Integration**: Managing field specialists, viewing and updating inspector profiles, fetching assigned inspection jobs, reviewing inspector applications, cancelling/deleting jobs, and accessing inspection report data and PDFs.
2. **Tenant Dashboard Integration**: Listing tenant organizations and retrieving organization-specific licensing, limits, and configurations.

This document provides a technical specification for all 9 requested endpoints, aligning client terminology with the AmenityOps core database architecture and security model.

### Terminology & Entity Mapping

| Client Term | AmenityOps Database Entity | Primary Table | Description |
| :--- | :--- | :--- | :--- |
| **Inspector** | Specialist Profile | `public.profiles` (`role = 'inspector'`) | Field specialist performing on-site amenity audits. |
| **Job** | Inspection Visit | `public.inspections` | Scheduled, in-progress, or completed property audit. |
| **Job Report** | Inspection Report & PDF | `public.inspections` + `public.inspection_items` | Outcome audit log, photos, compliance checklist, and risk metrics. |
| **Inspector Application** | Specialist Candidate | `public.profiles` (`is_contractor = true` / `status = 'inactive'`) | Registered applicant awaiting operational review or onboarding. |
| **Tenant** | Client Organization | `public.tenants` | Provisioned property management firm or master account. |

---

## 2. Authentication, Authorization & Security Architecture

### 2.1 Authentication Headers
All protected API endpoints require an active session Bearer token in the HTTP `Authorization` header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

Tokens are issued via standard Supabase authentication (`/auth/v1/token?grant_type=password` or refresh token exchange).

### 2.2 Role-Based Access Control (RBAC) & Tenant Scoping
AmenityOps enforces a 3-tier authorization model:
1. **Platform Owner / Super Admin** (`is_global_admin = true`):
   - Has unrestricted access across all tenants, inspectors, properties, and inspections.
2. **Tenant Admin** (`role = 'admin'` with `tenant_id`):
   - Strictly isolated to resources belonging to their `tenant_id`.
   - Cannot view or manipulate inspectors, jobs, or settings outside their organization.
3. **Inspector / Specialist** (`role = 'inspector'`):
   - Restricted to reading/updating their own profile (`profiles.id = user.id`).
   - Restricted to viewing jobs assigned directly to them (`inspections.inspector_id = user.id`).

---

## 3. Detailed Endpoint Specifications

---

### 3.1 Inspector Portal APIs

#### Endpoint 1: `GET /api/v1/inspectors`
* **Summary**: Retrieve a paginated list of all inspectors (specialists).
* **Authorization**: Super Admin (all organizations) or Tenant Admin (scoped to active tenant).
* **Query Parameters**:
  - `page` (optional, integer, default: `1`): Page number.
  - `limit` (optional, integer, default: `20`, max: `100`): Results per page.
  - `status` (optional, string): Filter by status (`active`, `inactive`, `suspended`).
  - `state` (optional, string): Filter by US state (e.g., `FL`, `TX`).
  - `search` (optional, string): Search query matching `full_name`, `email`, or `human_id`.
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "e4b2d88a-9238-4c91-a18a-f10d93821034",
      "human_id": "OCS-1042",
      "full_name": "Marcus Vance",
      "email": "marcus.vance@example.com",
      "phone": "+1 (555) 234-5678",
      "role": "inspector",
      "status": "active",
      "is_contractor": true,
      "tenant_id": "00000000-0000-0000-0000-000000000001",
      "address": {
        "street": "100 Ocean Blvd",
        "city": "Boca Raton",
        "state": "FL",
        "zip": "33432",
        "county": "Palm Beach"
      },
      "ach_enabled": true,
      "created_at": "2026-08-15T14:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 48,
    "total_pages": 3
  }
}
```

---

#### Endpoint 2: `GET /api/v1/inspectors/:id`
* **Summary**: Retrieve full details of a specific inspector.
* **Authorization**: Super Admin, Tenant Admin (same tenant), or the Inspector themselves.
* **URL Parameters**:
  - `id` (required, UUID): The inspector's unique identifier.
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "e4b2d88a-9238-4c91-a18a-f10d93821034",
    "human_id": "OCS-1042",
    "full_name": "Marcus Vance",
    "email": "marcus.vance@example.com",
    "phone": "+1 (555) 234-5678",
    "role": "inspector",
    "status": "active",
    "is_contractor": true,
    "tenant_id": "00000000-0000-0000-0000-000000000001",
    "organization_name": "Amenity Ops HQ",
    "address": {
      "street": "100 Ocean Blvd",
      "city": "Boca Raton",
      "state": "FL",
      "zip": "33432",
      "county": "Palm Beach"
    },
    "documents": {
      "id_front_uploaded": true,
      "id_back_uploaded": true
    },
    "banking": {
      "ach_enabled": true,
      "bank_name": "Chase Bank",
      "account_number_last4": "4892",
      "routing_number_last4": "0120"
    },
    "statistics": {
      "completed_inspections": 128,
      "pending_inspections": 3,
      "on_time_rate_pct": 98.4
    },
    "created_at": "2026-08-15T14:30:00Z"
  }
}
```
* **Error Response (404 Not Found)**:
```json
{
  "success": false,
  "error": "Inspector not found."
}
```

---

#### Endpoint 3: `PUT /api/v1/inspectors/:id`
* **Summary**: Update an inspector's contact details, coverage address, or status.
* **Authorization**: Super Admin, Tenant Admin, or Inspector (self-service profile edits).
* **URL Parameters**:
  - `id` (required, UUID): The inspector's ID.
* **Request Body**:
```json
{
  "full_name": "Marcus Vance",
  "phone": "+1 (555) 234-9999",
  "street": "105 Ocean Blvd Ste 200",
  "city": "Boca Raton",
  "state": "FL",
  "zip": "33432",
  "county": "Palm Beach",
  "status": "active",
  "ach_enabled": true,
  "bank_name": "Chase Bank",
  "bank_account_number": "123456789012",
  "bank_routing_number": "021000021"
}
```
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Inspector profile updated successfully.",
  "data": {
    "id": "e4b2d88a-9238-4c91-a18a-f10d93821034",
    "full_name": "Marcus Vance",
    "phone": "+1 (555) 234-9999",
    "status": "active",
    "updated_at": "2026-10-21T04:45:00Z"
  }
}
```

---

#### Endpoint 4: `GET /api/v1/inspectors/:id/jobs`
* **Summary**: Retrieve scheduled, active, or completed jobs (inspections) assigned to a specific inspector.
* **Authorization**: Super Admin, Tenant Admin, or the Inspector themselves (`id === user.id`).
* **URL Parameters**:
  - `id` (required, UUID): The inspector's ID.
* **Query Parameters**:
  - `status` (optional, string): Filter by job status (`pending`, `in_progress`, `completed`, `cancelled`).
  - `from_date` (optional, ISO8601 Date): Filter jobs scheduled on or after this date.
  - `to_date` (optional, ISO8601 Date): Filter jobs scheduled on or before this date.
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "7f8b91a2-3c4d-5e6f-7a8b-9c0d1e2f3a4b",
      "property_id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "property_name": "Waterfront Luxury Residences",
      "property_address": "450 Bayshore Dr, Miami, FL 33133",
      "property_coordinates": {
        "latitude": 25.7289,
        "longitude": -80.2374,
        "geofence_radius_meters": 150
      },
      "template_id": "c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f",
      "checklist_name": "55+ Active Adult Community Operational Audit",
      "status": "pending",
      "scheduled_for": "2026-10-22T08:00:00Z",
      "predictive_risk": {
        "score": 38,
        "tier": "moderate",
        "flags": [
          { "domain": "life_safety", "label": "Pool Emergency Gate Latch", "rate": 0.42 }
        ]
      },
      "created_at": "2026-10-20T18:00:00Z"
    }
  ]
}
```

---

#### Endpoint 5: `GET /api/v1/inspector-applications`
* **Summary**: Retrieve applicant/candidate specialists who have applied to become inspectors.
* **Authorization**: Super Admin or authorized Tenant Admin.
* **Query Parameters**:
  - `status` (optional, default: `pending`): Application status (`pending`, `approved`, `rejected`).
  - `state` (optional, string): Filter by applicant's geographic location.
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f",
      "full_name": "Elena Rostova",
      "email": "elena.rostova@example.com",
      "phone": "+1 (555) 987-6543",
      "location": {
        "city": "Tampa",
        "state": "FL",
        "county": "Hillsborough"
      },
      "is_contractor": true,
      "id_documents_submitted": true,
      "application_date": "2026-10-18T11:20:00Z",
      "status": "pending"
    }
  ]
}
```

---

#### Endpoint 6: `DELETE /api/v1/jobs/:id`
* **Summary**: Delete or cancel a scheduled inspection job.
* **Business Rule**:
  - If the job is `pending`, this cancels or permanently deletes the inspection visit.
  - Completed inspections are frozen audit records and cannot be deleted.
* **Authorization**: Super Admin or Tenant Admin.
* **URL Parameters**:
  - `id` (required, UUID): The inspection ID.
* **Query Parameters**:
  - `permanent` (optional, boolean, default: `false`): When `false`, soft-cancels the job with audit reason. When `true`, purges the row.
  - `reason` (optional, string): Reason for cancellation (e.g., `Resident request`, `Weather postponement`).
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Job successfully cancelled.",
  "data": {
    "id": "7f8b91a2-3c4d-5e6f-7a8b-9c0d1e2f3a4b",
    "status": "cancelled",
    "cancellation_reason": "Weather postponement",
    "cancelled_at": "2026-10-21T04:46:00Z"
  }
}
```

---

#### Endpoint 7: `GET /api/v1/jobs/:id/report`
* **Summary**: Retrieve the complete inspection report data, checklist item responses, photos, and PDF download URL.
* **Authorization**: Super Admin, Tenant Admin (same tenant), or assigned Inspector.
* **URL Parameters**:
  - `id` (required, UUID): The inspection ID.
* **Query Parameters**:
  - `format` (optional, string, `json` | `pdf`, default: `json`): When `pdf`, returns the binary PDF report directly.
* **Success Response (200 OK - JSON Format)**:
```json
{
  "success": true,
  "data": {
    "inspection_id": "7f8b91a2-3c4d-5e6f-7a8b-9c0d1e2f3a4b",
    "status": "completed",
    "property": {
      "name": "Waterfront Luxury Residences",
      "address": "450 Bayshore Dr, Miami, FL 33133",
      "human_id": "PROP-104"
    },
    "inspector": {
      "full_name": "Marcus Vance",
      "human_id": "OCS-1042"
    },
    "timings": {
      "scheduled_for": "2026-10-20T08:00:00Z",
      "arrived_at": "2026-10-20T07:58:12Z",
      "departed_at": "2026-10-20T08:42:30Z",
      "dwell_time_seconds": 2658
    },
    "geofence": {
      "status": "verified",
      "verified_within_meters": 42
    },
    "risk_analysis": {
      "predicted_score": 42,
      "predicted_summary": "Elevated failure risk detected in Life-safety domain based on 30-day historical window.",
      "flags": [
        { "domain": "life_safety", "label": "Pool Emergency Gate Latch", "rate": 0.50 }
      ]
    },
    "summary_metrics": {
      "total_items": 45,
      "passed": 42,
      "failed": 2,
      "na": 1
    },
    "checklist_items": [
      {
        "id": "item-101",
        "service_category": "Common Area Fire & Life Safety",
        "item_name": "Emergency Exit Signs Illuminated",
        "risk_domain": "life_safety",
        "status": "pass",
        "comment": null,
        "photo_url": null
      },
      {
        "id": "item-102",
        "service_category": "Common Area Fire & Life Safety",
        "item_name": "Pool Gate Latch Self-Closing",
        "risk_domain": "life_safety",
        "status": "fail",
        "comment": "Gate latch mechanism sticky; failed to latch automatically from 4 inches.",
        "photo_url": "https://<storage-cdn>/photos/7f8b91a2/pool_gate.jpg"
      }
    ],
    "pdf_report_url": "/api/inspections/7f8b91a2-3c4d-5e6f-7a8b-9c0d1e2f3a4b/pdf"
  }
}
```

---

### 3.2 Tenant Dashboard APIs

#### Endpoint 8: `GET /api/v1/tenants`
* **Summary**: Retrieve the list of all tenant organizations.
* **Authorization**: Platform Owner / Super Admin only.
* **Query Parameters**:
  - `status` (optional, string): Filter by status (`active`, `suspended`, `trial`).
  - `tier` (optional, string): Filter by tier (`starter`, `standard`, `pro`, `enterprise`).
  - `search` (optional, string): Search query matching tenant name or slug.
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "00000000-0000-0000-0000-000000000001",
      "name": "Amenity Ops HQ",
      "slug": "hq",
      "license_tier": "enterprise",
      "max_property_licenses": 9999,
      "status": "active",
      "allow_checklist_management": true,
      "enable_predictive_scoring": true,
      "active_properties_count": 84,
      "created_at": "2026-01-01T00:00:00Z"
    },
    {
      "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "name": "Greystar Southeast Region",
      "slug": "greystar-se",
      "license_tier": "standard",
      "max_property_licenses": 5,
      "status": "active",
      "allow_checklist_management": false,
      "enable_predictive_scoring": true,
      "active_properties_count": 4,
      "created_at": "2026-09-15T10:00:00Z"
    }
  ]
}
```

---

#### Endpoint 9: `GET /api/v1/tenants/:id`
* **Summary**: Retrieve detailed configuration, licensing status, and resource usage of a specific tenant.
* **Authorization**: Super Admin or Tenant Admin belonging to that tenant.
* **URL Parameters**:
  - `id` (required, UUID): The tenant organization ID.
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "name": "Greystar Southeast Region",
    "slug": "greystar-se",
    "license_tier": "standard",
    "max_property_licenses": 5,
    "allocated_properties": 4,
    "remaining_licenses": 1,
    "status": "active",
    "features": {
      "allow_checklist_management": false,
      "enable_predictive_scoring": true,
      "enable_payouts": true,
      "require_id_photo": true
    },
    "payout_configuration": {
      "default_payout_rate": 45.0,
      "payout_tier_1_rate": 40.0,
      "payout_tier_2_rate": 50.0,
      "payout_tier_3_rate": 65.0
    },
    "parent_organization_id": null,
    "created_at": "2026-09-15T10:00:00Z",
    "updated_at": "2026-10-19T08:48:00Z"
  }
}
```

---

## 4. Current Codebase Implementation & Availability Matrix

| Requested Endpoint | Method | Existing AmenityOps Source | Status |
| :--- | :--- | :--- | :--- |
| `/inspectors` | `GET` | `/src/lib/actions/team.ts`, `/src/app/admin/team/page.tsx` | **Logic Ready** (Mount to `/src/app/api/inspectors/route.ts`) |
| `/inspectors/:id` | `GET` | `/src/app/admin/team/[id]/page.tsx` | **Logic Ready** (Mount to `/src/app/api/inspectors/[id]/route.ts`) |
| `/inspectors/:id` | `PUT` | `/src/lib/actions/team.ts` (`updateOwnProfile`, `updateTeamMemberAddress`) | **Logic Ready** (Mount to `/src/app/api/inspectors/[id]/route.ts`) |
| `/inspectors/:id/jobs` | `GET` | `/src/app/inspector/page.tsx`, `inspections` table | **Logic Ready** (Mount to `/src/app/api/inspectors/[id]/jobs/route.ts`) |
| `/inspector-applications` | `GET` | `/src/lib/actions/team.ts`, `profiles.is_contractor` | **Logic Ready** (Mount to `/src/app/api/inspector-applications/route.ts`) |
| `/jobs/:id` | `DELETE` | `/src/lib/actions/inspections.ts` (`deleteInspection`, `cancelInspection`) | **Logic Ready** (Mount to `/src/app/api/jobs/[id]/route.ts`) |
| `/jobs/:id/report` | `GET` | `/src/app/api/inspections/[id]/pdf/route.ts`, `/src/lib/pdf/generate.ts` | **PDF Route Live**; JSON summary endpoint ready to mount |
| `/tenants` | `GET` | `/src/lib/actions/tenants.ts`, `/src/app/admin/tenants/page.tsx` | **Logic Ready** (Mount to `/src/app/api/tenants/route.ts`) |
| `/tenants/:id` | `GET` | `/src/lib/actions/tenants.ts`, `tenants` table | **Logic Ready** (Mount to `/src/app/api/tenants/[id]/route.ts`) |

---

## 5. Implementation Roadmap

1. **Route Handler Scaffolding**: Create the Next.js App Router handlers under `/src/app/api/v1/...` wrapping the verified DAL functions.
2. **Standard API Token Verification Middleware**: Centralize Supabase JWT verification and tenant scoping in a reusable helper (`/src/lib/auth/api-auth.ts`).
3. **Automated Testing Suite**: Create integration tests ensuring 401 unauthorized, 403 forbidden cross-tenant rejection, and 200 OK payload schemas match this document.
