# Project Description & Alignment Document
## Amenity Op's — Lead Generation, Recruitment & Outreach Automation Engine

**Prepared for:** Client Review & Scope Alignment  
**Project Status:** Scope Updated with Client Feedback (Ready for Execution Alignment)  
**Date:** November 2026  

---

## 1. Executive Summary

This document defines the project scope, technical specifications, data schemas, and operational architecture for the **Amenity Op's Lead Generation, Specialist Recruitment, and Outreach Automation Engine**.

The system is engineered as an autonomous growth engine consisting of three core modules:
1. **B2B Customer Lead Discovery & Cold Outreach Engine** — Identifies qualifying commercial, residential, and hospitality properties displaying active overnight operational pain, enriches verified decision-maker records, and runs a targeted 4-touch email sequence.
2. **Specialist Field Recruitment Engine** — Sources, evaluates, and contacts qualified overnight operations, inspection, and compliance candidates via a separate 2-touch recruiting pipeline.
3. **Human-in-the-Loop AI Reply Assistant** — Monitors outreach inboxes, classifies replies by intent, cancels follow-up cadences immediately upon response, and drafts tailored responses for human review and 1-click dispatch.

> **Production Isolation Rule:** This outreach engine operates completely independent of the core `amenityops.app` platform. Production inspection reports, client checklists, and password-reset workflows will never share sending domains, mailboxes, or IP addresses with outbound campaigns.

---

## 2. Infrastructure, Data Storage & Export Architecture

### 2.1 Dedicated Data Store (Completely Isolated from Production)
All raw scraped property data, contact enrichment, outreach status, and logs will be housed in an **independent lead database**:
- Isolated schema to guarantee zero impact on live inspection app performance.
- Full relational integrity tracking lead origin, scrape timestamp, intent triggers, outreach stage, and communication history.

### 2.2 Direct Data Export to Excel (`.xlsx`) & CSV (`.csv`)
To ensure full data ownership, mobility, and review flexibility:
- **Instant 1-Click Export:** The engine provides on-demand data export into both Microsoft Excel (`.xlsx`) and standard comma-separated (`.csv`) formats.
- **Segmented / Filtered Exports:** Ability to export by date range, property type (e.g., Motels, Student Housing, 55+), geographical region, or outreach status (e.g., *Enriched, In Sequence, Responded, Demo Requested*).
- **Clean Field Formatting:** Pre-formatted column widths, sanitized phone numbers, standard ISO dates, and clean multiline amenity notes.

### 2.3 Deliverability & Domain Protection
- **Dedicated Lookalike Domains:** Outbound sequences run across **4 to 5 secondary domains** (e.g., `getamenityops.com`, `amenityopshq.com`, `amenityops.co`, `useamenityops.com`, `tryamenityops.com`).
- **Distributed Sending:** 2 inboxes per domain (**8 to 10 inboxes total**).
- **Mandatory Warm-Up:** Automated deliverability warm-up for **14 to 21 days** before sending live outreach.
- **Strict Throttling:** Capped at **50 emails/day per inbox** (including initial messages and follow-ups).
- **Zero List Crossover:** Property management prospects and specialist job applicants remain in strictly segregated pipelines.

---

## 3. Module 1: B2B Customer Lead Generation & Outreach

### 3.1 Target Property Profile (Expanded Scope)
The engine identifies properties that already utilize evening/overnight staff and need standardized digital checklists and automated morning hand-off reports.

**A property is retained if it matches any of the following categories:**
1. **Commercial Multi-Tenant:** Office complexes or multi-use assets with 3+ distinct corporate tenants or over 50,000 sq. ft.
2. **Luxury Multi-Family & High-Rises:** Premium residential towers featuring amenities requiring strict asset protection (concierge desks, fitness facilities, pools, underground garages, smart/controlled access).
3. **55+ Active Adult & Independent Living Communities:** Senior living assets with high overnight safety, compliance, and morning-readiness liabilities.
4. **Motels & Boutique Hospitality:** Extended-stay and independent motel assets experiencing overnight front-desk turnover, unmonitored night hours, and exterior property/safety audit needs.
5. **Off-Campus Student Housing Complexes:** High-density, high-liability communities subject to after-hours amenity abuse, noise/trash issues, security gate failures, and rigorous room/common area turnover audits.
6. **Multi-Asset Regional Portfolios:** Corporate management firms overseeing clusters of any of the above asset categories.

> **Extensible Architecture:** The property profile taxonomy is built with a flexible classification engine, allowing rapid addition of new target asset classes (e.g., self-storage, mixed-use retail, industrial parks) as Amenity Op's expands its reach.

### 3.2 Standard Scraped Lead Data Schema
For every qualifying asset, the scraper and enrichment engine extracts and normalizes the following standardized schema:

| Column / Field | Data Description & Source |
| :--- | :--- |
| **Property Name** | Official legal or operating name of the asset. |
| **Community / Property Type** | Specific asset classification (*Motel, Off-Campus Student Housing, Luxury Multi-Family, 55+ Active Adult, Commercial Multi-Tenant*). |
| **Address** | Physical street address of the building/complex. |
| **Municipality / Town** | City, town, or incorporated municipality. |
| **County** | County jurisdiction (critical for tax, deed, and municipal court violation lookups). |
| **Key Amenities / Notes** | Physical features requiring overnight audit (e.g., *concierge, gated parking, pool/clubhouse, fitness center, fire exits, exterior corridors*), plus any detected pain signals (e.g., recent municipal fines, hiring posts, or negative night-shift reviews). |
| **Target Gatekeeper / Contact** | Full name and title of the primary local or regional decision-maker (e.g., *Property Manager, General Manager, Community Director, Facilities Lead*). |
| **Phone** | Verified direct line, leasing office phone, or executive desk number. |
| **Email** | Validated corporate or direct business email address for the identified decision-maker. |

### 3.3 Five-Tier Discovery & Intent Scoring
Leads are surfaced and scored by **active operational pain**, ensuring outreach is timely and relevant:

| Tier | Priority | Core Sources | Specific Signals Scraped |
| :--- | :--- | :--- | :--- |
| **Tier 1** | **Highest (Active Pain)** | Indeed, ZipRecruiter, LinkedIn Sales Navigator, Google Maps Reviews, Glassdoor | Active job openings for *Night Manager, Overnight Operations, Front Desk Closer, Night Auditor*; repeated night postings across regional assets; reviews citing *broken gates, unattended desks, morning trash*; employee complaints regarding *short staffing or manual paperwork*. |
| **Tier 2** | **High (Risk & Violations)** | Municipal Building Depts, Code Enforcement Records, Apollo.io, ZoomInfo | Citations or fines within the last 90 days (*trash logistics, lighting failures, fire door obstructions*), mapped to verified executive contacts. |
| **Tier 3** | **Targeted Portals** | Apartments.com, RentCafe, CollegeStudentHousing, SeniorHousingNet, Hospitality registries | Targeted scraping across student housing directories, motel listings, 55places, and Class A multi-family aggregators. |
| **Tier 4** | **Enterprise Portals** | Greystar, Lincoln Property Co., CBRE, JLL, Cushman & Wakefield, Colliers | Enterprise portfolios where a single relationship standardizes operations across dozens of buildings. |
| **Tier 5** | **CRE Verification** | CoStar, LoopNet, Crexi, County GIS, State Registries (SOS) | Cross-checks structural square footage, ownership transitions (last 6 months), and legal entity officer filings. |

### 3.4 Automated 4-Touch Sales Cadence
Outbound emails deploy **Tuesday through Thursday mid-morning** (prospect local time). Any prospect reply, demo request, or opt-out automatically and permanently halts further sequence steps:
- **Email 1 (Day 1):** Addresses the stress of overnight uncertainty; introduces Amenity Op's as an in-house software upgrade; requests permission to share a 5-minute self-paced demo video.
- **Email 2 (Day 4):** Focuses on eliminating the "morning surprise" via automated hand-off reports delivered before morning coffee; invites prospect to reply *"demo"*.
- **Email 3 (Day 8):** Highlights self-sufficiency—empowering existing staff with digital checklists without hiring expensive outside third parties; re-offers demo video link.
- **Email 4 (Day 14):** Polite break-up message; concludes proactive outreach and leaves the self-paced demo link for future reference.

---

## 4. Module 2: Specialist Recruitment Automation

Runs completely independent of customer outreach to build and maintain the on-demand roster of Operations Continuity Specialists.

### 4.1 Candidate Evaluation Criteria
Profiles are filtered against three operational competencies:
1. **Autonomous Off-Hours Track Record:** Documented success in evening, graveyard, or early morning shifts without direct on-site supervision.
2. **Operations & Checklist Literacy:** Background in facilities walkthroughs, asset protection, building lockups, compliance audits, or familiarity with property technology apps.
3. **Reliability & Consistency:** Steady tenure in high-trust roles with demonstrable attention to detail.

### 4.2 Sourcing Channels & 2-Touch Sequence
- **Sources:** LinkedIn Boolean mining, Indeed Resume database, ZipRecruiter operations pools, and security/facilities-adjacent boards.
- **Cadence:** Maximum of **2 personalized outreach emails**, stopping immediately upon any reply or opt-out request.
- **Role Positioning:** Explicitly framed as a **technology-enabled operations inspection role**—never positioned as a traditional security guard post.

---

## 5. Module 3: AI Lead Reply Assistant (Human-in-the-Loop)

Accelerates response times to warm inbound responses while keeping human operators 100% in control of outgoing messages.

### 5.1 Operating Workflow
1. **Noise Filtering:** Discards out-of-office autoreplies, bounces, newsletters, and vendor spam. Flags misdirected tenant/support emails for manual escalation.
2. **Intent Classification:** Categorizes incoming messages (*Wants Demo, Request for Pricing/Terms, How It Works, Referral to Colleague, Not Interested, Stop/Opt-Out, Specialist Applicant*).
3. **Draft-Only Generation:** Generates a thread-contextual draft adhering strictly to Amenity Op's voice and policies. Never fabricates pricing, terms, or unverified claims.
4. **Sequence Suppression:** Immediately flags the prospect in the sequencing tool so subsequent automated campaign emails are canceled.
5. **Human Dispatch:** A team member reviews the draft, adjusts if needed, and manually clicks **Send**. The assistant has **zero auto-send authority**.

---

## 6. Project Implementation Phases

| Phase & Timeline | Focus Area | Key Deliverables & Action Items |
| :--- | :--- | :--- |
| **Phase 1**<br>*(Weeks 1–3)* | **Infrastructure, Domains & Inbox Warm-Up** | • Acquire and configure DNS (SPF, DKIM, DMARC) for 4–5 lookalike secondary domains.<br>• Provision 8–10 sending inboxes and initiate 14–21 day automated deliverability warm-up.<br>• Set up dedicated isolated lead database and 1-click Excel (`.xlsx`) / CSV export engine. |
| **Phase 2**<br>*(Weeks 2–4)* | **Scraper, Enrichment & Property Profile** | • Deploy automated multi-source scrapers across Commercial, Luxury, 55+, Motels & Student Housing.<br>• Build intent scoring engine (hiring triggers, municipal code violations, reviews).<br>• Integrate verified decision-maker contact discovery (Email & Phone enrichment).<br>• Verify end-to-end data export to `.xlsx` and `.csv`. |
| **Phase 3**<br>*(Weeks 4–5)* | **Outbound Sequencer & Recruiting Pipeline** | • Build the automated 4-step B2B sales sequence (Tue–Thu mid-morning delivery).<br>• Build the 2-step Operations Specialist recruitment cadence.<br>• Implement inbox round-robin rotation, 50/day throttling, and auto-halt triggers on reply/opt-out. |
| **Phase 4**<br>*(Weeks 5–6)* | **AI Reply Assistant & Mailbox Integration** | • Connect AI monitoring to marketing inboxes to filter bounces, OOO, and spam.<br>• Implement thread-aware intent classifier and draft-only generator (never auto-sends).<br>• Set up instant sequence pause on inbound replies and human notification workflow. |
| **Phase 5**<br>*(Weeks 6–7)* | **Calibration, Live Ramp & Hand-Off** | • Conduct end-to-end dry-run audits and calibrate intent scoring thresholds.<br>• Execute controlled outbound ramp-up (scaling safely from 10 to 25 to 50/day per inbox).<br>• Deliver operational hand-off playbook and client training. |

---

## 7. Client Alignment Checklist

To proceed with Phase 1 kickoff, please confirm:
- [x] **Target Fields to Pull:** Locked to the 9 standard fields defined in Section 3.2.
- [x] **Data Storage & Export:** Dedicated isolated database with on-demand `.xlsx` and `.csv` export.
- [x] **Expanded Property Scope:** Motels and Off-Campus Student Housing incorporated with an extensible category model.
- [ ] **Secondary Domain Approval:** Approval of the 4–5 lookalike domain names to purchase.
- [ ] **Demo Video URL:** Destination link for the 5-minute self-paced demo video.
- [ ] **Priority Target Geography:** Confirmation of primary initial metro areas or states.
- [ ] **Commercial Lead Contact:** Email address of the team member receiving hot sales/pricing handoffs.
