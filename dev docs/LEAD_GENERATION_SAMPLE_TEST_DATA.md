# Lead Generation Engine — Sample Test Data Reference

**Document Type:** Test Reference & Seed Data Inventory  
**Purpose:** Realistic sandbox testing of all 5 property classes, intent scoring tiers, and sequence steps.  
**Location in Codebase:** `supabase/migrations/0021_lead_generation_engine.sql` & `src/lib/actions/leads.ts`  
**Date:** November 2026  

---

## 1. Discovered Properties Sample Data (The 5 Core Classes)

These 5 properties represent the primary market segments targeted by Amenity Op's off-hours auditing services:

| # | Property Name | Class | Address | Gatekeeper & Title | Phone & Email | Intent Tier & Signals | Status |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **The Collegiate at Rutgers** | `student_housing` | 15 College Avenue, New Brunswick, NJ, Middlesex Co. | Jordan Matthews<br>*(Community Director)* | (732) 555-0142<br>`jmatthews@thecollegiatenb.com` | **Tier 1 (Critical)**<br>• Job ad: Hiring Night Closer<br>• Reviews: Fire door left ajar | `in_sequence`<br>*(Touch 1 Sent)* |
| **2** | **Horizon Park Manor (55+)** | `active_adult_55_plus` | 4400 Horizon Blvd, Toms River, NJ, Ocean Co. | Eleanor Vance<br>*(HOA General Manager)* | (732) 555-0819<br>`evance@horizonparkhoa.org` | **Tier 2 (High)**<br>• Municipal exterior lighting notice (45 days ago) | `enriched`<br>*(Ready for Touch 1)* |
| **3** | **Oceanview Motor Lodge & Suites** | `motel` | 910 Ocean Avenue, Asbury Park, NJ, Monmouth Co. | Rajiv Patel<br>*(Owner & Managing Operator)* | (732) 555-0311<br>`rpatel@oceanviewmotelnj.com` | **Tier 1 (Critical)**<br>• Job ad: Hiring Night Front Desk Auditor 11pm-7am | `new`<br>*(Newly Scraped)* |
| **4** | **The Sovereign Luxury Tower** | `luxury_multifamily` | 77 Hudson Street, Jersey City, NJ, Hudson Co. | Christopher Sterling<br>*(Director of Property Mgmt)* | (201) 555-0988<br>`csterling@sovereignjc.com` | **Tier 3 (Medium)**<br>• High-rise common area walkthrough requirement | `replied`<br>*(Touch 2 Replied)* |
| **5** | **Metropolitan Corporate Plaza** | `commercial_multitenant` | 200 Metro Center Blvd, Edison, NJ, Middlesex Co. | Sandra Jenkins<br>*(Facilities & Asset Director)* | (732) 555-0624<br>`sjenkins@metrocplaza.com` | **Tier 2 (High)**<br>• New facilities lead reviewing vendor SLAs | `demo_scheduled`<br>*(Touch 3 Call Booked)* |

---

## 2. Operations Specialist Candidates (Recruitment Tab 3)

Sample applicants demonstrating the local field inspector pipeline:

| Candidate Name | Primary Role & Background | Target Area & Route | Desired Rate | Pipeline Status |
| :--- | :--- | :--- | :---: | :--- |
| **Marcus Vance** | Night Auditor & Hospitality Specialist | New Brunswick / Middlesex | \$28/hr | `touch_1_sent` |
| **Tyler Brooks** | Off-Duty Security Officer & Closer | Jersey City / Hudson | \$32/hr | `interview_requested` |
| **Elena Rostova** | Commercial Facilities Night Inspector | Edison / Central Corridor | \$30/hr | `screened` |

---

## 3. Sample Inbound AI Drafts (Review Queue Tab 4)

Pre-loaded inbound replies to demonstrate human-in-the-loop AI processing:

1. **Jordan Matthews (*The Collegiate at Rutgers*):**
   * **Inbound Message:** *"Can you share the 5-minute self-paced demo video? We've had issues with our side security gate unlatching overnight."*
   * **Classified Intent:** `wants_demo` (Interested in demo video)
   * **AI Suggested Draft:** Acknowledges gate security and provides the self-paced video link (`https://getamenityops.com/demo`).
2. **Rajiv Patel (*Oceanview Motor Lodge*):**
   * **Inbound Message:** *"What does monthly service typically cost for a 48-room motel with exterior corridors?"*
   * **Classified Intent:** `pricing_request` (Asking for pricing)
   * **AI Suggested Draft:** Explains per-property monthly pricing without outside hardware markups and offers a 10-minute discovery call.

---

## 4. How to Remove Sample Data

You can delete this sample data at any time through either of two methods:

### Method A: Directly from the Dashboard UI (Zero SQL)
1. Navigate to **[`/admin/leads`](https://amenityops.app/admin/leads)**.
2. Tick the **top header checkbox** to select all displayed properties.
3. Click the red **`Delete (X)`** button in the bulk action bar.
4. Or open any property details drawer and click **`Delete Lead`**.

### Method B: Via Supabase SQL Query
To wipe only the sample properties:
```sql
DELETE FROM public.growth_leads 
WHERE source IN (
  'motel_directory_nj', 
  'student_portal', 
  'senior_housing_registry', 
  'hospitality_registry', 
  'luxury_cre_directory', 
  'commercial_cre_directory'
);
```

To perform a clean 100% reset for live production:
```sql
TRUNCATE TABLE public.growth_leads CASCADE;
```
*(All related outreach logs and AI drafts are automatically removed via `ON DELETE CASCADE`).*

