# Task 8: Specialist Performance & Operational Tracking Metrics — Architecture & Specification

## 1. Executive Summary & Goals
The objective of Task 8 is to provide comprehensive, data-driven operational intelligence, productivity analysis, and specialist performance metrics across the Amenity Op's platform.

This engine empowers administrators to evaluate field team performance, audit thoroughness, and asset distribution, while providing Operational Continuity Specialists (OCS) with personal performance scorecards that motivate excellence.

---

## 2. Core Metrics & Mathematical Formulations

### A. Volume & Throughput Metrics
* **Total Audits Completed**: Count of inspections where `status = 'completed'`.
* **Audit Completion Rate**: $\frac{\text{Completed Audits}}{\text{Total Assigned Audits}} \times 100\%$
* **Checklist Template Distribution**: Volume and proportional percentage breakdown by template (e.g. Luxury Condominium, 55+ Community, Commercial Multi-Tenant).

### B. On-Time & Punctuality Rate
* **Punctuality Determination**:
  * For scheduled inspections with `scheduled_for` and `arrived_at` (or `completed_at`):
    $$\text{Arrival Delta (minutes)} = \frac{\text{arrived\_at} - \text{scheduled\_for}}{60 \text{ seconds}}$$
  * **On-Time**: Arrival $\le 15$ minutes after scheduled start.
  * **Grace Period**: Arrival between $15 - 30$ minutes after scheduled start.
  * **Delayed**: Arrival $> 30$ minutes after scheduled start.
  * **Punctuality Score**: $\frac{\text{On-Time Audits}}{\text{Total Scheduled Audits}} \times 100\%$

### C. Audit Quality, Thoroughness & Duration
* **Average Audit Duration**:
  $$\text{Avg Duration (minutes)} = \frac{1}{N} \sum_{i=1}^{N} \frac{\text{completed\_at}_i - \text{created\_at}_i}{60}$$
* **Average On-Site Dwell Time (GPS)**:
  $$\text{Avg Dwell Time} = \frac{1}{M} \sum_{j=1}^{M} \frac{\text{dwell\_time\_seconds}_j}{60}$$
* **Failure Discovery Rate**:
  $$\text{Failure Discovery Rate} = \frac{\text{Total Failed Items Flagged}}{\text{Total Items Checked}} \times 100\%$$
* **Photo Documentation Compliance**:
  $$\text{Photo Compliance Rate} = \frac{\text{Items with Photos}}{\text{Items Requiring Evidence}} \times 100\%$$

---

## 3. Architecture & User Experience

### A. Dedicated Admin Analytics Portal (`/admin/analytics`)
* **Time Range Selector**: 7 Days, 30 Days, 90 Days, All-Time.
* **Executive KPI Strip**:
  * Total Completed Audits
  * On-Time Punctuality Rate (%)
  * Avg Completion Duration (mins)
  * Avg Dwell Time on Site (mins)
  * Total Critical Failures Identified
  * Photo Compliance (%)
* **Checklist Template Volume Breakdown**: Visual distribution bars by asset category.
* **Specialist Leaderboard & Scorecards**: Table ranking specialists by completed audits, punctuality %, failure discovery rate, and avg duration, linking directly to individual profiles.
* **Property Audit Frequency**: Breakdown of top properties inspected.

### B. Admin Specialist Profile Scorecard (`/admin/team/[id]`)
* Deep-dive scorecard component embedded on the team member's profile page:
  * Overall performance grade / status
  * Personal on-time rate
  * Audit completion velocity
  * Flagged issues history

### C. Specialist Personal Scorecard (`/inspector/metrics`)
* Mobile-first performance dashboard for logged-in specialists:
  * Personal monthly audit volume & milestone achievements
  * On-time arrival streak & punctuality percentage
  * Quality badge & photo compliance score
  * Checklist template experience breakdown

---

## 4. Implementation Roadmap

| Step | Component | Description |
|---|---|---|
| **1** | Database Migration | Add compound indexes for rapid aggregations (`0012_operational_analytics_indexes.sql`). |
| **2** | Analytics Engine | Build `src/lib/analytics.ts` with statistical aggregation algorithms. |
| **3** | Server Actions | Build `src/lib/actions/analytics.ts` to fetch scoped analytics by tenant / specialist / date range. |
| **4** | Admin Analytics UI | Build `src/components/AdminAnalyticsDashboard.tsx` and `/admin/analytics/page.tsx`. |
| **5** | Specialist Scorecard UI | Build `src/components/SpecialistScorecard.tsx` and `/inspector/metrics/page.tsx`. |
| **6** | Team Detail Enhancement | Wire `SpecialistScorecard` into `/admin/team/[id]/page.tsx`. |
| **7** | Navigation Links | Add "Analytics" to Admin Nav and "Scorecard" to Inspector Nav. |
| **8** | Verification | Run `tsc`, `npm run build`, and write `TASK_8_ANALYTICS_METRICS_DEVELOPMENT.md`. |
