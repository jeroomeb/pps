# Amenity Op's — QA Legacy Codebase Bug Fixes: Action Plan (Phase 2)

> **Document Version:** 1.0  
> **Source Audit:** `dev docs/QA_AUDIT_ORIGIN_AND_SCOPE_BREAKDOWN.md` & `dev docs/QA_BUG_REPORT_MASTER.md`  
> **Target Scope:** Category A (Pre-Existing Legacy Code) & Category B (Associated QA UX Enhancements)

---

## Executive Overview

Following the 100% completion, testing, and deployment of **Phase 1** (31 QA bug fixes for the features we coded across Modules 1 to 7), **Phase 2** addresses the defects and UX gaps that existed in the **previous / legacy codebase** prior to our development contract.

---

## Module Breakdown & Execution Roadmap

### Module 1: Authentication & Onboarding Polish (Legacy Forms & Nav)
- [x] **Task 1 (`ONB-01`):** Add missing descriptive placeholders (`Enter your email`, `Enter your password`) in `src/app/login/page.tsx`.
- [x] **Task 2 (`ONB-02`):** Add missing descriptive placeholder (`Enter your email`) in `src/app/forgot-password/page.tsx`.
- [x] **Task 3 (`ONB-03`):** Ensure show/hide eye toggle is fully functional on `/login`.
- [x] **Task 4 (`ONB-05`):** Retain entered email in input field on failed login attempts (`src/app/login/page.tsx`) so users do not have to re-type.
- [x] **Task 5 (`ONB-11` & `RESP-14`):** Ensure dashboard header is sticky (`sticky top-0 z-40 bg-surface-container-lowest`) and desktop sidebar is fixed during scrolling across mobile, tablet, and desktop (`src/components/Header.tsx`, `src/components/AppShell.tsx`).
- [x] **Task 6 (`ONB-12`):** Add missing placeholders (`Enter current password`, `Enter your new password`, `Confirm your new password`) and ensure visibility toggles and validation work consistently on `/reset-password` (`src/components/ResetPasswordForm.tsx`).
- [x] **Task 7 (`ONB-13` & `ONB-14`):** Implement logout confirmation modal ("Are you sure you want to log out?"), logout success feedback, and top-right profile & logout dropdown menu in `src/components/AppShell.tsx` and `src/components/Header.tsx`.

---

### Module 2: Property Management & Profile Validation
- [x] **Task 8 (`PROP-01`):** Expand New Property add screen width from restrictive `max-w-2xl` to full responsive layout (`w-full max-w-5xl`) in `src/app/admin/properties/new/page.tsx`.
- [ ] **Task 9 (`PROP-02`):** Add missing placeholders:
  - Property Name: `Enter property name` in `src/components/PropertyForm.tsx`
  - Street Address: `Enter street address` in `src/components/AddressFields.tsx`
  - City: `Enter city` in `src/components/AddressFields.tsx`
  - Property Phone: `Enter property phone number` in `src/components/PropertyForm.tsx`
- [ ] **Task 10 (`PROP-03` & `PROF-01`):** Implement standard phone number formatting and validation (allowing optional `+` and 10–15 digits) on property forms and user profile edit forms (`src/components/PropertyForm.tsx`, `src/components/InspectorProfileForm.tsx`, `src/lib/actions/properties.ts`).
- [ ] **Task 11 (`PROP-05`):** Add green success toast notifications after creating or editing a property (`Property has been created successfully.` / `Property has been updated successfully.`) in `src/app/admin/properties/[id]/page.tsx`.
- [ ] **Task 12 (`PROP-06`):** Replace misleading empty-state message in Property search (`No properties in this area. Try clearing the location filter.` -> `No properties found. Try changing your search criteria or adjusting the filters.`) in `src/app/admin/properties/page.tsx`.

---

### Module 3: Inspection Checklist, Photo Controls & Reports Polish
- [ ] **Task 13 (`INSP-04`):** Expand inspection checklist layout container from `max-w-3xl` to full responsive width (`max-w-5xl`) in `src/components/ActiveInspectionChecklist.tsx` to eliminate excessive empty space on the right.
- [ ] **Task 14 (`INSP-05`):** Add an explicit "Remove / Delete Photo" action button alongside uploaded photos in `src/components/ChecklistItemCard.tsx` allowing specialists to remove or retake photos before submission.
- [ ] **Task 15 (`RESP-02`):** Fix mobile camera capture closing prematurely by enhancing file input attributes in `src/components/ChecklistItemCard.tsx`.
- [ ] **Task 16 (`REP-01`):** Remove redundant Filter heading and Apply button on Reports page (`src/app/admin/reports/page.tsx`) in favor of clean real-time search.
- [ ] **Task 17 (`RESP-01`):** Fix overlapping inspection section on mobile viewports in property inspection cards by stacking status badges and action buttons below details.

---

## Verification & Deployment Protocol
1. Static type checking: `npx tsc --noEmit`
2. Production build verification: `npm run build`
3. Document each task resolution in `dev docs/QA_LEGACY_FEATURES_RESOLUTION_LOG.md`
4. Deploy and verify through automated GitHub Actions CI/CD workflows.

