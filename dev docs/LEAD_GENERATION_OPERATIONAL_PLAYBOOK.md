# Amenity Op's Lead Generation & Outreach Engine — Operational Hand-Off Playbook

**Document Type:** Production Operating Manual & Client Hand-Off Guide  
**Audience:** Executive Team, Property Operations Leads & QA Audit Team  
**Standard:** Production-Grade / Zero-Risk Production Isolation  
**Date:** November 2026  

---

## 1. Executive Overview

This playbook establishes the standard operating procedures (SOPs), deliverability ramp schedules, and quality assurance protocols for the **Amenity Op's Lead Generation, Specialist Recruitment, and Outreach Automation Engine**.

The system is fully accessible from the unified **Amenity Op's Admin Portal** at:
```text
https://amenityops.app/admin/leads
```

---

## 2. Infrastructure & Deliverability Ramp-Up Schedule

To protect the primary domain (`amenityops.app`) and guarantee maximum inbox placement, all cold outbound outreach dispatches across **4 to 5 secondary lookalike domains** with dedicated sending inboxes.

### 2.1 Recommended Secondary Domain Architecture
* `getamenityops.com` (2 inboxes: `alex@...`, `ops@...`)
* `amenityopshq.com` (2 inboxes: `sarah@...`, `audits@...`)
* `useamenityops.com` (2 inboxes: `team@...`, `inspections@...`)
* `tryamenityops.com` (2 inboxes: `contact@...`, `reports@...`)
* `amenityops.co` (2 inboxes: `marcus@...`, `compliance@...`)

### 2.2 Mandatory DNS Authentication Setup
Every secondary domain must have 100% passing records prior to sending live messages:

| Record Type | Host | Target / Value | Purpose |
| :--- | :--- | :--- | :--- |
| **MX** | `@` | Google Workspace / Zoho Mail MX servers | Mailbox delivery routing |
| **SPF** | `@` | `v=spf1 include:_spf.google.com ~all` | Authorizes legitimate sending IPs |
| **DKIM** | `google._domainkey` | Cryptographic public key provided by mailbox host | Cryptographic signature validation |
| **DMARC** | `_dmarc` | `v=DMARC1; p=quarantine; rua=mailto:dmarc@getamenityops.com` | Prevents domain spoofing & establishes trust |
| **Custom Tracking** | `email` | `cname.secureserver.net` (SSL enabled) | Custom link tracking domain matching sender |

### 2.3 The 4-Week Volume Ramp Schedule
Outreach inboxes must follow this gradual ramp curve:

```
Daily Outbound Emails per Inbox
 50 |                                        [Week 4+: Capped at 50/day]
 40 |
 30 |                             [Week 3: 25-35/day]
 20 |               [Week 2: 15-20/day]
 10 | [Week 1: Warm-up Only]
  0 +-------------------------------------------------------------------> Time
```

| Timeline | Daily Outbound per Inbox | Total Outbound (10 Inboxes) | Operational Focus |
| :--- | :--- | :--- | :--- |
| **Weeks 1–2** | 0 cold emails (warm-up only) | 0 cold emails | Automated peer warm-up network (smartlead/instantly) generating high-reputation open/reply signals. |
| **Week 3** | 10 to 15 cold emails/day | 100 to 150 emails/day | Initial soft launch targeting Tier 1 Active Pain leads (properties with night hiring posts). |
| **Week 4** | 25 to 35 cold emails/day | 250 to 350 emails/day | Expanding to Tier 2 (code violations) and Tier 3 (student housing & motels). |
| **Week 5+** | **50 cold emails/day (HARD CAP)** | **500 emails/day max** | Full steady-state production throughput. |

---

## 3. Daily 5-Minute Operator Workflow

Operators should execute this standard 3-step routine once every morning (Monday through Friday):

### Step 1: Review AI Reply Queue (Tab 4 — ~2 Minutes)
1. Navigate to `/admin/leads` and click **"AI Lead Reply Assistant"**.
2. If the counter badge displays pending drafts:
   * Read the inbound prospect message and review the detected intent (*Wants Demo, Pricing, Referral*).
   * Check the proposed AI draft reply. Click **"Edit Draft"** if you wish to personalize any specifics.
   * Click **"Approve & Send"** to dispatch the message.
   * *Note: The AI assistant has zero auto-send authority. Outbound messages are never sent without human approval.*

### Step 2: Review New Discoveries & Export Regional Leads (Tab 1 — ~2 Minutes)
1. Click **"Discovered Leads"**.
2. Filter by property type (e.g. *Motels & Hospitality* or *Student Housing*) or County.
3. Click **"Export Excel (.xlsx)"** or **"Export CSV"** to generate clean, pre-formatted sheets for your local operations or sales team.
4. To launch a fresh scrape, click **"Run Scraper"** in the top action bar, pick target corridors, and click **"Run Discovery"**.

### Step 3: Monitor Active Cadences & Specialist Candidates (Tabs 2 & 3 — ~1 Minute)
1. Click **"B2B Outreach Cadence"**:
   * Verify open rate (>40%) and reply rate (>10%).
   * Confirm that prospects who responded are marked with the auto-halt trigger (*Replied* or *Opted Out*).
2. Click **"Specialist Recruitment"**:
   * Review applicants who reached Touch 2 or requested an interview.
   * Click **"Schedule Onboarding"** to transition verified candidates into the mobile app walkthrough.

---

## 4. QA Verification Test Matrix (For Client QA Team)

| Test Case | Objective | Action | Expected Pass Result |
| :--- | :--- | :--- | :--- |
| **TC-01** | Multi-Screen Responsiveness | Open `/admin/leads` on desktop, tablet, and mobile viewport (<768px). | High-density 9-field table on desktop; touch-friendly stacked cards on mobile; no layout breaks. |
| **TC-02** | 1-Click Excel Export | Filter by "Student Housing" $\rightarrow$ Click "Export Excel (.xlsx)". | Downloads `.xlsx` workbook containing only student housing records with auto-sized column widths. |
| **TC-03** | 1-Click CSV Export | Filter by "Tier 1 Active Pain" $\rightarrow$ Click "Export CSV". | Downloads RFC-4180 compliant CSV with proper quote escaping and clean phone numbers. |
| **TC-04** | Intent Scoring Automation | Click "Run Scraper" $\rightarrow$ Select Motels $\rightarrow$ Run. | Injects new motel leads; candidates with night shift hiring posts receive **Tier 1 Active Pain** badge. |
| **TC-05** | Cadence Auto-Halt | In Tab 2, find an active lead $\rightarrow$ Click "Halt Cadence". | Lead status changes to `opt_out`, sequence halts, and `next_touch_due_at` is set to null. |
| **TC-06** | AI Reply Approval | In Tab 4, click "🧪 Wants Demo Video" simulation $\rightarrow$ Click "Approve & Send". | Draft dispatches, is removed from review queue, and is permanently recorded in `growth_outreach_logs`. |
| **TC-07** | Production Database Isolation | Inspect database tables. | Leads live in `growth_*` tables; core `properties`, `inspections`, and `tenants` tables are untouched. |

---

## 5. Client Final Sign-Off Checklist

Before initiating cold outreach campaigns on live prospect mailboxes, confirm:
- [ ] **Secondary Domains Acquired:** 4–5 lookalike domains purchased and DNS configured (SPF, DKIM, DMARC).
- [ ] **Automated Warm-Up Started:** 14-day automated warm-up active on all 10 mailboxes.
- [ ] **Demo Video URL Confirmed:** Destination URL for the 5-minute self-paced video (e.g., `https://getamenityops.com/demo`).
- [ ] **Primary Geographic Corridors:** Target initial metro areas confirmed (e.g., Middlesex, Hudson, Ocean, Essex, Mercer).
- [ ] **Handoff Email Destination:** Client team email designated to receive hot demo and pricing inquiries.

