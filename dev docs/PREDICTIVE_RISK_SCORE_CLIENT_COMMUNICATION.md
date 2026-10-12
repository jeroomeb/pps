# Predictive Risk Scoring & Analytics — Client Communication & Testing Reference

**Date:** October 12, 2026  
**Audience:** Internal Reference / Client (Jerome) Communications  
**Direct Property Link:** [Jerome's Home Dashboard](https://portal.amenityops.app/admin/properties/7e43b766-ca7e-4884-bf5b-43eb2245295b)

---

## 1. Important Context Before Client Review

### Key Rule of the Predictive Scoring Model
- **Statistical Threshold:** The scoring algorithm requires **at least 30 days of completed inspection history** for a property before computing a statistical risk score (1–100).
- **Purpose:** This prevents arbitrary or inaccurate predictions on brand new properties.
- **Expected Behavior:** If a property has fewer than 30 days of completed inspection data, **no banner will appear on that property yet**, which is mathematically intended and functioning correctly.

---

## 2. Client Message (With Live Demo Data on Jerome's Home)

*Use this message when sample data has already been populated on Jerome's Home so the client can visually test all components immediately.*

> **Hi Jerome,**
> 
> The **Predictive Risk Scoring & Analytics** feature is complete and live!
> 
> Since the system normally requires 30 days of completed inspection history before generating real statistical predictions, we have temporarily enabled sample risk data on **Jerome's Home** so you can see the complete feature in action right away:
> 
> 👉 **Property Link:** [Jerome's Home Dashboard](https://portal.amenityops.app/admin/properties/7e43b766-ca7e-4884-bf5b-43eb2245295b)
> 
> ### What to check:
> 1. **Property Risk Banner:**  
>    Opening the link above will show the new **Evening Risk Score (42)** banner at the top, along with the summary: *"Life-safety and liability items fail here on Friday evenings"* and the alert *"Check first: Life-safety and liability"*.
> 2. **Dynamic Checklist Prioritization:**  
>    If you open any pending or in-progress inspection under this property, you'll see the risk banner at the top, and all categories tagged with high-risk life-safety questions are automatically prioritized to the top of the specialist's audit list.
> 3. **Completed Reports & PDF:**  
>    When inspections are opened, this score freezes to the record and displays on the audit findings and the generated PDF report.
> 4. **Checklist Templates:**  
>    Under the **Checklists** section, you can view how every question is now assigned to a Risk Domain (*Life-Safety*, *Asset Protection*, or *Appearance*), which feeds into the scoring engine.
> 
> Please take a look when you have a moment and let us know your feedback!

---

## 3. Alternative Client Message (High-Level Feature Summary)

*Use this message for high-level roadmap updates or if demo data has not yet been populated.*

> **Hi Jerome,**
> 
> The **Predictive Risk Scoring & Analytics** feature is fully implemented and live on the system.
> 
> **Here is what you can check right now:**
> 1. **Checklists:** Under the Checklists menu, all audit questions are now tagged with their risk domains (*Life-Safety*, *Asset Protection*, or *Appearance*). You can also set risk domains when adding or editing items.
> 2. **Property Timezone:** Each property now has a timezone setting, ensuring the risk engine runs at 4:00 PM local time for that specific building.
> 3. **Automated Scoring:** The hourly background scoring job is live on the server. As properties accumulate 30+ days of audit history, the 1–100 Risk Score banner, flagged areas, and weather adjustments will automatically display on the property view and specialist checklist.
> 
> If you would like us to insert a temporary sample score on a test property (like Jerome's Home) so you can preview the banner and PDF layout immediately before waiting for 30 days of history, let us know and we will set that up for you!

---

## 4. Technical Summary of Live Implementation

- **Database:** `supabase/migrations/0017_property_risk_scores.sql` applied.
- **Engine:** `src/lib/risk-score.ts` pure TypeScript weighted model (unit tests: 6/6 passing via `npm run test:risk`).
- **Endpoint:** `/api/cron/risk-scores` authenticated via `CRON_SECRET`.
- **Server Cron:** Configured on VPS (`187.124.132.193`) running hourly (`0 * * * *`), verified with HTTP `200 OK` (`{"ok":true,"scored":0,"skipped":3}`).
