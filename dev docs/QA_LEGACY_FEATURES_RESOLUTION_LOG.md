# Amenity Op's — QA Legacy Codebase Bug Fixes: Resolution Log (Phase 2)

> **Document Version:** 1.0  
> **Source Audit:** `dev docs/QA_AUDIT_ORIGIN_AND_SCOPE_BREAKDOWN.md`  
> **Status:** Initialized — Ready for Execution

---

## Resolution Matrix

| Issue ID | Flow | Target File(s) | Description | Status |
| :--- | :--- | :--- | :--- | :--- |
| `ONB-01` | Onboarding | `src/app/login/page.tsx` | Add proper placeholders for Email and Password fields on Login | Resolved |
| `ONB-02` | Onboarding | `src/app/forgot-password/page.tsx` | Add proper placeholder for Email on Forgot Password screen | Resolved |
| `ONB-03` | Onboarding | `src/app/login/page.tsx` | Verify and polish show/hide password visibility toggle icon | Resolved |
| `ONB-05` | Onboarding | `src/app/login/page.tsx` | Retain entered email value upon failed login attempts | Resolved |
| `ONB-11` & `RESP-14` | Onboarding / Nav | `src/components/Header.tsx`, `src/components/AppShell.tsx` | Sticky top header (`sticky top-0 z-40`) & fixed desktop sidebar | Resolved |
| `ONB-12` | Onboarding | `src/components/ResetPasswordForm.tsx` | Add placeholders & enforce toggles on `/reset-password` | Resolved |
| `ONB-13` & `ONB-14` | Onboarding / Nav | `src/components/AppShell.tsx`, `src/components/Header.tsx` | Logout confirmation modal, toast feedback, and top-right profile dropdown | Pending |
| `PROP-01` | Property | `src/app/admin/properties/new/page.tsx` | Expand New Property form from `max-w-2xl` to full container width | Pending |
| `PROP-02` | Property | `src/components/PropertyForm.tsx`, `src/components/AddressFields.tsx` | Add missing placeholders (Name, Street, City, Phone) | Pending |
| `PROP-03` & `PROF-01` | Property / Profile | `src/components/PropertyForm.tsx`, `src/components/InspectorProfileForm.tsx` | Standard phone number validation and formatting | Pending |
| `PROP-05` | Property | `src/app/admin/properties/[id]/page.tsx`, `src/lib/actions/properties.ts` | Green success toast after creating / editing property | Pending |
| `PROP-06` | Property | `src/app/admin/properties/page.tsx` | Fix misleading empty-state message on property search | Pending |
| `INSP-04` | Inspections | `src/components/ActiveInspectionChecklist.tsx` | Expand checklist layout to eliminate excessive empty space on the right | Pending |
| `INSP-05` | Inspections | `src/components/ChecklistItemCard.tsx` | Add Remove / Delete Photo option before submitting checklist | Pending |
| `RESP-02` | Inspections | `src/components/ChecklistItemCard.tsx` | Fix mobile camera capture closing prematurely | Pending |
| `REP-01` | Reports | `src/app/admin/reports/page.tsx` | Remove redundant filter heading and Apply button in favor of real-time search | Pending |
| `RESP-01` | Responsiveness | `src/components/PropertyCard.tsx` / `src/app/admin/properties/[id]/page.tsx` | Stack tags and action buttons below inspection details on mobile | Pending |

---

## Detailed Task Logs

### Task 1: `ONB-01` — Missing or Improper Placeholders in Email/Password on Login
- **Target File:** `src/app/login/page.tsx`
- **Root Cause:** Legacy form inputs for Email and Password lacked `placeholder` attributes.
- **Changes Applied:**
  - Added `placeholder="Enter your email"` to the email `<input>` element.
  - Added `placeholder="Enter your password"` to the password `<input>` element.
- **Verification:** TypeScript compilation verified clean (`npx tsc --noEmit` exited with code 0).

### Task 2: `ONB-02` — Missing or Improper Placeholder in Email on Forgot Password Screen
- **Target File:** `src/app/forgot-password/page.tsx`
- **Root Cause:** Email input field lacked a placeholder.
- **Changes Applied:**
  - Added `placeholder="Enter your email"` to the email input on the Forgot Password form.
- **Verification:** Verified clean diff and exact placeholder match.

### Task 3: `ONB-03` — Missing Password Visibility Toggle Icon on Login Page
- **Target File:** `src/app/login/page.tsx`
- **Root Cause:** Legacy login form password field lacked an interactive visibility toggle button.
- **Changes Applied:**
  - Verified and confirmed interactive eye toggle (`Eye` and `EyeOff` from `lucide-react`) allowing users to show and hide entered passwords.
  - Positioned absolutely inside the relative password container with proper ARIA accessibility labels.
- **Verification:** Verified in browser rendering and type checking.

### Task 4: `ONB-05` — Email and Password Fields Reset After Invalid Login Attempt
- **Target File:** `src/app/login/page.tsx`
- **Root Cause:** Email input was uncontrolled and reset upon server action re-render on failed login attempts.
- **Changes Applied:**
  - Added controlled React state `email` bound via `value={email}` and `onChange={(e) => setEmail(e.target.value)}`.
  - The entered email remains preserved in the input across failed attempts while the error message is displayed.
- **Verification:** Verified in code review and diff inspection.

### Task 5: `ONB-11` & `RESP-14` — Dashboard Sidebar and Header Not Fixed During Scrolling
- **Target Files:** `src/components/Header.tsx`, `src/components/AppShell.tsx`
- **Root Cause:** Mobile/tablet header and desktop top bar lacked `sticky` positioning, scrolling out of view with the page. Desktop sidebar moved with page scroll, making navigation items inaccessible without scrolling.
- **Changes Applied:**
  - Added `sticky top-0 z-40 bg-surface-container-lowest/95 backdrop-blur-sm` to `<header>` in `src/components/Header.tsx` (mobile & tablet).
  - Added `lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto` to `<aside>` in `src/components/AppShell.tsx` to fix the sidebar in the viewport with its own container scroll.
  - Added `lg:sticky lg:top-0 lg:z-30 bg-surface-container-lowest/95 backdrop-blur-sm` to the desktop top bar in `src/components/AppShell.tsx`.
- **Verification:** Verified responsive CSS classes and DOM hierarchy across mobile and desktop.

### Task 6: `ONB-12` — Missing Placeholders, Toggles & Validation in Password Reset Flow
- **Target File:** `src/components/ResetPasswordForm.tsx`
- **Root Cause:** Input fields in the password reset form lacked descriptive placeholder text.
- **Changes Applied:**
  - Added `placeholder="Enter current password"` to the Current Password field.
  - Added `placeholder="Enter your new password"` to the New Password field.
  - Added `placeholder="Confirm your new password"` to the Confirm Password field.
  - Verified active eye visibility toggles, standard 5-point password complexity rules, and mismatch validation.
- **Verification:** Verified in diff and visual inspection.







