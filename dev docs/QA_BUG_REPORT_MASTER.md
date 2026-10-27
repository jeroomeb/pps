# Amenity Op's — QA Bug Report & Master Issue Specification

> **Source File:** `dev docs/Amenity Op's - QA Bug Report.xlsx`  
> **Document Purpose:** Complete, unabridged technical conversion and categorized reference of all QA bug reports, reproduction steps, actual vs. expected results, and evidence media for client alignment and engineering sprints.

## Table of Contents
1. [Executive Summary & Metrics](#executive-summary--metrics)
2. [QA Guide & Rating Taxonomy](#qa-guide--rating-taxonomy)
3. [Tab 1: Onboarding Flow (16 Issues)](#tab-1-onboarding-flow)
4. [Tab 2: Property Flow (6 Issues)](#tab-2-property-flow)
5. [Tab 3: Inspections Flow (12 Issues)](#tab-3-inspections-flow)
6. [Tab 4: Team Flow (5 Issues)](#tab-4-team-flow)
7. [Tab 5: Profile Flow (1 Issue)](#tab-5-profile-flow)
8. [Tab 6: ChatBot (3 Issues)](#tab-6-chatbot)
9. [Tab 7: Reports Flow (1 Issue)](#tab-7-reports-flow)
10. [Tab 8: Responsiveness (Mobile & Tablet) (15 Issues + Server Alert)](#tab-8-responsiveness)

## Executive Summary & Metrics

- **Total Actionable Bug Items Logged:** `60`
- **Total Functional Tabs Audited:** `8 functional flows + 1 Guide sheet`

### Distribution by Flow
| Flow / Sheet | Total Issues | Critical / High Priority |
| :--- | :--- | :--- |
| **Onboarding Flow** | 16 | Detailed below |
| **Property Flow** | 6 | Detailed below |
| **Inspections Flow** | 12 | Detailed below |
| **Team Flow** | 5 | Detailed below |
| **Profle Flow** | 1 | Detailed below |
| **ChatBot** | 3 | Detailed below |
| **Reports Flow** | 1 | Detailed below |
| **Responsiveness** | 16 | Detailed below |

### Technical Domain Distribution
- **Front-end Only:** `38` issues
- **Front/Back-end Combined:** `20` issues
- **Back-end Only:** `2` issues

---

## QA Guide & Rating Taxonomy

### Status Definitions
- **ToDo:** The bug has been logged and still needs action.
- **QA:** The bug is with QA for testing or verification.
- **Done:** The required work and verification are complete.
- **Re-Open:** The issue still exists after being marked Done, or occurred again.
- **Roadblock Discussed:** Blocker discussed with relevant stakeholders.

### Priority vs. Severity Rules
- **Priority** = How urgently the bug must be addressed (`High`, `Medium`, `Low`).
- **Severity** = Impact on system reliability (`Critical`: system failure / data risk, `High`: key workflow broken, `Medium`: feature impaired with workaround, `Low`: minor visual / UX glitch).

---

## Tab 1: Onboarding Flow

### ONB-01: Missing or Improper Placeholders in Email and Password Fields on the Login Page
- **Domain:** `Front-end` | **Priority:** `Low` | **Severity:** `Low` | **Status:** `Todo`
- **Visual Evidence:** [Evidence Link](https://take.ms/4K2NO)

#### Steps to Reproduce
- Navigate to the login page.
- Check the placeholder text in the Email and Password fields.

#### Actual Result
> The Email and Password fields do not have proper placeholder text.

#### Expected Result
The Email field should display Enter your email, and the Password field should display Enter your password.

---

### ONB-02: Missing or Improper Placeholder in the Email Field on the Forgot Password Screen
- **Domain:** `Front-end` | **Priority:** `Low` | **Severity:** `Low` | **Status:** `Todo`
- **Visual Evidence:** [Evidence Link](https://take.ms/HseRy)

#### Steps to Reproduce
- Navigate to the Forgot Password screen.
- Check the placeholder text in the Email field.

#### Actual Result
> The Email field does not have proper placeholder text.

#### Expected Result
The Email field should display Enter your email.

---

### ONB-03: Missing Password Visibility Toggle Icon on the Login Page
- **Domain:** `Front-end` | **Priority:** `Medium` | **Severity:** `Low` | **Status:** `Todo`
- **Visual Evidence:** [Evidence Link](https://take.ms/G6liw)

#### Steps to Reproduce
- Navigate to the Login page.
- Enter a password in the Password field.
- Check whether a password visibility toggle icon is available.

#### Actual Result
> The Password field does not provide a toggle icon to show or hide the entered password.

#### Expected Result
The Password field should include a visibility toggle icon that allows users to show or hide their entered password.

---

### ONB-04: Missing Standard Password Validation in the Temporary Password Field When Adding a New Team Member
- **Domain:** `Front/Backend` | **Priority:** `High` | **Severity:** `Medium` | **Status:** `Todo`
- **Visual Evidence:** [Evidence Link](https://take.ms/MGz75)

#### Steps to Reproduce
- Navigate to the Team Member tab from the sidebar.
- Select the option to add a new team member.
- Enter a password in the Temporary Password field.
- Enter a password that does not meet standard password requirements.

#### Actual Result
> The Temporary Password field does not enforce or clearly display standard password validation requirements.

#### Expected Result
The Temporary Password field should enforce standard password validation requirements, including:
- Minimum 8 characters.
- At least one uppercase letter.
- At least one lowercase letter.
- At least one number.
- At least one special character.
- The system should clearly display the password requirements and prevent submission until the password meets all requirements.

---

### ONB-05: Email and Password Fields Reset After Invalid Login Attempt
- **Domain:** `Front-end` | **Priority:** `Medium` | **Severity:** `Low` | **Status:** `Todo`
- **Visual Evidence:** [Evidence Link](https://take.ms/5S5RM)

#### Steps to Reproduce
- Navigate to the Login page.
- Enter an email address and password.
- Submit the login form using invalid credentials.
- Observe the fields after the error message appears.

#### Actual Result
> An invalid credentials error message is displayed, but both the Email and Password fields are cleared.

#### Expected Result
The Email and Password fields should retain their entered values after an invalid login attempt, while displaying the appropriate error message. The user should be able to correct the credentials without re-entering both fields.

---

### ONB-06: Missing Password Visibility Toggle Icon on the First-Time Password Setup Page
- **Domain:** `Front-end` | **Priority:** `Medium` | **Severity:** `Low` | **Status:** `Todo`
- **Visual Evidence:** [Evidence Link](https://take.ms/zf6J5a)

#### Steps to Reproduce
- Navigate to the login page as a newly added team member.
- Log in using the temporary password.
- On the “Welcome to Amenity Op's — First-time setup: please set your personal password before continuing.” page, check the password fields.
- Verify whether a show/hide password toggle icon is available.

#### Actual Result
> The new team member's first-time password setup page does not provide a password visibility toggle icon.

#### Expected Result
Add an eye toggle icon to the password fields on the first-time password setup page, allowing users to show or hide their entered passwords for better usability.

---

### ONB-07: Password Fields Reset After Invalid Input on the First-Time Password Setup Page
- **Domain:** `Front-end` | **Priority:** `High` | **Severity:** `Medium` | **Status:** `Todo`
- **Visual Evidence:** [Evidence Link](https://take.ms/HoDS4)

#### Steps to Reproduce
- Log in as a newly added team member using the temporary password.
- Navigate to the “Welcome to Amenity Op's — First-time setup: please set your personal password before continuing.” page.
- Enter an invalid temporary password or a new password that does not meet the required validation rules.
- Submit the form and observe the validation messages and password fields.

#### Actual Result
> Appropriate validation error messages are displayed for invalid passwords, but the password fields are reset to their empty state.

#### Expected Result
The password fields should retain their entered values where appropriate, and only the field containing invalid data should be highlighted with a clear validation message. Valid field values should not be cleared unnecessarily. For security, the temporary password field may be cleared if authentication fails.

---

### ONB-08: Missing Standard Password Validation on the First-Time Password Setup Page
- **Domain:** `Front/Backend` | **Priority:** `High` | **Severity:** `Medium` | **Status:** `Todo`
- **Visual Evidence:** [Evidence Link](https://take.ms/DxFBS)

#### Steps to Reproduce
- Log in as a newly added team member using the temporary password.
- Navigate to the “Welcome to Amenity Op's — First-time setup: please set your personal password before continuing.” page.
- Enter a new password that meets the minimum 8-character requirement but does not meet other standard password requirements.
- Observe the password validation behavior.

#### Actual Result
> The new password field only enforces a minimum length of 8 characters, without implementing other standard password validation requirements.

#### Expected Result
Implement standard password validation requiring:
- Minimum 8 characters.
- At least one uppercase letter.
- At least one lowercase letter.
- At least one number.
- At least one special character.
Display the password requirements clearly and prevent submission until all requirements are met.

---

### ONB-09: Unclear Password Mismatch Validation Message on the First-Time Password Setup Page
- **Domain:** `Front-end` | **Priority:** `Medium` | **Severity:** `Low` | **Status:** `Todo`
- **Visual Evidence:** [Evidence Link](https://take.ms/zlQ4T)

#### Steps to Reproduce
- Log in as a newly added team member using the temporary password.
- Navigate to the “Welcome to Amenity Op's — First-time setup: please set your personal password before continuing.” page.
- Enter a password in the New Password field.
- Enter a different password in the Confirm Password field.
- Observe the validation message displayed.

#### Actual Result
> The system displays the generic message “Passwords do not match,” which does not clearly indicate which field needs correction.

#### Expected Result
Display a clear validation message below the Confirm Password field, such as “Confirm Password must match the New Password.” Highlight the Confirm Password field when the values do not match and clear the validation error once both passwords match.

---

### ONB-10: Missing Success Notification After First-Time Password Setup and Password reset flow as well (Both for the New Team Member flow and the Password Reset flow)
- **Domain:** `Front-end` | **Priority:** `Medium` | **Severity:** `Low` | **Status:** `Todo`

#### Steps to Reproduce
- Log in as a newly added team member using the temporary password.
- Navigate to the “Welcome to Amenity Op's — First-time setup: please set your personal password before continuing.” page.
- Enter a valid new password and confirm it.
- Submit the form and observe the redirection to the Login page.

#### Actual Result
> After successfully setting a new password, the system redirects the user to the Login page without displaying a success toast or confirmation message.

#### Expected Result
Display a clear success toast or notification, such as “Password updated successfully. Please log in with your new password.” after the password is changed successfully and before or during the redirection to the Login page.

---

### ONB-11: Dashboard Sidebar and Header Are Not Fixed During Scrolling, and Sidebar Elements Require Scrolling to Access
- **Domain:** `Front-end` | **Priority:** `High` | **Severity:** `Medium` | **Status:** `Todo`
- **Visual Evidence:** [Evidence Link](https://take.ms/yGHUw)

#### Steps to Reproduce
- Log in and navigate to the dashboard.
- Scroll down the page and observe the sidebar and header bar.
- Check the sidebar navigation elements, particularly the Start Inspection and Logout buttons.

#### Actual Result
> The sidebar and header bar move when the page scrolls. Additionally, some sidebar elements, including the Start Inspection and Logout buttons, are not visible without scrolling within the sidebar.

#### Expected Result
Keep the dashboard sidebar and header bar fixed in their respective positions while the main content scrolls. Ensure all sidebar navigation elements, including Start Inspection and Logout, remain accessible without requiring separate sidebar scrolling. Adjust the sidebar layout, spacing, or sizing as needed to fit all elements within the available viewport height.

---

### ONB-12: Missing Placeholders, Password Visibility Toggles, and Standard Password Validation in the Password Reset Flow
- **Domain:** `Front/Backend` | **Priority:** `High` | **Severity:** `Medium` | **Status:** `Todo`
- **Visual Evidence:** [Evidence Link](https://take.ms/y4o02)

#### Steps to Reproduce
- Navigate to the password reset flow.
- Open the screen containing the New Password and Confirm Password fields.
- Check the placeholder text and password visibility toggle icons.
- Enter a password that meets the minimum 8-character requirement but does not meet other standard password requirements.
- Observe the password validation behavior.

#### Actual Result
> The New Password and Confirm Password fields lack proper placeholder text and functional show/hide password toggle icons. Password validation currently enforces only the minimum 8-character requirement.

#### Expected Result
- Add clear placeholders: Enter your new password and Confirm your new password.
- Implement functional eye toggle icons in both fields to show or hide entered passwords.
- Enforce standard password requirements:
  - Minimum 8 characters.
  - At least one uppercase letter.
  - At least one lowercase letter.
  - At least one number.
  - At least one special character.
- Display clear password requirements and inline validation messages.
- Prevent form submission until the new password meets all requirements and matches the confirmation password.
- Apply password validation consistently on both the frontend and backend.

---

### ONB-13: Missing Proper Toast Notifications for Login/Logout and Logout Confirmation Modal
- **Domain:** `Front-end` | **Priority:** `Medium` | **Severity:** `Medium` | **Status:** `Todo`
- **Visual Evidence:** [Evidence Link](https://take.ms/UmN9k)

#### Steps to Reproduce
- Open the application’s login page.
- Enter valid credentials and log in.
- Observe whether a proper toast notification confirms successful login.
- Log out of the application.
- Observe whether a confirmation modal appears before the logout action is performed.
- Confirm the logout action and observe whether a toast notification confirms successful logout.

#### Actual Result
> The login and logout flows do not provide the expected user feedback through proper toast notifications, and the logout flow does not provide a confirmation modal before logging the user out.

#### Expected Result
- Login Notifications: Display a clear success toast after successful login and an appropriate error toast when login fails. Error messages should be user-friendly and must not expose sensitive information.
- Logout Confirmation: When the user clicks Logout, display a standard confirmation modal asking whether they are sure they want to log out. Include clear Cancel and Confirm Logout actions.
- Cancel Logout: Clicking Cancel or closing the modal should dismiss it without logging out the user or interrupting their current session.
- Confirm Logout: Clicking Confirm Logout should end the session and redirect the user to the login page or the appropriate public page.
- Logout Notifications: Display a success toast after successful logout. If logout fails, display an appropriate error message and handle the session state correctly.
- Consistent UI/UX: Ensure toast notifications and the confirmation modal follow the application's existing design system, provide clear messages, and behave consistently across the application.

---

### ONB-14: Missing Profile and Logout Dropdown in the Top-Right Navigation for Admin and Member Users
- **Domain:** `Front-end` | **Priority:** `Medium` | **Severity:** `Medium` | **Status:** `Todo`
- **Visual Evidence:** [Evidence Link](https://take.ms/0pzaC)

#### Steps to Reproduce
- Log in as an Admin.
- Navigate to a page other than My Inspection.
- Locate the profile icon or username in the top-right corner.
- Hover the mouse over the profile icon or username.
- Observe whether a dropdown menu appears.
- Repeat the same steps while logged in as a Member.

#### Actual Result
> Currently, the Admin can access the profile page only through the My Inspection page. A consistent profile dropdown is not available from the top-right navigation for easy access. The same behavior should also be checked for Member users.

#### Expected Result
- Display a profile icon or username in the top-right corner of the application for both Admin and Member users.
- When the user hovers over the profile icon or username, display a dropdown menu directly below it with the following options:
- Profile — navigates to the logged-in user's profile page.
  - Logout — initiates the logout flow, displaying the logout confirmation modal before ending the session.
  - Ensure the dropdown is accessible and works consistently across all relevant application pages, not only My Inspection.
- Clicking outside the dropdown or moving the mouse away should dismiss it appropriately.
- Ensure each role can access only the profile and account actions permitted for that user.
- Follow the application's existing design system and standard UX practices for dropdown positioning, spacing, hover states, and interaction behavior.

---

### ONB-15: Logging Out on One Device Terminates the User's Sessions on All Other Devices
- **Domain:** `Back-end` | **Priority:** `High` | **Severity:** `High` | **Status:** `Todo`
- **Visual Evidence:** [Evidence Link](https://take.ms/knJXt)

#### Steps to Reproduce
- Log in to the application using the same user account on two different devices or browsers.
- Verify that the user is logged in on both devices.
- On the first device, perform the logout action.
- Switch to the second device and attempt to continue using the application.
- Observe whether the user is also logged out from the second device.

#### Actual Result
> When a user, whether an Admin or Member, logs out from one device, the same account is also logged out from other devices where the user is currently logged in.

#### Expected Result
Logging out should terminate only the active session on the device or browser where the logout action is performed. Sessions on other devices must remain active and usable until the user logs out from those devices or their sessions expire according to the application's session policy.

Ensure that each device or browser maintains its own independent session and that the logout functionality invalidates only the session associated with the current device. Apply this behavior consistently to both Admin and Member accounts without affecting security controls or intentional account-wide session termination features.

---

### ONB-16: False Logout Error on Concurrent Sessions Despite Successful API Response
- **Domain:** `Front/Backend` | **Priority:** `High` | **Severity:** `High` | **Status:** `Todo`
- **Visual Evidence:** [Evidence Link](https://take.ms/Qa578) [Evidence Link](https://take.ms/KJgDg)

#### Steps to Reproduce
1. Log in to the same user account on two different devices or browsers.
2. Log out successfully from the first device.
3. Log out from the second device.
4. Observe the error message and check the Network tab for the logout and Inspector API responses.

#### Actual Result
> The second device displays “Something went wrong. Your data is safe. Try again — if this keeps happening, contact the administrator.” even though the logout API returns 200 OK. Another Inspector API request returns 307 Temporary Redirect.

#### Expected Result
Ensure logout completes successfully on each device without displaying a false error when the API returns success. Investigate the frontend response handling and backend session logic, and fix the unexpected 307 Temporary Redirect from the Inspector API so requests are handled correctly without unintended redirects.

---

## Tab 2: Property Flow

### PROP-01: New Property Add Screen Is Restricted to Half the Page Width, Leaving Excessive Empty Space on the Right
- **Domain:** `Front-end` | **Priority:** `High` | **Severity:** `Medium` | **Status:** `Todo`
- **Visual Evidence:** [Evidence Link](https://take.ms/7Axtc)

#### Steps to Reproduce
- Open the Property Page From Sidebar
- Navigate to the New Property Add screen.
- Observe the overall page layout and the width of the UI components.
- Check the headings, buttons, and other text elements for unnecessary line wrapping.

#### Actual Result
> The UI components are restricted to approximately half the page width, leaving excessive empty black space on the right. As a result, the layout appears cramped, and some headings and button text wrap onto multiple lines unnecessarily.

#### Expected Result
Expand the New Property Add screen and its UI components to utilize the available page width appropriately. Remove the unnecessary empty space on the right and ensure headings, buttons, and other elements are displayed with proper spacing and alignment. Maintain a clean, responsive layout across different screen sizes.

---

### PROP-02: Missing or Improper Placeholders in Property Name, Street Address, City, and Property Phone Fields in the New Property Add Flow
- **Domain:** `Front-end` | **Priority:** `Medium` | **Severity:** `Low` | **Status:** `Todo`
- **Visual Evidence:** [Evidence Link](https://take.ms/EiZik)

#### Steps to Reproduce
- Navigate to the New Property Add flow.
- Inspect the Property Name, Street Address, City, and Property Phone fields.
- Verify whether each field displays an appropriate placeholder.

#### Actual Result
> The Property Name, Street Address, City, and Property Phone fields do not have proper placeholder text.

#### Expected Result
Add clear, descriptive placeholders to all four fields, such as:
- Property Name: Enter property name
- Street Address: Enter street address
- City: Enter city
- Property Phone: Enter property phone number

---

### PROP-03: Missing Phone Number Validation in the Property Phone Field in the New Property Add Flow
- **Domain:** `Front-end` | **Priority:** `High` | **Severity:** `Medium` | **Status:** `Todo`
- **Visual Evidence:** [Evidence Link](https://take.ms/dfSwL)

#### Steps to Reproduce
- Navigate to the New Property Add flow.
- Enter text containing alphabets or other invalid characters in the Property Phone field.
- Enter a phone number shorter or longer than the permitted length.
- Observe the field validation while typing.

#### Actual Result
> The Property Phone field allows alphabets and does not enforce proper phone number length or input validation while the user is typing.

#### Expected Result
Implement appropriate frontend phone number validation with the following behavior:
- Prevent alphabets and unsupported characters from being entered.
- Enforce minimum and maximum phone number lengths based on the supported phone number format.
- Allow valid phone number characters, including an optional leading + for international numbers.
- Display clear inline validation messages for invalid or incomplete phone numbers.
- Validate the phone number before allowing the property form to be submitted.
- Apply validation dynamically while the user is typing without disrupting the input experience.

---

### PROP-04: Missing Conditional Validation for GPS Coordinates and Required Inspection Days in the New and Edit Property Flows
- **Domain:** `Front/Back-end` | **Priority:** `High` | **Severity:** `High` | **Status:** `Todo`
- **Visual Evidence:** [Evidence Link](https://take.ms/KcPGm)

#### Steps to Reproduce
- Navigate to the New Property Add flow or open an existing property in the Edit flow.
- Enable Enable On-Site GPS Geofence Verification and leave the Latitude and Longitude fields empty.
- Attempt to create or save the property.
- Enable Enable Required Inspection Days and leave all days of the week unselected.
- Attempt to create or save the property again.

#### Actual Result
> The system allows the user to create or save a property even when GPS coordinates are missing while GPS geofence verification is enabled, or when no inspection days are selected while required inspection days are enabled.

#### Expected Result
- When Enable On-Site GPS Geofence Verification is enabled, require both Latitude and Longitude fields and validate that they contain valid coordinate values.
- When Enable Required Inspection Days is enabled, require the user to select at least one day of the week.
- Display clear inline validation messages for missing or invalid values.
- Prevent property creation or updates until all required conditional fields are valid.
- Apply the same validation rules consistently to both the New Property Add and Edit flows, on both the frontend and backend.

---

### PROP-05: Missing Success Notification After Creating or Editing a Property
- **Domain:** `Front-end` | **Priority:** `Medium` | **Severity:** `Low` | **Status:** `Todo`
- **Visual Evidence:** [Evidence Link](https://take.ms/KcPGm)

#### Steps to Reproduce
- Navigate to the New Property Add flow or open an existing property in the Edit flow.
- Enter valid property details.
- Create a new property or save the changes to an existing property.
- Observe the UI after the operation completes successfully.

#### Actual Result
> The property is created or updated successfully, but no success toast or confirmation message is displayed.

#### Expected Result
Display a clear success toast or notification after the operation completes successfully, such as:
- Property Created Successfully: “Property has been created successfully.”
- Property Updated Successfully: “Property has been updated successfully.”

---

### PROP-06: Misleading Empty-State Message When Searching for a Property That Does Not Exist
- **Domain:** `Front-end` | **Priority:** `Medium` | **Severity:** `Low` | **Status:** `Todo`
- **Visual Evidence:** [Evidence Link](https://take.ms/SPpMH)

#### Steps to Reproduce
- Navigate to the Properties page.
- Search for a property that is not available in the properties list.
- Observe the empty-state message displayed.

#### Actual Result
> The system displays the message “No properties in this area. Try clearing the location filter.”, which incorrectly suggests that the location filter is causing the issue.

#### Expected Result
Display a generic and relevant empty-state message, such as “No properties found. Try changing your search criteria or adjusting the filters.” Ensure the message accurately reflects the search results and does not incorrectly refer to the location filter when it is not relevant.

---

## Tab 3: Inspections Flow

### INSP-01: Unclear Relationship Between Property Rosters and Inspection Assignment
- **Domain:** `Front/Back-end` | **Priority:** `Medium` | **Severity:** `Medium` | **Status:** `Todo`
- **Visual Evidence:** [Evidence Link](https://take.ms/q9lTm)

#### Steps to Reproduce
- Log in as an Admin.
- Create a new property and add multiple specialists to its roster.
- Start an inspection for that property.
- Observe that only one specialist can be assigned despite multiple specialists being added to the property roster.

#### Actual Result
> The system allows multiple specialists to be added to a property's roster but permits assigning only one specialist when starting an inspection. The intended purpose of the property roster is unclear.

#### Expected Result
- Define the purpose of the property roster and its relationship to inspection assignments.
- Consider allowing multiple specialists to be assigned to a single inspection if collaborative inspections are supported.
- If each inspection is intended for one specialist only, use the property roster to determine which specialists are eligible for assignment.
- Confirm the intended business rules before implementation.

---

### INSP-02: Admin-Completed Inspection Checklists Do Not Appear in the My Inspections — Open Inspections Section
- **Domain:** `Front/Back-end` | **Priority:** `High` | **Severity:** `Medium` | **Status:** `Todo`
- **Visual Evidence:** [Evidence Link](https://take.ms/EzIoW)

#### Steps to Reproduce
- Log in as an Admin.
- Navigate to a property and open an inspection checklist.
- Complete or work through the inspection checklist as the Admin.
- Navigate to the My Inspections page.
- Check the Open Inspections section for the inspection.

#### Actual Result
> The Admin can access and complete inspection checklists for properties, but the corresponding inspections do not appear in the My Inspections page under Open Inspections. The Open Inspections section is also missing from the Admin's view.

#### Expected Result
- Display an Open Inspections section on the Admin's My Inspections page.
- Show inspections started by the Admin that remain incomplete and are accessible to that Admin.
- Allow the Admin to reopen an open inspection and continue from where they left off.
- Ensure inspection records and statuses are correctly reflected in My Inspections.
- Apply consistent inspection visibility rules so that authorized Admins can access their relevant open inspections.

---

### INSP-03: Inspection Assignment and Access Permissions Are Not Clearly Restricted by Property Roster
- **Domain:** `Front/Back-end` | **Priority:** `Medium` | **Severity:** `Medium` | **Status:** `Todo`

#### Steps to Reproduce
- Log in as an Admin and start an inspection for a property.
- Open the specialist assignment list.
- Observe that available team members, including Admins, can be selected.
- Access an inspection checklist as an Admin who is not assigned to the property's roster.
- Check whether the Admin can access and complete the checklist.

#### Actual Result
> The assignment list includes available team members, including Admins, without clear roster-based eligibility rules. Admins can also complete inspection checklists without being assigned to the property's roster.

#### Expected Result
- Define whether Admins are eligible to perform inspections as specialists.
- Consider restricting specialist assignment options to team members assigned to the relevant property's roster.
- Define whether Admins need roster membership to perform inspections or can access them through separate permissions.
- Ensure inspection access and checklist completion follow clearly defined authorization rules.

---

### INSP-04: Excessive Blank Space on the Right Side of the Inspection Checklist Page
- **Domain:** `Front-end` | **Priority:** `Medium` | **Severity:** `Low` | **Status:** `Todo`
- **Visual Evidence:** [Evidence Link](https://take.ms/AiTgB) [Evidence Link](https://take.ms/2RAIz)

#### Steps to Reproduce
- Log in as an Admin and navigate to an Inspection Checklist page.
- Observe the overall layout and the unused space on the right side.
- Repeat the same steps using a Specialist account.
- Compare the layout on both sides.

#### Actual Result
> The Inspection Checklist page leaves excessive blank space on the right side, restricting the checklist layout and resulting in inconsistent use of the available screen width for both Admins and Specialists.

#### Expected Result
Expand the Inspection Checklist layout to utilize the available page width appropriately on both Admin and Specialist interfaces. Remove unnecessary blank space on the right, maintain consistent spacing and alignment, and ensure the checklist components use a clean, responsive layout across different screen sizes.

---

### INSP-05: Missing Option to Remove an Uploaded Photo from the Inspection Checklist
- **Domain:** `Front/Back-end` | **Priority:** `Medium` | **Severity:** `Medium` | **Status:** `Todo`
- **Visual Evidence:** [Evidence Link](https://take.ms/ytCQiE)

#### Steps to Reproduce
- Log in as an Inspector or Specialist.
- Navigate to an inspection and open the inspection checklist.
- Upload or capture a photo for a checklist item.
- Observe whether an option is available to remove the uploaded photo.

#### Actual Result
> Once a photo has been uploaded or captured for an inspection checklist item, there is no option for the inspector to remove it.

#### Expected Result
Add a clear Remove/Delete Photo option alongside each uploaded photo in the inspection checklist. The inspector should be able to remove an attached photo before submitting or completing the inspection. Update the displayed photo immediately after removal and ensure the deletion is reflected in the saved inspection data. If necessary, display a confirmation prompt before permanently deleting the photo.

---

### INSP-06: Internal Server Error (500) When Submitting a Completed Inspection Checklist
- **Domain:** `Front/Back-end` | **Priority:** `High` | **Severity:** `High` | **Status:** `Todo`
- **Visual Evidence:** [Evidence Link](https://take.ms/eAurh)

#### Steps to Reproduce
- Log in to the system as a user authorized to complete inspections.
- Navigate to an inspection and open the inspection checklist.
- Complete the required checklist questions.
- Submit the completed inspection checklist.
- Observe the error message displayed by the system.

#### Actual Result
> After submitting the completed inspection checklist, the system returns a 500 Internal Server Error and displays the following message: “Something went wrong — your answers are saved. Please sign in again if needed and retry.”

#### Expected Result
The inspection checklist should be submitted successfully without triggering a 500 Internal Server Error. The system should save the answers, complete the submission process, and display an appropriate success confirmation. The user should not be prompted to sign in again unless their session has genuinely expired.

---

### INSP-07: Incorrect Specialist Assignment Flow and Property Staff Roster Synchronization
- **Domain:** `Front/Back-end` | **Priority:** `High` | **Severity:** `High` | **Status:** `Todo`
- **Visual Evidence:** [Evidence Link](https://take.ms/SePA9F)

#### Steps to Reproduce
- Log in as an Admin.
- Navigate to a property and open the option to start an inspection.
- Open the Assign Specialist dropdown.
- Observe that the dropdown displays all specialists, team members, and admins across the current tenant, regardless of whether they are added to the property's staff roster.
- Navigate to the property's Property Staff Roster section and observe that no specialists may be assigned to the property.
- Start an inspection and assign a specialist who is not currently listed in the property's roster.
- Check the Property Staff Roster and Inspections sections for the selected property.

#### Actual Result
> - The Assign Specialist dropdown displays all specialists, team members, and admins across the current tenant instead of only specialists assigned to the specific property's roster.
- Specialists can be assigned to inspections even when they are not listed in the property's staff roster.
- After assigning a specialist to an inspection, the specialist does not appear in the Property Staff Roster section.
- The specialist's assignment is visible in the property's Inspections section, resulting in inconsistent information between the roster and inspection records.

#### Expected Result
- The Assign Specialist dropdown should display only specialists assigned to the selected property's staff roster.
- Specialists, team members, and admins who are not eligible for specialist assignment should not appear in the dropdown.
- If an Admin assigns a specialist who is not already listed in the property's roster, the system should automatically add that specialist to the Property Staff Roster and reflect the change consistently across the system.
- The Property Staff Roster and Inspections sections should remain synchronized and accurately display the assigned specialist.
- Implement a clear and consistent workflow for managing property rosters and assigning specialists to inspections, ensuring that property-specific assignments are respected.

---

### INSP-08: Photo ID Document Verification Is Not Enforced Before Inspection Checklist Access
- **Domain:** `Front/Back-end` | **Priority:** `High` | **Severity:** `High` | **Status:** `Todo`
- **Visual Evidence:** [Evidence Link](https://take.ms/qJY91)

#### Steps to Reproduce
- Log in as an Admin.
- Navigate to the relevant property settings.
- Turn ON Require Photo ID Document Verification.
- Assign a specialist to an inspection for that property.
- Log in as the assigned specialist.
- Open the inspection checklist without completing photo ID verification.
- Observe whether the specialist can access and work on the checklist without submitting their ID document.

#### Actual Result
> Even when Require Photo ID Document Verification is enabled, the assigned specialist can access the inspection checklist and begin working without completing photo ID verification.

#### Expected Result
When Require Photo ID Document Verification is enabled, the assigned specialist must first be prompted to submit their ID document for verification before accessing or performing any work on the inspection checklist. The system must enforce this requirement on the backend as well as the frontend to prevent bypassing the verification step.

When the setting is turned OFF, specialists should be allowed to access and work on the inspection checklist without being required to complete photo ID verification.

---

### INSP-09: Clarify and Fix Property Staff Roster and Inspection Specialist Assignment Workflow
- **Domain:** `Front/Back-end` | **Priority:** `High` | **Severity:** `High` | **Status:** `Todo`
- **Visual Evidence:** [Evidence Link](https://take.ms/Ux9jo)

#### Steps to Reproduce
- Log in as an Admin.
- Navigate to a property and open the Property Staff Roster section.
- Add primary, backup, staff, or in-house specialists to the property's roster.
- Start a new inspection for that property.
- Open the Assign Specialist dropdown and observe the available specialists.
- Assign a specialist to the inspection, or proceed without selecting one.
- Log in as a specialist included in the property's roster who was not explicitly selected for the inspection.
- Check whether the specialist can see the open or pending inspection.

#### Actual Result
> The relationship between the property's staff roster and the inspection's specialist assignment is unclear. Specialists added to the property's roster are not consistently treated as part of the inspection workflow, and the Admin must manually assign a specialist when starting an inspection. This creates confusion about whether roster membership automatically includes specialists in property inspections and what purpose the Assign Specialist dropdown serves.

#### Expected Result
Implement a clear and consistent workflow for property roster membership and inspection assignments.
- Property Staff Roster: Primary, backup, and in-house specialists added to a property's roster should be associated with that property and able to see its open and pending inspections, even when they are not individually selected during inspection creation.
- Inspection Visibility: When an inspection is started, it should be visible to the relevant roster members so they can identify and access pending work according to their assigned roles and permissions.
- Assign Specialist Dropdown: The dropdown should be limited to eligible specialists from the selected property's roster. It should be used to identify the primary specialist responsible for a specific inspection, rather than determine whether the property's roster members can see the inspection at all.
- Assignment Consistency: The system should clearly distinguish between specialists who belong to the property's roster and the specialist explicitly assigned as the inspection's primary responsible person. Inspection records and property staff records must remain synchronized.
- Clear User Experience: Update the interface and workflow so Admins understand that roster membership determines which specialists belong to the property, while inspection assignment determines who is primarily responsible for an individual inspection. Any backup or in-house specialist responsibilities should be clearly represented.
Ensure that open audits are routed to the relevant property's roster team, in accordance with the intended roles and permissions, without requiring unnecessary duplicate assignments.

---

### INSP-10: GPS Geofence Verification Is Not Working Correctly and Does Not Block Inspection Checklist Access
- **Domain:** `Front/Back-end` | **Priority:** `High` | **Severity:** `High` | **Status:** `Todo`
- **Visual Evidence:** [Evidence Link](https://take.ms/7hVsY)

#### Steps to Reproduce
- Log in as an Admin.
- Navigate to the relevant property's settings.
- Enable On-Site GPS Geofence Verification.
- Configure the property's latitude, longitude, and geofence perimeter radius.
- Log in as the assigned specialist.
- Open the inspection list and observe the location-related error message.
- Attempt to open an inspection checklist and begin working without satisfying the required GPS location verification criteria.
- Observe whether the system allows access to the checklist.

#### Actual Result
> - When the specialist opens the inspection list, the system displays the following error message:
- Location Access Disabled
- “Enable browser location permissions to verify your physical presence inside the property perimeter.”
- Despite GPS geofence verification being enabled and the location verification criteria not being met, the specialist can still access the inspection checklist and begin working.
- The system does not consistently enforce the configured on-site location verification requirement.

#### Expected Result
- When On-Site GPS Geofence Verification is enabled, the system should correctly request and use the specialist's browser location permissions to verify their physical presence within the configured property geofence.
- If browser location access is disabled, the system should clearly guide the specialist through enabling location permissions and prevent inspection work until the required verification is completed.
- If the specialist is outside the configured geofence perimeter, the system must prevent access to checklist work until the location requirement is satisfied.
- Location verification must be enforced by both the frontend and backend so that specialists cannot bypass it by accessing the checklist through another route or request.
- Once verification succeeds, the system should allow the specialist to proceed with the inspection and accurately record the required arrival timestamp, location-related entry/exit telemetry, and on-site duration according to the feature requirements.
- When the geofence setting is disabled for a property, the system should not require this GPS verification.

Implementation Status: The reported behavior indicates that the feature is either not fully implemented or is not being enforced correctly. Confirm the implementation status and ensure the complete GPS geofence verification workflow works as configured.

---

### INSP-11: Misaligned Borders and Excessive Empty Space in My Assignments Summary Cards on Mobile and Tablet Viewports
- **Domain:** `Front-end` | **Priority:** `Medium` | **Severity:** `Medium` | **Status:** `Todo`
- **Visual Evidence:** [Evidence Link](https://take.ms/IXmjz)

#### Steps to Reproduce
- Log in to the application as a user.
- Navigate to the My Assignments page.
- Observe the summary cards for Total Assigned, Pending, In Progress, and Completed.
- Resize the viewport to mobile dimensions.
- Repeat the test using tablet dimensions.
- Observe the card borders, alignment, spacing, and empty space along the edges.

#### Actual Result
> The summary cards and their borders are not properly aligned on mobile and tablet viewports. Excessive or unnecessary empty spaces appear along the edges, making the layout look inconsistent.

#### Expected Result
- Ensure all four summary cards (Total Assigned, Pending, In Progress, and Completed) have properly aligned borders and consistent dimensions.
- Remove unnecessary empty spaces along the edges of the layout.
- Apply consistent margins, padding, gaps, and border alignment across all summary cards.
- Make the layout responsive so the cards fit appropriately within the available screen width on mobile and tablet devices.
- Prevent horizontal overflow, clipping, or uneven spacing.
- Preserve the existing desktop layout while ensuring a consistent and professional appearance across all supported viewport sizes.

---

### INSP-12: Missing Border Styling in the Completed Section on the My Assignments Page
- **Domain:** `Front-end` | **Priority:** `Medium` | **Severity:** `Low` | **Status:** `Todo`
- **Visual Evidence:** [Evidence Link](https://take.ms/5NpnW)

#### Steps to Reproduce
- Log in to the application.
- Navigate to the My Assignments page.
- Open the Completed section.
- Compare its layout and styling with the other assignment sections.
- Observe the missing border styling.

#### Actual Result
> The Completed section does not display the expected borders, unlike the other sections, resulting in an inconsistent visual design.

#### Expected Result
Apply the same border styling used in the other assignment sections to the Completed section. Ensure consistent borders, spacing, padding, and overall layout across all sections for a uniform user experience on desktop, tablet, and mobile viewports.

---

## Tab 4: Team Flow

### TEAM-01: Misaligned “Open Specialist Panel” Button in the Team Page — Active Members Section
- **Domain:** `Front-end` | **Priority:** `Medium` | **Severity:** `Low` | **Status:** `Todo`
- **Visual Evidence:** [Evidence Link](https://take.ms/hRBtn)

#### Steps to Reproduce
- Navigate to the Team page from the sidebar.
- Open the Active Members section.
- Observe the placement of the “Open Specialist Panel” button relative to the team member names and their information.

#### Actual Result
> The “Open Specialist Panel” button disrupts the layout of the Active Members section, affecting the alignment and presentation of team member names and their information.

#### Expected Result
Reposition the “Open Specialist Panel” button in an appropriate location within the Active Members section to maintain a clean, consistent layout without disrupting team member names or their information.

---

### TEAM-02: Exit to Admin” and “Close Tab” Buttons Perform the Same Action in the Specialist Team Member Panel
- **Domain:** `Front-end` | **Priority:** `High` | **Severity:** `Medium` | **Status:** `Todo`
- **Visual Evidence:** [Evidence Link](https://take.ms/HAXAK)

#### Steps to Reproduce
- Log in as an admin.
- Navigate to the Team page.
- Open a specialist's team member panel using the available option.
- Observe the two buttons in the top-left corner: “Exit to Admin” and “Close Tab.”
- Click each button separately and observe the resulting behavior and browser tabs.

#### Actual Result
> Both buttons perform the same action, redirecting the admin to the Admin page and opening another tab. This results in duplicate browser tabs displaying the Teams page.

#### Expected Result
- Exit to Admin: Return the admin to the existing Admin interface or Teams page without opening an additional browser tab. Preserve the original admin tab and its navigation context.
- Close Tab: Close the current Specialist Team Member Panel tab and return the user to the previously opened Admin tab, provided the browser allows the tab to be closed programmatically.
- Ensure both buttons perform distinct actions and do not create duplicate tabs or unnecessary redirects.

---

### TEAM-03: Admin Impersonation Mode Displays Unauthorized Quick Actions and Allows Navigation Back to the Admin Portal
- **Domain:** `Front/Back - end` | **Priority:** `High` | **Severity:** `High` | **Status:** `Todo`
- **Visual Evidence:** [Evidence Link](https://take.ms/81ZbF) [Evidence Link](https://take.ms/4YwcGt)

#### Steps to Reproduce
- Log in as an admin.
- Navigate to the Team page and open a specialist's team member panel in view mode.
- Verify that the interface displays “Admin Impersonation Mode”
- Observe the Quick Action section and the sidebar navigation options.
- Click the Start Inspection, Dashboard, or Inspection option.
- Observe whether the admin remains in impersonation mode or returns to the original Admin portal.

#### Actual Result
> The Quick Action section displays extra options, including Start Inspection and Dashboard. When the admin interacts with these options or the original admin sidebar navigation, the system navigates back to the corresponding Admin page and exits the specialist viewing context unexpectedly.

#### Expected Result
- Maintain Admin Impersonation Mode: Viewing full specialist portal as Team Member until the admin explicitly exits the viewing session.
- Hide or disable Quick Action buttons and navigation options that are not intended to be available during the specialist viewing flow.
- Ensure specialist portal navigation remains within the specialist's viewing context and does not redirect the admin to the original Admin portal.
- Prevent the original Admin sidebar options from appearing or becoming accessible while viewing the specialist portal, unless explicitly required by the intended workflow.
- Allow the admin to return to the Admin portal only through the designated exit action.
- Preserve the impersonation context consistently across navigation within the specialist portal.

---

### TEAM-04: Admin Can Demote Another Admin to Specialist Without Super Admin Authorization
- **Domain:** `Front/Back - end` | **Priority:** `High` | **Severity:** `Critical` | **Status:** `Todo`
- **Visual Evidence:** [Evidence Link](https://take.ms/w6KGO)

#### Steps to Reproduce
- Log in using an existing Admin account.
- Create or add another user with the Admin role.
- Log in using the newly created Admin account.
- Navigate to the Team Members section.
- Attempt to change the original Admin's role from Admin to Specialist.
- Observe whether the role change is permitted.

#### Actual Result
> A newly created Admin can demote the original Admin to Specialist, allowing an administrator to change another administrator's role without appropriate authorization.

#### Expected Result
- Restrict the ability to demote an Admin or change another Admin's privileged role to an authorized Super Admin.
- Standard Admins must not be able to demote, remove, or modify the privileged role of another Admin.
- Only a Super Admin should be permitted to change another Admin's role, including demoting them to Specialist.
- Enforce role-based access control on both the frontend and backend to prevent unauthorized role changes, including requests made directly through the API.
- Display a clear authorization error if a standard Admin attempts a restricted role change.
- Ensure these restrictions apply consistently to all relevant team member management flows.

---

### TEAM-05: Incorrect Open Tenant Admin Panel Access and Missing Exit View Navigation
- **Domain:** `Front/Back - end` | **Priority:** `High` | **Severity:** `High` | **Status:** `Todo`
- **Visual Evidence:** [Evidence Link](https://take.ms/bDojE)

#### Steps to Reproduce
- Log in as an Admin.
- Navigate to the Team page and locate another Admin.
- Click Open Tenant Admin Panel.
- Observe the panel displayed and check whether a top bar or exit option appears

#### Actual Result
> The Admin remains on their own panel instead of properly switching to the selected Admin's panel. No top bar or exit-view option appears, unlike the Specialist Panel view.

#### Expected Result
Ensure the Open Tenant Admin Panel flow follows the intended access permissions. Admins should not access another Admin's panel unless explicitly authorized. If this functionality is intended, switch to the selected Admin's panel correctly and display a clear top bar with an option to exit the view and return to the original Admin panel, consistent with the Specialist Panel flow.

---

## Tab 5: Profile Flow

### PROF-01: Missing Phone Number Validation in the Profile Edit Flow (Fix this both for the Admin and Team Member)
- **Domain:** `Front-end` | **Priority:** `High` | **Severity:** `Medium` | **Status:** `Todo`
- **Visual Evidence:** [Evidence Link](https://take.ms/E6AFI)

#### Steps to Reproduce
- Navigate to the Profile page.
- Enter the profile edit flow.
- Enter alphabets or an invalid phone number in the Phone Number field.
- Observe the field validation while typing and when saving the profile.

#### Actual Result
> The Phone Number field allows alphabets and does not enforce standard phone number validation rules.

#### Expected Result
Implement standard phone number validation in the Profile Edit flow with the following requirements:
- Allow only valid phone number characters, including digits and an optional leading + for international numbers.
- Prevent alphabets and unsupported special characters.
- Enforce appropriate minimum and maximum phone number lengths based on the supported phone number format.
- Display clear inline validation messages when the phone number is invalid or incomplete.
- Validate the phone number while the user is typing and before saving the profile.
- Prevent profile updates until the phone number is valid.
- Ensure valid international phone numbers are supported where applicable.

---

## Tab 6: ChatBot

### CHAT-01: Chatbot Does Not Close on Outside Interaction and Conversation History Is Lost on Page Refresh
- **Domain:** `Front/Back-end` | **Priority:** `Medium` | **Severity:** `Medium` | **Status:** `Todo`
- **Visual Evidence:** [Evidence Link](https://take.ms/krI74)

#### Steps to Reproduce
- Log in to the application and open the chatbot.
- Interact with the chatbot by sending one or more messages.
- Click anywhere outside the chatbot window or interact with another component on the screen.
- Observe whether the chatbot window closes appropriately.
- Open the chatbot again and refresh the page.
- Open the chatbot after the refresh and observe whether the previous conversation history is retained.
- Locate the chatbot's Reset button and verify its intended behavior.

#### Actual Result
> - he chatbot does not close consistently when the user clicks outside its window or interacts with other components on the screen.
- Refreshing the page automatically clears the chatbot conversation history.
- The conversation is lost even though a dedicated Reset button is available for intentionally clearing the conversation.

#### Expected Result
- Close on Outside Interaction: The chatbot window should close when the user clicks anywhere outside the chatbot or interacts with another component on the screen. Interaction within the chatbot itself should not unintentionally close it.
- Conversation History Persistence: The chatbot should retain the conversation history when the user refreshes the page, closes and reopens the chatbot, or navigates through the application, according to the intended conversation scope.
- Reset Button Functionality: The conversation should be cleared only when the user explicitly clicks the Reset button and confirms the action if a confirmation prompt is part of the intended UX.
- Consistent User Experience: Ensure that opening or closing the chatbot does not erase the conversation and that the conversation history remains available until the user explicitly resets it or it is cleared according to the application's defined session policy.

---

### CHAT-02: Chatbot Fails to Properly Render Tables, HTML, Regex, and JSON Responses
- **Domain:** `Front/Back-end` | **Priority:** `Medium` | **Severity:** `Medium` | **Status:** `Todo`
- **Visual Evidence:** [Evidence Link](https://take.ms/DwCcU)

#### Steps to Reproduce
- Open the chatbot.
- Ask the chatbot to explain a topic using a table.
- Observe how the table is displayed in the response.
- Ask the chatbot to provide or explain HTML, regular expressions (Regex), and JSON examples.
- Observe whether the content is rendered in a readable format or displayed as raw tags or improperly formatted text.

#### Actual Result
> The chatbot does not consistently render structured responses correctly. Tables may appear broken or improperly formatted, raw HTML tags may be displayed directly in the response, and Regex and JSON content may not be formatted or displayed properly.

#### Expected Result
- Table Rendering: Properly render Markdown and supported table formats with aligned rows and columns, readable headers, and consistent spacing.
- HTML Rendering: Correctly display supported HTML-based formatting instead of exposing raw HTML tags when they are intended to provide visual structure. Sanitize HTML appropriately to prevent security vulnerabilities.
- Regex Rendering: Display regular expressions in a readable format, preserving special characters, backslashes, and escaping.
- JSON Rendering: Display JSON in properly formatted code blocks with correct indentation, line breaks, and syntax highlighting where supported. Preserve the original JSON structure without altering its values.
- Code and Markdown Support: Ensure the chatbot correctly parses and renders supported Markdown, code blocks, and structured content while preserving the original meaning and content of the response.
- Responsive Layout: Ensure tables and formatted content remain readable on different screen sizes without breaking the chatbot layout or causing unnecessary horizontal overflow.

---

### CHAT-03: Chatbot Violates Defined Scope by Answering Unrelated Questions
- **Domain:** `Back-end` | **Priority:** `High` | **Severity:** `Medium` | **Status:** `Todo`
- **Visual Evidence:** [Evidence Link](https://take.ms/1dyLg)

#### Steps to Reproduce
- Open the chatbot.
- Ask a question related to property inspection, such as how to inspect balcony railings.
- Include an unrelated question, such as requesting a tutorial on converting binary numbers to decimal.
- Observe whether the chatbot answers both questions or restricts its response to property inspection.

#### Actual Result
> The chatbot fails the scope boundary test by providing a detailed explanation of binary-to-decimal conversion, even though this topic is unrelated to property inspection procedures.

#### Expected Result
- The chatbot must strictly follow its system prompt and respond only to questions within its defined scope of property inspections and related procedures.
- When a user asks both an in-scope and an out-of-scope question in the same message, the chatbot should answer the property inspection question and politely decline the unrelated question.
- For the binary conversion question, the chatbot should briefly explain that it can assist with property inspection-related queries and redirect the user to the relevant topic.
- The chatbot must not provide tutorials, explanations, or other detailed content unrelated to its defined scope.
- Ensure this restriction is consistently enforced across mixed-topic questions and other out-of-scope requests.

---

## Tab 7: Reports Flow

### REP-01: Remove Redundant Filter Heading and Apply Button from Reports Page
- **Domain:** `Front-end` | **Priority:** `Medium` | **Severity:** `Low` | **Status:** `Todo`
- **Visual Evidence:** [Evidence Link](https://take.ms/Ezn0R)

#### Steps to Reproduce
- Open the Reports page.
- Observe the Filter heading, search bar, and Apply button.
- Search for a report by typing its name.

#### Actual Result
> The Filter heading and Apply button are displayed unnecessarily, making the interface cluttered.

#### Expected Result
Remove the Filter heading and Apply button. Keep the search bar and enable real-time search so matching reports appear automatically as the user types. If no matching reports exist, display a message such as “No reports found with this name.”

---

## Tab 8: Responsiveness

### Section: Mobile Viewport

### RESP-01: roperty Page Inspection Section Has Overlapping Content on Mobile Viewports
- **Domain:** `Front-end` | **Priority:** `Medium` | **Severity:** `Medium` | **Status:** `Todo`
- **Visual Evidence:** [Evidence Link](https://take.ms/auIYx)

#### Steps to Reproduce
- Log in to the application.
- Navigate to the Property page.
- Open individual property
- Scroll to the Inspections section.
- Switch to a mobile viewport.
- Observe the inspection name, team members, status tags, and action buttons.

#### Actual Result
> On mobile viewports, the inspection name and team members are not fully visible because the status tags and action buttons occupy space within the same layout.

#### Expected Result
- Adjust the inspection section layout for mobile screens so the inspection name and team members remain fully visible.
- Position the status tags and action buttons on a separate row below the inspection details, or in another responsive arrangement that prevents overlapping.
- Ensure appropriate spacing, alignment, and text wrapping for long inspection names and team member details.
- Prevent content clipping and horizontal overflow.
- Preserve the existing desktop and tablet layouts while ensuring the inspection section remains readable and usable across mobile screen sizes.

---

### RESP-02: Camera Closes Immediately When Opened on the Inspection Screen
- **Domain:** `Front-end` | **Priority:** `High` | **Severity:** `High` | **Status:** `Todo`
- **Visual Evidence:** [Evidence Link](https://take.ms/CllZI)

#### Steps to Reproduce
- Log in to the application as a user with access to inspections.
- Open an inspection and navigate to the inspection checklist.
- Click the option to open the camera to capture a photo.
- Observe the camera behavior.

#### Actual Result
> When the user opens the camera from the inspection screen, the camera does not remain open. The camera window closes immediately without allowing the user to capture a photo.

#### Expected Result
The camera should open successfully and remain active until the user captures a photo, cancels the action, or closes the camera manually. Ensure that camera permissions are handled correctly and that the camera does not close unexpectedly. After capturing a photo, the image should be available to attach to the relevant inspection checklist item.

---

### RESP-03: Property License and SKU Unit Fields Are Displayed Inline Instead of on Separate Lines
- **Domain:** `Front-end` | **Priority:** `Medium` | **Severity:** `Low` | **Status:** `Todo`
- **Visual Evidence:** [Evidence Link](https://take.ms/mwkw8)

#### Steps to Reproduce
- Log in to the application.
- Navigate to the Properties page.
- Open or view a property's details.
- Locate the Property License and SKU Unit fields.
- Observe how the two fields are displayed.

#### Actual Result
> The Property License and SKU Unit fields are displayed inline, appearing next to each other instead of on separate lines.

#### Expected Result
Display Property License and SKU Unit vertically, with each field on its own line. Ensure proper alignment, spacing, and readability while maintaining a consistent layout across supported screen sizes.

---

### RESP-04: Analytics Page Day Filters Are Overlapping Instead of Displaying in a Swipeable Slider
- **Domain:** `Front-end` | **Priority:** `Medium` | **Severity:** `Low` | **Status:** `Todo`
- **Visual Evidence:** [Evidence Link](https://take.ms/mWk9O)

#### Steps to Reproduce
- Log in to the application.
- Navigate to the Analytics page.
- Locate the day filter options.
- Observe the filter layout, particularly on mobile and tablet viewports.

#### Actual Result
> The day filter options appear on top of each other, creating a cluttered and visually inconsistent layout that makes the filters difficult to access.

#### Expected Result
- Display the day filter options in a horizontally scrollable, swipeable slider.
- Allow users to swipe horizontally on mobile and tablet devices to access all available filters.
- Keep the filters properly aligned, with consistent spacing and sizing.
- Ensure the selected filter remains clearly highlighted.
- Prevent overlapping, clipping, and unnecessary vertical stacking.
- Maintain a clean, responsive layout across mobile, tablet, and desktop viewports.

---

### RESP-05: Misaligned Headings in Audit Volume by Checklist Template / Asset Category and Inconsistent Icon Sizing on the Analytics Page
- **Domain:** `Front-end` | **Priority:** `Medium` | **Severity:** `Medium` | **Status:** `Todo`
- **Visual Evidence:** [Evidence Link](https://take.ms/OkZou)

#### Steps to Reproduce
- Log in to the application.
- Navigate to the Analytics page.
- Locate the Audit Volume by Checklist Template / Asset Category section.
- Observe the alignment of the section headings and the Active Checklist text.
- Review the icons throughout the Analytics page, particularly where text labels are long.

#### Actual Result
> - The headings in the Audit Volume by Checklist Template / Asset Category section appear inline with the Active Checklist text, resulting in a cluttered and inconsistent layout.
- Icons across the Analytics page do not maintain consistent sizing. When text content is large or lengthy, the icons shrink and appear uneven.

#### Expected Result
- Arrange the headings in the Audit Volume by Checklist Template / Asset Category section vertically, placing them on separate lines rather than inline with the Active Checklist text.
- Ensure appropriate spacing, alignment, and readability between headings and their associated content.
- Standardize icon dimensions throughout the entire Analytics page.
- Prevent icons from shrinking when adjacent text is long by applying fixed width and height constraints and appropriate flex-shrink settings.
- Ensure text and icons remain properly aligned without overlapping or breaking the layout.
- Verify consistent styling and responsive behavior across desktop, tablet, and mobile viewports.

---

### RESP-06: Cramped Specialist Performance Scorecards Layout and Inconsistent Icon Sizes
- **Domain:** `Front-end` | **Priority:** `Medium` | **Severity:** `Low` | **Status:** `Todo`
- **Visual Evidence:** [Evidence Link](https://take.ms/q9TJb)

#### Steps to Reproduce
- Open the Analytics page.
- Navigate to Specialist Performance Scorecards & Ranking.
- Observe the heading, description, Manage Team link, and icon sizes.

#### Actual Result
> The section looks cramped, and icons across the page have inconsistent sizes.

#### Expected Result
Make the heading and description full-width, place Manage Team below the description, and maintain consistent icon sizes throughout the Analytics page.

---

### RESP-07: Cramped Property Inspection Frequency & Issue Rates Layout and Inconsistent Icon Sizes
- **Domain:** `Front-end` | **Priority:** `Medium` | **Severity:** `Low` | **Status:** `Todo`
- **Visual Evidence:** [Evidence Link](https://take.ms/9PYz0)

#### Steps to Reproduce
- Open the Analytics page.
- Navigate to Property Inspection Frequency & Issue Rates.
- Observe the heading, description, All Properties link, and icon sizes.

#### Actual Result
> The heading and description do not use the full section width, the All Properties link is not positioned appropriately, and icon sizes are inconsistent.

#### Expected Result
Make the heading and description full-width, position All Properties below the description, and ensure consistent icon sizes throughout the Analytics page.

---

### RESP-08: Improve Search and Filter Layout and Enable Real-Time Filtering Across the Application
- **Domain:** `Front/Back-end` | **Priority:** `High` | **Severity:** `Medium` | **Status:** `Todo`
- **Visual Evidence:** [Evidence Link](https://take.ms/VN9bP)

#### Steps to Reproduce
- Open the Properties page.
- Locate the search and filter section.
- Observe the Filter text, Apply button, and filter layout.
- Enter a search term or change a filter and observe when the results update.

#### Actual Result
> Filters are stacked on top of each other, making the layout cluttered. The Apply button placement is not ideal, and users may need to click Apply to update results.

#### Expected Result
Replace the Filter text beside the search field with the Apply button. Display filter options in a horizontal, swipeable slider to prevent vertical stacking. Enable real-time search and filtering so results update automatically as users type or change filters, eliminating the need to click Apply where possible. Apply these layout and behavior improvements consistently across all search and filter sections throughout the application.

---

### RESP-09: Misaligned Tenant and Staff Tags on Mobile Property Lists
- **Domain:** `Front-end` | **Priority:** `Medium` | **Severity:** `Low` | **Status:** `Todo`
- **Visual Evidence:** [Evidence Link](https://take.ms/aKvM5)

#### Steps to Reproduce
- Open the Properties page.
- Observe the property name and Tenant/Staff tags in the property list.

#### Actual Result
> The Tenant and Staff tags are not positioned appropriately on mobile, affecting the layout and readability.

#### Expected Result
Place the Tenant and Staff tags below the property name in each property list item on mobile viewports. Ensure proper spacing, alignment, and responsiveness without affecting the desktop layout.

---

### RESP-10: Inconsistent Placement of Tenant and Current Inspections Tags in Team Members List
- **Domain:** `Front-end` | **Priority:** `Medium` | **Severity:** `Low` | **Status:** `Todo`
- **Visual Evidence:** [Evidence Link](https://take.ms/Q8T1G)

#### Steps to Reproduce
- Open the Team page.
- Locate the Team Members list.
- Observe the placement of the Tenant and Current Inspections tags relative to team member names.

#### Actual Result
> The tags appear inline with the team member name in some entries and below the name in others, resulting in an inconsistent layout.

#### Expected Result
Consistently place the Tenant and Current Inspections tags below each team member's name in the Team Members list, regardless of name length. Maintain proper spacing and alignment across all screen sizes.

---

### RESP-11: Inconsistent Alignment of Team Member Action Buttons
- **Domain:** `Front-end` | **Priority:** `Medium` | **Severity:** `Low` | **Status:** `Todo`
- **Visual Evidence:** [Evidence Link](https://take.ms/7KyyS)

#### Steps to Reproduce
- Open the Team page.
- Locate a team member's action buttons.
- Observe the alignment of the Make (Specialist/Admin), Activate/Deactivate, and Delete actions relative to the Open Tenant Admin/Open Specialist Panel button.

#### Actual Result
> Action buttons are inconsistently positioned, with some appearing inline with the panel button and others below it.

#### Expected Result
Place the Make (Specialist/Admin), Activate/Deactivate, and Delete actions in a single row below the Open Tenant Admin/Open Specialist Panel button. Ensure consistent alignment, spacing, and responsive behavior across all team members and screen sizes.

---

### RESP-12: Misaligned Auto Generate If Blank Option and Oversized Placeholder Text in Add Team Member Form
- **Domain:** `Front-end` | **Priority:** `Medium` | **Severity:** `Low` | **Status:** `Todo`
- **Visual Evidence:** [Evidence Link](https://take.ms/Xt0y2)

#### Steps to Reproduce
- Open the Team page.
- Click Add Team Member.
- Observe the Temporary Password heading, Auto Generate If Blank option, and input placeholder.

#### Actual Result
> The Auto Generate If Blank option appears inline with the Temporary Password heading, making the layout messy. The placeholder text is too large and is not fully visible.

#### Expected Result
Place Auto Generate If Blank below the Temporary Password heading. Reduce the input placeholder font size or adjust its styling so the full text is clearly visible. Maintain consistent spacing and alignment.

---

### RESP-13: Improve Team Page Search and Filter Layout with Real-Time Results
- **Domain:** `Front-end` | **Priority:** `High` | **Severity:** `Medium` | **Status:** `Todo`
- **Visual Evidence:** [Evidence Link](https://take.ms/y6AVC)

#### Steps to Reproduce
- Open the Team page.
- Observe the search bar, Filter heading, Apply button, and filter dropdowns.
- Search for a team member or change a filter.

#### Actual Result
> The filters and dropdowns are stacked vertically, creating a cluttered layout. The search and filter results may require clicking Apply to update.

#### Expected Result
Place the Apply button to the right of the search bar, replacing the Filter heading. Display filter options and dropdowns in a horizontal, swipeable slider below the search bar. Enable real-time search and filtering so results update automatically as the user types or changes a filter, without requiring an Apply click wherever possible. Maintain a clean, responsive layout across desktop, tablet, and mobile.

---

### RESP-14: Top Header Scrolls with Page Content on Mobile and Tablet Views
- **Domain:** `Front-end` | **Priority:** `Medium` | **Severity:** `Low` | **Status:** `Todo`
- **Visual Evidence:** [Evidence Link](https://take.ms/mynX4)

#### Steps to Reproduce
- Open the web application on a mobile or tablet viewport.
- Navigate to any page.
- Scroll down and observe the top header.

#### Actual Result
> The top header scrolls away with the page content, making navigation less accessible.

#### Expected Result
Keep the top header fixed at the top on mobile and tablet viewports while the page content scrolls beneath it. Ensure proper spacing so content is not hidden behind the header and maintain consistent behavior across pages.

---

### RESP-15: Inconsistent Performance Tab Naming Across Viewports
- **Domain:** `Front-end` | **Priority:** `Low` | **Severity:** `Low` | **Status:** `Todo`
- **Visual Evidence:** [Evidence Link](https://take.ms/rkSy9g)

#### Steps to Reproduce
- Log in as a Member/Specialist.
- Open the application on a desktop viewport and observe the Performance tab.
- Switch to a mobile or tablet viewport and observe the tab name.

#### Actual Result
> The tab is named Performance on desktop but Scorecard on mobile and tablet.

#### Expected Result
Use Performance consistently across desktop, tablet, and mobile viewports for both Members and Specialists.

---

### Section: Tablet Viewport

### RESP-16: Inconsistent Alignment of Tenant Name and Open Inspection Tags on Tablet View
- **Domain:** `Front-end` | **Priority:** `Medium` | **Severity:** `Low` | **Status:** `Todo`
- **Visual Evidence:** [Evidence Link](https://take.ms/rybQL) [Evidence Link](https://take.ms/R6ack)

#### Steps to Reproduce
- Open the Team page on a tablet viewport.
- Locate the Team Members list.
- Observe the Tenant Name and Open Inspection tags beside each team member's name.

#### Actual Result
> The tags appear inline with the team member's name in some entries but move below the name in others, creating an inconsistent layout.

#### Expected Result
Consistently display the Tenant Name and Open Inspection tags inline with the team member's name on tablet viewports. Ensure proper spacing and alignment without overlapping or clipping content.

---

### Critical Infrastructure Note (Server Stability)
> Site goes down quite often kindly check this please.
https://take.ms/6Xu3k
