# Amenity Op's — QA Bug Resolution Record & Engineering Audit Log

> **Document Type:** Live Resolution Record & Engineering Audit Log (Features We Built & Coded)  
> **Source Plan:** `dev docs/QA_FEATURES_WE_CODED_ACTION_PLAN.md`  
> **Total Actionable Items:** 31 Concrete Development Tasks  
> **Last Updated:** October 30, 2026  
> **Status:** 26 of 31 Resolved (83.9% Complete)

---

## Executive Progress Tracker

| Module | Feature Area | Total Tasks | Resolved | Pending | Status |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Module 1** | Task 4 — Forced Password Reset & Team Setup | 7 | **7** | 0 | **COMPLETED** |
| **Module 2** | Task 6 — GPS Geofencing & Telemetry Validation | 2 | **2** | 0 | **COMPLETED** |
| **Module 3** | Task 3 — Property Staff Rosters & Gate Enforcement | 4 | **4** | 0 | **COMPLETED** |
| **Module 4** | Task 7 — Field Specialist AI Chatbot | 3 | **3** | 0 | **COMPLETED** |
| **Module 5** | Task 8 — Analytics Hub & Performance Scorecards | 5 | **5** | 0 | **COMPLETED** |
| **Module 6** | Phase 2 — Specialist Impersonation & Admin Security | 5 | **5** | 0 | **COMPLETED** |
| **Module 7** | Task 1 & 3 — Multi-Tenancy Tags & Action Alignment | 5 | 0 | 5 | PENDING |
| **Total** | | **31** | **26** | **5** | **In Progress** |

---

## Module 1: Task 4 — Forced Password Reset & Team Setup

### 1. `ONB-04`: Missing Standard Password Validation in the Temporary Password Field When Adding a New Team Member
* **Priority:** `High` | **Severity:** `Medium`
* **Target Files:**
  * `src/components/InspectorForm.tsx`
  * `src/lib/actions/team.ts`
  * `src/lib/password.ts`
* **Reported Issue:**
  The Temporary Password input in the Add Team Member modal did not enforce or display standard enterprise password validation when a custom temporary password was entered.
* **Engineering Resolution:**
  1. Integrated real-time complexity validation via `checkPasswordRequirements()` in `src/components/InspectorForm.tsx`.
  2. If the admin leaves the field blank, the system maintains the secure auto-generation of a 14-character cryptographically random password (`generateSecureTemporaryPassword()`).
  3. If the admin enters a custom password, a 5-point requirements grid displays live green checkmarks for:
     * Minimum 8 characters
     * At least 1 uppercase letter (A-Z)
     * At least 1 lowercase letter (a-z)
     * At least 1 number (0-9)
     * At least 1 special character (!@#$%)
  4. Form submission is disabled until all 5 criteria are satisfied.
  5. In `src/lib/actions/team.ts`, server-side validation (`getPasswordValidationError`) blocks invalid submissions before calling Supabase Auth admin API.
* **Verification Status:** `RESOLVED` (Verified via `npx tsc --noEmit` and production build).

---

### 2. `RESP-12`: Misaligned Auto-Generate Option and Oversized Placeholder in Add Team Member Form
* **Priority:** `Medium` | **Severity:** `Low`
* **Target Files:**
  * `src/components/InspectorForm.tsx`
* **Reported Issue:**
  "Auto Generate If Blank" was rendered inline with the Temporary Password heading, creating an unbalanced layout, and the placeholder text was oversized and clipped on narrower viewports.
* **Engineering Resolution:**
  1. Restructured layout to place the *"Auto-Generated if blank"* badge directly below the Temporary Password label in a clean vertical flow.
  2. Adjusted input placeholder styling using `placeholder:text-xs font-mono text-sm` to prevent text truncation across all screen sizes.
* **Verification Status:** `RESOLVED` (Clean visual hierarchy with responsive spacing).

---

### 3. `ONB-06`: Missing Password Visibility Toggle Icon on the First-Time Password Setup Page
* **Priority:** `Medium` | **Severity:** `Low`
* **Target Files:**
  * `src/components/ForcePasswordChangeForm.tsx`
  * `src/components/ResetPasswordForm.tsx`
  * `src/app/login/page.tsx`
* **Reported Issue:**
  Users setting their permanent password on `/force-password-change` or resetting password on `/reset-password` had no show/hide toggle, increasing input error rates.
* **Engineering Resolution:**
  1. Added stateful visibility toggles (`Eye` and `EyeOff` from `lucide-react`) to all password inputs:
     * Temporary Initial Password
     * New Password
     * Confirm New Password
  2. Added keyboard-accessible toggle buttons (`aria-label`, `type="button"`) maintaining focus inside inputs.
* **Verification Status:** `RESOLVED` (Toggles functional across all password forms).

---

### 4. `ONB-07`: Password Fields Reset After Invalid Input on the First-Time Password Setup Page
* **Priority:** `High` | **Severity:** `Medium`
* **Target Files:**
  * `src/components/ForcePasswordChangeForm.tsx`
* **Reported Issue:**
  When validation failed, all password input fields were cleared, forcing users to repeatedly type long passwords from scratch.
* **Engineering Resolution:**
  1. Converted inputs to React-controlled state (`useState`).
  2. On validation errors or password mismatch, `newPassword` and `confirmPassword` remain intact in state.
  3. If authentication fails specifically on the current temporary password, only the temporary password field resets for security, preserving the user's newly formulated password.
* **Verification Status:** `RESOLVED` (Form inputs preserved across client and server validation failures).

---

### 5. `ONB-08`: Missing Standard Password Complexity Validation on First-Time Password Setup
* **Priority:** `High` | **Severity:** `Medium`
* **Target Files:**
  * `src/components/ForcePasswordChangeForm.tsx`
  * `src/lib/actions/auth.ts`
  * `src/lib/password.ts`
* **Reported Issue:**
  The new password input previously only checked `length >= 8`, omitting uppercase, lowercase, numbers, and symbols.
* **Engineering Resolution:**
  1. Implemented standard enterprise complexity checklist:
     * Minimum 8 characters
     * 1 uppercase letter (A-Z)
     * 1 lowercase letter (a-z)
     * 1 number (0-9)
     * 1 special character (!@#$%&*+)
  2. Renders dynamic green checks when satisfied and subtle gray indicators when incomplete.
  3. Action button is disabled until all 5 complexity rules are met.
  4. Server action `completeForcedPasswordChange` in `src/lib/actions/auth.ts` enforces server-side compliance with exact error messages.
* **Verification Status:** `RESOLVED` (Dynamic UI checklist + server-side enforcement).

---

### 6. `ONB-09`: Unclear Password Mismatch Validation Message on First-Time Password Setup
* **Priority:** `Medium` | **Severity:** `Low`
* **Target Files:**
  * `src/components/ForcePasswordChangeForm.tsx`
  * `src/lib/actions/auth.ts`
* **Reported Issue:**
  Displaying a generic "Passwords do not match" banner didn't indicate which field needed correction.
* **Engineering Resolution:**
  1. Added inline validation directly beneath the Confirm Password input.
  2. If the fields mismatch, the confirm input border turns red (`border-error ring-1 ring-error/40`) with an inline warning:
     > ⚠️ *"Confirm Password must match the New Password."*
  3. Once matched, the error clears and the border turns green (`border-emerald-500/60`).
  4. Updated server error in `src/lib/actions/auth.ts` to match the explicit wording.
* **Verification Status:** `RESOLVED` (Clear visual feedback and targeted inline error).

---

### 7. `ONB-10`: Missing Success Notification After Password Setup & Password Reset Flow
* **Priority:** `Medium` | **Severity:** `Low`
* **Target Files:**
  * `src/lib/actions/auth.ts`
  * `src/app/login/page.tsx`
  * `src/components/ResetPasswordForm.tsx`
* **Reported Issue:**
  After completing first-time password setup or password recovery, the user was silently redirected to `/login` without confirmation that the change succeeded.
* **Engineering Resolution:**
  1. Updated both `completeForcedPasswordChange` and `updatePassword` in `src/lib/actions/auth.ts` to redirect to `/login?notice=password_updated`.
  2. In `src/app/login/page.tsx`, created a `<LoginNotice />` component wrapped in `<Suspense>` reading the query parameter.
  3. Renders a prominent green confirmation toast:
     > ✅ **Password Updated Successfully**  
     > *Please log in with your new password.*
* **Verification Status:** `RESOLVED` (Confirmed across both new user onboarding and password reset flows).

---

## Module 2: Task 6 — GPS Geofencing & Telemetry Validation

### 8. `PROP-04`: Missing Conditional Validation for GPS Coordinates and Required Inspection Days in the New and Edit Property Flows
* **Priority:** `High` | **Severity:** `High`
* **Target Files:**
  * `src/components/PropertyForm.tsx`
  * `src/lib/actions/properties.ts`
* **Reported Issue:**
  The system allowed saving or creating a property with missing or invalid GPS coordinates even when "Enable On-Site GPS Geofence Verification" was enabled, and allowed saving with zero days selected when "Enable Required Inspection Days" was enabled.
* **Engineering Resolution:**
  1. **Conditional GPS Geofence Validation:**
     * In `src/lib/actions/properties.ts`, added a strict Zod `.superRefine()` rule: when `enable_gps_geofencing` is true, validates that Latitude is a valid number between -90 and 90, and Longitude is a valid number between -180 and 180.
     * In `src/components/PropertyForm.tsx`, added real-time client validation for both Latitude and Longitude with red asterisk indicators and dynamic inline error feedback.
  2. **Conditional Required Inspection Days Validation:**
     * In `src/components/PropertyForm.tsx`, bound `name="enable_schedule"` to the toggle and tracked `selectedDays`. If the schedule is enabled and zero days are picked, an inline warning (`Please select at least one day of the week when Required Inspection Days is enabled.`) renders and blocks submission.
     * In `src/lib/actions/properties.ts`, enforced server-side validation in both `createProperty` and `updateProperty`. When `enable_schedule` is turned off, `required_schedule` is cleanly reset to `[]` so stale days are never stored.
  3. Form submission button is conditionally locked and displays helper text until all conditional requirements are valid across both New and Edit property flows.
* **Verification Status:** `RESOLVED` (Full frontend & backend validation verified).

---

### 9. `INSP-10`: GPS Geofence Verification Is Not Working Correctly and Does Not Block Inspection Checklist Access
* **Priority:** `High` | **Severity:** `Critical`
* **Target Files:**
  * `src/components/GpsTelemetryTracker.tsx`
  * `src/components/ActiveInspectionChecklist.tsx`
  * `src/app/api/inspections/[id]/complete/route.ts`
* **Reported Issue:**
  GPS Geofence was purely advisory — specialists could access the checklist, fill answers, and submit audits even when location permissions were denied or when physically outside the property perimeter.
* **Engineering Resolution:**
  1. **Telemetry Tracker Communication & Retry Mechanism:**
     * In `src/components/GpsTelemetryTracker.tsx`, added `onStatusChange` prop reporting live status (`'verified'`, `'outside'`, `'denied'`, `'exempt'`) and proximity distance.
     * Added manual retry buttons ("Retry Permission Check" and "Refresh GPS Location") allowing specialists to re-trigger browser location checks without refreshing the page.
  2. **Hard Blocking Gate UI:**
     * In `src/components/ActiveInspectionChecklist.tsx`, when geofencing is configured and status is `'denied'` or `'outside'`, rendered a prominent red blocking gate card with explicit instructions.
     * The entire checklist items container is blurred, grayed out, and input-locked (`opacity-40 pointer-events-none select-none filter blur-[0.5px]`), preventing question answering or photo capture while outside.
     * Submit button is hard-disabled with the message: *"Checklist is locked until your physical presence inside the property perimeter is verified."*
  3. **Backend Hard Gate Enforcement:**
     * In `src/app/api/inspections/[id]/complete/route.ts`, added a backend security gate before completing any inspection. If `enable_gps_geofencing` is true and the property has coordinates, the API returns a `403 Forbidden` error if the specialist was not verified on-site (`arrived_at` null and `geofence_status !== 'verified'`), eliminating any route or API bypass.
* **Verification Status:** `RESOLVED` (Hard blocking screen gate + backend 403 enforcement verified).

---

## Module 3: Task 3 — Property Staff Rosters & Gate Enforcement

### 10. `INSP-07`: Incorrect Specialist Assignment Flow and Property Staff Roster Synchronization
* **Priority:** `High` | **Severity:** `High`
* **Target Files:**
  * `src/components/SpecialistSelect.tsx`
  * `src/app/admin/inspections/new/page.tsx`
  * `src/app/admin/inspections/[id]/edit/page.tsx`
  * `src/app/admin/properties/[id]/page.tsx`
  * `src/lib/actions/inspections.ts`
* **Reported Issue:**
  The specialist assignment dropdown displayed admins, team members, and all specialists across the tenant regardless of property roster assignment. Assigning an unlisted specialist to an inspection did not enroll them on the property roster, resulting in desynchronized data between property rosters and inspection records.
* **Engineering Resolution:**
  1. **Strict Specialist Filtering:** Excluded accounts with `role: 'admin'` from specialist selection in `src/components/SpecialistSelect.tsx`, `src/app/admin/inspections/new/page.tsx`, and `src/app/admin/inspections/[id]/edit/page.tsx`. Also filtered candidate specialists in `src/app/admin/properties/[id]/page.tsx` to only eligible inspectors.
  2. **Roster Prioritization & Unlisted Assignment Workflow:**
     * In `src/components/SpecialistSelect.tsx`, by default, the dropdown displays *only* specialists assigned to the selected property's staff roster.
     * If specialists are assigned, a badge displays the count on the roster (e.g., `[PRIMARY]`, `[BACKUP]`, `[STAFF]`).
     * Added an explicit toggle checkbox: *"Allow assigning unlisted specialist (automatically adds to property staff roster)"*. When checked, other active specialists are listed in an optgroup with an auto-enrollment notice.
     * If a property has no assigned roster members, an informative amber warning banner informs the admin, and available organization specialists are presented with automatic roster enrollment.
  3. **Automatic Roster Synchronization:**
     * In `src/lib/actions/inspections.ts`, both `createInspection` and `updateInspection` verify whether the assigned specialist exists in `property_specialist_assignments` for that property.
     * If not already enrolled, the server automatically inserts them into `property_specialist_assignments` with role `'staff'` and triggers immediate revalidation of `/admin/properties/${propertyId}`, keeping property rosters and inspections completely synchronized.
* **Verification Status:** `RESOLVED` (Full dropdown gating and bi-directional roster sync verified).

---

### 11. `INSP-08`: Photo ID Document Verification Is Not Enforced Before Inspection Checklist Access
* **Priority:** `High` | **Severity:** `High`
* **Target Files:**
  * `src/components/ActiveInspectionChecklist.tsx`
  * `src/app/inspector/inspections/[id]/page.tsx`
  * `src/app/api/inspections/[id]/complete/route.ts`
  * `src/lib/actions/inspections.ts`
* **Reported Issue:**
  Even when "Require Photo ID Document Verification" was enabled in property settings, the assigned specialist could access the inspection checklist, enter data, and complete inspections without having submitted their Driver's License photo ID documents.
* **Engineering Resolution:**
  1. **Data Pipeline Integration:**
     * In `src/app/inspector/inspections/[id]/page.tsx`, queried `require_id_photo` on `properties` and `id_front_path` / `id_back_path` on `profiles`.
     * Passed `requireIdPhoto` and `isIdVerified` flags to `ActiveInspectionChecklist`.
  2. **Hard Blocking Photo ID Gate UI:**
     * In `src/components/ActiveInspectionChecklist.tsx`, when `requireIdPhoto` is true and the non-admin specialist lacks an ID front document, a prominent gate card is rendered with an immediate deep link to `/inspector/profile` (*"Upload Photo ID Document"*).
     * The entire checklist item stream is blurred, dimmed, and input-locked (`opacity-40 pointer-events-none select-none filter blur-[0.5px]`).
     * The inspection submission button is locked with the label *"Locked (Photo ID Required)"* and an explanatory warning.
     * When `requireIdPhoto` is false, specialists have seamless, unhindered access.
  3. **Backend API & Action Enforcement:**
     * In `src/lib/actions/inspections.ts` (`saveInspectionItem`), added verification rejecting item updates with an error if the property mandates photo ID verification and the user profile has not uploaded an ID document.
     * In `src/app/api/inspections/[id]/complete/route.ts`, added a backend security check returning `403 Forbidden` if `require_id_photo` is enabled and the specialist has not uploaded an approved ID on file.
* **Verification Status:** `RESOLVED` (End-to-end frontend blocking gate + backend API enforcement verified).

---

### 12. `INSP-11`: Misaligned Borders and Excessive Empty Space in My Assignments Summary Cards on Mobile and Tablet Viewports
* **Priority:** `Medium` | **Severity:** `Medium`
* **Target Files:**
  * `src/components/AssignmentsBoard.tsx`
* **Reported Issue:**
  The summary cards on the My Assignments page displayed misaligned borders, uneven dimensions, and excessive empty space on tablet and mobile viewports due to abrupt breakpoint transitions.
* **Engineering Resolution:**
  1. Updated the grid from `grid grid-cols-2 gap-3 lg:grid-cols-4` to `grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4`.
  2. Wrapped each metric button with `w-full h-full rounded-xl focus:outline-none focus-visible:ring-2` and ensured the inner `Card` spans `h-full w-full` with consistent padding (`p-3.5 sm:p-4`).
  3. Un-hid status indicator icons on tablet viewports (`hidden sm:block`) to create a balanced, professional presentation that eliminates dead horizontal space on tablet screens (768px-1024px) while preserving compact 2-column mobile layout.
* **Verification Status:** `RESOLVED` (Responsive grid and aligned container borders verified).

---

### 13. `INSP-12`: Missing Border Styling in the Completed Section on the My Assignments Page
* **Priority:** `Medium` | **Severity:** `Low`
* **Target Files:**
  * `src/components/AssignmentsBoard.tsx`
* **Reported Issue:**
  The Completed section on the My Assignments page lacked uniform border styling and rendered an unstyled plain text element when no completed inspections existed, resulting in visual inconsistency compared to the Open section.
* **Engineering Resolution:**
  1. Added explicit `border border-outline-variant overflow-hidden rounded-xl` to the Completed assignments card container on both desktop and mobile viewports.
  2. Applied consistent header background (`bg-surface-container-low`) and border separators to table and mobile list items.
  3. Replaced the unstyled empty state paragraph with the standard `EmptyState` component with `CheckCircle2` icon, uniform dashed border, and structured description.
* **Verification Status:** `RESOLVED` (Uniform card border and styled EmptyState container verified).

---

## Module 4: Task 7 — Field Specialist AI Chatbot

### 14. `CHAT-01`: Chatbot Does Not Close on Outside Interaction and Conversation History Is Lost on Page Refresh
* **Priority:** `Medium` | **Severity:** `Medium`
* **Target Files:**
  * `src/components/SpecialistChatbot.tsx`
* **Reported Issue:**
  The chatbot did not close when clicking outside the window or interacting with other page components, especially on desktop. Additionally, refreshing the browser page or navigating away erased the active conversation history, even though a dedicated Reset button existed for intentional clearing.
* **Engineering Resolution:**
  1. **Universal Outside Interaction Dismissal:**
     * Attached `cardRef` to the chatbot container and added document-level `mousedown` and `touchstart` pointer listeners whenever `isOpen` is true.
     * Clicks or taps originating outside `cardRef.current` immediately close the chatbot (`setIsOpen(false)`), while internal interactions remain active without unintentional dismissal across mobile, tablet, and desktop viewports.
  2. **Conversation History Persistence:**
     * Implemented persistent local storage caching via `localStorage` key `'amenityops_specialist_chat_history'`.
     * On component mount, the chatbot restores previously exchanged messages, maintaining conversational continuity across page refreshes, tab closures, and route transitions.
     * Every new user or assistant message automatically updates the persisted cache.
  3. **Guarded Conversation Reset Workflow:**
     * Configured the Reset button (`RotateCcw`) to prompt the specialist with an explicit confirmation dialog before wiping the chat.
     * Upon confirmation, the message history resets to the initial operational greeting and the `localStorage` cache is cleanly removed.
* **Verification Status:** `RESOLVED` (Outside click dismissal + localStorage persistence + guarded reset verified).

---

### 15. `CHAT-02`: Chatbot Fails to Properly Render Tables, HTML, Regex, and JSON Responses
* **Priority:** `Medium` | **Severity:** `Medium`
* **Target Files:**
  * `src/components/ChatMarkdownRenderer.tsx`
  * `src/components/SpecialistChatbot.tsx`
* **Reported Issue:**
  The assistant response renderer did not support structured content. Markdown tables rendered as broken pipe text, code blocks lacked formatting, raw HTML tags appeared unparsed, and regexes or JSON objects were displayed without syntax structure or copy capabilities.
* **Engineering Resolution:**
  1. **Structured Block Parser:**
     * Built dedicated modular renderer `ChatMarkdownRenderer.tsx` replacing basic line-by-line paragraph splitting.
  2. **Markdown Table Rendering:**
     * Implemented table parsing detecting headers, alignment specifiers (`:---`, `:---:`, `---:`), and rows.
     * Rendered responsive tables inside `overflow-x-auto` containers with rounded borders, distinct `bg-surface-container-low` headers, padded cells, and alternating hover states.
  3. **Code Blocks (JSON, Regex, Code):**
     * Formats fenced code blocks (```lang ... ```) with language tags (`JSON`, `REGEX`, `CODE`).
     * Added an interactive "Copy" button with instant feedback checkmark and 2-second timeout.
     * Added automatic pretty-printing for JSON via `JSON.stringify(JSON.parse(code), null, 2)`.
     * Preserved special characters, backslashes, and token boundaries in Regex and code patterns without double-escaping.
  4. **HTML Sanitization & Inline Parsing:**
     * Safely parses and normalizes inline HTML tags (`<strong>`, `<b>`, `<code>`, `<em>`, `<br>`) while stripping harmful tags (`<script>`, `<iframe>`, inline `on*` attributes) to prevent XSS vulnerabilities.
* **Verification Status:** `RESOLVED` (Full table, code block, JSON, regex, and HTML rendering verified).

---

### 16. `CHAT-03`: Chatbot Violates Defined Scope by Answering Unrelated Questions
* **Priority:** `High` | **Severity:** `High`
* **Target Files:**
  * `src/lib/specialist-bot-knowledge.ts`
  * `src/lib/rag-assistant.ts`
* **Reported Issue:**
  The chatbot violated its operational boundary by answering unrelated questions (such as providing step-by-step tutorials on binary-to-decimal conversion) instead of maintaining focus on property inspection SOPs.
* **Engineering Resolution:**
  1. **Hardened System Prompt Guardrails:**
     * In `src/lib/rag-assistant.ts`, expanded `SYSTEM_PROMPT` with strict negative constraints: strictly forbidden from answering off-topic queries (programming tutorials, binary conversion, general trivia, math problem solving, personal advice).
     * Instructed the model to politely decline and redirect the specialist back to property audits, photo evidence, and compliance SOPs.
  2. **Automated Scope Classifier & Pre-Filter:**
     * In `src/lib/specialist-bot-knowledge.ts`, implemented `classifyQueryScope()` with word-boundary regex detection for out-of-scope patterns vs. in-scope operational keywords.
     * **Pure Out-of-Scope Queries:** When a query like *"How do you convert binary to decimal?"* or *"Write python code"* is received, the assistant immediately provides a polite refusal:
       *`I am the Amenity Op's Field Assistant, specialized exclusively in on-site property inspection procedures, photo evidence standards, GPS geofencing, and platform compliance. I cannot provide tutorials regarding [topic]. How can I assist you with your current property audit or checklist today?`*
     * **Mixed Queries:** When a query contains both an in-scope question and an out-of-scope question (e.g. *"What are the photo rules and how do I convert binary to decimal?"*), the assistant answers the property inspection question completely, and appends an explicit scope notice politely declining the unrelated question.
* **Verification Status:** `RESOLVED` (Strict scope boundaries verified across pure out-of-scope, in-scope, and mixed queries).

---

## Module 5: Task 8 — Analytics Hub & Performance Scorecards

### 17. `RESP-04`: Analytics Page Day Filters Are Overlapping Instead of Displaying in a Swipeable Slider
* **Priority:** `Medium` | **Severity:** `Low`
* **Target Files:**
  * `src/components/AdminAnalyticsDashboard.tsx`
* **Reported Issue:**
  The analytics day filter options (Last 7 Days, Last 30 Days, Last 90 Days, All-Time) overlapped and wrapped awkwardly on mobile and tablet screens, creating a cluttered and difficult-to-tap layout.
* **Engineering Resolution:**
  1. Restructured the Time Horizon strip into a responsive container (`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3`).
  2. Wrapped the filter pill buttons in a dedicated horizontally scrollable slider (`flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 max-w-full`).
  3. Applied `shrink-0 whitespace-nowrap min-h-9 px-3.5` to all filter buttons, enabling smooth horizontal swipe gesture navigation without awkward vertical wrapping or button clipping on smaller devices.
* **Verification Status:** `RESOLVED` (Responsive horizontal swipeable slider verified across viewports).

---

### 18. `RESP-05`: Misaligned Headings in Audit Volume by Checklist Template and Inconsistent Icon Sizing on Analytics Page
* **Priority:** `Medium` | **Severity:** `Medium`
* **Target Files:**
  * `src/components/AdminAnalyticsDashboard.tsx`
* **Reported Issue:**
  The heading in the Audit Volume by Checklist Template / Asset Category section appeared inline with the "Active Checklist" badge, causing text collisions on narrower screens. Furthermore, metric card icons lacked fixed sizing and would shrink when adjacent metric descriptions wrapped.
* **Engineering Resolution:**
  1. **Vertical Heading Separation:**
     * Replaced the inline layout with a vertically stacked header (`flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between`), placing the active checklist type counter neatly beneath the section heading.
  2. **Standardized Icon Constraints:**
     * Enforced rigid icon dimensions (`w-5 h-5 shrink-0`) and fixed container dimensions (`h-9 w-9 shrink-0 flex items-center justify-center rounded-lg`) across all 5 primary KPI cards (Completed Audits, On-Time Arrival, Avg Duration & Dwell, Issue Discovery Rate, Photo Compliance).
     * Added `shrink-0` constraints to section header icons (`Layers`, `Calendar`, `Award`, `Building2`) to prevent icon shrinkage when descriptions or numbers expand.
* **Verification Status:** `RESOLVED` (Clean vertical headings and uniform icon dimensions verified).

---

### 19. `RESP-06`: Cramped Specialist Performance Scorecards Layout and Inconsistent Icon Sizes
* **Priority:** `Medium` | **Severity:** `Low`
* **Target Files:**
  * `src/components/AdminAnalyticsDashboard.tsx`
* **Reported Issue:**
  The Specialist Performance Scorecards & Ranking card header squeezed the title and description into a narrow space because the "Manage Team" link was forced inline on the right, causing cramped text wrapping on mobile and tablet viewports.
* **Engineering Resolution:**
  1. Expanded the title and description to full width (`w-full`).
  2. Repositioned the "Manage Team" action link into its own dedicated row below the descriptive text (`inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline`).
  3. Enforced consistent `Award` icon sizing (`w-5 h-5 shrink-0 text-primary mt-0.5`).
* **Verification Status:** `RESOLVED` (Full-width heading layout with positioned action link verified).

---

### 20. `RESP-07`: Cramped Property Inspection Frequency & Issue Rates Layout and Inconsistent Icon Sizes
* **Priority:** `Medium` | **Severity:** `Low`
* **Target Files:**
  * `src/components/AdminAnalyticsDashboard.tsx`
* **Reported Issue:**
  The Property Inspection Frequency & Issue Rates section was horizontally cramped by having the "All Properties" link inline on the right, resulting in awkward multiline wrapping of the subtitle on mobile and tablet screens.
* **Engineering Resolution:**
  1. Restructured the header to provide full-width allocation (`w-full`) for the section heading and description.
  2. Positioned the "All Properties" navigation link cleanly below the description block.
  3. Enforced standardized `Building2` icon sizing (`w-5 h-5 shrink-0 text-primary mt-0.5`).
* **Verification Status:** `RESOLVED` (Clean full-width layout with structured link placement verified).

---

### 21. `RESP-15`: Inconsistent Performance Tab Naming Across Viewports
* **Priority:** `Low` | **Severity:** `Low`
* **Target Files:**
  * `src/lib/nav-items.ts`
  * `src/components/BottomNav.tsx`
* **Reported Issue:**
  The navigation tab for specialist metrics was labeled "Performance" on desktop sidebar navigation, but showed "Scorecard" on mobile and tablet bottom navigation, creating inconsistent nomenclature across viewports.
* **Engineering Resolution:**
  1. In `src/lib/nav-items.ts`, updated `INSPECTOR_NAV_ITEMS` for `/inspector/metrics` from `shortLabel: 'Scorecard'` to `shortLabel: 'Performance'`.
  2. Desktop navigation, mobile navigation, and tablet bottom bar now all display the unified term **"Performance"**.
* **Verification Status:** `RESOLVED` (Unified 'Performance' label across all viewports verified).

---

## Module 6: Phase 2 — Specialist Impersonation & Admin Security

### 22. `TEAM-01`: Misaligned “Open Specialist Panel” Button in the Team Page — Active Members Section
* **Priority:** `Medium` | **Severity:** `Low`
* **Target Files:**
  * `src/app/admin/team/page.tsx`
* **Reported Issue:**
  The "Open Specialist Panel" button alongside the role toggle and deactivation modal disrupted the layout of the Active Members section, forcing member summary details (names, role titles, contact info, coverage areas) into a narrow, squashed column that wrapped awkwardly across 4-6 lines on medium and desktop screens.
* **Engineering Resolution:**
  1. Restructured each member card in `src/app/admin/team/page.tsx` into a two-tier layout:
     * **Top Tier:** Full-width profile summary containing member name, organization/HQ badge, setup pending indicator, open inspections counter, professional title, human ID, contact info, and coverage area with unobstructed horizontal space.
     * **Bottom Action Bar:** A dedicated, clean action strip (`border-t border-outline-variant/30 pt-3 flex flex-wrap items-center gap-2`).
  2. Placed the "Open Specialist Panel" button cleanly alongside the `RoleToggleButton` and `DeactivateMemberModal` within this dedicated container, eliminating all text collision and wrapping anomalies across all device viewports.
* **Verification Status:** `RESOLVED` (Dedicated bottom action bar layout verified across viewports).

---

### 23. `TEAM-02`: "Exit to Admin" and "Close Tab" Buttons Perform the Same Action in the Specialist Team Member Panel
* **Priority:** `High` | **Severity:** `Medium`
* **Target Files:**
  * `src/components/AdminImpersonationBanner.tsx`
  * `src/components/TenantViewBanner.tsx`
* **Reported Issue:**
  Both "Exit to Admin" and "Close Tab" buttons in the impersonation header redirected the admin to `/api/impersonate/exit`, opening a new/duplicate browser tab and cluttering the admin's workspace with duplicate Team pages.
* **Engineering Resolution:**
  1. **Differentiated Action Semantics:**
     * **"Exit to Admin":** Navigates the current browser tab cleanly back to the Admin Team page via `/api/impersonate/exit` (or `/api/tenant-view/exit`), clearing impersonation session cookies without spawning new tabs.
     * **"Close Tab":** Programmatically attempts `window.close()` to cleanly close the specialist panel tab and return the user to their previously opened admin window.
  2. **Non-Duplicating Browser Security Fallback:**
     * When browser security restrictions prevent programmatic closure of tabs opened via direct link (`window.close()` blocked), instead of executing an unexpected redirect that opens duplicate tabs, the banner displays a non-intrusive inline dismissible instruction:
       *`Browser tab closure was prevented by browser security. Please close this browser tab manually, or click Exit to Admin to return in this window.`*
  3. Applied the identical robust dual-action pattern to both `AdminImpersonationBanner.tsx` and `TenantViewBanner.tsx`.
* **Verification Status:** `RESOLVED` (Distinct in-app redirect vs. window.close() with graceful browser fallback verified).

---

### 24. `TEAM-03`: Admin Impersonation Mode Displays Unauthorized Quick Actions and Allows Navigation Back to the Admin Portal
* **Priority:** `High` | **Severity:** `High`
* **Target Files:**
  * `src/app/inspector/page.tsx`
  * `src/app/inspector/layout.tsx`
  * `src/components/AssignmentsBoard.tsx`
* **Reported Issue:**
  While in Specialist Impersonation mode, the specialist assignments board displayed unauthorized Admin quick actions ("Start Inspection" navigating to `/admin/inspections/new` and "Dashboard" navigating to `/admin`). Clicking these links leaked out of the impersonation view and dropped the user into the admin portal unexpectedly.
* **Engineering Resolution:**
  1. **Strict Viewport Isolation in RSC:**
     * In `src/app/inspector/page.tsx`, computed `showAdminActions = !isImpersonating && (adminProfile?.role === 'admin' || profile.role === 'admin')`.
     * Passed `isAdmin={showAdminActions}` to `AssignmentsBoard`.
  2. **Suppression of Admin Quick Actions & Route Isolation:**
     * When `isImpersonating` is active, `isAdmin` is strictly `false`.
     * The "Start Inspection" (`/admin/inspections/new`) and "Dashboard" (`/admin`) buttons in the Quick Actions aside are suppressed.
     * Completed inspection links route strictly within the specialist portal (`/inspector/inspections/${id}`) rather than linking to the admin report route (`/admin/reports/${id}`).
  3. Combined with `src/app/inspector/layout.tsx`, navigation headers, app shells, and bottom bars remain strictly isolated within the specialist viewport until the user explicitly clicks "Exit to Admin".
* **Verification Status:** `RESOLVED` (Complete isolation of specialist viewport without admin link leaks verified).

---

### 25. `TEAM-04`: Admin Can Demote Another Admin to Specialist Without Super Admin Authorization
* **Priority:** `High` | **Severity:** `Critical`
* **Target Files:**
  * `src/lib/actions/team.ts`
  * `src/components/RoleToggleButton.tsx`
  * `src/app/admin/team/page.tsx`
* **Reported Issue:**
  A standard tenant admin was able to demote another admin (or the initial HQ admin) to specialist, allowing unauthorized privilege alteration without Super Admin authorization.
* **Engineering Resolution:**
  1. **Backend Privilege Gate:**
     * In `src/lib/actions/team.ts` (`setTeamMemberRole`), queried target user's role and verified the calling admin's `current.is_global_admin` status.
     * If the target profile is an `'admin'` and the proposed role is `'inspector'`, the server requires `current.is_global_admin` to be `true`. If not, execution is rejected with:
       *`Unauthorized: Demoting an Administrator to Specialist requires Super Admin authorization.`*
     * Also prevented standard admins from altering another administrator's account.
  2. **Frontend UI Lock & Tooltip:**
     * In `src/components/RoleToggleButton.tsx`, added `canDemoteAdmin` prop.
     * When `role === 'admin'` and `!canDemoteAdmin`, the button is locked with `disabled`, `opacity-40 cursor-not-allowed`, and a tooltip explaining *"Demoting an Administrator requires Super Admin authorization"*.
     * Clicking triggers an explanatory error toast if bypassed.
  3. In `src/app/admin/team/page.tsx`, passed `canDemoteAdmin={Boolean(currentProfile.is_global_admin)}`.
* **Verification Status:** `RESOLVED` (Dual frontend lock + backend security check verified).

---

### 26. `TEAM-05`: Incorrect Open Tenant Admin Panel Access and Missing Exit View Navigation
* **Priority:** `High` | **Severity:** `High`
* **Target Files:**
  * `src/app/admin/team/page.tsx`
  * `src/app/admin/impersonate/[id]/route.ts`
  * `src/components/TenantViewBanner.tsx`
* **Reported Issue:**
  Standard tenant admins could see "Open Tenant Admin" on other admin cards, but clicking it redirected them back to their own dashboard without switching contexts or displaying an exit view top banner.
* **Engineering Resolution:**
  1. **Role-Based Button Rendering:**
     * In `src/app/admin/team/page.tsx`, "Open Tenant Admin" is now displayed **only** when `member.role === 'admin' && currentProfile.is_global_admin && member.tenant_id`. Standard tenant admins never see this action on peer admins.
     * Specialist cards display "Open Specialist Panel" for all authorized admins.
  2. **Impersonation Route Security & Context Switch:**
     * In `src/app/admin/impersonate/[id]/route.ts`, added verification: if target user is an admin belonging to a different tenant and the caller is not a Global HQ Admin, access is denied and redirected with `?error=unauthorized_admin_view`.
     * When an authorized Global Admin opens a tenant admin, `TENANT_VIEW_COOKIE` is written and redirected to `/admin`.
  3. **Persistent Exit Banner:**
     * In `src/app/admin/layout.tsx`, `TenantViewBanner` is rendered when viewing a tenant, providing an "Exit to HQ" button (`/api/tenant-view/exit`) and "Close Tab" with fallback notice.
* **Verification Status:** `RESOLVED` (Tenant context switching, permission gating, and sticky exit banner verified).

---

## Module 7: Task 1 & 3 — Multi-Tenancy Tags & Action Alignment

### 27. `RESP-03`: Property License and SKU Unit Fields Are Displayed Inline Instead of on Separate Lines
* **Priority:** `Medium` | **Severity:** `Low`
* **Target Files:**
  * `src/app/admin/properties/page.tsx`
  * `src/app/admin/properties/new/page.tsx`
* **Reported Issue:**
  The Property License heading and SKU Unit allocation fields were displayed inline next to each other on a single row, creating a cramped layout that wrapped irregularly on narrower desktop and tablet viewports.
* **Engineering Resolution:**
  1. In `src/app/admin/properties/page.tsx`, converted the Property License SKU Usage Indicator to a dedicated stacked structure (`flex flex-col gap-1`):
     * **Line 1:** Icon and Title (`Property Licenses:`) with `KeyRound` icon.
     * **Line 2:** Indented SKU allocation details (`{used} of {max} SKU units allocated ({tier} Tier)`) directly below.
     * Placed available license badge / capacity status neatly aligned to the right or bottom on mobile (`sm:items-center sm:justify-between`).
  2. In `src/app/admin/properties/new/page.tsx`, applied the identical vertical rhythm:
     * **Line 1:** `Property Licenses` with icon.
     * **Line 2:** `SKU Units: {used} of {max} used` on its own distinct line.
* **Verification Status:** `RESOLVED` (Vertical stacking of Property License and SKU units verified).

---

### 28. `RESP-09`: Misaligned Tenant and Staff Tags on Mobile Property Lists
* **Priority:** `Medium` | **Severity:** `Low`
* **Target Files:**
  * `src/app/admin/properties/page.tsx`
* **Reported Issue:**
  On mobile viewports, property items forced tenant badges and staff roster tags inline with the property title, causing the badges to collide, wrap unpredictably, and truncate building names.
* **Engineering Resolution:**
  1. In the mobile property card list (`lg:hidden`), separated property titles and badges into a clean two-level block (`flex flex-col items-start gap-1`):
     * **Level 1:** Unobstructed property name (`font-headline font-semibold text-base text-on-surface`).
     * **Level 2:** Tenant badge (`Building` icon + Tenant Name) and staff count badge (`{total} Staff`) rendered in a clean horizontal strip directly below the property title.
  2. Preserved full desktop table layout with aligned columns for wide screens.
* **Verification Status:** `RESOLVED` (Mobile vertical stacking of property badges verified).

---

### 29. `RESP-10`: Inconsistent Placement of Tenant and Current Inspections Tags in Team Members List
* **Priority:** `Medium` | **Severity:** `Low`
* **Target Files:**
  * `src/app/admin/team/page.tsx`
* **Reported Issue:**
  In the Team Members list, Tenant and Current Inspections badges appeared inline with the member's name for shorter names, but wrapped below for longer names, producing an irregular, staggered presentation across rows.
* **Engineering Resolution:**
  1. Standardized the active and deactivated member cards in `src/app/admin/team/page.tsx` so that metadata badges are **consistently positioned on their own dedicated line directly below the member's full name**, regardless of name length.
  2. Enforced uniform spacing (`mt-1 flex flex-wrap items-center gap-1.5`) across all entries, establishing consistent vertical rhythm throughout the roster.
* **Verification Status:** `RESOLVED` (Consistent placement of tags below member names verified).

---

### 30. `RESP-11`: Inconsistent Alignment of Team Member Action Buttons
* **Priority:** `Medium` | **Severity:** `Low`
* **Target Files:**
  * `src/app/admin/team/page.tsx`
* **Reported Issue:**
  Action buttons on the team page were inconsistently placed; some secondary actions wrapped next to the primary panel launch button while others broke below it, causing jagged alignment.
* **Engineering Resolution:**
  1. Structured member action controls into a dedicated two-row layout:
     * **Row 1:** Primary panel action button (`Open Specialist Panel` or `Open Tenant Admin`).
     * **Row 2:** Secondary management buttons (`RoleToggleButton` / Make Specialist or Admin, `DeactivateMemberModal` / Deactivate) aligned in a single, neat horizontal flex row (`flex flex-wrap items-center gap-2`).
  2. Ensured uniform button dimensions, border styling, and responsive padding across desktop, tablet, and mobile viewports.
* **Verification Status:** `RESOLVED` (Single horizontal flex row below primary panel button verified).

---

### 31. `RESP-16`: Inconsistent Alignment of Tenant Name and Open Inspection Tags on Tablet View
* **Priority:** `Medium` | **Severity:** `Low`
* **Target Files:**
  * `src/app/admin/team/page.tsx`
* **Reported Issue:**
  On tablet viewports (768px-1024px), tenant and open inspection badges occasionally wrapped or clipped against right-aligned action elements depending on viewport width.
* **Engineering Resolution:**
  1. Separated the member summary header from the action controls completely with a dedicated divider (`border-t border-outline-variant/30 pt-3`).
  2. Allocated 100% of the horizontal row width to the member name and its badge strip (`mt-1 flex flex-wrap items-center gap-1.5`), preventing any text truncation, badge overlapping, or clipping across all tablet viewports.
* **Verification Status:** `RESOLVED` (Clean tablet alignment with 100% horizontal width verified).

