# AmenityOps REST API Reference & Integration Guide

**Platform Version:** 1.0.0  
**Production Base URL:** `https://amenityops.app/api/v1`  
**Staging Base URL:** `https://staging.amenityops.app/api/v1`  
**Protocol:** HTTPS  
**Data Format:** JSON (`application/json`)  
**Authentication:** Bearer JWT Token  

---

## Table of Contents

1. [Architecture & Overview](#1-architecture--overview)
2. [Authentication & Authorization](#2-authentication--authorization)
   - [2.1 Authentication Headers](#21-authentication-headers)
   - [2.2 Role-Based Access Control (RBAC)](#22-role-based-access-control-rbac)
   - [2.3 Multi-Tenant Isolation](#23-multi-tenant-isolation)
3. [Standard Response & Error Conventions](#3-standard-response--error-conventions)
4. [Inspector Portal APIs](#4-inspector-portal-apis)
   - [4.1 List All Inspectors (`GET /inspectors`)](#41-list-all-inspectors-get-inspectors)
   - [4.2 Retrieve Inspector Details (`GET /inspectors/:id`)](#42-retrieve-inspector-details-get-inspectorsid)
   - [4.3 Update Inspector Information (`PUT /inspectors/:id`)](#43-update-inspector-information-put-inspectorsid)
   - [4.4 Retrieve Inspector Jobs (`GET /inspectors/:id/jobs`)](#44-retrieve-inspector-jobs-get-inspectorsidjobs)
   - [4.5 Retrieve Inspector Applications (`GET /inspector-applications`)](#45-retrieve-inspector-applications-get-inspector-applications)
   - [4.6 Delete or Cancel Job (`DELETE /jobs/:id`)](#46-delete-or-cancel-job-delete-jobsid)
   - [4.7 Retrieve Job Inspection Report (`GET /jobs/:id/report`)](#47-retrieve-job-inspection-report-get-jobsidreport)
5. [Tenant Dashboard APIs](#5-tenant-dashboard-apis)
   - [5.1 List All Tenants (`GET /tenants`)](#51-list-all-tenants-get-tenants)
   - [5.2 Retrieve Tenant Details (`GET /tenants/:id`)](#52-retrieve-tenant-details-get-tenantsid)
6. [Rate Limits & Security Best Practices](#6-rate-limits--security-best-practices)

---

## 1. Architecture & Overview

AmenityOps provides a centralized REST API engine powering property compliance audits, field operations, and multi-tenant management. External systems, mobile inspection applications, and third-party dashboards interact with the core engine through standardized RESTful endpoints under the `/api/v1` namespace.

### Core Data Models

* **Inspectors (`profiles`)**: Operational field specialists responsible for performing physical on-site amenity audits and submitting photo verification data.
* **Jobs (`inspections`)**: Scheduled, in-progress, or finalized property visits associated with a compliance checklist template and assigned inspector.
* **Reports (`inspection_items` + PDF)**: Audited shift data, GPS/timestamp-stamped photos, pass/fail compliance status, and predictive risk scores.
* **Tenants (`tenants`)**: Property management organizations, regional operators, or master enterprise accounts with isolated licensing and user rosters.

---

## 2. Authentication & Authorization

All private endpoints require transport-layer encryption (HTTPS) and an active Bearer JWT token issued by the AmenityOps authentication service.

### 2.1 Authentication Headers

Every API request must include the following headers:

```http
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json
Accept: application/json
```

Tokens are obtained via user credentials or API client authentication against the platform's auth endpoints.

### 2.2 Role-Based Access Control (RBAC)

Access permissions are enforced based on the caller's verified role:

| Role | Scope | Capabilities |
| :--- | :--- | :--- |
| **Super Admin** (`is_global_admin = true`) | Platform-Wide | Full administrative read/write access across all tenants, inspectors, properties, and jobs. |
| **Tenant Admin** (`role = 'admin'`) | Tenant-Scoped | Management of inspectors, properties, and scheduled jobs within their specific organization (`tenant_id`). |
| **Inspector** (`role = 'inspector'`) | Self-Scoped | Access to own profile, assigned job queue, and checklist execution workflows. |

### 2.3 Multi-Tenant Isolation

For Tenant Admins and Inspectors, all queries are automatically scoped by `tenant_id` at the database level. Attempting to query or mutate a resource belonging to another organization returns an immediate `403 Forbidden` or `404 Not Found` response.

---

## 3. Standard Response & Error Conventions

### Success Response Format
Successful API responses return HTTP `200 OK` (or `201 Created` for resource creation) with a unified envelope:

```json
{
  "success": true,
  "data": { ... },
  "pagination": { ... } // Included on collection endpoints
}
```

### Error Response Format
When a request fails, the API returns the appropriate 4xx or 5xx status code with an actionable JSON error object:

```json
{
  "success": false,
  "error": "Descriptive error message",
  "code": "RESOURCE_NOT_FOUND",
  "details": null
}
```

#### HTTP Status Codes

| Code | Status | Meaning |
| :--- | :--- | :--- |
| **200** | `OK` | Request succeeded; body contains requested data. |
| **201** | `Created` | New resource created successfully. |
| **204** | `No Content` | Action succeeded with no body returned. |
| **400** | `Bad Request` | Validation failure or malformed payload. |
| **401** | `Unauthorized` | Missing or expired Bearer token. |
| **403** | `Forbidden` | Insufficient permissions or cross-tenant boundary violation. |
| **404** | `Not Found` | Requested resource does not exist. |
| **422** | `Unprocessable Entity` | Schema validation error on provided fields. |
| **500** | `Internal Server Error` | Unexpected server failure. |

---

## 4. Inspector Portal APIs

---

### 4.1 List All Inspectors (`GET /inspectors`)

Retrieve a paginated list of field inspectors.

* **Method:** `GET`
* **Path:** `/api/v1/inspectors`
* **Access Level:** Super Admin, Tenant Admin (scoped to active tenant)
* **Query Parameters:**

| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `page` | `integer` | No | `1` | Page number for pagination. |
| `limit` | `integer` | No | `20` | Results per page (max: `100`). |
| `status` | `string` | No | `all` | Filter by status: `active`, `inactive`, `suspended`. |
| `state` | `string` | No | — | Filter by 2-letter US state code (e.g., `FL`, `GA`, `TX`). |
| `search` | `string` | No | — | Text search matching `full_name`, `email`, or `human_id`. |

#### Response (`200 OK`)

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
      "coverage_area": {
        "city": "Boca Raton",
        "state": "FL",
        "county": "Palm Beach",
        "zip": "33432"
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

### 4.2 Retrieve Inspector Details (`GET /inspectors/:id`)

Retrieve comprehensive profile and operational telemetry for a single inspector.

* **Method:** `GET`
* **Path:** `/api/v1/inspectors/:id`
* **Access Level:** Super Admin, Tenant Admin (same organization), or the Inspector themselves (`:id == user.id`)
* **Path Parameters:**

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Yes | The inspector's unique account ID. |

#### Response (`200 OK`)

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
      "account_number_masked": "••••4892",
      "routing_number_masked": "••••0120"
    },
    "metrics": {
      "completed_jobs": 128,
      "pending_jobs": 3,
      "geofence_compliance_rate_pct": 99.2
    },
    "created_at": "2026-08-15T14:30:00Z"
  }
}
```

---

### 4.3 Update Inspector Information (`PUT /inspectors/:id`)

Update contact info, coverage address, or status for an inspector.

* **Method:** `PUT`
* **Path:** `/api/v1/inspectors/:id`
* **Access Level:** Super Admin, Tenant Admin, or Inspector (self-service fields)
* **Path Parameters:**

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Yes | The inspector's unique account ID. |

#### Request Body

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

#### Response (`200 OK`)

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

### 4.4 Retrieve Inspector Jobs (`GET /inspectors/:id/jobs`)

Retrieve inspection assignments for a specific inspector.

* **Method:** `GET`
* **Path:** `/api/v1/inspectors/:id/jobs`
* **Access Level:** Super Admin, Tenant Admin, or the assigned Inspector
* **Query Parameters:**

| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `status` | `string` | No | — | Filter by job status: `pending`, `in_progress`, `completed`, `cancelled`. |
| `from_date` | `ISO8601 Date` | No | — | Scheduled date lower bound (e.g., `2026-10-01`). |
| `to_date` | `ISO8601 Date` | No | — | Scheduled date upper bound (e.g., `2026-10-31`). |

#### Response (`200 OK`)

```json
{
  "success": true,
  "data": [
    {
      "id": "7f8b91a2-3c4d-5e6f-7a8b-9c0d1e2f3a4b",
      "status": "pending",
      "scheduled_for": "2026-10-22T08:00:00Z",
      "property": {
        "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
        "name": "Waterfront Luxury Residences",
        "address": "450 Bayshore Dr, Miami, FL 33133",
        "latitude": 25.7289,
        "longitude": -80.2374,
        "geofence_radius_meters": 150
      },
      "checklist": {
        "template_id": "c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f",
        "name": "55+ Active Adult Community Operational Audit",
        "item_count": 45
      },
      "predictive_risk": {
        "score": 38,
        "tier": "moderate",
        "summary": "Moderate risk of life-safety violations during Thursday morning operational shift."
      },
      "created_at": "2026-10-20T18:00:00Z"
    }
  ]
}
```

---

### 4.5 Retrieve Inspector Applications (`GET /inspector-applications`)

Retrieve specialist candidate applications awaiting review or onboarding.

* **Method:** `GET`
* **Path:** `/api/v1/inspector-applications`
* **Access Level:** Super Admin, Tenant Admin
* **Query Parameters:**

| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `status` | `string` | No | `pending` | Filter by application status (`pending`, `approved`, `rejected`). |
| `state` | `string` | No | — | Filter by applicant state (e.g., `FL`). |

#### Response (`200 OK`)

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
      "id_documents_uploaded": true,
      "application_date": "2026-10-18T11:20:00Z",
      "status": "pending"
    }
  ]
}
```

---

### 4.6 Delete or Cancel Job (`DELETE /jobs/:id`)

Cancel or permanently delete an inspection visit.

* **Method:** `DELETE`
* **Path:** `/api/v1/jobs/:id`
* **Access Level:** Super Admin, Tenant Admin
* **Query Parameters:**

| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `permanent` | `boolean` | No | `false` | When `false`, soft-cancels the visit with audit history. When `true`, purges the row. |
| `reason` | `string` | No | — | Reason for cancellation (e.g., `Weather cancellation`, `Property closure`). |

#### Response (`200 OK`)

```json
{
  "success": true,
  "message": "Job successfully cancelled.",
  "data": {
    "id": "7f8b91a2-3c4d-5e6f-7a8b-9c0d1e2f3a4b",
    "status": "cancelled",
    "cancellation_reason": "Weather cancellation",
    "cancelled_at": "2026-10-21T04:46:00Z"
  }
}
```

---

### 4.7 Retrieve Job Inspection Report (`GET /jobs/:id/report`)

Retrieve complete audit data, question results, watermarked photos, and PDF report link.

* **Method:** `GET`
* **Path:** `/api/v1/jobs/:id/report`
* **Access Level:** Super Admin, Tenant Admin, or assigned Inspector
* **Query Parameters:**

| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `format` | `string` | No | `json` | Return structured JSON (`json`) or stream the generated PDF (`pdf`). |

#### Response (`200 OK - JSON Format`)

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
      "distance_meters": 42
    },
    "predictive_risk": {
      "score": 42,
      "tier": "moderate",
      "summary": "Elevated failure risk detected in Life-safety domain based on 30-day historical window."
    },
    "checklist_summary": {
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
        "photo_url": "https://amenityops.app/api/photos/7f8b91a2/pool_gate.jpg"
      }
    ],
    "pdf_report_url": "https://amenityops.app/api/inspections/7f8b91a2-3c4d-5e6f-7a8b-9c0d1e2f3a4b/pdf"
  }
}
```

---

## 5. Tenant Dashboard APIs

---

### 5.1 List All Tenants (`GET /tenants`)

Retrieve all provisioned tenant organizations and licensing allocations.

* **Method:** `GET`
* **Path:** `/api/v1/tenants`
* **Access Level:** Super Admin (Platform Owner)
* **Query Parameters:**

| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `status` | `string` | No | `all` | Filter by status: `active`, `suspended`, `trial`. |
| `tier` | `string` | No | — | Filter by license tier: `starter`, `standard`, `pro`, `enterprise`. |
| `search` | `string` | No | — | Search query matching tenant name or slug. |

#### Response (`200 OK`)

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
      "allocated_properties": 84,
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
      "allocated_properties": 4,
      "created_at": "2026-09-15T10:00:00Z"
    }
  ]
}
```

---

### 5.2 Retrieve Tenant Details (`GET /tenants/:id`)

Retrieve configuration, property license allocation, and active feature flags for a single tenant.

* **Method:** `GET`
* **Path:** `/api/v1/tenants/:id`
* **Access Level:** Super Admin or Tenant Admin belonging to that tenant
* **Path Parameters:**

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Yes | The tenant organization ID. |

#### Response (`200 OK`)

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
    "payout_matrix": {
      "default_payout_rate": 45.0,
      "tier_1_rate": 40.0,
      "tier_2_rate": 50.0,
      "tier_3_rate": 65.0
    },
    "parent_organization_id": null,
    "created_at": "2026-09-15T10:00:00Z",
    "updated_at": "2026-10-19T08:48:00Z"
  }
}
```

---

## 6. Rate Limits & Security Best Practices

1. **Rate Limiting**: Protected endpoints enforce a standard threshold of **120 requests/minute per API token**. Requests exceeding this quota receive a `429 Too Many Requests` status code.
2. **Payload Size**: `PUT` request bodies are limited to a maximum of **1 MB**.
3. **Idempotency**: Use UUID identifiers for resources to ensure mutation retries do not create duplicate records.
4. **Token Expiration**: Access tokens expire after 60 minutes. Integrations should refresh tokens using their standard OAuth/Supabase refresh credentials before expiration.
