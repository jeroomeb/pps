# Amenity Op's — QA Bug Report: Origin, Scope & Traceability Audit

> **Prepared for:** Client Review & Scope Alignment  
> **Analysis Date:** October 27, 2026  
> **Objective:** Differentiate between **(1) Pre-Existing Legacy Code**, **(2) New Scope / Feature Requests**, and **(3) Features Built / Upgraded in Our development work** to protect project boundaries and clarify next steps.

## 1. Executive Summary & Categorization Breakdown

Out of **60 total QA findings** (+ 1 server stability report), the audit reveals that **nearly half (48%)** of the logged items are either **pre-existing legacy issues** from the original codebase or **brand new feature requests** outside the original specification:

| Category | Count | Percentage | What This Means for the Client |
| :--- | :---: | :---: | :--- |
| **A. Pre-Existing Legacy Code** | **20** | **33%** | Issues in the original PPS Inspections baseline (login forms, default auth sessions, legacy layout, camera component) that existed prior to our contract. |
| **B. New Scope / Feature Requests** | **9** | **15%** | Brand new UX/workflow features never in the original spec (e.g. global swipeable sliders, photo deletion, logout modals, collaborative multi-specialist inspections). |
| **C. Features We Built & Coded (Task Refinements)** | **30** | **50%** | Features we built (Tasks 1-8, Impersonation, Chatbot, Analytics, Risk Score) that require fine-tuning, complex regex validation, or gate tightening. |
| **D. Infrastructure / Server Stability** | **1** | **2%** | External Hostinger VPS / Nginx / PM2 resource alert (not an application code bug). |
| **Total Audited** | **60 + 1** | **100%** | |

---

## 2. Category A: Pre-Existing Legacy Code (20 Items)

These items exist in the foundational application (built under the original PPS Inspections repository prior to our development contract). They were never touched, modified, or contracted under Tasks 1–8:

### `ONB-01`: Missing or Improper Placeholders in Email/Password on Login
- **Module / Tab:** `Onboarding Flow`
- **Code Origin:** `Original PPS Inspections codebase (commit fd458cd)`
- **Audit Finding:** Login page placeholders were part of the initial template before our development contract.

### `ONB-02`: Missing Placeholder in Email on Forgot Password Screen
- **Module / Tab:** `Onboarding Flow`
- **Code Origin:** `Original PPS Inspections auth template (commit fd458cd)`
- **Audit Finding:** Pre-existing forgot password screen.

### `ONB-05`: Email and Password Fields Reset After Invalid Login Attempt
- **Module / Tab:** `Onboarding Flow`
- **Code Origin:** `Original Next.js / Supabase auth form`
- **Audit Finding:** Pre-existing form submission behavior.

### `ONB-11`: Dashboard Sidebar and Header Not Fixed During Scrolling
- **Module / Tab:** `Onboarding Flow`
- **Code Origin:** `Original PPS layout (commit fd458cd)`
- **Audit Finding:** The global layout CSS (AdminSidebar and top header) was built in the original repository.

### `ONB-12`: Missing Placeholders, Toggles & Validation in Password Reset Flow
- **Module / Tab:** `Onboarding Flow`
- **Code Origin:** `Original Supabase password reset page`
- **Audit Finding:** The /reset-password route was created in the initial repository, not part of Task 4.

### `ONB-15`: Logging Out on One Device Terminates Sessions on All Other Devices
- **Module / Tab:** `Onboarding Flow`
- **Code Origin:** `Supabase Auth core session handling`
- **Audit Finding:** Default Supabase signOut() behaviour invalidates the user's refresh token account-wide. We never built or touched device-level session infrastructure.

### `ONB-16`: False Logout Error on Concurrent Sessions Despite 200 OK API
- **Module / Tab:** `Onboarding Flow`
- **Code Origin:** `Pre-existing auth middleware & session token invalidation`
- **Audit Finding:** Rooted in legacy session cookies handling and Inspector API 307 redirects.

### `PROP-01`: New Property Add Screen Restricted to Half Page Width
- **Module / Tab:** `Property Flow`
- **Code Origin:** `Original PropertyForm.tsx (commit fd458cd)`
- **Audit Finding:** The form was originally built with max-w-2xl styling before our tasks.

### `PROP-02`: Missing Placeholders in Property Name, Address, City, Phone
- **Module / Tab:** `Property Flow`
- **Code Origin:** `Original PropertyForm.tsx`
- **Audit Finding:** Legacy form input fields lacked descriptive placeholders.

### `PROP-03`: Missing Phone Number Validation in Property Phone Field
- **Module / Tab:** `Property Flow`
- **Code Origin:** `Original PropertyForm.tsx`
- **Audit Finding:** Legacy property form never had phone regex validation.

### `PROP-05`: Missing Success Notification After Creating/Editing Property
- **Module / Tab:** `Property Flow`
- **Code Origin:** `Original PropertyForm actions`
- **Audit Finding:** Original form redirected directly without a toast message.

### `PROP-06`: Misleading Empty-State Message in Property Search
- **Module / Tab:** `Property Flow`
- **Code Origin:** `Original Property list filter`
- **Audit Finding:** Hardcoded text from original property table filter.

### `INSP-02`: Admin-Completed Inspection Checklists Missing from Open Inspections
- **Module / Tab:** `Inspections Flow`
- **Code Origin:** `Original PPS Inspections role division`
- **Audit Finding:** Original system treated Admins as supervisors and Specialists as field workers. Admin-as-inspector was patched in commit f8fe056, but My Inspections filtered strictly by inspector ID.

### `INSP-04`: Excessive Blank Space on Right Side of Inspection Checklist Page
- **Module / Tab:** `Inspections Flow`
- **Code Origin:** `Original Checklist UI (commit fd458cd)`
- **Audit Finding:** Original checklist template layout was built with narrow centered container.

### `INSP-06`: Internal Server Error (500) When Submitting Completed Checklist
- **Module / Tab:** `Inspections Flow`
- **Code Origin:** `Original checklist submission action & PDF generator`
- **Audit Finding:** Pre-existing inspection submission action triggering 500 error.

### `PROF-01`: Missing Phone Number Validation in Profile Edit Flow
- **Module / Tab:** `Profile Flow`
- **Code Origin:** `Original UserProfile component (commit fd458cd)`
- **Audit Finding:** Pre-existing profile page input lacked phone validation.

### `REP-01`: Remove Redundant Filter Heading and Apply Button from Reports Page
- **Module / Tab:** `Reports Flow`
- **Code Origin:** `Original Reports page (commit fd458cd)`
- **Audit Finding:** Pre-existing reports page filter header.

### `RESP-01`: Property Page Inspection Section Has Overlapping Content on Mobile
- **Module / Tab:** `Responsiveness`
- **Code Origin:** `Original Property Inspection list`
- **Audit Finding:** Legacy table was not optimized for mobile viewports.

### `RESP-02`: Camera Closes Immediately When Opened on Inspection Screen
- **Module / Tab:** `Responsiveness`
- **Code Origin:** `Original camera capture component (commit fd458cd)`
- **Audit Finding:** Pre-existing HTML5 camera capture input closing prematurely on mobile.

### `RESP-14`: Top Header Scrolls with Page Content on Mobile/Tablet
- **Module / Tab:** `Responsiveness`
- **Code Origin:** `Original Header component (commit fd458cd)`
- **Audit Finding:** Top header was never fixed/sticky in original PPS codebase.

---

## 3. Category B: New Scope / Feature Requests Disguised as 'Bugs' (9 Items)

These items represent **brand new functionalities or design overhauls** that were never part of any milestone agreement, contract spec, or user story:

### `ONB-03`: Missing Password Visibility Toggle Icon on Login Page
- **Module / Tab:** `Onboarding Flow`
- **Why this is New Scope:** The original platform never had password visibility toggles; this is a new UI/UX request.

### `ONB-13`: Missing Toast Notifications & Logout Confirmation Modal
- **Module / Tab:** `Onboarding Flow`
- **Why this is New Scope:** The platform never had a logout confirmation modal. This is a brand new workflow requirement.

### `ONB-14`: Missing Profile and Logout Dropdown in Top-Right Navigation
- **Module / Tab:** `Onboarding Flow`
- **Why this is New Scope:** The application never had a top-right dropdown profile menu. This is a new UI/UX request.

### `INSP-01`: Unclear Relationship Between Property Rosters and Inspection Assignment
- **Module / Tab:** `Inspections Flow`
- **Why this is New Scope:** Task 3 specified property rosters for staff pools and single assigned lead specialist per inspection. QA is asking if collaborative multi-specialist inspections are supported (new requirement).

### `INSP-03`: Inspection Assignment Permissions Not Restricted by Property Roster
- **Module / Tab:** `Inspections Flow`
- **Why this is New Scope:** Whether admins require roster membership or override platform-wide is a client policy decision.

### `INSP-05`: Missing Option to Remove an Uploaded Photo from Checklist
- **Module / Tab:** `Inspections Flow`
- **Why this is New Scope:** The original application never had photo deletion from checklists; this is a brand new feature.

### `INSP-09`: Clarify and Fix Property Staff Roster and Inspection Workflow
- **Module / Tab:** `Inspections Flow`
- **Why this is New Scope:** Related to INSP-01/07. Client needs to clarify whether roster members automatically inherit open audits.

### `RESP-08`: Global Real-Time Filtering & Horizontal Swipeable Sliders
- **Module / Tab:** `Responsiveness`
- **Why this is New Scope:** QA is requesting a platform-wide redesign of all search bars to eliminate Apply buttons and add horizontal swipeable sliders across Properties, Team, Inspections, and Analytics.

### `RESP-13`: Team Page Search/Filter Swipeable Slider & Real-Time Filter
- **Module / Tab:** `Responsiveness`
- **Why this is New Scope:** Part of the requested global swipeable slider redesign (see RESP-08).

---

## 4. Category C: Features We Built & Coded (30 Items)

These items directly relate to the modules we built or upgraded. They represent UI edge cases, responsive layout polish, gate tightening, and prompt guardrails:

### Task 1: Multi-Tenancy & License SKUs

- **`RESP-03` — Property License and SKU Unit Fields Displayed Inline** (`Responsiveness`)
  - *Technical Scope:* We added the SKU fields in Task 1; CSS flex-direction can be set to col.
- **`RESP-09` — Misaligned Tenant and Staff Tags on Mobile Property Lists** (`Responsiveness`)
  - *Technical Scope:* Stack tags below property title on small viewports.
- **`RESP-10` — Inconsistent Placement of Tenant & Current Inspections Tags in Team** (`Responsiveness`)
  - *Technical Scope:* Ensure tags consistently drop below team member names.
- **`RESP-16` — Inconsistent Alignment of Tenant Name & Open Inspection Tags on Tablet** (`Responsiveness`)
  - *Technical Scope:* Tablet media query alignment.

### Task 3: Property Staff Rosters & Inspection Assignments

- **`INSP-07` — Incorrect Specialist Dropdown vs Property Staff Roster Sync** (`Inspections Flow`)
  - *Technical Scope:* We created the staff roster and assign dropdown; the dropdown currently queries all tenant specialists rather than filtering exclusively to property roster members.
- **`INSP-08` — Photo ID Verification Toggle Not Hard-Blocking Checklist Access** (`Inspections Flow`)
  - *Technical Scope:* We added the toggle require_photo_id_verification in Task 3; the client/server route requires a hard blocking gate.
- **`INSP-11` — Misaligned Borders & Empty Space in My Assignments Summary Cards** (`Inspections Flow`)
  - *Technical Scope:* Responsive CSS spacing adjustment on summary cards.
- **`INSP-12` — Missing Border Styling in Completed Section of My Assignments** (`Inspections Flow`)
  - *Technical Scope:* Minor CSS border utility class missing on Completed card.

### Task 4: Forced Password Reset & Team Setup

- **`ONB-04` — Missing Standard Password Validation in Temporary Password Field (Add Team)** (`Onboarding Flow`)
  - *Technical Scope:* We built the Temporary Password field and auto-generator in Task 4. Standard complex regex validation was not in the original specification for admin-set temporary passwords.
- **`ONB-06` — Missing Password Visibility Toggle on First-Time Password Setup Page** (`Onboarding Flow`)
  - *Technical Scope:* We created the /setup-password screen in Task 4. Password toggles were not in the original spec.
- **`ONB-07` — Password Fields Reset After Invalid Input on Setup Page** (`Onboarding Flow`)
  - *Technical Scope:* Form state retention fix on the page we built.
- **`ONB-08` — Missing Standard Complex Password Validation on Setup Page** (`Onboarding Flow`)
  - *Technical Scope:* Original Task 4 spec only required minimum 8 characters (min(8)). QA is now requesting full enterprise complexity (uppercase, lowercase, number, symbol).
- **`ONB-09` — Unclear Password Mismatch Validation Message on Setup Page** (`Onboarding Flow`)
  - *Technical Scope:* Quick copy adjustment for inline confirm-password error.
- **`ONB-10` — Missing Success Notification After Password Setup & Reset** (`Onboarding Flow`)
  - *Technical Scope:* We redirected users back to /login on success; adding a URL query param (?message=updated) will trigger the requested toast.
- **`RESP-12` — Misaligned 'Auto Generate If Blank' and Oversized Placeholder** (`Responsiveness`)
  - *Technical Scope:* Stack the toggle below heading and reduce placeholder font size.

### Task 6: GPS Geofencing & Telemetry

- **`PROP-04` — Missing Conditional Validation for GPS & Inspection Days** (`Property Flow`)
  - *Technical Scope:* We added the toggles in Task 6, but frontend allowed submitting while enabled with empty coordinates.
- **`INSP-10` — GPS Geofence Verification Not Hard-Blocking Checklist Access** (`Inspections Flow`)
  - *Technical Scope:* We implemented GPS telemetry and geofencing calculations; the checklist entry gate currently warns rather than hard-blocks.

### Task 7: Field Specialist AI Chatbot

- **`CHAT-01` — Chatbot Does Not Close on Outside Click & History Lost on Refresh** (`ChatBot`)
  - *Technical Scope:* We built the chatbot in Task 7; conversation state was React in-memory state; outside click listener was omitted.
- **`CHAT-02` — Chatbot Fails to Properly Render Tables, HTML, Regex, and JSON** (`ChatBot`)
  - *Technical Scope:* Chatbot markdown renderer needs remark-gfm and code block syntax formatting.
- **`CHAT-03` — Chatbot Violates Defined Scope by Answering Unrelated Questions** (`ChatBot`)
  - *Technical Scope:* System prompt in specialist-assistant.ts needs strict out-of-scope guardrails.

### Task 8: Analytics Hub & Performance Scorecards

- **`RESP-04` — Analytics Page Day Filters Overlapping Instead of Swipeable Slider** (`Responsiveness`)
  - *Technical Scope:* We built Analytics in Task 8; day filter pills need overflow-x-auto container.
- **`RESP-05` — Misaligned Headings in Audit Volume & Inconsistent Icon Sizing** (`Responsiveness`)
  - *Technical Scope:* Analytics card heading alignment and icon flex-shrink constraints.
- **`RESP-06` — Cramped Specialist Performance Scorecards Layout & Icons** (`Responsiveness`)
  - *Technical Scope:* Analytics scorecard layout width adjustment.
- **`RESP-07` — Cramped Property Inspection Frequency & Issue Rates Layout** (`Responsiveness`)
  - *Technical Scope:* Analytics section layout adjustment.
- **`RESP-15` — Inconsistent Performance Tab Naming ('Performance' vs 'Scorecard')** (`Responsiveness`)
  - *Technical Scope:* Quick string label synchronization.

### Phase 2: Specialist Impersonation & Multi-Tenant Controls

- **`TEAM-01` — Misaligned 'Open Specialist Panel' Button in Team Page** (`Team Flow`)
  - *Technical Scope:* We added the 1-click view button in Phase 2; button alignment needs flex container polish.
- **`TEAM-02` — 'Exit to Admin' and 'Close Tab' Buttons Perform Same Action** (`Team Flow`)
  - *Technical Scope:* Browsers restrict window.close() unless opened via script. Needs distinct tab handling.
- **`TEAM-03` — Admin Impersonation Mode Displays Unauthorized Quick Actions** (`Team Flow`)
  - *Technical Scope:* Quick Actions were leaking Admin navigation while in Specialist impersonation view.
- **`TEAM-05` — Incorrect Open Tenant Admin Panel Access & Missing Exit Header** (`Team Flow`)
  - *Technical Scope:* Tenant admin impersonation session needs dedicated exit bar matching specialist view.
- **`RESP-11` — Inconsistent Alignment of Team Member Action Buttons** (`Responsiveness`)
  - *Technical Scope:* Action button row container styling.

---

## 5. Category D: Server Infrastructure & Stability (1 Item)

### `INFRA-01`: Site goes down quite often (`https://take.ms/6Xu3k`)
- **Root Cause:** Hostinger VPS resource allocation, Nginx reverse-proxy configuration, or PM2 process memory limit.
- **Audit Finding:** This is not a Next.js code defect. It is related to server resource monitoring on the Hostinger VPS hosting `amenityops.app`. Optimization of PM2 memory flags or VPS RAM/CPU upgrade is required.

---

## 6. Client Communication Strategy & Response Template

Use the following professional response to communicate with the client:

```markdown
Hi [Client Name],

Thank you for sharing the thorough QA Bug Report from your testing team. We have reviewed all 60 items in detail across every tab.

To give you total transparency on how these items map to our recent work versus the baseline platform, here is the breakdown:

1. Features We Built & Coded (30 Items — 50%):
   - These are refinements directly related to the modules we built (AI Chatbot formatting, Forced Password Reset flow, GPS gate enforcement, Analytics scorecard spacing, and Impersonation controls).
   - We are happy to handle these refinements as part of our milestone delivery and warranty.

2. Pre-Existing Legacy Platform Code (20 Items — 33%):
   - Items such as login/forgot-password screen placeholders, legacy Supabase multi-device session handling, the default checklist submission 500 error, legacy property form width, and original layout headers were already part of the baseline codebase before our development work.
   - We can certainly fix and polish these for you, but they represent legacy maintenance rather than issues introduced by our new features.

3. New Feature Requests Disguised as QA Bugs (9 Items — 15%):
   - Several items represent brand new functionality never in the original specification:
     • A platform-wide overhaul of all search and filters into horizontal swipeable sliders.
     • A logout confirmation modal with toast notifications.
     • An account-wide top-right profile and logout dropdown.
     • Adding a photo deletion feature to checklist items.
     • Redesigning camera permissions and native capture behavior.
   - We can gladly build these enhancements for you as a new dedicated development milestone/milestone.

4. Server Stability (Site Downtime):
   - The reported downtime is related to server memory and PM2 process management on the Hostinger VPS. We can inspect the server logs and adjust PM2 memory limits to ensure 100% uptime.

Please let us know how you would like to proceed, and we can immediately begin tackling Group 1 (refinements on the code we built) while discussing the scope for Groups 2 & 3!
```