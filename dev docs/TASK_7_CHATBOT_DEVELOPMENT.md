# Task 7: Field Specialist On-Site AI Assistant Chatbot — Development Record

## 1. Feature Summary
Task 7 provides a dedicated, on-site Operational Continuity Specialist (OCS) Help & SOP Chatbot built **exclusively for field specialists**.

Per client directives, the assistant is **excluded from all Admin views (`/admin/*`)** and appears only across the specialist portal (`/inspector/*` routes, including active inspection checklists).

---

## 2. Architecture & Components Built

### A. Specialist Knowledge Base Engine (`src/lib/specialist-bot-knowledge.ts`)
Comprehensive repository containing operational standards and domain rules:
1. **Photo Rules**: Mandatory photos on every item (Pass or Fail) except N/A items.
2. **Failure Item SOP**: Explanatory comment and photo evidence required for submission.
3. **N/A Guidelines**: Used only when an amenity does not physically exist on the property.
4. **GPS Geofencing**: On-site verification badge indicators, distance calculations, and dwell times.
5. **Locked Gates & Inaccessible Areas SOP**: Steps for contacting on-site management and documenting blocked areas.
6. **Autosave & Local Draft Recovery**: Real-time server sync and crash protection.
7. **Scheduled Audit Gates**: Start-time locking mechanism.
8. **Specialist Earnings & Payouts**: 3x3 matrix rates and disbursement process.
9. **Inspection Submission Pipeline**: Validation, PDF generation, and automated client email dispatch.
10. **Specialist Scorecard**: Punctuality rates, inspection velocity, and discovery rates.

### B. Backend API Route (`src/app/api/specialist-assistant/route.ts`)
- Authenticated server endpoint (`runtime = 'nodejs'`).
- Validates active user session via `getProfile()`.
- Resolves specialist queries via `querySpecialistAssistant()`.
- Returns formatted responses and suggested follow-up prompts.

### C. Floating Chatbot Client Widget (`src/components/SpecialistChatbot.tsx`)
- **Responsive Floating Trigger**:
  - Positioned at `bottom-20 right-4` on mobile (floating cleanly above the 4-tab mobile bottom nav) and `bottom-6 right-6` on desktop.
  - Animated live SOP indicator badge.
- **Slide-Over Modal Drawer**:
  - Modern header with specialist name personalization and live SOP tag.
  - Scrollable chat message area with rich formatting (headers, bullet points, numbers, bold text).
  - One-tap quick suggestion chips (*"Photo evidence rules"*, *"What is required on a Fail?"*, *"When should I use N/A?"*, *"Locked gate / access SOP"*, etc.).
  - Interactive input bar and reset conversation button.

### D. Layout Integration (`src/app/inspector/layout.tsx`)
- Mounted directly in the specialist layout shell so it is available across all specialist screens.
- Completely excluded from `src/app/admin/layout.tsx`.

---

## 3. How to Test & Verify

1. **Sign In as a Specialist**:
   * Log in with a specialist (inspector) account or access `/inspector`.
   * Observe the floating orange circular assistant button at the bottom-right.
2. **Open Assistant Drawer**:
   * Tap the floating assistant button. The slide-over drawer will open smoothly.
3. **Test Suggested SOP Chips**:
   * Tap any suggestion chip (e.g. **"Photo Rules"**, **"Fail Requirements"**, **"Locked Gate SOP"**).
   * Verify instant formatted guidance is displayed with bullet points and rules.
4. **Test Custom Queries**:
   * Type a question into the input field: *"What if the pool gate is locked?"* or *"How do payouts work?"*.
   * Verify the assistant provides relevant, structured instructions.
5. **Verify Admin Exclusion**:
   * Navigate to `/admin`.
   * Confirm the assistant button is **not** present on any admin page.
