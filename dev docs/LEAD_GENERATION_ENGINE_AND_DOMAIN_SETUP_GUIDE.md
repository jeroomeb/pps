# Amenity Op's Lead Generation Engine & Domain Infrastructure Guide

**Document Version:** 1.0.0 (Production Release)  
**Target Audience:** Client Executive Team, Operations Leadership, Technical QA Team  
**Live Access Route:** `https://amenityops.app/admin/leads`  
**Date:** November 2026  

---

## 1. Executive Summary

The **Amenity Op's Lead Generation, Recruitment & Outreach Engine** is an enterprise-grade growth platform integrated directly into the Amenity Op's Admin Panel. It automates both sides of property operations:
1. **B2B Property Acquisition:** Discovering, intent-scoring, and nurturing commercial, hospitality, student housing, and luxury multifamily properties that need overnight off-hours auditing.
2. **Operations Specialist Recruitment:** Sourcing and onboarding qualified local night auditors and field inspectors to ensure inspection capacity matches client demand in every target zip code.

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │                      AMENITY OP'S GROWTH SUBSYSTEM                     │
 └───────────────────────────────────┬────────────────────────────────────┘
                                     │
         ┌───────────────────────────┴───────────────────────────┐
         ▼                                                       ▼
 ┌───────────────────────────────┐               ┌───────────────────────────────┐
 │   B2B PROPERTY ACQUISITION    │               │    SPECIALIST RECRUITMENT     │
 │ - Multi-Source CRE Scrapers   │               │ - Local Night Auditor Funnel  │
 │ - 5-Tier Intent Scoring       │               │ - Rate & Route Qualification  │
 │ - 4-Touch Value-Led Cadence   │               │ - 2-Touch Mobile Onboarding   │
 └───────────────┬───────────────┘               └───────────────┬───────────────┘
                 │                                               │
                 └───────────────────────┬───────────────────────┘
                                         ▼
                 ┌───────────────────────────────────────────────┐
                 │       HUMAN-IN-THE-LOOP AI REPLY QUEUE        │
                 │ - Inbound Prospect Classification             │
                 │ - Contextual Draft Reply Generation           │
                 │ - 1-Click Operator Approval & Dispatch        │
                 └───────────────────────────────────────────────┘
```

---

## 2. Complete Domain & Cold Email Infrastructure

Cold email deliverability is governed by domain reputation algorithms maintained by Google Workspace and Microsoft Office 365. To achieve high inbox placement rates (>90%) without risking the company's core operations, Amenity Op's uses a **two-track domain architecture**.

### 2.1 The Cardinal Rule: Never Send Cold Outreach from `amenityops.app`

| Email Track | Domain Used | Service | Risk Profile |
| :--- | :--- | :--- | :--- |
| **Track 1: Core Transactional** | `amenityops.app` (`reports@amenityops.app`) | Resend API | **Zero Tolerance for Spam Marks.** Used for real client reports, inspector welcome credentials, and password resets. |
| **Track 2: Cold Prospecting** | Secondary Lookalike Domains (`getamenityops.com`, etc.) | Dedicated Cold Inboxes | **Fully Isolated.** If a prospect marks an email as spam, only that secondary domain is affected. Your main application domain remains 100% clean. |

---

### 2.2 Secondary Lookalike Domain Portfolio

The client should acquire **4 to 5 secondary lookalike domains** (available for ~$10/year each on Namecheap, Cloudflare Registrar, or GoDaddy):

1. `getamenityops.com`
2. `amenityopshq.com`
3. `useamenityops.com`
4. `tryamenityops.com`
5. `amenityops.co`

> **Domain Selection Best Practices:**
> * Never use hyphens (e.g., `amenity-ops.com` is frequently flagged by spam filters).
> * Use standard `.com` or `.co` extensions. Avoid cheap generic extensions (`.xyz`, `.info`, `.biz`).
> * Forward domain root web traffic (HTTP 301) directly to `https://amenityops.app` so any prospect typing the domain into their browser lands on your official website.

---

### 2.3 Mailbox Architecture (10 Sending Inboxes)

Set up **2 mailboxes per domain** using Google Workspace (recommended) or Zoho Mail ($6/user/month):

| Secondary Domain | Inbox 1 | Inbox 2 | Daily Capacity |
| :--- | :--- | :--- | :--- |
| `getamenityops.com` | `alex@getamenityops.com` | `ops@getamenityops.com` | Up to 100 emails/day |
| `amenityopshq.com` | `sarah@amenityopshq.com` | `team@amenityopshq.com` | Up to 100 emails/day |
| `useamenityops.com` | `marcus@useamenityops.com` | `audits@useamenityops.com` | Up to 100 emails/day |
| `tryamenityops.com` | `david@tryamenityops.com` | `compliance@tryamenityops.com` | Up to 100 emails/day |
| `amenityops.co` | `elena@amenityops.co` | `contact@amenityops.co` | Up to 100 emails/day |
| **Total Fleet** | **5 Rep Inboxes** | **5 Role Inboxes** | **500 emails/day max** |

---

### 2.4 Mandatory DNS Authentication Setup

Every secondary domain must have 4 core DNS records configured prior to launching cold outreach:

```
                  ┌──────────────────────────────────────────────┐
                  │       DNS AUTHENTICATION FOR DELIVERABILITY  │
                  └──────────────────────┬───────────────────────┘
                                         │
     ┌───────────────────┬───────────────┴───────────────┬───────────────────┐
     ▼                   ▼                               ▼                   ▼
┌─────────┐         ┌─────────┐                     ┌─────────┐         ┌─────────┐
│   MX    │         │   SPF   │                     │  DKIM   │         │  DMARC  │
│ Inbound │         │ Sender  │                     │ Crypto  │         │ Policy  │
│ Routing │         │ Trust   │                     │ Hand-   │         │ Enforce-│
│         │         │         │                     │ shake   │         │ ment    │
└─────────┘         └─────────┘                     └─────────┘         └─────────┘
```

#### Exact DNS Record Specifications:

1. **MX (Mail Exchange):**
   * **Host:** `@`
   * **Target:** Google Workspace MX records (`ASPMX.L.GOOGLE.COM`, etc.) or Zoho MX.
   * **Purpose:** Allows secondary inboxes to receive inbound replies from prospects.

2. **SPF (Sender Policy Framework):**
   * **Type:** `TXT`
   * **Host:** `@`
   * **Value:** `v=spf1 include:_spf.google.com ~all`
   * **Purpose:** Authorizes Google Workspace mail servers to send emails on behalf of your domain.

3. **DKIM (DomainKeys Identified Mail):**
   * **Type:** `TXT`
   * **Host:** `google._domainkey`
   * **Value:** Generated inside Google Workspace Admin Console (`Apps > Google Workspace > Gmail > Authenticate email`).
   * **Purpose:** Digitally signs every outbound message with a cryptographic key to prevent email tampering.

4. **DMARC (Domain-based Message Authentication):**
   * **Type:** `TXT`
   * **Host:** `_dmarc`
   * **Value:** `v=DMARC1; p=quarantine; rua=mailto:dmarc@getamenityops.com`
   * **Purpose:** Enforces security policy if an unauthorized sender attempts to spoof your domain.

5. **Custom Tracking Domain (Optional but Recommended):**
   * **Type:** `CNAME`
   * **Host:** `email`
   * **Target:** Provided by sending platform (e.g., `cname.smartlead.ai` or `cname.instantly.ai`).
   * **Purpose:** Masks open and click tracking links under your own branded domain.

---

### 2.5 The 4-Week Mailbox Warm-Up & Ramp Curve

Brand new domains have zero sender reputation. Sending 50 cold emails on Day 1 will result in automatic spam filtering by Google and Microsoft spam engines. All mailboxes must follow this ramp:

```
Daily Outbound Emails per Inbox
 50 |                                              [Week 4+: Steady State Capped at 50/day]
 40 |
 30 |                                   [Week 3: 25-35 emails/day]
 20 |                     [Week 2: 15-20 emails/day]
 10 | [Week 1: Warm-up]
  0 +--------------------------------------------------------------------------> Time
```

* **Weeks 1–2 (Automated Warm-up Only — 0 Cold Emails):**
  Connect all 10 mailboxes to an automated warm-up network (e.g. Smartlead or Instantly). The software sends positive, peer-to-peer emails back and forth, opens them, marks them as "Important", and moves them out of spam folders automatically to build domain authority.
* **Week 3 (Soft Launch — 10 to 15 Cold Emails/Day per Inbox):**
  Begin sending cold emails exclusively to **Tier 1 Active Pain** leads (properties with active night job openings).
* **Week 4 (Ramping — 25 to 35 Cold Emails/Day per Inbox):**
  Expand outreach to Tier 2 (recent municipal violations) and Tier 3 (student housing).
* **Week 5+ (Steady State Production — Hard Cap of 50 Emails/Day per Inbox):**
  Maximum throughput of **500 cold emails per day** across 10 mailboxes. Never exceed 50 emails/day per mailbox.

---

## 3. Platform Capabilities & Architecture

The Lead Generation Engine lives at `/admin/leads` and is composed of 4 core tabs:

### Module 1: Discovered Leads Hub (Tab 1)
* **The 9 Standard Property Fields:**
  1. `property_name` (e.g., The Collegiate at Rutgers)
  2. `community_type` (Motel, Student Housing, 55+ Active Adult, Luxury Multifamily, Commercial)
  3. `address` (Street address)
  4. `municipality_town` (e.g., New Brunswick)
  5. `county` (e.g., Middlesex)
  6. `key_amenities_notes` (Overnight audit requirements, pool, gate access)
  7. `target_gatekeeper_name` (Decision-maker name)
  8. `target_gatekeeper_title` (e.g., HOA General Manager, Director of Operations)
  9. `phone` & `email` (Direct desk phone and email)
* **1-Click High-Performance Exports:**
  * **Excel (`.xlsx`):** Generates binary Microsoft Excel sheets with formatted headers and auto-sized column widths.
  * **CSV:** RFC-4180 compliant CSV generator for import into HubSpot, Salesforce, or Google Sheets.
* **Bulk Operations & Deletion:**
  * Bulk selection checkboxes in table header.
  * **Enroll in Cadence:** Launches prospect into 4-touch sequence.
  * **Disqualify:** Archives the property and suppresses future contact.
  * **Delete Lead(s):** Permanently removes selected records with `ON DELETE CASCADE` safety.

---

### Module 2: 5-Tier Intent Scoring Engine
The intent scorer analyzes municipal records, job board postings, and online reviews to classify properties into 5 actionable priority tiers:

| Tier | Priority Label | Qualifying Signals | Action Plan |
| :---: | :--- | :--- | :--- |
| **1** | **Critical Active Pain** | Active job opening for night front desk/closer, or recent noise/unlatched gate complaints. | Priority Touch 1 within 24 hours. |
| **2** | **High Priority Pain** | Township municipal lighting/trash compliance notices received in last 60 days. | Enrolled in 4-touch compliance sequence. |
| **3** | **Medium Intent** | Off-campus student housing or extended-stay motel with exterior corridors. | Standard 4-touch educational cadence. |
| **4** | **General Qualified** | Commercial multi-tenant office building or gated 55+ active adult community. | Targeted off-hours audit cadence. |
| **5** | **Low Intent / Nurture** | Property managed by national conglomerate with centralized procurement. | Long-term monthly market awareness. |

---

### Module 3: 4-Touch B2B Sales Sequence (Tab 2)
Outbound emails are sent Tuesday through Thursday between 9:00 AM and 11:30 AM local time (proven highest B2B open window):

* **Touch 1 (Day 1) — The Morning Visibility Gap:**
  * *Subject:* `Quick question regarding overnight operations at {{propertyName}}`
  * *Offer:* Soft pitch addressing off-hours uncertainty + link to a 5-minute self-paced demo video.
* **Touch 2 (Day 4) — Eliminating the "Morning Surprise":**
  * *Subject:* `Re: overnight operations at {{propertyName}}`
  * *Focus:* Photo proof and timestamp telemetry for gates, pools, and dumpsters.
* **Touch 3 (Day 8) — Staff Empowerment (No 3rd-Party Guard Markup):**
  * *Subject:* `Empowering {{propertyName}}'s on-site team without outside vendor markups`
  * *Focus:* Explains that existing night staff use the app, eliminating expensive guard contract costs.
* **Touch 4 (Day 14) — Professional Breakup:**
  * *Subject:* `Closing the loop regarding {{propertyName}}`
  * *Focus:* Respectful permission to close the file. Often generates 15–20% of total replies.

---

### Module 4: Human-in-the-Loop AI Reply Assistant (Tab 4)
When prospects reply to outbound emails, the AI Reply Assistant processes the inbound message:
1. **Intent Classification:** Identifies whether the prospect wants a demo, is asking about pricing, gave a referral to a different manager, or requested an unsubscribe.
2. **Contextual Draft Generation:** Drafts a personalized response using the property's specific data and the pre-configured 5-minute demo video link.
3. **Strict Operator Review Gate:** The AI **never** sends emails autonomously. All draft replies sit in the review queue where an operator reviews, edits, and clicks **`Approve & Send`**.

---

## 4. Step-by-Step Hands-On Testing Runbook

To test the system from start to finish, navigate to **`https://amenityops.app/admin/leads`**:

### Step 1: Layout & Full-Width View Verification
1. Perform a hard refresh: press **`Ctrl + Shift + R`** (Windows) or **`Cmd + Shift + R`** (Mac).
2. Verify the dashboard stretches across the full desktop width (`max-w-none`).
3. Verify that property names (*"Horizon Park Manor (55+ Active Adult)"*), addresses, gatekeepers, and email addresses display completely without `...` truncations.

### Step 2: Live Scraper & Deduplication Test
1. Click the purple **`Run Scraper`** button in the top action bar.
2. Select **Corridor** (*Central Jersey / Route 1*) and **Property Class** (*Student Housing*).
3. Click **`Run Scraper Pipeline`**.
4. Observe the 4 live animated steps:
   * *Querying municipal registries...*
   * *Parsing hiring signals & job boards...*
   * *Calculating intent tier...*
   * *Deduplicating existing records...*
5. Confirm that new properties are injected, while existing properties are recognized as duplicates and safely ignored.

### Step 3: Excel & CSV Export Test
1. Filter the table by any property class (e.g., *Student Housing*).
2. Click **`Export Excel (.xlsx)`** $\rightarrow$ Open the downloaded file to verify auto-sized column widths and clean headers.
3. Click **`Export CSV`** $\rightarrow$ Verify standard RFC-4180 CSV generation.

### Step 4: Slide-Over Detail Drawer & Cadence Preview
1. Click on any property row or the **`>`** arrow under the **Details** column.
2. In the slide-over drawer:
   * Test copying the email or phone number (green checkmark confirmation).
   * Review the **Intent Signals & Pain Triggers** card.
   * Notice the red **`Delete Lead`** button in the footer.
3. Click **`Preview Sequence`** in the header or in Tab 2 to verify dynamic variable replacement (`{{propertyName}}`, `{{gatekeeper_name}}`).

### Step 5: AI Reply Assistant & Simulator Test
1. Click Tab 4: **`AI Lead Reply Assistant`**.
2. Scroll to the **Interactive Scenario Simulator** at the bottom:
   * Click **`🧪 Wants Demo Video`** $\rightarrow$ AI categorizes intent as *Interested (Wants Demo)* and drafts a reply containing the video link.
   * Click **`🧪 Asking for Pricing`** $\rightarrow$ AI drafts an explanation of per-building audit pricing.
   * Click **`🧪 Referral / Wrong Person`** $\rightarrow$ AI drafts a polite request for the new manager's email.
3. Click **`Edit Draft`** on any card to modify text, then click **`Approve & Send`** to verify human-in-the-loop dispatch.

---

## 5. Client Launch Checklist

Before launching live cold email outreach to external property managers, complete these 5 items:

- [ ] **Secondary Domains Acquired:** Purchase 4 to 5 lookalike domains (`getamenityops.com`, `amenityopshq.com`, etc.).
- [ ] **Mailboxes Created:** Set up 2 Google Workspace or Zoho Mail inboxes per domain (10 inboxes total).
- [ ] **DNS Records Configured:** Add SPF, DKIM, DMARC, and MX records to each domain's DNS manager.
- [ ] **14-Day Automated Warm-Up Active:** Connect mailboxes to Smartlead or Instantly warm-up network.
- [ ] **5-Minute Demo Video Ready:** Confirm the URL for the self-paced walkthrough video (e.g., `https://getamenityops.com/demo`).
- [ ] **Operator Notification Email:** Designate the team email address to receive notifications when prospects request a live phone call or demo.
