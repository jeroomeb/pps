# Task 7: AI Assistant & Operational Help Chatbot — Architecture & Specification

## 1. Overview & Client Directive
Following client clarification, Task 7 is streamlined from a complex multi-party human chatroom into an **intelligent, lightweight in-app Help & Operations Chatbot**.

The chatbot serves as an instant digital assistant for all platform users directly within the app, reducing support overhead and guiding specialists on-site.

---

## 2. Who Are the Users & How Authentication / Roles Work

In Amenity Op's, **all users authenticate through the same single login page (`/login`)**. After authentication, the database `role` dynamically routes them to their authorized portal and controls their permissions:

```
                          Single Login Screen (/login)
                                      │
                                      ▼
                           Inspects Database Role
                                      │
                ┌─────────────────────┴─────────────────────┐
                ▼                                           ▼
         Role: 'admin'                              Role: 'inspector'
    (Company Owner / Property Managers)        (Field Specialists / OCS)
                │                                           │
                ▼                                           ▼
       Redirects to /admin                        Redirects to /inspector
 • Dashboard, Properties, Reports           • My Assigned Inspections
 • Analytics & Team Management              • Active Checklists (Pass/Fail/Photos)
 • Payouts & Organization Settings          • Personal Earnings & Scorecard
 • Can also do inspections if needed        • Profile & ID Upload
```

### Detailed Role Breakdown

| User Type | DB `role` | Portal URL | Who They Are | What They Do |
|---|---|---|---|---|
| **Admin** | `'admin'` | `/admin` | Jerome (Client), dispatchers, property managers | Creates properties, assigns inspections, sets schedules, reviews completed reports, manages team & payouts, views analytics. |
| **Specialist (OCS)** | `'inspector'` | `/inspector` | Field inspectors / Operational Continuity Specialists (1099 contractors or W-2 staff) | Sees their open audit queue, travels on-site, fills out Pass/Fail checklists, takes required photos, and submits reports. |

*(Note: If an Admin assigns an audit to themselves, they can also access `/inspector` through the "My Inspections" tab).*

---

## 3. What the Simple Chatbot Is & How It Works

The chatbot is a **floating assistant widget** (with a slide-over / popup drawer) accessible at the bottom corner of the portal for logged-in users. It is context-aware and tailors its responses based on whether the user is an **Admin** or a **Specialist (OCS)**.

### A. For Field Specialists (OCS) (`/inspector` & Active Checklists)
* **On-Site Guidance & Standard Operating Procedures (SOPs)**:
  * *"What is required when an item fails?"* $\rightarrow$ Clarifies that an explanatory comment and photo evidence are mandatory.
  * *"How does photo verification work?"* $\rightarrow$ Explains that every non-N/A item requires a photo.
* **Troubleshooting & Location Assistance**:
  * Explains GPS geofencing perimeter status (e.g. verifying presence within property radius).
  * Guidance on what to do if an access gate is locked or access is blocked.
  * Explains how offline drafts and auto-save work.

### B. For Administrators (`/admin`)
* **Platform Operations Assistance**:
  * Step-by-step guidance on creating properties and configuring schedules.
  * Managing staff rosters (Primary vs. Backup specialist assignments).
  * Reviewing, approving, and settling specialist compensation payouts.
  * Understanding operational metrics, on-time punctuality scores, and downloading PDF reports.

---

## 4. Technical Architecture

1. **Client Floating Trigger (`src/components/ChatbotWidget.tsx`)**:
   - Modern, unobtrusive floating button with chat bubble icon at bottom-right of viewport.
   - Expandable slide-up chat card / drawer with quick-prompt chips (e.g., *"Audit Requirements"*, *"GPS Geofencing Info"*, *"Photo Rules"*).
   - Keeps conversation in local state with responsive touch-friendly mobile design.

2. **Backend API Route (`/api/chatbot/route.ts`)**:
   - Authenticated server route that identifies user role (`admin` vs `inspector`).
   - Integrates knowledge base context containing platform SOPs, checklist rules, and administrative workflows.
   - Provides fast, accurate answers.

---

## 5. Implementation Roadmap

| Step | Component | Description |
|---|---|---|
| **1** | Knowledge Base Engine | Build structured Amenity Op's knowledge base and Q&A engine in `src/lib/chatbot-knowledge.ts`. |
| **2** | Chat API Route | Build secure endpoint `/api/chatbot/route.ts` validating user session and delivering context-aware responses. |
| **3** | Floating UI Widget | Build `src/components/ChatbotWidget.tsx` with quick-help suggested prompt chips. |
| **4** | Layout Integration | Integrate `ChatbotWidget` into root / app shells so it is available across all pages for authenticated users. |
| **5** | Verification | Run `tsc`, `npm run build`, and test end-to-end functionality. |
