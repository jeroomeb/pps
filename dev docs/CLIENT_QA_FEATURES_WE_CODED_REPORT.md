# Amenity Op's — Review of Features We Built & Coded: QA Alignment Report

> **Document Type:** Client Alignment & Scope Review for Features We Built & Coded (The 50%)  
> **Total Actionable Items:** 31 Concrete Development Tasks  
> **Reference Document:** `dev docs/CLIENT_QA_FEATURES_WE_CODED_REPORT.md`  
> **Purpose:** This document details the 31 items from the QA Bug Report that specifically relate to the custom features and modules we developed (Tasks 1–8, Impersonation, Chatbot, Analytics). For each item, it outlines the priority, severity, visual evidence, and QA observation for alignment.

## Table of Modules
1. [Module 1: Task 4 — Forced Password Reset & Team Setup (7 Items)](#module-1-task-4--forced-password-reset--team-setup)
2. [Module 2: Task 6 — GPS Geofencing & Telemetry Validation (2 Items)](#module-2-task-6--gps-geofencing--telemetry-validation)
3. [Module 3: Task 3 — Property Staff Rosters & Gate Enforcement (4 Items)](#module-3-task-3--property-staff-rosters--gate-enforcement)
4. [Module 4: Task 7 — Field Specialist AI Chatbot (3 Items)](#module-4-task-7--field-specialist-ai-chatbot)
5. [Module 5: Task 8 — Analytics Hub & Performance Scorecards (5 Items)](#module-5-task-8--analytics-hub--performance-scorecards)
6. [Module 6: Phase 2 — Specialist Impersonation & Admin Security (5 Items)](#module-6-phase-2--specialist-impersonation--admin-security)
7. [Module 7: Task 1 & 3 — Multi-Tenancy Tags & Action Alignment (5 Items)](#module-7-task-1--3--multi-tenancy-tags--action-alignment)

---

## Module 1: Task 4 — Forced Password Reset & Team Setup
> Refining the First-Time Password Setup screen (`/force-password-change`), temporary password validation, eye visibility toggles, and form state retention.

### `ONB-04`: Missing Standard Password Validation in the Temporary Password Field When Adding a New Team Member
- **Priority:** `High` | **Severity:** `Medium` | **Feature Area:** `Team Management & Add Team Member Modal`
- **Evidence Media:** [Visual Evidence](https://take.ms/MGz75)

#### Reproduction & QA Observation
- **Actual Result:** The Temporary Password field does not enforce or clearly display standard password validation requirements.
- **Expected Result:** The Temporary Password field should enforce standard password validation requirements, including: - Minimum 8 characters. - At least one uppercase letter. - At least one lowercase letter. - At least one number. - At least one special character. - The system should clearly display the password requirements and prevent submission until the password meets all requirements.

---

### `ONB-06`: Missing Password Visibility Toggle Icon on the First-Time Password Setup Page
- **Priority:** `Medium` | **Severity:** `Low` | **Feature Area:** `First-Time Password Setup Screen (/force-password-change)`
- **Evidence Media:** [Visual Evidence](https://take.ms/zf6J5a)

#### Reproduction & QA Observation
- **Actual Result:** The new team member's first-time password setup page does not provide a password visibility toggle icon.
- **Expected Result:** Add an eye toggle icon to the password fields on the first-time password setup page, allowing users to show or hide their entered passwords for better usability.

---

### `ONB-07`: Password Fields Reset After Invalid Input on the First-Time Password Setup Page
- **Priority:** `High` | **Severity:** `Medium` | **Feature Area:** `First-Time Password Setup Screen (/force-password-change)`
- **Evidence Media:** [Visual Evidence](https://take.ms/HoDS4)

#### Reproduction & QA Observation
- **Actual Result:** Appropriate validation error messages are displayed for invalid passwords, but the password fields are reset to their empty state.
- **Expected Result:** The password fields should retain their entered values where appropriate, and only the field containing invalid data should be highlighted with a clear validation message. Valid field values should not be cleared unnecessarily. For security, the temporary password field may be cleared if authentication fails.

---

### `ONB-08`: Missing Standard Password Validation on the First-Time Password Setup Page
- **Priority:** `High` | **Severity:** `Medium` | **Feature Area:** `First-Time Password Setup Screen (/force-password-change)`
- **Evidence Media:** [Visual Evidence](https://take.ms/DxFBS)

#### Reproduction & QA Observation
- **Actual Result:** The new password field only enforces a minimum length of 8 characters, without implementing other standard password validation requirements.
- **Expected Result:** Implement standard password validation requiring: - Minimum 8 characters. - At least one uppercase letter. - At least one lowercase letter. - At least one number. - At least one special character. Display the password requirements clearly and prevent submission until all requirements are met.

---

### `ONB-09`: Unclear Password Mismatch Validation Message on the First-Time Password Setup Page
- **Priority:** `Medium` | **Severity:** `Low` | **Feature Area:** `First-Time Password Setup Screen (/force-password-change)`
- **Evidence Media:** [Visual Evidence](https://take.ms/zlQ4T)

#### Reproduction & QA Observation
- **Actual Result:** The system displays the generic message “Passwords do not match,” which does not clearly indicate which field needs correction.
- **Expected Result:** Display a clear validation message below the Confirm Password field, such as “Confirm Password must match the New Password.” Highlight the Confirm Password field when the values do not match and clear the validation error once both passwords match.

---

### `ONB-10`: Missing Success Notification After First-Time Password Setup and Password reset flow as well (Both for the New Team Member flow and the Password Reset flow)
- **Priority:** `Medium` | **Severity:** `Low` | **Feature Area:** `First-Time Password Setup Screen (/force-password-change)`

#### Reproduction & QA Observation
- **Actual Result:** After successfully setting a new password, the system redirects the user to the Login page without displaying a success toast or confirmation message.
- **Expected Result:** Display a clear success toast or notification, such as “Password updated successfully. Please log in with your new password.” after the password is changed successfully and before or during the redirection to the Login page.

---

### `RESP-12`: Misaligned Auto Generate If Blank Option and Oversized Placeholder Text in Add Team Member Form
- **Priority:** `Medium` | **Severity:** `Low` | **Feature Area:** `Team Management & Add Team Member Modal`
- **Evidence Media:** [Visual Evidence](https://take.ms/Xt0y2)

#### Reproduction & QA Observation
- **Actual Result:** The Auto Generate If Blank option appears inline with the Temporary Password heading, making the layout messy. The placeholder text is too large and is not fully visible.
- **Expected Result:** Place Auto Generate If Blank below the Temporary Password heading. Reduce the input placeholder font size or adjust its styling so the full text is clearly visible. Maintain consistent spacing and alignment.

---

## Module 2: Task 6 — GPS Geofencing & Telemetry Validation
> Enforcing conditional validation on property settings and hard blocking checklist access if physical GPS perimeter verification fails.

### `PROP-04`: Missing Conditional Validation for GPS Coordinates and Required Inspection Days in the New and Edit Property Flows
- **Priority:** `High` | **Severity:** `High` | **Feature Area:** `Property Settings & Configuration Form`
- **Evidence Media:** [Visual Evidence](https://take.ms/KcPGm)

#### Reproduction & QA Observation
- **Actual Result:** The system allows the user to create or save a property even when GPS coordinates are missing while GPS geofence verification is enabled, or when no inspection days are selected while required inspection days are enabled.
- **Expected Result:** - When Enable On-Site GPS Geofence Verification is enabled, require both Latitude and Longitude fields and validate that they contain valid coordinate values. - When Enable Required Inspection Days is enabled, require the user to select at least one day of the week. - Display clear inline validation messages for missing or invalid values. - Prevent property creation or updates until all required conditional fields are valid. - Apply the same validation rules consistently to both the New Property Add and Edit flows, on both the frontend and backend.

---

### `INSP-10`: GPS Geofence Verification Is Not Working Correctly and Does Not Block Inspection Checklist Access
- **Priority:** `High` | **Severity:** `High` | **Feature Area:** `Active Inspection Checklist & Verification Gate`
- **Evidence Media:** [Visual Evidence](https://take.ms/7hVsY)

#### Reproduction & QA Observation
- **Actual Result:** - When the specialist opens the inspection list, the system displays the following error message: - Location Access Disabled - “Enable browser location permissions to verify your physical presence inside the property perimeter.” - Despite GPS geofence verification being enabled and the location verification criteria not being met, the specialist can still access the inspection checklist and begin working. - The system does not consistently enforce the configured on-site location verification requirement.
- **Expected Result:** - When On-Site GPS Geofence Verification is enabled, the system should correctly request and use the specialist's browser location permissions to verify their physical presence within the configured property geofence. - If browser location access is disabled, the system should clearly guide the specialist through enabling location permissions and prevent inspection work until the required verification is completed. - If the specialist is outside the configured geofence perimeter, the system must prevent access to checklist work until the location requirement is satisfied. - Location verification must be enforced by both the frontend and backend so that specialists cannot bypass it by accessing the checklist through another route or request. - Once verification succeeds, the system should allow the specialist to proceed with the inspection and accurately record the required arrival timestamp, location-related entry/exit telemetry, and on-site duration according to the feature requirements. - When the geofence setting is disabled for a property, the system should not require this GPS verification.  Implementation Status: The reported behavior indicates that the feature is either not fully implemented or is not being enforced correctly. Confirm the implementation status and ensure the complete GPS geofence verification workflow works as configured.

---

## Module 3: Task 3 — Property Staff Rosters & Gate Enforcement
> Synchronizing property staff roster assignments, enforcing photo ID document verification, and polishing assignment summary cards.

### `INSP-07`: Incorrect Specialist Assignment Flow and Property Staff Roster Synchronization
- **Priority:** `High` | **Severity:** `High` | **Feature Area:** `Property Staff Roster & Inspection Assignment`
- **Evidence Media:** [Visual Evidence](https://take.ms/SePA9F)

#### Reproduction & QA Observation
- **Actual Result:** - The Assign Specialist dropdown displays all specialists, team members, and admins across the current tenant instead of only specialists assigned to the specific property's roster. - Specialists can be assigned to inspections even when they are not listed in the property's staff roster. - After assigning a specialist to an inspection, the specialist does not appear in the Property Staff Roster section. - The specialist's assignment is visible in the property's Inspections section, resulting in inconsistent information between the roster and inspection records.
- **Expected Result:** - The Assign Specialist dropdown should display only specialists assigned to the selected property's staff roster. - Specialists, team members, and admins who are not eligible for specialist assignment should not appear in the dropdown. - If an Admin assigns a specialist who is not already listed in the property's roster, the system should automatically add that specialist to the Property Staff Roster and reflect the change consistently across the system. - The Property Staff Roster and Inspections sections should remain synchronized and accurately display the assigned specialist. - Implement a clear and consistent workflow for managing property rosters and assigning specialists to inspections, ensuring that property-specific assignments are respected.

---

### `INSP-08`: Photo ID Document Verification Is Not Enforced Before Inspection Checklist Access
- **Priority:** `High` | **Severity:** `High` | **Feature Area:** `Active Inspection Checklist & Verification Gate`
- **Evidence Media:** [Visual Evidence](https://take.ms/qJY91)

#### Reproduction & QA Observation
- **Actual Result:** Even when Require Photo ID Document Verification is enabled, the assigned specialist can access the inspection checklist and begin working without completing photo ID verification.
- **Expected Result:** When Require Photo ID Document Verification is enabled, the assigned specialist must first be prompted to submit their ID document for verification before accessing or performing any work on the inspection checklist. The system must enforce this requirement on the backend as well as the frontend to prevent bypassing the verification step.  When the setting is turned OFF, specialists should be allowed to access and work on the inspection checklist without being required to complete photo ID verification.

---

### `INSP-11`: Misaligned Borders and Excessive Empty Space in My Assignments Summary Cards on Mobile and Tablet Viewports
- **Priority:** `Medium` | **Severity:** `Medium` | **Feature Area:** `My Assignments Dashboard (Specialist Portal)`
- **Evidence Media:** [Visual Evidence](https://take.ms/IXmjz)

#### Reproduction & QA Observation
- **Actual Result:** The summary cards and their borders are not properly aligned on mobile and tablet viewports. Excessive or unnecessary empty spaces appear along the edges, making the layout look inconsistent.
- **Expected Result:** - Ensure all four summary cards (Total Assigned, Pending, In Progress, and Completed) have properly aligned borders and consistent dimensions. - Remove unnecessary empty spaces along the edges of the layout. - Apply consistent margins, padding, gaps, and border alignment across all summary cards. - Make the layout responsive so the cards fit appropriately within the available screen width on mobile and tablet devices. - Prevent horizontal overflow, clipping, or uneven spacing. - Preserve the existing desktop layout while ensuring a consistent and professional appearance across all supported viewport sizes.

---

### `INSP-12`: Missing Border Styling in the Completed Section on the My Assignments Page
- **Priority:** `Medium` | **Severity:** `Low` | **Feature Area:** `My Assignments Dashboard (Specialist Portal)`
- **Evidence Media:** [Visual Evidence](https://take.ms/5NpnW)

#### Reproduction & QA Observation
- **Actual Result:** The Completed section does not display the expected borders, unlike the other sections, resulting in an inconsistent visual design.
- **Expected Result:** Apply the same border styling used in the other assignment sections to the Completed section. Ensure consistent borders, spacing, padding, and overall layout across all sections for a uniform user experience on desktop, tablet, and mobile viewports.

---

## Module 4: Task 7 — Field Specialist AI Chatbot
> Upgrading the AI assistant modal UX, Markdown/table/JSON rendering, conversation persistence, and system prompt boundary enforcement.

### `CHAT-01`: Chatbot Does Not Close on Outside Interaction and Conversation History Is Lost on Page Refresh
- **Priority:** `Medium` | **Severity:** `Medium` | **Feature Area:** `Field Specialist AI Assistant Chatbot`
- **Evidence Media:** [Visual Evidence](https://take.ms/krI74)

#### Reproduction & QA Observation
- **Actual Result:** - he chatbot does not close consistently when the user clicks outside its window or interacts with other components on the screen. - Refreshing the page automatically clears the chatbot conversation history. - The conversation is lost even though a dedicated Reset button is available for intentionally clearing the conversation.
- **Expected Result:** - Close on Outside Interaction: The chatbot window should close when the user clicks anywhere outside the chatbot or interacts with another component on the screen. Interaction within the chatbot itself should not unintentionally close it. - Conversation History Persistence: The chatbot should retain the conversation history when the user refreshes the page, closes and reopens the chatbot, or navigates through the application, according to the intended conversation scope. - Reset Button Functionality: The conversation should be cleared only when the user explicitly clicks the Reset button and confirms the action if a confirmation prompt is part of the intended UX. - Consistent User Experience: Ensure that opening or closing the chatbot does not erase the conversation and that the conversation history remains available until the user explicitly resets it or it is cleared according to the application's defined session policy.

---

### `CHAT-02`: Chatbot Fails to Properly Render Tables, HTML, Regex, and JSON Responses
- **Priority:** `Medium` | **Severity:** `Medium` | **Feature Area:** `Field Specialist AI Assistant Chatbot`
- **Evidence Media:** [Visual Evidence](https://take.ms/DwCcU)

#### Reproduction & QA Observation
- **Actual Result:** The chatbot does not consistently render structured responses correctly. Tables may appear broken or improperly formatted, raw HTML tags may be displayed directly in the response, and Regex and JSON content may not be formatted or displayed properly.
- **Expected Result:** - Table Rendering: Properly render Markdown and supported table formats with aligned rows and columns, readable headers, and consistent spacing. - HTML Rendering: Correctly display supported HTML-based formatting instead of exposing raw HTML tags when they are intended to provide visual structure. Sanitize HTML appropriately to prevent security vulnerabilities. - Regex Rendering: Display regular expressions in a readable format, preserving special characters, backslashes, and escaping. - JSON Rendering: Display JSON in properly formatted code blocks with correct indentation, line breaks, and syntax highlighting where supported. Preserve the original JSON structure without altering its values. - Code and Markdown Support: Ensure the chatbot correctly parses and renders supported Markdown, code blocks, and structured content while preserving the original meaning and content of the response. - Responsive Layout: Ensure tables and formatted content remain readable on different screen sizes without breaking the chatbot layout or causing unnecessary horizontal overflow.

---

### `CHAT-03`: Chatbot Violates Defined Scope by Answering Unrelated Questions
- **Priority:** `High` | **Severity:** `Medium` | **Feature Area:** `Field Specialist AI Assistant System Logic`
- **Evidence Media:** [Visual Evidence](https://take.ms/1dyLg)

#### Reproduction & QA Observation
- **Actual Result:** The chatbot fails the scope boundary test by providing a detailed explanation of binary-to-decimal conversion, even though this topic is unrelated to property inspection procedures.
- **Expected Result:** - The chatbot must strictly follow its system prompt and respond only to questions within its defined scope of property inspections and related procedures. - When a user asks both an in-scope and an out-of-scope question in the same message, the chatbot should answer the property inspection question and politely decline the unrelated question. - For the binary conversion question, the chatbot should briefly explain that it can assist with property inspection-related queries and redirect the user to the relevant topic. - The chatbot must not provide tutorials, explanations, or other detailed content unrelated to its defined scope. - Ensure this restriction is consistently enforced across mixed-topic questions and other out-of-scope requests.

---

## Module 5: Task 8 — Analytics Hub & Performance Scorecards
> Fixing mobile swipeable day filters, heading alignments, flex-shrink icon constraints, and viewport label consistency.

### `RESP-04`: Analytics Page Day Filters Are Overlapping Instead of Displaying in a Swipeable Slider
- **Priority:** `Medium` | **Severity:** `Low` | **Feature Area:** `Operations Analytics & Performance Scorecards`
- **Evidence Media:** [Visual Evidence](https://take.ms/mWk9O)

#### Reproduction & QA Observation
- **Actual Result:** The day filter options appear on top of each other, creating a cluttered and visually inconsistent layout that makes the filters difficult to access.
- **Expected Result:** - Display the day filter options in a horizontally scrollable, swipeable slider. - Allow users to swipe horizontally on mobile and tablet devices to access all available filters. - Keep the filters properly aligned, with consistent spacing and sizing. - Ensure the selected filter remains clearly highlighted. - Prevent overlapping, clipping, and unnecessary vertical stacking. - Maintain a clean, responsive layout across mobile, tablet, and desktop viewports.

---

### `RESP-05`: Misaligned Headings in Audit Volume by Checklist Template / Asset Category and Inconsistent Icon Sizing on the Analytics Page
- **Priority:** `Medium` | **Severity:** `Medium` | **Feature Area:** `Operations Analytics & Performance Scorecards`
- **Evidence Media:** [Visual Evidence](https://take.ms/OkZou)

#### Reproduction & QA Observation
- **Actual Result:** - The headings in the Audit Volume by Checklist Template / Asset Category section appear inline with the Active Checklist text, resulting in a cluttered and inconsistent layout. - Icons across the Analytics page do not maintain consistent sizing. When text content is large or lengthy, the icons shrink and appear uneven.
- **Expected Result:** - Arrange the headings in the Audit Volume by Checklist Template / Asset Category section vertically, placing them on separate lines rather than inline with the Active Checklist text. - Ensure appropriate spacing, alignment, and readability between headings and their associated content. - Standardize icon dimensions throughout the entire Analytics page. - Prevent icons from shrinking when adjacent text is long by applying fixed width and height constraints and appropriate flex-shrink settings. - Ensure text and icons remain properly aligned without overlapping or breaking the layout. - Verify consistent styling and responsive behavior across desktop, tablet, and mobile viewports.

---

### `RESP-06`: Cramped Specialist Performance Scorecards Layout and Inconsistent Icon Sizes
- **Priority:** `Medium` | **Severity:** `Low` | **Feature Area:** `Operations Analytics & Performance Scorecards`
- **Evidence Media:** [Visual Evidence](https://take.ms/q9TJb)

#### Reproduction & QA Observation
- **Actual Result:** The section looks cramped, and icons across the page have inconsistent sizes.
- **Expected Result:** Make the heading and description full-width, place Manage Team below the description, and maintain consistent icon sizes throughout the Analytics page.

---

### `RESP-07`: Cramped Property Inspection Frequency & Issue Rates Layout and Inconsistent Icon Sizes
- **Priority:** `Medium` | **Severity:** `Low` | **Feature Area:** `Operations Analytics & Performance Scorecards`
- **Evidence Media:** [Visual Evidence](https://take.ms/9PYz0)

#### Reproduction & QA Observation
- **Actual Result:** The heading and description do not use the full section width, the All Properties link is not positioned appropriately, and icon sizes are inconsistent.
- **Expected Result:** Make the heading and description full-width, position All Properties below the description, and ensure consistent icon sizes throughout the Analytics page.

---

### `RESP-15`: Inconsistent Performance Tab Naming Across Viewports
- **Priority:** `Low` | **Severity:** `Low` | **Feature Area:** `Portal Navigation Bar (Desktop & Mobile)`
- **Evidence Media:** [Visual Evidence](https://take.ms/rkSy9g)

#### Reproduction & QA Observation
- **Actual Result:** The tab is named Performance on desktop but Scorecard on mobile and tablet.
- **Expected Result:** Use Performance consistently across desktop, tablet, and mobile viewports for both Members and Specialists.

---

## Module 6: Phase 2 — Specialist Impersonation & Admin Security
> Securing admin-to-specialist role changes, isolating impersonation viewports, fixing browser tab close behavior, and impersonation exit headers.

### `TEAM-01`: Misaligned “Open Specialist Panel” Button in the Team Page — Active Members Section
- **Priority:** `Medium` | **Severity:** `Low` | **Feature Area:** `Team Management & Add Team Member Modal`
- **Evidence Media:** [Visual Evidence](https://take.ms/hRBtn)

#### Reproduction & QA Observation
- **Actual Result:** The “Open Specialist Panel” button disrupts the layout of the Active Members section, affecting the alignment and presentation of team member names and their information.
- **Expected Result:** Reposition the “Open Specialist Panel” button in an appropriate location within the Active Members section to maintain a clean, consistent layout without disrupting team member names or their information.

---

### `TEAM-02`: Exit to Admin” and “Close Tab” Buttons Perform the Same Action in the Specialist Team Member Panel
- **Priority:** `High` | **Severity:** `Medium` | **Feature Area:** `Specialist Impersonation Header & Navigation`
- **Evidence Media:** [Visual Evidence](https://take.ms/HAXAK)

#### Reproduction & QA Observation
- **Actual Result:** Both buttons perform the same action, redirecting the admin to the Admin page and opening another tab. This results in duplicate browser tabs displaying the Teams page.
- **Expected Result:** - Exit to Admin: Return the admin to the existing Admin interface or Teams page without opening an additional browser tab. Preserve the original admin tab and its navigation context. - Close Tab: Close the current Specialist Team Member Panel tab and return the user to the previously opened Admin tab, provided the browser allows the tab to be closed programmatically. - Ensure both buttons perform distinct actions and do not create duplicate tabs or unnecessary redirects.

---

### `TEAM-03`: Admin Impersonation Mode Displays Unauthorized Quick Actions and Allows Navigation Back to the Admin Portal
- **Priority:** `High` | **Severity:** `High` | **Feature Area:** `Specialist Impersonation Header & Navigation`
- **Evidence Media:** [Visual Evidence](https://take.ms/81ZbF) [Visual Evidence](https://take.ms/4YwcGt)

#### Reproduction & QA Observation
- **Actual Result:** The Quick Action section displays extra options, including Start Inspection and Dashboard. When the admin interacts with these options or the original admin sidebar navigation, the system navigates back to the corresponding Admin page and exits the specialist viewing context unexpectedly.
- **Expected Result:** - Maintain Admin Impersonation Mode: Viewing full specialist portal as Team Member until the admin explicitly exits the viewing session. - Hide or disable Quick Action buttons and navigation options that are not intended to be available during the specialist viewing flow. - Ensure specialist portal navigation remains within the specialist's viewing context and does not redirect the admin to the original Admin portal. - Prevent the original Admin sidebar options from appearing or becoming accessible while viewing the specialist portal, unless explicitly required by the intended workflow. - Allow the admin to return to the Admin portal only through the designated exit action. - Preserve the impersonation context consistently across navigation within the specialist portal.

---

### `TEAM-04`: Admin Can Demote Another Admin to Specialist Without Super Admin Authorization
- **Priority:** `High` | **Severity:** `Critical` | **Feature Area:** `Team Member Role Management & Permissions`
- **Evidence Media:** [Visual Evidence](https://take.ms/w6KGO)

#### Reproduction & QA Observation
- **Actual Result:** A newly created Admin can demote the original Admin to Specialist, allowing an administrator to change another administrator's role without appropriate authorization.
- **Expected Result:** - Restrict the ability to demote an Admin or change another Admin's privileged role to an authorized Super Admin. - Standard Admins must not be able to demote, remove, or modify the privileged role of another Admin. - Only a Super Admin should be permitted to change another Admin's role, including demoting them to Specialist. - Enforce role-based access control on both the frontend and backend to prevent unauthorized role changes, including requests made directly through the API. - Display a clear authorization error if a standard Admin attempts a restricted role change. - Ensure these restrictions apply consistently to all relevant team member management flows.

---

### `TEAM-05`: Incorrect Open Tenant Admin Panel Access and Missing Exit View Navigation
- **Priority:** `High` | **Severity:** `High` | **Feature Area:** `Team Management & Add Team Member Modal`
- **Evidence Media:** [Visual Evidence](https://take.ms/bDojE)

#### Reproduction & QA Observation
- **Actual Result:** The Admin remains on their own panel instead of properly switching to the selected Admin's panel. No top bar or exit-view option appears, unlike the Specialist Panel view.
- **Expected Result:** Ensure the Open Tenant Admin Panel flow follows the intended access permissions. Admins should not access another Admin's panel unless explicitly authorized. If this functionality is intended, switch to the selected Admin's panel correctly and display a clear top bar with an option to exit the view and return to the original Admin panel, consistent with the Specialist Panel flow.

---

## Module 7: Task 1 & 3 — Multi-Tenancy Tags & Action Alignment
> Polishing UI badge alignment, multi-tenancy license unit stacking, and action button rows across viewports.

### `RESP-03`: Property License and SKU Unit Fields Are Displayed Inline Instead of on Separate Lines
- **Priority:** `Medium` | **Severity:** `Low` | **Feature Area:** `Property Settings & Configuration Form`
- **Evidence Media:** [Visual Evidence](https://take.ms/mwkw8)

#### Reproduction & QA Observation
- **Actual Result:** The Property License and SKU Unit fields are displayed inline, appearing next to each other instead of on separate lines.
- **Expected Result:** Display Property License and SKU Unit vertically, with each field on its own line. Ensure proper alignment, spacing, and readability while maintaining a consistent layout across supported screen sizes.

---

### `RESP-09`: Misaligned Tenant and Staff Tags on Mobile Property Lists
- **Priority:** `Medium` | **Severity:** `Low` | **Feature Area:** `Properties Directory & Tag Display`
- **Evidence Media:** [Visual Evidence](https://take.ms/aKvM5)

#### Reproduction & QA Observation
- **Actual Result:** The Tenant and Staff tags are not positioned appropriately on mobile, affecting the layout and readability.
- **Expected Result:** Place the Tenant and Staff tags below the property name in each property list item on mobile viewports. Ensure proper spacing, alignment, and responsiveness without affecting the desktop layout.

---

### `RESP-10`: Inconsistent Placement of Tenant and Current Inspections Tags in Team Members List
- **Priority:** `Medium` | **Severity:** `Low` | **Feature Area:** `Team Management & Add Team Member Modal`
- **Evidence Media:** [Visual Evidence](https://take.ms/Q8T1G)

#### Reproduction & QA Observation
- **Actual Result:** The tags appear inline with the team member name in some entries and below the name in others, resulting in an inconsistent layout.
- **Expected Result:** Consistently place the Tenant and Current Inspections tags below each team member's name in the Team Members list, regardless of name length. Maintain proper spacing and alignment across all screen sizes.

---

### `RESP-11`: Inconsistent Alignment of Team Member Action Buttons
- **Priority:** `Medium` | **Severity:** `Low` | **Feature Area:** `Team Management & Add Team Member Modal`
- **Evidence Media:** [Visual Evidence](https://take.ms/7KyyS)

#### Reproduction & QA Observation
- **Actual Result:** Action buttons are inconsistently positioned, with some appearing inline with the panel button and others below it.
- **Expected Result:** Place the Make (Specialist/Admin), Activate/Deactivate, and Delete actions in a single row below the Open Tenant Admin/Open Specialist Panel button. Ensure consistent alignment, spacing, and responsive behavior across all team members and screen sizes.

---

### `RESP-16`: Inconsistent Alignment of Tenant Name and Open Inspection Tags on Tablet View
- **Priority:** `Medium` | **Severity:** `Low` | **Feature Area:** `Team Management & Add Team Member Modal`
- **Evidence Media:** [Visual Evidence](https://take.ms/rybQL) [Visual Evidence](https://take.ms/R6ack)

#### Reproduction & QA Observation
- **Actual Result:** The tags appear inline with the team member's name in some entries but move below the name in others, creating an inconsistent layout.
- **Expected Result:** Consistently display the Tenant Name and Open Inspection tags inline with the team member's name on tablet viewports. Ensure proper spacing and alignment without overlapping or clipping content.

---
