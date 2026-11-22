# Lead Generation, Recruitment & Outreach Engine — Task Tracker & QA Audit Plan

**Project:** Amenity Op's Autonomous Growth Engine  
**Client:** Commercial Multi-Tenant, Hospitality & Residential Operations (USA)  
**Standard:** Production-Grade / QA-Verified / Zero Production Footprint  
**Author:** Antigravity AI Engineering  
**Last Updated:** November 2026  

---

## 1. Executive Quality & Architecture Guidelines

1. **Production Isolation:**
   - All lead tables (`growth_leads`, `growth_outreach_logs`, `growth_ai_drafts`) operate in a strictly segregated schema.
   - No shared dependencies with live property inspections, client checklists, or audit telemetry.
2. **UI/UX & Mobile Responsiveness:**
   - Built with Next.js 16 App Router, React 19, Tailwind CSS v4, Lucide icons.
   - Fully tested across mobile (< 640px), tablet (640px – 1024px), and desktop (> 1024px).
   - Table features horizontal scroll container, sticky headers, responsive card view fallbacks, and accessible touch targets (min 44px).
3. **Performance Optimization:**
   - Heavy use of `useMemo` for client-side search, filtering, and metric aggregations.
   - `useCallback` for stable handlers passed to table rows and modals.
   - Zero layout shifts (CLS = 0) with skeleton loading states.
4. **Git & Release Protocol:**
   - Every phase and atomic sub-step is locally committed with clear Conventional Commits.
   - **Local Verification First:** Changes are NOT pushed to `origin/main` until local staging and client QA sign-off.

---

## 2. Master Phase Breakdown & Status Matrix

| Phase | Module / Milestone | Status | Target Deliverables |
| :--- | :--- | :--- | :--- |
| **Phase 1** | **Database Schema & Isolated Models** | 🟢 COMPLETED | Migration `0021_lead_generation_engine.sql`, RLS policies, indexing on 9 standard fields, foreign keys. |
| **Phase 1** | **TypeScript Domain & Validation Types** | 🟢 COMPLETED | `src/types/growth-leads.ts`, Zod schemas for all 9 fields + intent tiers. |
| **Phase 1** | **Server-Side Data Access & Actions** | 🟢 COMPLETED | `src/lib/actions/leads.ts` (CRUD, pagination, filters, stats, bulk actions). |
| **Phase 1** | **High-Fidelity Export Engine (.xlsx & .csv)** | 🟢 COMPLETED | `src/lib/export/leads-export.ts` + `/api/admin/leads/export` streaming endpoint. |
| **Phase 1** | **Admin Navigation & Shell Integration** | 🟢 COMPLETED | `/admin/leads` route, `src/lib/nav-items.ts` tab with shield/target icon. |
| **Phase 1** | **Admin Leads Portal UI/UX (Tabs 1–4)** | 🟢 COMPLETED | Responsive table, stats cards, search/filter bar, lead detail drawer, manual creation modal. |
| **Phase 2** | **Multi-Source Scraping & Ingestion Engine** | ⚪ QUEUED | Scraper pipelines for Motels, Student Housing, 55+, Luxury, Commercial. |
| **Phase 2** | **5-Tier Intent Scoring & Enrichment Parser** | ⚪ QUEUED | Automated scoring on hiring triggers, municipal code violations, negative reviews. |
| **Phase 3** | **4-Touch B2B Sales Sequence Sequencer** | ⚪ QUEUED | Day 1, Day 4, Day 8, Day 14 cadence, 50/day throttling, auto-stop on reply. |
| **Phase 3** | **2-Touch Specialist Recruitment Cadence** | ⚪ QUEUED | Operations Specialist sourcing, personalized template delivery, resume ingestion. |
| **Phase 4** | **Human-in-the-Loop AI Reply Assistant** | ⚪ QUEUED | Inbound email listener, intent classifier, draft-only generator, 1-click human dispatch. |
| **Phase 5** | **Live Deliverability Ramp & Hand-Off Playbook**| ⚪ QUEUED | Domain warm-up monitoring, dry-run delivery tests, operator documentation. |

---

## 3. QA Acceptance Criteria Checklist (For USA Client QA Team)

### Module 1: Data Presentation & 9 Standard Fields
- [ ] **Field Integrity:** All 9 fields render accurately without data truncation:
  1. Property Name
  2. Community / Property Type (Motel, Student Housing, Luxury, 55+, Commercial)
  3. Address
  4. Municipality / Town
  5. County
  6. Key Amenities & Pain Signals
  7. Target Gatekeeper (Name & Title)
  8. Phone (Click-to-call link with format validation)
  9. Email (Mailto link with format validation)
- [ ] **Empty States:** Graceful handling when optional fields (e.g. gatekeeper name or phone) are missing, displaying subtle placeholder badges instead of broken layouts.

### Module 2: Filtering, Search & Real-Time Responsiveness
- [ ] **Search:** Case-insensitive search querying Property Name, Address, Contact Name, and Email simultaneously.
- [ ] **Type Filter:** Filtering by Motels, Student Housing, Luxury, 55+, Commercial returns exact subsets.
- [ ] **Tier Filter:** Filtering by Tier 1 (Active Pain) through Tier 5 accurately narrows rows.
- [ ] **Status Filter:** Filtering by New, Enriched, In Cadence, Responded, Demo Scheduled, Opt-Out.
- [ ] **Multi-Screen Responsiveness:**
  - Desktop (>1280px): Full table view with high-density data spacing.
  - Tablet (768px–1024px): Responsive horizontally scrolling table with sticky action column.
  - Mobile (<768px): Card-based stacked view optimized for touch and vertical thumb scroll.

### Module 3: 1-Click Data Export (.xlsx & .csv)
- [ ] **Excel (.xlsx) Format:**
  - Clean workbook name: `amenityops-leads-[timestamp].xlsx`.
  - Header row styled with bold font, colored background, and auto-filters enabled.
  - Column widths auto-calculated based on content length.
  - Phone numbers preserved as clean text strings (never scientific notation).
- [ ] **CSV (.csv) Format:**
  - RFC-4180 standard escaping for addresses and notes with commas/quotes/newlines.
  - Compatible with Excel, Google Sheets, Apollo.io, and Smartlead.
- [ ] **Filter-Aware Export:** When a filter is active (e.g. only "Motels" in "Essex County"), clicking Export only downloads the filtered subset.

### Module 4: Manual Creation & CSV Upload
- [ ] **Manual Lead Addition:** Accessible modal with instant validation and immediate table insertion.
- [ ] **Batch CSV Import:** Client can drop a CSV file, map the columns, and ingest records with duplicate detection.

---

## 4. Local Commit History Log (Lead Generation Engine)

*(Maintained continuously; no remote push until client QA approval)*

| Commit SHA | Phase | Description |
| :--- | :--- | :--- |
| `b5c5e78` | Phase 1 | `feat(leads): implement Phase 1 Lead Engine schema, export utilities, and /admin/leads portal` |

