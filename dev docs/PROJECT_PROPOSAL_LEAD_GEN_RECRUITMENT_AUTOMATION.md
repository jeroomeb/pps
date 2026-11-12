# Project Description & Alignment Document
## Amenity Op's — Lead Generation, Recruitment & Outreach Automation Engine

**Prepared for:** Client Review & Scope Alignment  
**Project Status:** Proposed Next Phase (Separate from Core `amenityops.app` SaaS Platform)  
**Date:** November 2026  

---

## 1. Executive Summary

This document outlines the updated project scope and operational blueprint for the **Amenity Op's Lead Generation, Specialist Recruitment, and Outreach Automation Engine**.

The system is designed as an independent, automated growth platform consisting of three integrated modules:
1. **B2B Customer Lead Generation & Cold Outreach Engine** — Identifies qualifying properties and decision-makers showing active overnight operational pain, then runs a targeted 4-step email sequence.
2. **Specialist Field Recruitment Engine** — Sources, scores, and contacts qualified overnight operations and compliance candidates via a separate 2-step recruiting sequence.
3. **Human-in-the-Loop AI Reply Assistant** — Monitors the marketing mailbox, classifies incoming replies, cancels follow-up sequences automatically, and prepares human-reviewed response drafts.

> **Core Architecture Rule:** This outreach engine operates completely separate from the live `amenityops.app` application. Inspection reports, password resets, and operational alerts on `amenityops.app` will never share domains, mailboxes, or databases with cold outreach or recruiting campaigns.

---

## 2. Infrastructure & Deliverability Safeguards

To send outbound campaigns at scale without triggering spam filters or damaging the primary `amenityops.app` domain reputation, the outreach infrastructure follows strict isolation rules:

- **Dedicated Secondary Domains:** Acquire **4 to 5 lookalike domains** strictly for outreach (e.g., `getamenityops.com`, `amenityopshq.com`, `amenityops.co`, `useamenityops.com`, `tryamenityops.com`, `amenityopslabs.com`).
- **Distributed Mailboxes:** Provision **2 inboxes per domain** (8–10 active sending inboxes total).
- **Mandatory Warm-Up Period:** All new domains and inboxes undergo automated deliverability warm-up for **14 to 21 days** prior to launching any live sequence.
- **Strict Sending Caps:** Each inbox is capped at **50 total emails per day** (combining initial touches and follow-ups).
- **Zero List Crossover:** Customer prospects and specialist job candidates are stored in separate pipelines. A property manager is never routed to recruitment, and a job candidate is never placed on a B2B sales list.

---

## 3. Module 1: B2B Customer Lead Generation & Outreach

### 3.1 Target Property Profile (Qualification Filters)
The automation targets property managers who already employ overnight or evening staff and want to standardize operations with a digital checklist and automated morning hand-off report (without replacing their existing team).

**A property is only retained if it meets at least one of these structural criteria:**
- **Commercial Multi-Tenant:** 3+ distinct corporate tenants or larger than 50,000 sq. ft.
- **Luxury Multi-Family / High-Rise:** Properties featuring premium amenities (concierge, fitness center, clubhouse, underground parking, controlled/smart access).
- **55+ Active Adult & Independent Living:** Communities with heightened overnight safety, compliance, and morning-readiness liabilities.
- **Multi-Asset Regional Portfolios:** Management companies overseeing clusters of qualifying properties.

*All properties failing these criteria are automatically discarded before enrichment or outreach.*

### 3.2 Five-Tier Lead Discovery & Signal Scoring
Instead of blasting static property directories, leads are prioritized by **live operational pain and intent triggers**:

| Tier | Priority | Sources | Target Signals & Buying Triggers |
| :--- | :--- | :--- | :--- |
| **Tier 1** | Highest (Active Pain) | Indeed, ZipRecruiter, LinkedIn Sales Navigator, Google Maps Reviews, Glassdoor | Active hiring for *Night Manager / Overnight Operations / Front Desk Closer*; corporate clusters of night-shift listings; resident complaints (*unattended desk, broken gates, morning mess*); employee reviews citing *short staffing, burnout, manual paperwork*. |
| **Tier 2** | High (Risk & Compliance) | Municipal Building Departments, Apollo.io, ZoomInfo | City code violations or fines within the last 90 days (*trash logistics, lighting failures, blocked exits*), paired with verified executive contact enrichment. |
| **Tier 3** | Targeted Niche | SeniorHousingNet, Yardi Matrix, Apartments.com, 55places, After55, RentCafe | Isolates luxury high-rises, Class A portfolios, and 55+ active-adult communities. |
| **Tier 4** | Portfolio Scale | Greystar, Lincoln Property Co., CBRE, JLL, Cushman & Wakefield, Colliers portals | Enterprise property networks where one partnership unlocks dozens of buildings. |
| **Tier 5** | Background Verification Only | CoStar, LoopNet, Crexi, County GIS, State Registries (SOS), Attom Data | Used strictly to verify square footage, tenant count, ownership changes (last 6 months), and LLC officer names. *Never emailed directly without Tier 1–4 qualification.* |

### 3.3 Target Decision-Maker Personas
Each qualified company receives one primary contact matched to the person experiencing the morning hand-off friction first:
- **Property Level:** Property Manager, Senior Community Manager, General Manager / Resident Experience Director, Assistant Property Manager.
- **Regional / Portfolio Level:** Regional Operations Director, VP of Property Management, Director of Asset Management.
- **Risk & Facilities Level:** Facilities Director / Chief Engineer, Head of Security & Compliance / Risk Manager, Director of PropTech (enterprise), VP of HR (when night-shift turnover is the trigger).

### 3.4 Automated 4-Step Sales Sequence
Outbound emails are sent **Tuesday through Thursday mid-morning** (local time). If a prospect replies, requests the demo, or asks to stop, all remaining steps cancel immediately.

| Step | Timing | Core Messaging & Call to Action |
| :--- | :--- | :--- |
| **Email 1** | Day 1 | **Introduction & Hook:** Addresses after-hours uncertainty; introduces Amenity Op's as a standalone tool empowering existing in-house staff; asks permission to send a 5-minute self-paced demo video. |
| **Email 2** | Day 4 | **The Morning Surprise:** Eliminating morning catch-up and guesswork with automated morning hand-off reports; invites prospect to reply *"demo"* for the video link. |
| **Email 3** | Day 8 | **Self-Sufficiency:** Contrasts memory/paper logs with digital compliance checklists without hiring outside contractors; re-offers the self-paced video. |
| **Email 4** | Day 14 | **Polite Break-Up:** Closes the loop respectfully, stops further outreach, and leaves the self-paced demo link for future reference. |

### 3.5 Monthly Pipeline Math & Volume Targets (At Full Scale)
Based on a 20-working-day month and a conservative 0.2% cold-to-close conversion benchmark:
- **New Companies Added:** ~125 targeted companies per working day (**2,500 companies/month**).
- **Daily Sending Volume:** ~125 first-touch emails + ~375–500 follow-ups = **500–625 total emails/day** (safely distributed across 8–10 warmed inboxes).
- **Monthly Total Volume:** **10,000–12,500 emails/month**.
- **Expected Funnel Output:** ~90 total replies -> 15–25 discovery/sales calls -> **~5 new signed clients/month**.

---

## 4. Module 2: Specialist Recruitment Automation

This pipeline sources qualified field personnel (Operations Continuity Specialists) completely independently from software sales.

### 4.1 Candidate Scoring Profile
Resumes and profiles are filtered and scored against three competency pillars:
1. **Autonomous Night/Off-Hours Experience:** Proven reliability in evening, overnight, or early-morning shifts without direct on-site supervision.
2. **Operations, Compliance & PropTech Fluency:** Familiarity with building continuity hand-offs, multi-point compliance checklists (fire safety, building condition audits), asset protection, and property software (e.g., Yardi, RealPage, AppFolio, or mobile ticketing/audit apps).
3. **Work Ethic Indicators:** Long tenures in high-responsibility roles and measurable accuracy/compliance track records.

### 4.2 Candidate Sourcing Platforms
- **LinkedIn:** Boolean searches combining property operations, asset protection, and night-shift management.
- **Indeed & Resume-Library:** Active resume mining for facility operations and risk mitigation backgrounds.
- **ZipRecruiter:** Localized hourly/salaried operations coordinators and vendor hand-off leads.
- **Niche Tech & Operations Communities:** PropTech user forums and security-adjacent operations job boards (e.g., ClearanceJobs / local operations registries).

### 4.3 Recruiting Outreach Cadence
- **2-Email Sequence:** Qualified candidates receive a maximum of **2 emails**, stopping automatically upon any reply or opt-out.
- **Messaging Positioning:** Explicitly frames the opportunity as an **operations and digital checklist role** using mobile technology—never framed as a traditional "security guard" post.

---

## 5. Module 3: AI Lead Reply Assistant (Human-in-the-Loop)

When prospects or candidates write back to the marketing inbox, the **Reply Assistant** accelerates response time while keeping humans 100% in control of outbound communication.

### 5.1 How the Assistant Operates
1. **Noise Filtering:** Automatically skips bounces, delivery failures, out-of-office auto-responders, newsletters, and spam. (Flags misrouted billing/support/inspection emails for manual review).
2. **Thread Context & Classification:** Reads the full email thread and categorizes the reply (e.g., *Wants Demo*, *How It Works*, *Pricing/Pilot Inquiry*, *Referral to Colleague*, *Not Interested*, *Unsubscribe/Stop*, or *Specialist Candidate Reply*).
3. **Draft Generation (Drafts Only):** Writes a reply matching Amenity Op's exact voice and rules—never inventing pricing, discounts, fake customer metrics, or unauthorized claims—and saves it as a **Draft** in the thread.
4. **Sequence Pause Notification:** Records that a live reply occurred so the outbound sequencer immediately cancels Day 4/8/14 follow-ups.
5. **Human Review & Send:** A team member reviews, edits if needed, and manually clicks **Send** (or deletes the draft). The assistant has **no automated send capability**.

### 5.2 Built-In Guardrails
- Never sends an email automatically.
- Never invents pricing, contract terms, or case studies.
- Never contacts a third-party address mentioned in a referral without human execution.
- Immediately drafts a polite stop confirmation for any "unsubscribe" or "do not contact" reply and flags the contact for suppression.
- Strictly separates customer sales drafts from specialist recruiting drafts.

---

## 6. Project Deliverables & Implementation Phases

| Phase | Scope & Deliverables |
| :--- | :--- |
| **Phase 1: Infrastructure & Deliverability** | Acquisition and DNS setup (SPF, DKIM, DMARC) of 4–5 secondary domains, configuration of 8–10 outreach inboxes, and initiation of the 14–21 day automated inbox warm-up cycle. |
| **Phase 2: Scraping & Enrichment Engine** | Automated data collectors across Tier 1–4 sources, firmographic filtering (50k+ sq. ft., 3+ tenants, luxury/55+), pain-signal scoring, decision-maker email verification, and separate candidate resume scoring pipeline. |
| **Phase 3: Multi-Channel Sequencer** | Setup of the 4-step B2B sales cadence (Tue–Thu scheduling, reply/opt-out auto-halt) and the 2-step specialist recruitment cadence. |
| **Phase 4: AI Reply Assistant** | Deployment of the marketing mailbox monitor, intent classifier, thread-aware draft generator, and human notification workflow. |
| **Phase 5: Launch, QA & Hand-Off** | Dry-run verification, calibration of scoring thresholds, live campaign ramp-up (scaling safely to 50/day per inbox), and operational playbook hand-off. |

---

## 7. Items Required for Client Alignment Before Kickoff

To finalize configuration and begin Phase 1, please review and confirm the following items:
1. **Secondary Domains:** Approval of 4–5 lookalike domain names to purchase for outreach isolation.
2. **Self-Paced Demo Video Link:** Final URL for the 5-minute demo video referenced in Emails 1–4 and the Reply Assistant.
3. **Target Geography:** Confirmation of priority metro markets/states for initial customer scraping and specialist sourcing.
4. **Recruitment Email Copy:** Approval of the 2-step outreach email templates for specialist candidates (aligned with the operations/checklist positioning).
5. **Commercial Handoff:** Confirmation of which team inbox/person receives notifications when a prospect asks pricing/contract questions or requests a call.

