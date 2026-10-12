# Amenity Op's — Field Specialist AI Knowledge Base & Context Repository

> **Document Purpose:** This document serves as the ground-truth knowledge base and reference context for integrating the OpenAI API (or any LLM) into the Amenity Op's Specialist Field Assistant. It contains comprehensive questions, answers, system rules, standard operating procedures (SOPs), and edge-case handling for Operational Continuity Specialists (OCS).

---

## 1. System Identity & Specialist Role Overview

### Q1: What is Amenity Op's?
**Answer:** Amenity Op's is an enterprise-grade property inspection, quality assurance, and operational audit platform. It allows property management companies, HOAs, and asset managers to schedule, execute, and review forensic-level facility and amenity inspections across luxury condominiums, 55+ active adult communities, and commercial multi-tenant real estate.

### Q2: What is an OCS (Operational Continuity Specialist)?
**Answer:** An Operational Continuity Specialist (OCS) is a field inspector responsible for visiting assigned properties, verifying physical assets, evaluating operational readiness, identifying safety hazards/defects, and capturing photographic evidence. In the application database and authentication system, this user role is designated as `'inspector'`.

### Q3: What devices and browsers should specialists use?
**Answer:** Specialists typically conduct audits using smartphones (iOS Safari, Android Chrome) or tablets. The web portal is fully responsive and installable as a Progressive Web App (PWA) on mobile home screens.

---

## 2. Pre-Audit & Scheduling Workflows

### Q4: How do I see which properties and audits are assigned to me?
**Answer:** Log in to your portal (`https://portal.amenityops.app/inspector`). Your dashboard displays all active audits under **Open Inspections**, sorted by urgency (Overdue, Due Today, Due in X Days, and Unscheduled). You can also view historical submitted audits under the **Completed** tab.

### Q5: Can I start an inspection before its scheduled start time?
**Answer:** No. If an administrator has set a designated future date and time for an inspection (e.g., *Today at 2:00 PM*), the audit is time-gated. If you open it early, the app displays a countdown screen showing the property address, contact phone number, and the exact time the checklist unlocks. Unscheduled audits can be started immediately.

### Q6: What should I do before arriving at the property?
**Answer:**
1. Check your assigned audit queue in `/inspector`.
2. Review the property address, gate access codes, and administrative notes attached to the inspection.
3. Ensure your mobile device has sufficient battery and camera/location permissions enabled in your browser settings.

---

## 3. Active Checklist Rules & Standard Operating Procedures (SOPs)

### Q7: What are the three status options for each checklist item?
**Answer:** Every item in a checklist must be marked with one of three statuses:
* **Pass (Green)**: The asset or amenity is clean, fully operational, safe, and meets all standard operating criteria.
* **Fail (Red)**: The item has defects, cleanliness issues, safety hazards, or operational failures requiring attention.
* **N/A (Neutral Gray)**: The amenity or feature does not exist at this specific property.

### Q8: What are the photo evidence rules for an inspection?
**Answer:**
* **Mandatory Photos**: A clear photo is strictly required on **every item marked Pass or Fail**.
* **N/A Exemption**: Only items marked **N/A** (Not Applicable) are exempt from photos.
* **Why this is required**: Client reports are forensic documentation. Every passed or failed standard must have visual proof for property managers, boards, and insurance purposes.

### Q9: What happens when I mark an item as "Fail"?
**Answer:** Marking an item as Fail triggers two mandatory requirements:
1. **Mandatory Explanatory Comment**: You must type a specific description of what is wrong (e.g., *"Main pool entry gate latch broken; gate does not self-close or latch automatically — immediate child safety hazard"*).
2. **Mandatory Photographic Evidence**: You must take a clear photo showing the exact defect or hazard.
3. **Submission Blocking**: The system will refuse to submit the inspection if any Failed item lacks either a comment or a photo.

### Q10: When should I use the "N/A" (Not Applicable) option?
**Answer:** Use N/A **only** when the property does not physically have that specific amenity or asset (e.g., if the checklist includes *"Sauna Temperature Check"* but the community has no sauna facility). Do **NOT** use N/A if an asset exists but is locked or inaccessible (see Q13).

### Q11: How do I replace or retake a photo on an item?
**Answer:** If you captured a blurry photo or need to update evidence, tap the **"Replace Photo"** button directly on that checklist item card and select a new photo. The new image will immediately upload and replace the previous photo.

---

## 4. On-Site Obstructions & Inaccessible Areas Protocol

### Q12: What should I do if a gate, door, or amenity area is locked?
**Answer:**
1. **Check Property Notes**: Review the property details at the top of your active checklist for gate codes, lockbox combinations, or manager notes.
2. **Call Property Contact**: Tap the clickable property phone number in your checklist header to contact the on-site manager or concierge.
3. **If Still Inaccessible**:
   * Do **NOT** mark the item as N/A.
   * Mark the item as **Fail**.
   * Add a clear comment: *"Area Inaccessible: Gate/door locked; access code [XYZ] failed. Management contacted at [Time]. Unable to inspect interior."*
   * Capture a photo of the locked door, padlock, or access gate as visual evidence.

### Q13: What should I do if a resident or security guard refuses entry?
**Answer:**
1. State your name and explain that you are an Operational Continuity Specialist conducting an authorized property compliance audit for Amenity Op's.
2. If access is still refused, call the property management phone number listed at the top of your screen.
3. If entry cannot be obtained, mark the affected items as **Fail** with a note explaining the security refusal, photograph the entrance/security booth, and notify your dispatcher/admin.

---

## 5. GPS Tracking, Virtual Geofencing & Telemetry

### Q14: How does GPS geofencing work during my inspection?
**Answer:** When you open an active checklist for a geofenced property, the app requests your device's location and continuously verifies your distance to the property's center coordinates. A live telemetry banner appears at the top:
* 🟢 **On-Site & Verified**: Your device is physically inside the property's designated boundary radius. Your arrival time is logged.
* 🟡 **Outside Perimeter**: You are currently outside the designated boundary (your distance in meters is displayed).
* ⚪ **GPS Exempt**: The property does not have GPS geofencing enabled.

### Q15: How is dwell time (time on-site) calculated?
**Answer:** Dwell time measures the total duration you spent on the property grounds. It is calculated automatically from the moment your device is logged as **Arrived (On-Site)** until you tap **Submit Inspection** (logged as **Departed**). This telemetry is included in the executive report.

### Q16: What if my GPS shows "Outside Perimeter" even though I am at the property?
**Answer:**
1. Ensure your phone's **Location Services / GPS** is turned on.
2. In your mobile browser settings, ensure location permissions are set to **"Allow"** for `portal.amenityops.app`.
3. If you are inside a large building, thick concrete or metal roofs may degrade GPS signals. Step near a window or exterior area briefly to establish satellite lock.

---

## 6. Data Autosave, Local Drafts & Crash Protection

### Q17: Does my progress save automatically while inspecting?
**Answer:** Yes. Every time you tap Pass, Fail, or N/A, and every time you finish typing a comment, the app automatically saves your response to the server immediately.

### Q18: What happens if my phone battery dies or my browser crashes?
**Answer:**
* **Instant Dual-Sync**: All responses are saved to the server and mirrored in real-time in your phone's secure local storage.
* **Restore Banner**: If your phone powers off or the page reloads, reopening the inspection will display a **"Restore Draft"** banner. Tapping Restore instantly brings back all unsaved changes and in-progress comments.
* **Photo Safety**: Photos upload immediately to secure cloud storage upon capture, so photos are never lost during a crash.

---

## 7. Submission Pipeline & Final Reports

### Q19: What happens when I tap "Submit Inspection"?
**Answer:**
1. **Validation Sweep**: The system checks that every item has a status, required photos are present, and all Fails have comments.
2. **PDF Generation**: A branded *Operations, Asset and Logistics Report* is generated on the server with high-resolution photos and GPS telemetry.
3. **Automated Dispatch**: The PDF is automatically emailed to the property manager's email address and CC'd to dispatch.
4. **Audit Sealing**: The inspection status changes to **Completed** and is permanently sealed as a forensic legal record.
5. **Payout Generation**: If your organization has payouts enabled, an earnings record is automatically logged into your financial ledger.

### Q20: Can I edit an inspection after submitting it?
**Answer:** No. Once submitted, inspections are permanently frozen to preserve report integrity and prevent tampering. You can view your completed submission in read-only mode under the **Completed** tab.

### Q21: Why is the Submit button disabled or showing an error?
**Answer:** If the Submit button cannot be completed, the app will show a red summary banner listing the exact items requiring attention (e.g., missing photos, empty comments on Fail, or unanswered items) with direct jump links to fix each one.

---

## 8. Specialist Compensation, Tiers & Payouts

### Q22: How is my compensation calculated for each inspection?
**Answer:** Audit payouts are calculated using the organization's **3x3 Property Category × Service Tier Compensation Matrix**:
* **Property Categories**:
  1. *Luxury Condominium* (Residential high-rises & HOAs)
  2. *55+ Active Adult Community* (Senior living & recreational complexes)
  3. *Commercial Multi-Tenant* (Office parks & retail centers)
* **Service Tiers**:
  1. *Tier 1 (Baseline)*: Standard baseline audit rate.
  2. *Tier 2 (Premier)*: Mid-size / comprehensive audit rate.
  3. *Tier 3 (Sovereign)*: Premium high-complexity audit rate.
* *Custom Rates*: Specific properties may also have a custom flat override rate set by administrators.

### Q23: How do I track my earnings and payout status?
**Answer:** Open the **Earnings** tab (`/inspector/payouts`) to view your total earnings, paid disbursements, and breakdown of every audit. Payout statuses:
* **Pending**: Audit completed; waiting for manager review.
* **Approved**: Verified and scheduled for disbursement.
* **Paid**: Disbursed to you with a payment reference number (ACH / Direct Deposit / Check).

---

## 9. Performance Scorecard & Specialist Metrics

### Q24: What is the Specialist Scorecard?
**Answer:** Located under the **Performance** tab (`/inspector/metrics`), your scorecard tracks four key professional metrics:
1. **Punctuality Rate**: Percentage of scheduled audits started on time.
2. **Audit Velocity**: Average time spent performing an audit from start to submission.
3. **Issue Discovery Rate**: Percentage of items where defects, cleanliness issues, or safety hazards were caught.
4. **Photo Compliance Rate**: Visual documentation compliance score.

### Q25: What are the Specialist Recognition Tiers?
**Answer:** Based on audit volume, punctuality, and thoroughness, specialists can earn **Senior Specialist** or **Elite Specialist** badges on their profile.

---

## 10. Profile, Credentials & Photo ID Verification

### Q26: What is my Specialist Human ID?
**Answer:** Every specialist is assigned a unique, permanent identification code formatted as `OCS-####` (e.g., `OCS-1042`). This ID appears on your profile and on all inspection reports you complete.

### Q27: How do I upload my Driver's License or Government ID?
**Answer:**
1. Navigate to the **Profile** tab (`/inspector/profile`).
2. Under **Photo of Identification**, upload a clear photo of the **Front** and **Back** of your driver's license or state ID.
3. Tap **Save Profile**. Your documents are stored in encrypted private storage for compliance verification.

### Q28: Why is it important to keep my address and county updated?
**Answer:** Amenity Op's uses proximity-based routing. Administrators assign audits based on geographic proximity (Same ZIP $\rightarrow$ Same County $\rightarrow$ Same State). Keeping your address updated ensures you receive audit assignments near your home territory.

---

## 11. Account Security & Password Management

### Q29: What should I do if I am prompted to change my password on first login?
**Answer:** When your account is first created by an administrator, you must set a permanent private password on the `/force-password-change` screen before accessing the system. Enter your temporary password followed by your new password (minimum 8 characters).

### Q30: What should I do if I forgot my password?
**Answer:** On the login screen (`/login`), tap **"Forgot Password?"**, enter your registered email address, and check your inbox for a secure password reset link.

---

## 12. Quick Reference SOP Cheat Sheet (For Fast AI Lookup)

| Situation | Action / Protocol |
|---|---|
| **Pass on an item** | Select Pass $\rightarrow$ **Photo mandatory**. |
| **Fail on an item** | Select Fail $\rightarrow$ **Comment mandatory** $\rightarrow$ **Photo mandatory**. |
| **Item doesn't exist on property** | Select **N/A** $\rightarrow$ No photo required. |
| **Amenity exists but locked/inaccessible** | Mark **Fail** $\rightarrow$ Comment *"Area inaccessible / Locked"* $\rightarrow$ Photo of locked gate/door. |
| **GPS outside perimeter** | Enable phone GPS/location permissions; move closer to building exterior if signal is weak. |
| **Audit time-gated** | Wait for designated scheduled time; screen unlocks automatically. |
| **Battery died mid-audit** | Plug in phone $\rightarrow$ Reopen audit $\rightarrow$ Tap **"Restore Draft"** banner. |
| **Submit button blocked** | Review red error banner at bottom of checklist; fill in missing photos/comments. |
| **Check earnings** | Go to **Earnings** (`/inspector/payouts`) to view pending & paid audit compensation. |
