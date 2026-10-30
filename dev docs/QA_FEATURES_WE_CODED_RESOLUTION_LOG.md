# Amenity Op's — QA Bug Resolution Record & Engineering Audit Log

> **Document Type:** Live Resolution Record & Engineering Audit Log (Features We Built & Coded)  
> **Source Plan:** [`dev docs/QA_FEATURES_WE_CODED_ACTION_PLAN.md`](file:///d:/Nextjs%20Projects/amenityops/dev%20docs/QA_FEATURES_WE_CODED_ACTION_PLAN.md)  
> **Total Actionable Items:** 31 Concrete Development Tasks  
> **Last Updated:** October 30, 2026  
> **Status:** 9 of 31 Resolved (29.0% Complete)

---

## Executive Progress Tracker

| Module | Feature Area | Total Tasks | Resolved | Pending | Status |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Module 1** | Task 4 — Forced Password Reset & Team Setup | 7 | **7** | 0 | **COMPLETED** |
| **Module 2** | Task 6 — GPS Geofencing & Telemetry Validation | 2 | **2** | 0 | **COMPLETED** |
| **Module 3** | Task 3 — Property Staff Rosters & Gate Enforcement | 4 | 0 | 4 | PENDING |
| **Module 4** | Task 7 — Field Specialist AI Chatbot | 3 | 0 | 3 | PENDING |
| **Module 5** | Task 8 — Analytics Hub & Performance Scorecards | 5 | 0 | 5 | PENDING |
| **Module 6** | Phase 2 — Specialist Impersonation & Admin Security | 5 | 0 | 5 | PENDING |
| **Module 7** | Task 1 & 3 — Multi-Tenancy Tags & Action Alignment | 5 | 0 | 5 | PENDING |
| **Total** | | **31** | **9** | **22** | **In Progress** |

---

## Module 1: Task 4 — Forced Password Reset & Team Setup

### 1. `ONB-04`: Missing Standard Password Validation in the Temporary Password Field When Adding a New Team Member
* **Priority:** `High` | **Severity:** `Medium`
* **Target Files:**
  * [`src/components/InspectorForm.tsx`](file:///d:/Nextjs%20Projects/amenityops/src/components/InspectorForm.tsx)
  * [`src/lib/actions/team.ts`](file:///d:/Nextjs%20Projects/amenityops/src/lib/actions/team.ts)
  * [`src/lib/password.ts`](file:///d:/Nextjs%20Projects/amenityops/src/lib/password.ts)
* **Reported Issue:**
  The Temporary Password input in the Add Team Member modal did not enforce or display standard enterprise password validation when a custom temporary password was entered.
* **Engineering Resolution:**
  1. Integrated real-time complexity validation via `checkPasswordRequirements()` in [`src/components/InspectorForm.tsx`](file:///d:/Nextjs%20Projects/amenityops/src/components/InspectorForm.tsx).
  2. If the admin leaves the field blank, the system maintains the secure auto-generation of a 14-character cryptographically random password (`generateSecureTemporaryPassword()`).
  3. If the admin enters a custom password, a 5-point requirements grid displays live green checkmarks for:
     * Minimum 8 characters
     * At least 1 uppercase letter (A-Z)
     * At least 1 lowercase letter (a-z)
     * At least 1 number (0-9)
     * At least 1 special character (!@#$%)
  4. Form submission is disabled until all 5 criteria are satisfied.
  5. In [`src/lib/actions/team.ts`](file:///d:/Nextjs%20Projects/amenityops/src/lib/actions/team.ts), server-side validation (`getPasswordValidationError`) blocks invalid submissions before calling Supabase Auth admin API.
* **Verification Status:** `RESOLVED` (Verified via `npx tsc --noEmit` and production build).

---

### 2. `RESP-12`: Misaligned Auto-Generate Option and Oversized Placeholder in Add Team Member Form
* **Priority:** `Medium` | **Severity:** `Low`
* **Target Files:**
  * [`src/components/InspectorForm.tsx`](file:///d:/Nextjs%20Projects/amenityops/src/components/InspectorForm.tsx)
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
  * [`src/components/ForcePasswordChangeForm.tsx`](file:///d:/Nextjs%20Projects/amenityops/src/components/ForcePasswordChangeForm.tsx)
  * [`src/components/ResetPasswordForm.tsx`](file:///d:/Nextjs%20Projects/amenityops/src/components/ResetPasswordForm.tsx)
  * [`src/app/login/page.tsx`](file:///d:/Nextjs%20Projects/amenityops/src/app/login/page.tsx)
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
  * [`src/components/ForcePasswordChangeForm.tsx`](file:///d:/Nextjs%20Projects/amenityops/src/components/ForcePasswordChangeForm.tsx)
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
  * [`src/components/ForcePasswordChangeForm.tsx`](file:///d:/Nextjs%20Projects/amenityops/src/components/ForcePasswordChangeForm.tsx)
  * [`src/lib/actions/auth.ts`](file:///d:/Nextjs%20Projects/amenityops/src/lib/actions/auth.ts)
  * [`src/lib/password.ts`](file:///d:/Nextjs%20Projects/amenityops/src/lib/password.ts)
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
  4. Server action `completeForcedPasswordChange` in [`src/lib/actions/auth.ts`](file:///d:/Nextjs%20Projects/amenityops/src/lib/actions/auth.ts) enforces server-side compliance with exact error messages.
* **Verification Status:** `RESOLVED` (Dynamic UI checklist + server-side enforcement).

---

### 6. `ONB-09`: Unclear Password Mismatch Validation Message on First-Time Password Setup
* **Priority:** `Medium` | **Severity:** `Low`
* **Target Files:**
  * [`src/components/ForcePasswordChangeForm.tsx`](file:///d:/Nextjs%20Projects/amenityops/src/components/ForcePasswordChangeForm.tsx)
  * [`src/lib/actions/auth.ts`](file:///d:/Nextjs%20Projects/amenityops/src/lib/actions/auth.ts)
* **Reported Issue:**
  Displaying a generic "Passwords do not match" banner didn't indicate which field needed correction.
* **Engineering Resolution:**
  1. Added inline validation directly beneath the Confirm Password input.
  2. If the fields mismatch, the confirm input border turns red (`border-error ring-1 ring-error/40`) with an inline warning:
     > ⚠️ *"Confirm Password must match the New Password."*
  3. Once matched, the error clears and the border turns green (`border-emerald-500/60`).
  4. Updated server error in [`src/lib/actions/auth.ts`](file:///d:/Nextjs%20Projects/amenityops/src/lib/actions/auth.ts) to match the explicit wording.
* **Verification Status:** `RESOLVED` (Clear visual feedback and targeted inline error).

---

### 7. `ONB-10`: Missing Success Notification After Password Setup & Password Reset Flow
* **Priority:** `Medium` | **Severity:** `Low`
* **Target Files:**
  * [`src/lib/actions/auth.ts`](file:///d:/Nextjs%20Projects/amenityops/src/lib/actions/auth.ts)
  * [`src/app/login/page.tsx`](file:///d:/Nextjs%20Projects/amenityops/src/app/login/page.tsx)
  * [`src/components/ResetPasswordForm.tsx`](file:///d:/Nextjs%20Projects/amenityops/src/components/ResetPasswordForm.tsx)
* **Reported Issue:**
  After completing first-time password setup or password recovery, the user was silently redirected to `/login` without confirmation that the change succeeded.
* **Engineering Resolution:**
  1. Updated both `completeForcedPasswordChange` and `updatePassword` in [`src/lib/actions/auth.ts`](file:///d:/Nextjs%20Projects/amenityops/src/lib/actions/auth.ts) to redirect to `/login?notice=password_updated`.
  2. In [`src/app/login/page.tsx`](file:///d:/Nextjs%20Projects/amenityops/src/app/login/page.tsx), created a `<LoginNotice />` component wrapped in `<Suspense>` reading the query parameter.
  3. Renders a prominent green confirmation toast:
     > ✅ **Password Updated Successfully**  
     > *Please log in with your new password.*
* **Verification Status:** `RESOLVED` (Confirmed across both new user onboarding and password reset flows).

---

## Module 2: Task 6 — GPS Geofencing & Telemetry Validation

### 8. `PROP-04`: Missing Conditional Validation for GPS Coordinates and Required Inspection Days in the New and Edit Property Flows
* **Priority:** `High` | **Severity:** `High`
* **Target Files:**
  * [`src/components/PropertyForm.tsx`](file:///d:/Nextjs%20Projects/amenityops/src/components/PropertyForm.tsx)
  * [`src/lib/actions/properties.ts`](file:///d:/Nextjs%20Projects/amenityops/src/lib/actions/properties.ts)
* **Reported Issue:**
  The system allowed saving or creating a property with missing or invalid GPS coordinates even when "Enable On-Site GPS Geofence Verification" was enabled, and allowed saving with zero days selected when "Enable Required Inspection Days" was enabled.
* **Engineering Resolution:**
  1. **Conditional GPS Geofence Validation:**
     * In [`src/lib/actions/properties.ts`](file:///d:/Nextjs%20Projects/amenityops/src/lib/actions/properties.ts), added a strict Zod `.superRefine()` rule: when `enable_gps_geofencing` is true, validates that Latitude is a valid number between -90 and 90, and Longitude is a valid number between -180 and 180.
     * In [`src/components/PropertyForm.tsx`](file:///d:/Nextjs%20Projects/amenityops/src/components/PropertyForm.tsx), added real-time client validation for both Latitude and Longitude with red asterisk indicators and dynamic inline error feedback.
  2. **Conditional Required Inspection Days Validation:**
     * In [`src/components/PropertyForm.tsx`](file:///d:/Nextjs%20Projects/amenityops/src/components/PropertyForm.tsx), bound `name="enable_schedule"` to the toggle and tracked `selectedDays`. If the schedule is enabled and zero days are picked, an inline warning (`Please select at least one day of the week when Required Inspection Days is enabled.`) renders and blocks submission.
     * In [`src/lib/actions/properties.ts`](file:///d:/Nextjs%20Projects/amenityops/src/lib/actions/properties.ts), enforced server-side validation in both `createProperty` and `updateProperty`. When `enable_schedule` is turned off, `required_schedule` is cleanly reset to `[]` so stale days are never stored.
  3. Form submission button is conditionally locked and displays helper text until all conditional requirements are valid across both New and Edit property flows.
* **Verification Status:** `RESOLVED` (Full frontend & backend validation verified).

---

### 9. `INSP-10`: GPS Geofence Verification Is Not Working Correctly and Does Not Block Inspection Checklist Access
* **Priority:** `High` | **Severity:** `Critical`
* **Target Files:**
  * [`src/components/GpsTelemetryTracker.tsx`](file:///d:/Nextjs%20Projects/amenityops/src/components/GpsTelemetryTracker.tsx)
  * [`src/components/ActiveInspectionChecklist.tsx`](file:///d:/Nextjs%20Projects/amenityops/src/components/ActiveInspectionChecklist.tsx)
  * [`src/app/api/inspections/[id]/complete/route.ts`](file:///d:/Nextjs%20Projects/amenityops/src/app/api/inspections/[id]/complete/route.ts)
* **Reported Issue:**
  GPS Geofence was purely advisory — specialists could access the checklist, fill answers, and submit audits even when location permissions were denied or when physically outside the property perimeter.
* **Engineering Resolution:**
  1. **Telemetry Tracker Communication & Retry Mechanism:**
     * In [`src/components/GpsTelemetryTracker.tsx`](file:///d:/Nextjs%20Projects/amenityops/src/components/GpsTelemetryTracker.tsx), added `onStatusChange` prop reporting live status (`'verified'`, `'outside'`, `'denied'`, `'exempt'`) and proximity distance.
     * Added manual retry buttons ("Retry Permission Check" and "Refresh GPS Location") allowing specialists to re-trigger browser location checks without refreshing the page.
  2. **Hard Blocking Gate UI:**
     * In [`src/components/ActiveInspectionChecklist.tsx`](file:///d:/Nextjs%20Projects/amenityops/src/components/ActiveInspectionChecklist.tsx), when geofencing is configured and status is `'denied'` or `'outside'`, rendered a prominent red blocking gate card with explicit instructions.
     * The entire checklist items container is blurred, grayed out, and input-locked (`opacity-40 pointer-events-none select-none filter blur-[0.5px]`), preventing question answering or photo capture while outside.
     * Submit button is hard-disabled with the message: *"Checklist is locked until your physical presence inside the property perimeter is verified."*
  3. **Backend Hard Gate Enforcement:**
     * In [`src/app/api/inspections/[id]/complete/route.ts`](file:///d:/Nextjs%20Projects/amenityops/src/app/api/inspections/[id]/complete/route.ts), added a backend security gate before completing any inspection. If `enable_gps_geofencing` is true and the property has coordinates, the API returns a `403 Forbidden` error if the specialist was not verified on-site (`arrived_at` null and `geofence_status !== 'verified'`), eliminating any route or API bypass.
* **Verification Status:** `RESOLVED` (Hard blocking screen gate + backend 403 enforcement verified).

---

## Module 3: Task 3 — Property Staff Rosters & Gate Enforcement

### 10. `INSP-07`: Specialist Assignment Dropdown Must Filter by Property Staff Roster
* **Priority:** `High` | **Severity:** `High`
* **Target Files:** `src/components/PropertyRosterManager.tsx`, `src/app/admin/inspections/new/page.tsx`
* **Status:** `PENDING`

### 11. `INSP-08`: Photo ID Verification Gate Enforcement
* **Priority:** `High` | **Severity:** `High`
* **Target Files:** `src/components/ActiveInspectionChecklist.tsx`
* **Status:** `PENDING`

### 12. `INSP-11`: Specialist Assignments Layout & Summary Cards Responsiveness
* **Priority:** `Medium` | **Severity:** `Medium`
* **Target Files:** `src/app/specialist/assignments/page.tsx`
* **Status:** `PENDING`

### 13. `INSP-12`: Completed Assignments Section Border Styling
* **Priority:** `Medium` | **Severity:** `Low`
* **Target Files:** `src/app/specialist/assignments/page.tsx`
* **Status:** `PENDING`

---

## Module 4: Task 7 — Field Specialist AI Chatbot

### 14. `CHAT-01`: Chatbot Outside-Click Modal Close & History Persistence
* **Priority:** `Medium` | **Severity:** `Medium`
* **Target Files:** `src/components/SpecialistChatbot.tsx`
* **Status:** `PENDING`

### 15. `CHAT-02`: Markdown & Structured Content Rendering in Chatbot
* **Priority:** `Medium` | **Severity:** `Medium`
* **Target Files:** `src/components/SpecialistChatbot.tsx`
* **Status:** `PENDING`

### 16. `CHAT-03`: AI Scope Guardrails & Topic Hardening
* **Priority:** `High` | **Severity:** `High`
* **Target Files:** `src/lib/ai/specialist-assistant.ts`
* **Status:** `PENDING`

---

## Module 5: Task 8 — Analytics Hub & Performance Scorecards

### 17. `RESP-04`: Day Filters Swipeable Slider on Mobile Viewports
* **Priority:** `Medium` | **Severity:** `Medium`
* **Target Files:** `src/components/AdminAnalyticsDashboard.tsx`
* **Status:** `PENDING`

### 18. `RESP-05`: Audit Volume Headings Stack & Metric Icon Flex Dimensions
* **Priority:** `Medium` | **Severity:** `Low`
* **Target Files:** `src/components/AdminAnalyticsDashboard.tsx`
* **Status:** `PENDING`

### 19. `RESP-06`: Specialist Performance Scorecards Layout
* **Priority:** `Medium` | **Severity:** `Low`
* **Target Files:** `src/components/AdminAnalyticsDashboard.tsx`
* **Status:** `PENDING`

### 20. `RESP-07`: Property Inspection Frequency Full-Width Layout
* **Priority:** `Medium` | **Severity:** `Low`
* **Target Files:** `src/components/AdminAnalyticsDashboard.tsx`
* **Status:** `PENDING`

### 21. `RESP-15`: Performance Tab Label Inconsistency Across Viewports
* **Priority:** `Low` | **Severity:** `Low`
* **Target Files:** `src/components/AdminAnalyticsDashboard.tsx`
* **Status:** `PENDING`

---

## Module 6: Phase 2 — Specialist Impersonation & Admin Security

### 22. `TEAM-01`: Open Specialist Panel Button Alignment
* **Priority:** `Medium` | **Severity:** `Low`
* **Target Files:** `src/app/admin/team/page.tsx`
* **Status:** `PENDING`

### 23. `TEAM-02`: "Exit to Admin" In-App Redirect vs "Close Tab"
* **Priority:** `High` | **Severity:** `Medium`
* **Target Files:** `src/components/impersonation/ImpersonationBanner.tsx`
* **Status:** `PENDING`

### 24. `TEAM-03`: Specialist Impersonation Navigation Isolation
* **Priority:** `High` | **Severity:** `Medium`
* **Target Files:** `src/components/impersonation/ImpersonationBanner.tsx`, layout components
* **Status:** `PENDING`

### 25. `TEAM-04`: Super Admin Authorization Required for Admin Demotion
* **Priority:** `Critical` | **Severity:** `High`
* **Target Files:** `src/lib/actions/team.ts`
* **Status:** `PENDING`

### 26. `TEAM-05`: Tenant Admin Panel Switching & Persistent Exit Banner
* **Priority:** `High` | **Severity:** `Medium`
* **Target Files:** `src/components/impersonation/ImpersonationBanner.tsx`, `src/lib/auth/tenant-view.ts`
* **Status:** `PENDING`

---

## Module 7: Task 1 & 3 — Multi-Tenancy Tags & Action Alignment

### 27. `RESP-03`: Property License & SKU Unit Vertical Stacking
* **Priority:** `Medium` | **Severity:** `Low`
* **Target Files:** `src/components/PropertyForm.tsx`
* **Status:** `PENDING`

### 28. `RESP-09`: Property List Tags Mobile Stacking
* **Priority:** `Medium` | **Severity:** `Low`
* **Target Files:** `src/app/admin/properties/page.tsx`
* **Status:** `PENDING`

### 29. `RESP-10`: Team List Tags Alignment
* **Priority:** `Medium` | **Severity:** `Low`
* **Target Files:** `src/app/admin/team/page.tsx`
* **Status:** `PENDING`

### 30. `RESP-11`: Team Member Action Buttons Horizontal Row Alignment
* **Priority:** `Medium` | **Severity:** `Low`
* **Target Files:** `src/app/admin/team/page.tsx`
* **Status:** `PENDING`

### 31. `RESP-16`: Tablet Viewport Alignment for Tenant & Inspection Tags
* **Priority:** `Medium` | **Severity:** `Low`
* **Target Files:** `src/app/admin/team/page.tsx`
* **Status:** `PENDING`

