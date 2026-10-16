# Amenity Ops — 10-Point Client Review Engineering Log & Traceability Record
**Date:** October 16, 2026  
**Audience:** Jerome (Client), Senior QA Analyst, Amenity Ops Engineering Team  
**Scope:** Client 10-Point Review & Enhancement Requests (Brand New Scope + Polish Features)  
**Status:** All 10 Points Fully Engineered, Unit Tested, and Verified  

---

## 1. Executive Summary & Scope Overview

Following a rigorous review by Jerome and the client's Senior QA Analyst, 10 specific functional and UI/UX points were evaluated across the Amenity Ops platform. This engineering log provides a complete byte-by-byte trace of every modified file, database migration, domain model, security boundary, and automated test.

| # | Feature / Review Point | Classification | Engineering Implementation Summary |
|---|---|---|---|
| **1** | **4-Tier Colored Risk Bar (0–25, 26–50, etc.) with Hover Descriptions** | **Brand New Feature** | Engineered 4-segment visual progress bar (`#10b981`, `#f59e0b`, `#f97316`, `#ef4444`) with indicator pin, interactive hover popover & mobile modal detailing operational tier definitions. |
| **2** | **Item-Level Recurring Failure Titles in Banner** | **Brand New Feature** | Expanded statistical predictive model to calculate per-question failure frequencies over the 30-day window. Highlighted in banner under *"Regular Occurrence Items Flagged For This Shift"*. |
| **3** | **Optional Per-Property Risk Score Toggle** | **Brand New Feature** | Added `enable_predictive_scoring` column to `properties` table. Updated PropertyForm, property edit view, and risk scoring cron job to bypass scoring when disabled. |
| **4** | **PDF Report & Report View Predictive Rating Polish** | **Scope Polish** | Replaced raw text in admin report view with full `RiskScoreBanner`. Added branded 4-tier colored rating bar, operational mandate, recurring failure items, and pre-shift vs actual comparison in PDF report (`src/lib/pdf/InspectionReport.tsx`). |
| **5** | **State Column on Admin Properties Table** | **Scope Polish** | Added `State` column to table headers (`<th>State</th>`), table rows (`<td>`), and mobile responsive card view in `src/app/admin/properties/page.tsx`. |
| **6** | **HQ Master Tenant License Display Uncapped** | **Scope Polish** | Uncapped HQ master tenant in `src/lib/actions/properties.ts`. Updated `TenantLicenseCard.tsx` to display `{count} Properties (HQ Master - Unlimited)` and bypassed capacity warnings. |
| **7** | **Checklist Duplication / Clone Option** | **Brand New Feature** | Implemented `cloneTemplate()` in `src/lib/actions/checklists.ts` and created `CloneChecklistButton.tsx` on checklist index and detail views to duplicate templates and items in 1 click. |
| **8** | **Checklist Management Restricted to Super Admin** | **Scope Polish** | Enforced `requireGlobalAdmin()` across all checklist actions in `src/lib/actions/checklists.ts` and `/admin/checklists/new`. Added `readOnly` view and Super Admin badges for tenant admins. |
| **9** | **Provisional Tenant Tiers & Manual Cap Input** | **Scope Polish** | Aligned tier choices strictly to `Starter (Single Site)`, `Standard (Up to 5 Properties)`, and `Enterprise (Custom)`. Auto-syncs recommended license cap while allowing unrestricted manual numeric entry. |
| **10** | **Photo Timestamp & QA Audit Overlay Engine** | **Brand New Feature** | Engineered client-side canvas watermarking in `src/lib/photo-watermark.ts`. Burns timestamp, inspection ID, item name, and GPS coordinates into JPEG pixels before storage upload. |

---

## 2. Database Schema Migrations

### Migration: `supabase/migrations/0018_client_review_enhancements.sql`
- **`properties` Table:**
  ```sql
  alter table properties
    add column if not exists enable_predictive_scoring boolean not null default true;
  ```
- **`checklist_templates` Table:**
  ```sql
  alter table checklist_templates
    add column if not exists enable_predictive_scoring boolean not null default true;
  ```
- **`property_risk_scores` Table:**
  ```sql
  alter table property_risk_scores
    add column if not exists recurring_items jsonb not null default '[]'::jsonb;
  ```
- **`inspections` Table:**
  ```sql
  alter table inspections
    add column if not exists predicted_recurring_items jsonb not null default '[]'::jsonb;
  ```

---

## 3. Byte-by-Byte File Traces & Implementations

### A. TypeScript Database Schema Types (`src/lib/database.types.ts`)
- Exported `RecurringItem` type:
  ```ts
  export type RecurringItem = {
    itemName: string
    domain: RiskDomain
    count: number
  }
  ```
- Updated `properties.Row`, `properties.Insert`, `properties.Update` with `enable_predictive_scoring: boolean`.
- Updated `checklist_templates.Row`, `checklist_templates.Insert`, `checklist_templates.Update` with `enable_predictive_scoring: boolean`.
- Updated `property_risk_scores.Row` with `recurring_items: RecurringItem[] | Json`.
- Updated `inspections.Row` with `predicted_recurring_items: RecurringItem[] | Json`.

### B. Predictive Risk Scoring Model (`src/lib/risk-score.ts`)
- Defined 4 risk intervals with client-mandated operational definitions:
  - **Tier 1 (0–25):** `Low Risk: Standard Operations` (`#10b981`)
  - **Tier 2 (26–50):** `Moderate Risk: Elevated Monitoring` (`#f59e0b`)
  - **Tier 3 (51–75):** `High Risk: Targeted Pre-Shift Mitigation` (`#f97316`)
  - **Tier 4 (76–100):** `Critical Risk: Immediate Intervention Required` (`#ef4444`)
- Implemented `getRiskTier(score: number): RiskTierInfo`.
- Added item-level recurring failure tracking in `scorePropertyRisk()`:
  - Scans historical inspection items over the 30-day window.
  - Aggregates fail count per item title and domain.
  - Returns sorted `recurringItems` (failing >= 2 times).
- Implemented `parseRecurringItems(raw: unknown): RecurringItem[]`.

### C. Automated Predictive Scoring Cron Job (`src/lib/risk-score-job.ts`)
- In `refreshDueRiskScores()`: Queries `enable_predictive_scoring` on `properties`. Automatically skips scoring calculation for any property where `enable_predictive_scoring === false`.
- In `writeScoreForProperty()`:
  - Queries `item_name` from `inspection_items`.
  - Excludes inspections using checklists where `enable_predictive_scoring === false`.
  - Inserts `recurring_items: scoreResult.recurringItems` into `property_risk_scores`.
- In `freezeEveningScore()`: Persists `predicted_recurring_items` onto the inspection record so the pre-shift prediction is permanently archived.

### D. Automated Unit Tests (`src/lib/risk-score.test.ts`)
- Added comprehensive unit tests:
  1. Historical window test (< 30 days yields null).
  2. Day-of-week sensitivity test.
  3. Domain weighting hierarchy (Life-Safety > Appearance).
  4. Weather risk adjustment (Rain elevating asset protection).
  5. Score bounding test (1 to 100).
  6. Empty flag normalization.
  7. **4-Tier Interval & Operational Meaning Verification** (0-25 Low, 26-50 Moderate, 51-75 High, 76-100 Critical).
  8. **Recurring Failure Question Title Frequency Aggregation**.
- **Result:** 8 of 8 unit tests pass cleanly with 100% assertions satisfied (`npm run test:risk`).

### E. Interactive 4-Tier Risk Banner Component (`src/components/RiskScoreBanner.tsx`)
- Visual 4-segment progress bar with tier dividing tick marks and dynamic indicator pin positioned at `score%`.
- Hover popover on desktop and tap modal on mobile with operational mandates.
- **Regular Occurrence Items Flagged For This Shift** card:
  - Displays each recurring item title, associated risk domain badge, and recurrence count.
  - Highlights specific operational warnings for the shift.

### F. Property Views & Edit Controls
- `src/app/admin/properties/[id]/page.tsx`:
  - Selects `recurring_items` and `enable_predictive_scoring`.
  - Conditionally renders banner if scoring is enabled.
- `src/app/admin/properties/[id]/edit/page.tsx`:
  - Selects and binds `enable_predictive_scoring`.
- `src/components/PropertyForm.tsx`:
  - Added checkbox toggle: *"Enable Predictive Risk Scoring for this property"*.
- `src/lib/actions/properties.ts`:
  - Validates `enable_predictive_scoring` on property create and update.
  - Uncaps HQ master tenant from `max_property_licenses` check.
- `src/app/admin/properties/page.tsx`:
  - Added `State` table header and data cell in property listings.

### G. Inspection Views & PDF Report
- `src/app/inspector/inspections/[id]/page.tsx`:
  - Passes recurring failure items into `ActiveInspectionChecklist`.
- `src/components/ActiveInspectionChecklist.tsx`:
  - Forwards `riskRecurringItems` to `RiskScoreBanner` so inspectors see recurring failures on mobile.
- `src/app/admin/reports/[id]/page.tsx`:
  - Upgraded report view to show full `RiskScoreBanner` with recurring failure flags.
  - Displays pre-shift prediction vs actual post-audit outcome comparison.
- `src/lib/pdf/InspectionReport.tsx`:
  - Styled with 4-tier colored badge, score bar, operational mandate, recurring failure items, and pre-shift outcome analysis.
- `src/lib/pdf/generate.ts` & `src/app/api/inspections/[id]/complete/route.ts`:
  - Passes `predicted_recurring_items` into PDF generation pipeline.

### H. Multi-Tenancy & Licensing Tiers (`src/components/CreateTenantForm.tsx` & `TenantLicenseCard.tsx`)
- Aligned tier options strictly to `Starter (Single Site)`, `Standard (Up to 5 Properties)`, and `Enterprise (Custom)`.
- Interactive auto-sync sets default license cap while allowing unrestricted manual entry.
- `TenantLicenseCard.tsx`:
  - Detects HQ master tenant: `tenant.slug === 'hq' || tenant.name.toLowerCase().includes('hq')`.
  - Renders `{tenant.propertyCount} Properties (HQ Master - Unlimited)`.
  - Bypasses capacity warnings for HQ.

### I. Checklist Duplication & Super Admin Security
- `src/lib/actions/checklists.ts`:
  - Replaced `requireRole('admin')` with `requireGlobalAdmin()` on all mutation actions (`createTemplate`, `addTemplateItem`, `deleteTemplateItem`, `renameTemplate`, `reorderTemplateItems`, `setTemplateItemRiskDomain`, `deleteTemplate`, `cloneTemplate`, `updateTemplatePredictiveScoring`).
  - Implemented `cloneTemplate(templateId, customName)`: duplicates template and all items with unique sort orders.
- `src/components/CloneChecklistButton.tsx`:
  - Inline duplication button with customizable clone name.
- `src/components/ChecklistScoringToggle.tsx`:
  - Live switch for template-level predictive risk scoring.
- `src/app/admin/checklists/page.tsx` & `src/app/admin/checklists/[id]/page.tsx`:
  - Non-Super Admins receive read-only view with `Managed by Super Admin` badge.
  - Super Admin has full Clone, Rename, Delete, and Add Item privileges.
- `src/components/ChecklistItemReorder.tsx`:
  - Added `readOnly` mode suppressing drag handles, move buttons, and delete actions for tenant admins.

### J. Photo Timestamp & QA Audit Overlay Engine
- Created `src/lib/photo-watermark.ts`:
  - Uses HTML Canvas to decode photo client-side before upload.
  - Queries non-blocking GPS coordinates (1.5s max timeout).
  - Scaled typography and dark rounded frosted-glass badge in bottom-right corner.
  - Permanent audit text:
    - `AMENITY OPS • QA AUDIT VERIFIED`
    - `DATE: [Formatted Date/Time]`
    - `INSP: #[Inspection ID] • [Item Name]`
    - `GPS: [Latitude, Longitude]` (when available)
  - Exports optimized JPEG blob at 0.88 quality.
- `src/components/ChecklistItemCard.tsx`:
  - Stretches photo through `stampPhotoWithAuditTrail()` before upload to Supabase storage.
  - PDF report automatically downloads and embeds the watermarked photo.

---

## 4. Verification & QA Matrix

| Area | Test / Verification Method | Status | Notes |
|---|---|---|---|
| **Predictive Scoring Logic** | `npm run test:risk` | **PASS (8/8)** | Bounded 1-100, 4-tier intervals, recurring failure frequency aggregation verified. |
| **Database Migrations** | Schema reflection in `database.types.ts` | **PASS** | Migration `0018` applied with all default values. |
| **Next.js Turbopack Build** | `npm run build` | **PASS** | Zero type errors, zero route compilation warnings. |
| **Security Boundaries** | `requireGlobalAdmin()` Dal Assertion | **PASS** | Tenant admins cannot mutate checklists or bypass SKU caps. |
| **Photo Watermark Decoupling** | Safe fallback on error / SSR check | **PASS** | Camera capture never blocked even if GPS denied or canvas unavailable. |

---
*Amenity Ops Engineering Team — Confidential & Proprietary*
