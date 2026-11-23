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
| **Phase 2** | **Multi-Source Scraping & Ingestion Engine** | 🟢 COMPLETED | Scraper pipelines across Motels, Student Housing, 55+, Luxury, and Commercial assets. |
| **Phase 2** | **5-Tier Intent Scoring & Enrichment Parser** | 🟢 COMPLETED | Automated scoring on hiring triggers, municipal code violations, negative reviews (`intent-scorer.ts`). |
| **Phase 2** | **Contact Sanitizer & Title Enrichment Engine**| 🟢 COMPLETED | Phone standardization `(XXX) XXX-XXXX`, email corporate domain check, gatekeeper title mapping (`contact-enricher.ts`). |
| **Phase 2** | **Batch CSV / Excel Importer & Ingestion UI** | 🟢 COMPLETED | Drag-and-drop CSV parser with auto column mapping, validation flags, deduplication (`BatchImportModal.tsx`). |
| **Phase 2** | **Live Multi-Source Scraper Simulation Modal** | 🟢 COMPLETED | Interactive discovery runner with progress animations and county/class filters (`RunScraperModal.tsx`). |
| **Phase 3** | **4-Touch B2B Sales Sequence Sequencer** | 🟢 COMPLETED | Day 1, 4, 8, 14 personalized cadence, Tue–Thu mid-morning window, 50/day cap, auto-stop on reply (`outreach-sequencer.ts`). |
| **Phase 3** | **2-Touch Specialist Recruitment Cadence** | 🟢 COMPLETED | Operations Continuity Specialist candidate roster, competency scoring, 2-touch recruitment cadence. |
| **Phase 3** | **Sequence Inspection & Simulation Modal** | 🟢 COMPLETED | `SequencePreviewModal.tsx` rendering dynamic variables (`{{propertyName}}`, `{{contactName}}`) and advance triggers. |
| **Phase 4** | **Human-in-the-Loop AI Reply Assistant** | 🟢 COMPLETED | Inbound email listener, intent classifier, noise/bounce filter, draft-only generator (`ai-reply-assistant.ts`). |
| **Phase 4** | **Review Queue & QA Simulator UI** | 🟢 COMPLETED | `AiDraftReviewCard.tsx` with draft editor, 1-click dispatch, and 5-scenario QA simulation runner. |
| **Phase 5** | **Live Deliverability Ramp & Hand-Off Playbook**| 🟢 COMPLETED | `LEAD_GENERATION_OPERATIONAL_PLAYBOOK.md` with DNS setup, 4-week ramp schedule, daily operator SOP, and QA matrix. |

---

## 3. QA Acceptance Criteria Checklist (For USA Client QA Team)

### Module 1: Data Presentation & 9 Standard Fields
- [x] **Field Integrity:** All 9 fields render accurately without data truncation:
  1. Property Name
  2. Community / Property Type (Motel, Student Housing, Luxury, 55+, Commercial)
  3. Address
  4. Municipality / Town
  5. County
  6. Key Amenities & Pain Signals
  7. Target Gatekeeper (Name & Title)
  8. Phone (Click-to-call link with format validation)
  9. Email (Mailto link with format validation)
- [x] **Empty States:** Graceful handling when optional fields (e.g. gatekeeper name or phone) are missing, displaying subtle placeholder badges instead of broken layouts.

### Module 2: Filtering, Search & Real-Time Responsiveness
- [x] **Search:** Case-insensitive search querying Property Name, Address, Contact Name, and Email simultaneously.
- [x] **Type Filter:** Filtering by Motels, Student Housing, Luxury, 55+, Commercial returns exact subsets.
- [x] **Tier Filter:** Filtering by Tier 1 (Active Pain) through Tier 5 accurately narrows rows.
- [x] **Status Filter:** Filtering by New, Enriched, In Cadence, Responded, Demo Scheduled, Opt-Out.
- [x] **Multi-Screen Responsiveness:**
  - Desktop (>1280px): Full table view with high-density data spacing.
  - Tablet (768px–1024px): Responsive horizontally scrolling table with sticky action column.
  - Mobile (<768px): Card-based stacked view optimized for touch and vertical thumb scroll.

### Module 3: 1-Click Data Export (.xlsx & .csv)
- [x] **Excel (.xlsx) Format:**
  - Clean workbook name: `amenityops-leads-[timestamp].xlsx`.
  - Header row styled with bold font, colored background, and auto-filters enabled.
  - Column widths auto-calculated based on content length.
  - Phone numbers preserved as clean text strings (never scientific notation).
- [x] **CSV (.csv) Format:**
  - RFC-4180 standard escaping for addresses and notes with commas/quotes/newlines.
  - Compatible with Excel, Google Sheets, Apollo.io, and Smartlead.
- [x] **Filter-Aware Export:** When a filter is active (e.g. only "Motels" in "Essex County"), clicking Export only downloads the filtered subset.

### Module 4: Manual Creation & CSV Upload
- [x] **Manual Lead Addition:** Accessible modal with instant validation and immediate table insertion.
- [x] **Batch CSV Import:** Client can drop a CSV file, map the columns, and ingest records with duplicate detection.

---

## 4. Local Commit History Log (Lead Generation Engine)

*(Maintained continuously; no remote push until client QA approval)*

| Commit SHA | Phase | Description |
| :--- | :--- | :--- |
| `b5c5e78` | Phase 1 | `feat(leads): implement Phase 1 Lead Engine schema, export utilities, and /admin/leads portal` |
| `8443c72` | Phase 1 | `docs: update lead generation task tracker with Phase 1 completion` |
| `69509b2` | Phase 2 | `feat(leads): implement Phase 2 scraper pipeline, 5-tier intent scorer, and batch importer` |
| `bdbacd0` | Phase 2 | `docs: document Phase 2 scraper pipeline and intent scoring engine in specs and task tracker` |
| `b7a75cb` | Phase 3 | `feat(leads): implement Phase 3 4-touch B2B cadence and specialist recruitment pipeline` |
| `8d6625e` | Phase 3 | `docs: document Phase 3 B2B sequencer and specialist recruiting pipeline in specs and tracker` |
| `5ad5585` | Phase 4 | `feat(leads): implement Phase 4 AI reply assistant, review queue, and inbound simulator` |
| `3e777f9` | Phase 4 | `docs: document Phase 4 AI reply assistant and review queue in specs and task tracker` |
| `[PENDING]` | Phase 5 | `docs: complete Phase 5 operational playbook, deliverability ramp, and QA handoff` |

