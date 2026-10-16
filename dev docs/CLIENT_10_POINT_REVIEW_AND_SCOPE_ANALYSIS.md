# Client 10-Point Review & Technical Scope Analysis

> **Date:** October 15–16, 2026  
> **Project:** Amenity Ops (`amenityops`)  
> **Client Contact:** Jerome  
> **Topic:** Technical evaluation and client response to Jerome's 10-point review of the Predictive Risk Modeling & Platform Features.

---

## 1. Original Client Review Received from Jerome

```text
1) Predictive Risk Modeling: Include a bar with the following breakdown color scheme going from green to red. 
Risk Score Interval Breakdown (The What it Means description should only appear when hovering over the score section) 
The 0–100 scale is divided into four distinct tiers. Each segment dictates specific workflow adjustments, notification rules, and operational mandates for the overnight team:
 0 – 25: Low Risk (Standard Operations)
 What it means: The property has clean compliance logs, great weather conditions, minimal recent asset anomalies, and low occupancy stress.
 26 – 50: Moderate Risk (Elevated Monitoring)
 What it means: Minor predictive anomalies detected. This is typically triggered by a combination of early-stage asset friction.
 51 – 75: High Risk (Targeted Pre-Shift Mitigation)
 What it means: The model identifies a high probability of an asset failure or municipal citation. Driven by compounding historical signals.
 76 – 100: Critical Risk (Immediate Intervention Required)
 What it means: A severe operational, safety, or legal liability breakdown is highly imminent during the graveyard shift.

2) Predictive Risk Modeling: Highlight the items title within the banner that are a regular occurrence and not just the category indicating it’s a life safety item.

3) Predictive Risk Modeling: Make the score Optional (Hence, only an admin can make available to properties, enable/disable feature).

4) Predictive Risk Modeling: Ensure when the report is issued that the banner is also included on the report.

5) Property Tab & Team's Tab: Include an option to filter by State and specifically for Properties add a column for State.

6) Tenant Account/License: Amenity Op’s (HQ) should not have a limit on either the quantity of inspectors or properties. Platform Owner/Super Admin should be able to modify as required (increase/decrease quantity).

7) Checklist: For any new checklist created the option to enable/disable the predictive model.

8) Checklist: Ability to clone an existing checklist to save time. In addition, only allow the Super Admin (HQ) the ability to create a new or modify a checklist. This feature should only be optional (enabled/disabled) and only controlled by the Platform Owner/Super User (HQ).

9) Provisional Tenant: When adding a provisional tenant there are only 3 tiers: Starter (Single Site), Standard (Up to 5 Properties) & Enterprise (Custom). As Platform Owner/Super Admin I need the ability to set the number of properties manually within the system.

10) Checklist Photo: When a photo is taken during an inspection can the photo also be timestamped? Is this feature available?
```

---

## 2. Internal Engineering Scope Assessment

| # | Client Review Point | Actual Status in Codebase | Scope Assessment |
| :-: | :--- | :--- | :--- |
| **1** | **Color bar (Green to Red: 0–25, 26–50, etc.) with hover descriptions** | **Brand New Feature** | **NEW SCOPE.** The original spec was a numerical score (1–100) and text summary. A 4-tier colored progress bar with interactive hover modals is a brand new UI/UX component. |
| **2** | **Item-level failure titles in banner (not just categories)** | **Brand New Feature** | **NEW SCOPE.** The agreed predictive model aggregated by the 3 core risk domains (Life-Safety, Asset Protection, Appearance). Tracking and highlighting specific question titles requires algorithmic & data structure changes. |
| **3** | **Optional per-property score toggle (Enable/Disable)** | **Brand New Feature** | **NEW SCOPE.** Currently all active properties with 30+ days of history calculate scores. Adding a per-property configuration switch requires a DB column and form toggle. |
| **4** | **Risk banner included on issued report / PDF** | **ALREADY BUILT ✅** | **EXISTING FEATURE.** The system already freezes the predicted score, summary, and domain comparison onto completed reports and renders it on the official PDF (`/admin/reports/[id]` and `src/lib/pdf/generate.ts`). |
| **5** | **Filter by State + State column on Properties** | **Already 80% Built** | **MINOR POLISH.** State filtering already exists in the `AddressFilterBar`. Adding a dedicated `State` column in the desktop table is a minor UI touch-up. |
| **6** | **HQ should not have limits on properties/inspectors** | **Quick Polish** | **MINOR ADJUSTMENT.** HQ had a 100-license display badge from default seeding. We can set HQ to display as "Unlimited" so Master HQ is never constrained. |
| **7** | **Checklist-level Predictive Model toggle (Enable/Disable)** | **Brand New Feature** | **NEW SCOPE.** Adding an algorithm bypass switch on individual checklist templates is a new configuration rule. |
| **8** | **Block provisional tenants/inspectors from modifying checklists + Clone checklist** | **Inspectors Already Blocked; Cloning is New** | **MIXED.** Inspectors already have zero access to checklists. Locking tenant admins is a minor permission rule. Adding a complete checklist cloning/duplication engine is a new utility feature. |
| **9** | **Provisional Tenant tiers + Manual property limit setting** | **ALREADY BUILT ✅** | **EXISTING FEATURE.** The Super Admin can *already* manually type any number into the "Licensed Property SKUs" input box. We can clean up the tier dropdown to show only Starter, Standard, and Enterprise. |
| **10** | **Photo Timestamping on inspection photos** | **New Feature Inquiry** | **NEW SCOPE.** The client explicitly asked: *"Is this feature available?"*. Photos currently save as high-res camera captures; burning an automated timestamp overlay directly onto images is a new canvas/image-processing feature. |

---

## 3. Ready-to-Send Professional Client Response

*You can copy and send this message directly to Jerome:*

***

**Hi Jerome,**

Thank you for the detailed review and feedback! We have gone through all 10 points thoroughly against our production codebase and architecture.

To give you complete transparency, here is the status of each point—including what is already live and available, what quick refinements we are including, and the new feature enhancements:

---

### 1. Predictive Risk Color Interval Bar & Tooltips
* **Status:** **New Feature Request (Phase 2 Enhancement)**
* **Explanation:** The agreed specification for the predictive engine was the dynamic 1–100 numerical score, operational summary, and flagged risk areas. The 4-segment visual breakdown bar (Green 0–25, Yellow 26–50, Orange 51–75, Red 76–100) with interactive hover tooltips is a brand-new UI/UX enhancement. We can build this custom component and integrate the operational definitions you provided into a dedicated milestone.

### 2. Specific Item Titles Highlighted in the Banner
* **Status:** **New Feature Request (Algorithmic Refinement)**
* **Explanation:** The current predictive model groups risk by the 3 core domains (Life-Safety, Asset Protection, and Appearance) based on historical statistical weightings. Granular item-level frequency tracking (e.g. specifically extracting and highlighting "Active Plumbing Leaks" or "Floor Trip Anomalies" by question title within the banner) requires an architectural update to the aggregation engine and banner layout.

### 3. Enable / Disable Predictive Scoring Per Property
* **Status:** **New Feature Request**
* **Explanation:** Currently, the system automatically scores all active buildings once they cross the 30-day statistical threshold. Giving admins a manual on/off toggle per property requires adding a property-level configuration flag to the database and property management forms.

### 4. Risk Banner Included on Issued Reports & PDF
* **Status:** **Already Implemented & Live ✅**
* **Explanation:** This feature is already fully built into the platform! Whenever an inspection is completed while an active risk score exists, that score, summary, and domain comparison are permanently frozen to the inspection record. They are displayed directly on the web report (`/admin/reports/[id]`) and rendered inside the official branded PDF attachment. *(Note: Audits completed before a score was calculated will naturally not show retroactive predictions).*

### 5. State Filter & State Column on Properties
* **Status:** **Already Partially Available & Included Minor Touch-up**
* **Explanation:** State filtering is already built into the Filter Bar across both Properties and Team pages (it appears whenever properties in that portfolio have a state assigned). We will happily add a dedicated **State** column to the desktop Properties table so it is visible at a glance alongside City/County.

### 6. Unlimited Property & Inspector Limits for HQ Master Account
* **Status:** **Included Minor Adjustment**
* **Explanation:** The 100-SKU badge displayed on HQ was simply default database seeding from initial setup. Because Amenity Op’s HQ is the Master Platform Owner, we will update the display so HQ is labeled as **Unlimited / Uncapped**, ensuring you never have constraints on your master operations.

### 7. Enable / Disable Predictive Scoring Per Checklist
* **Status:** **New Feature Request**
* **Explanation:** Similar to Point #3, introducing a toggle switch on individual checklist templates to opt them in or out of predictive scoring is a new feature requirement that we can bundle with the configuration updates.

### 8. Restrict Checklist Creation / Modification for Provisional Tenants & Checklist Cloning
* **Status:** **Inspectors Already Blocked; Tenant Restriction Included**
* **Explanation:** Operations Continuity Specialists (Inspectors) already have zero access to checklists. For provisional corporate tenants, we will ensure template creation and modification permissions are locked strictly to HQ Super Admins, keeping your master audit standards protected. Checklist cloning will be included in the Phase 2 templates upgrade.

### 9. Provisional Tenant Tiers & Manual Property Capacity Setting
* **Status:** **Already Implemented & Live ✅**
* **Explanation:** The ability to manually set any number of properties is already live! When you click **Provision Tenant**, the *"Licensed Property SKUs"* field is a numeric input box that allows the Super Admin to enter any custom number of buildings. We will also align the dropdown list to strictly show your 3 preferred tiers: *Starter (Single Site)*, *Standard (Up to 5)*, and *Enterprise (Custom)*.

### 10. Photo Timestamping Overlay
* **Status:** **New Feature Inquiry**
* **Explanation:** You asked if this feature is available: currently, inspection photos are stored with system-recorded server timestamps and audit logs. Burning a visible date, time, and GPS coordinate watermark directly into the photo pixels themselves at the moment of capture is not currently in the platform. This requires a dedicated client-side canvas/image-processing engine, which we can build as an add-on feature.

---

### Summary & Next Steps:

* **Points 4, 5, 6, 8, & 9:** These are either already working or minor polish items that we will handle immediately as part of our current delivery.
* **Points 1, 2, 3, 7, & 10:** These represent valuable new features and UX upgrades (visual interval color bar with hover modals, item-level algorithm tracking, property/checklist toggle controls, and photo timestamp watermarking). 

We would love to implement these new enhancements for you! We can package Points 1, 2, 3, 7, and 10 into a streamlined **Phase 2 Enhancement Milestone** with an estimated turnaround of 5 days for $[X]. 

Please let us know if you would like us to prepare the scope for that milestone!
