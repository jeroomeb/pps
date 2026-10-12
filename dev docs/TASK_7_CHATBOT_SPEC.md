# Task 7: Field Specialist On-Site AI Assistant Chatbot — Architecture & Specification

## 1. Overview & Directive
Task 7 provides a lightweight, dedicated **On-Site Operational Field Assistant Chatbot** built **exclusively for Operational Continuity Specialists (OCS / Field Inspectors)**.

> **Scope Note:** The chatbot is **NOT** displayed in the Admin portal (`/admin`). It is specifically designed for specialists working on mobile/tablet in the field during property audits (`/inspector` and active checklist inspection views).

---

## 2. Target Audience & Role Context

* **Target Users**: Operational Continuity Specialists (Field Inspectors / role `'inspector'`).
* **Where It Appears**: Specialist dashboard (`/inspector`), active inspection checklists (`/inspector/inspections/[id]`), performance metrics (`/inspector/metrics`), personal earnings (`/inspector/payouts`), and specialist profile (`/inspector/profile`).
* **Where It Is Excluded**: Completely excluded from all Admin routes (`/admin/*`).

---

## 3. Specialist-Centric Knowledge & Capabilities

The chatbot acts as an instant 24/7 on-site supervisor & SOP guide for field specialists:

### A. Audit & Checklist Standard Operating Procedures (SOPs)
1. **Photo Requirements**:
   * *Rule*: Photos are mandatory for **every item** (Pass or Fail) except N/A items.
   * *Upload Tips*: How to capture clear asset images, replace a photo, or verify upload status.
2. **Failure Item Protocol**:
   * *Rule*: Whenever an item is marked **Fail**, an explanatory comment detailing the defect/hazard AND a clear photo are strictly required before submission.
3. **N/A Guidelines**:
   * *Rule*: Mark N/A only if the specific asset or amenity does not exist on the property. N/A items do not require photos.

### B. Field Telemetry & Geofencing Assistance
1. **GPS Perimeter Verification**:
   * Explains the on-site GPS badge indicator:
     - **Green (On-Site & Verified)**: Device is within the property's geofenced radius.
     - **Amber (Outside Perimeter)**: Device is currently outside the designated boundary.
     - **Exempt**: Property does not have GPS geofencing enabled.
2. **Access & Obstruction Protocol**:
   * What to do if a gate is locked, key code fails, or physical access to an amenity is blocked.
   * How to document obstructions with comments and evidence photos.

### C. Connectivity, Drafts & Autosave
1. **Autosave Mechanics**:
   * Every checklist toggle and comment automatically saves to the server immediately.
2. **Crash & Battery-Death Protection**:
   * If mobile battery dies or the browser crashes, locally mirrored drafts in storage allow instant recovery on next open via the "Restore Draft" prompt.

### D. Compensation & Payout Guidance
1. **How Payouts Work**:
   * Payouts are generated automatically upon successful audit submission if payouts are enabled for the organization.
   * Compensation is based on the property's assigned tier in the 3x3 Property Compensation Matrix.

---

## 4. Technical Architecture

1. **Floating Specialist Widget (`src/components/SpecialistChatbot.tsx`)**:
   - Modern, unobtrusive floating circular button with sparkle/chat icon at the bottom-right of specialist views.
   - Expandable slide-up mobile drawer / desktop card.
   - Quick-action suggestion chips (e.g., *"Photo Rules"*, *"Fail Requirements"*, *"GPS Geofence Info"*, *"Locked Gate Protocol"*, *"Offline Saves"*).
   - Chat history retained during the active session.

2. **Specialist Knowledge Base Engine (`src/lib/specialist-bot-knowledge.ts`)**:
   - Structured SOP knowledge base with fuzzy matching, topic categorizations, and clear, actionable answers.
   - Comprehensive fallback for custom specialist questions.

3. **Backend API Route (`/api/specialist-assistant/route.ts`)**:
   - Secure route verifying active specialist session (`requireRole('inspector')` or active user in `/inspector`).
   - Processes queries and returns formatted markdown responses.

4. **Integration Point**:
   - Integrated directly into `src/app/inspector/layout.tsx` so it is automatically available across all specialist screens without cluttering admin pages.

---

## 5. Development Roadmap

| Step | Component | Description |
|---|---|---|
| **1** | Knowledge Base Engine | Build comprehensive specialist SOPs in `src/lib/specialist-bot-knowledge.ts`. |
| **2** | Backend API Route | Create `/api/specialist-assistant/route.ts` with session authentication. |
| **3** | UI Floating Widget | Build responsive `SpecialistChatbot.tsx` with suggestion chips and touch-friendly UI. |
| **4** | Layout Integration | Mount `SpecialistChatbot` inside `src/app/inspector/layout.tsx`. |
| **5** | Verification | Run TypeScript checks and Next.js build verification. |
