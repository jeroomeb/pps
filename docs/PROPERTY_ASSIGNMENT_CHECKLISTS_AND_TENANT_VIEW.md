# Property assignment, standing checklists, tenant dashboard, and ACH

Date: 2026-09-29

This document records the work done for the client’s assignment-model change. It lists every file created or updated, what each file does, and what has to be applied before testing.

Typecheck (`npx tsc --noEmit`) was clean after these changes. The new database objects are not live until the migration below is run in the Supabase SQL editor.

---

## What the client asked for

1. When a provisional tenant is added, and again when a property is added, choose which checklists they can use. More than one checklist can be enabled.
2. Work is assigned by assigning a specialist to a property, not by creating a one-off inspection on the property page. There is an on/off switch so checklists can stay available 24/7. After a specialist submits a checklist, it stays pending for the next visit when that switch is on.
3. When a specialist is assigned to a property, they receive an email.
4. A property under HQ records both a building type and a compensation tier, because payout is the cell where those two meet on the existing 3×3 matrix.
5. The specialist profile has an enable/disable section for ACH: bank name, account number, and routing number.
6. Each corporate client stays inside its own tenant boundary. HQ can open that tenant’s admin dashboard the same way it opens a specialist panel. The client was unsure what item 6 meant, so this is the piece for them to test: while HQ is inside a tenant dashboard, lists are limited to that company.

A separate, already-aligned change is also in these files: provisioning a tenant creates an optional **new primary administrator** (name, email, temporary password). It does not promote an existing specialist to admin.

---

## Behavior

### Checklist access

- HQ turns checklist types on for a tenant when the tenant is provisioned, and can change that list later from the tenant card.
- Existing tenants are backfilled with every current checklist template so they are not locked out.
- A property can enable one or more of the checklists its organization is allowed to use.
- If a property is saved with a checklist the tenant is not allowed to use, that checklist is dropped.

### Standing inspections

- Assigning a specialist to a property opens a pending inspection for each enabled checklist on that property, for that specialist.
- If **Available 24/7** is on, submitting a checklist creates a fresh pending copy for the same specialist, property, and checklist, as long as they are still assigned and the checklist is still enabled.
- If **Available 24/7** is off, a completed checklist is not reopened.
- Existing properties default to 24/7 **off**, so old work does not suddenly regenerate. New properties default the checkbox to **on**.
- Removing a specialist cancels their **pending** inspections on that property. In-progress and completed inspections are left alone.
- The **New Inspection** form was removed from the property page. The global `/admin/inspections/new` route is still in the app for a one-off scheduled visit.

### Property assignment email

- The first time a specialist is added to a property, they get an email with the property name, address, enabled checklist names, and whether 24/7 access is on.
- Re-saving an existing roster row does not send another email.
- Assigning yourself does not send the email.
- A mail failure does not undo the assignment.

### Payout category and tier

- Property form fields: **Property type** (Luxury Condominium, 55+ Active Adult Community, Commercial Multi-Tenant) and **Compensation tier** (Tier 1, Tier 2, Tier 3, or a custom flat rate).
- On inspection completion, the payout uses the property’s building type and tier against `tenants.payout_matrix`.
- If the property has no building type yet, the completion route still falls back to guessing the category from the checklist name.

### ACH

- On `/inspector/profile`, the specialist can turn direct deposit on.
- When it is on, bank name, a 4–17 digit account number, and a 9-digit routing number are required.
- Turning it off and saving clears the stored bank name, account number, and routing number.

### HQ tenant dashboard

- Each tenant card has **Open dashboard**. It opens `/admin` in a new tab.
- A cookie named `amenity_view_tenant_id` is set for 4 hours.
- The admin shell switches to the normal tenant-admin navigation (the Tenants item is hidden) and shows a banner: **HQ tenant view**, with **Exit to HQ** and **Close tab**.
- While the cookie is set, these admin lists are limited to that tenant: dashboard, properties, inspections, reports, team, analytics, payouts, and checklists.
- Exit clears the cookie and returns to `/admin/tenants`.
- The cookie is shared by the browser, same as specialist impersonation. The original HQ tab will also be scoped on its next load until you exit.

---

## Database

### Migration to apply

`supabase/migrations/0016_checklist_access_property_category_ach.sql`

Run this once in the Supabase SQL editor before testing. It is written to be safe to re-run (`if not exists`, `on conflict do nothing`).

`supabase/schema.sql` was updated so a fresh install matches this migration.

### New columns

| Table | Column | Purpose |
| --- | --- | --- |
| `properties` | `building_category` | `luxury`, `adult`, or `commercial`. Nullable so existing properties are not forced into a type. |
| `properties` | `checklist_always_available` | 24/7 standing checklists. Default `false`. |
| `profiles` | `ach_enabled` | Direct-deposit switch. Default `false`. |
| `profiles` | `bank_name` | ACH bank name. Cleared when ACH is turned off. |
| `profiles` | `bank_account_number` | ACH account number. Cleared when ACH is turned off. |
| `profiles` | `bank_routing_number` | ACH routing number. Cleared when ACH is turned off. |

### New tables

| Table | Purpose |
| --- | --- |
| `tenant_checklist_access` | Which checklist templates a tenant may use. Primary key `(tenant_id, template_id)`. |
| `property_checklist_access` | Which of those templates are enabled on a property. Primary key `(property_id, template_id)`. |

Both tables have row-level security. Global admins manage tenant checklist access. A tenant admin can manage checklist access on their own properties. Assigned specialists can read the checklists enabled on their properties.

The migration also copies every current checklist template onto every existing tenant so current organizations keep access.

---

## Files created

| File | What it does |
| --- | --- |
| `supabase/migrations/0016_checklist_access_property_category_ach.sql` | Database migration described above. |
| `src/lib/building-category.ts` | Building-type values, labels, and the map onto payout-matrix keys (`luxury_condo`, `adult_community`, `commercial_multi`). |
| `src/lib/checklist-access.ts` | Reads `template_ids` from a form, replaces a tenant’s or property’s checklist rows, and drops templates the tenant is not allowed to use. |
| `src/lib/standing-inspections.ts` | Opens a pending inspection when a checklist should be on a specialist’s board, renews it after a 24/7 submission, and cancels pending inspections when a specialist is removed. Uses the service-role client. |
| `src/lib/email/sendPropertyAssignmentEmail.ts` | Branded Resend email: property assigned, address, checklist names, 24/7 note. |
| `src/lib/auth/tenant-view.ts` | Reads `amenity_view_tenant_id`. Global HQ with no cookie still sees every tenant. A normal tenant admin stays on their own tenant. HQ with the cookie is scoped to that one tenant. |
| `src/components/TenantViewBanner.tsx` | Sticky banner while HQ is inside a tenant dashboard. Exit and close-tab controls. |
| `src/app/admin/tenants/[id]/open/route.ts` | Global-admin-only route. Confirms the tenant exists, sets the view cookie, redirects to `/admin`. |
| `src/app/api/tenant-view/exit/route.ts` | Clears the view cookie and redirects to `/admin/tenants`. |
| `docs/PROPERTY_ASSIGNMENT_CHECKLISTS_AND_TENANT_VIEW.md` | This file. |

---

## Files updated

### Tenant provisioning and tenant cards

| File | What changed |
| --- | --- |
| `src/components/CreateTenantForm.tsx` | Optional primary administrator (name, email, temporary password) instead of assigning an existing specialist. Checklist checkboxes for the new tenant. Success toast. If a password is generated, it stays on screen with a Copy button. |
| `src/components/TenantLicenseCard.tsx` | **Open dashboard** link. Checklist checkboxes in the edit form. Specialist roster assignment and delete stay as they were. |
| `src/app/admin/tenants/page.tsx` | Loads checklist templates and current tenant access, and passes them into the create form and each tenant card. |
| `src/lib/actions/tenants.ts` | Creating a tenant can provision a new admin user and welcome email, and saves checklist access. Updating a tenant saves checklist access when the edit form is submitted. A tenant cannot be its own parent. A name or password without an admin email is rejected. Empty slugs get a fallback. |

### Properties and assignments

| File | What changed |
| --- | --- |
| `src/components/PropertyForm.tsx` | Building type, compensation tier, 24/7 checkbox, and checklist checkboxes. For HQ, the checklist list follows the selected organization. |
| `src/app/admin/properties/new/page.tsx` | Loads templates and tenant checklist access for the form. |
| `src/app/admin/properties/[id]/edit/page.tsx` | Loads the property’s building type, 24/7 flag, and enabled checklists into the form. |
| `src/app/admin/properties/[id]/page.tsx` | Removed the New Inspection form. The inspections list explains which checklists are enabled and whether 24/7 is on. While HQ is viewing a tenant, a property from another tenant does not open. |
| `src/lib/actions/properties.ts` | Saves building type, 24/7, and property checklist rows. While HQ is viewing a tenant, new properties are created in that tenant. After save, standing inspections are opened for assigned specialists. |
| `src/lib/actions/property-assignments.ts` | Assignment stores the property’s tenant id. New assignments open standing inspections and send the property email. Removal cancels that specialist’s pending inspections on the property. |
| `src/app/api/inspections/[id]/complete/route.ts` | Payout uses the property’s building type when it is set. After a successful submit, a 24/7 checklist is renewed. |

### Specialist profile

| File | What changed |
| --- | --- |
| `src/components/InspectorProfileForm.tsx` | ACH enable/disable section and the three bank fields. |
| `src/app/inspector/profile/page.tsx` | Loads the ACH columns into the profile form. |
| `src/lib/actions/team.ts` | `updateOwnProfile` accepts and validates ACH fields. Turning ACH off clears the bank columns. Role, tenant, and other privileged columns are still blocked by the existing database guard. |

### HQ viewing a tenant

| File | What changed |
| --- | --- |
| `src/app/admin/layout.tsx` | Shows `TenantViewBanner`. While viewing a tenant, navigation is the tenant-admin nav and payouts follow that tenant’s payout flag. |
| `src/app/admin/page.tsx` | Dashboard properties and inspections are scoped to the viewed or own tenant. |
| `src/app/admin/properties/page.tsx` | Property list and location filters are scoped. |
| `src/app/admin/inspections/page.tsx` | Inspection list is scoped. |
| `src/app/admin/reports/page.tsx` | Completed reports are scoped. |
| `src/app/admin/team/page.tsx` | Team list is scoped to that tenant’s profiles. |
| `src/app/admin/analytics/page.tsx` | Analytics inspections are scoped. |
| `src/app/admin/payouts/page.tsx` | Payout settings and ledger use the viewed tenant when HQ is inside one. |
| `src/app/admin/checklists/page.tsx` | Checklist library is limited to templates that tenant is allowed to use. |

### Types, schema, and project memory

| File | What changed |
| --- | --- |
| `src/lib/database.types.ts` | `BuildingCategory`, ACH columns on `profiles`, building type and 24/7 on `properties`, and the two checklist-access tables with their foreign keys. |
| `supabase/schema.sql` | Same columns, tables, and RLS policies as the migration, for a fresh database. |
| `CLAUDE.md` | Status-log entry for this work, including the migration that must be applied. |

---

## How to test

1. Run `supabase/migrations/0016_checklist_access_property_category_ach.sql` in the Supabase SQL editor.
2. Restart or reload the app so it is serving this code.
3. As HQ, open **Tenants & Licenses**.
   - Provision a tenant with at least one checklist selected and an admin email. Copy the temporary password shown after success.
   - Sign in as that admin and confirm the first login forces a password change and the dashboard is the tenant admin dashboard.
   - Back as HQ, use **Open dashboard** on that tenant. Confirm properties, team, and reports are only that company’s. Use **Exit to HQ**.
4. Add a property inside that tenant.
   - Set property type and tier.
   - Enable one or more checklists.
   - Leave **Available 24/7** on.
5. Assign a specialist on that property.
   - They should receive the assignment email.
   - Their specialist dashboard should show a pending checklist for each enabled type.
6. Submit one checklist.
   - The completed run should become a report.
   - A new pending copy of the same checklist should appear.
7. Edit the property and turn 24/7 off. Submit again. A new pending copy should not appear.
8. Remove the specialist. Their still-pending checklist on that property should be cancelled.
9. On `/inspector/profile`, turn ACH on, save valid bank details, then turn it off and save. The numbers should clear.

---

## Left as-is on purpose

- `/admin/inspections/new` still exists for a one-off scheduled inspection. The client asked for the New Inspection block on the **property** page to go away.
- Item 6 did not add a new kind of wall. The existing tenant boundary is what HQ is now looking through when they open a tenant dashboard.
- ACH numbers are stored on `profiles` and are readable by the specialist and by admins who can already read that profile. They are not emailed. Turning the section off deletes them.
- Photos, GPS, payouts enable/disable, and the specialist impersonation panel were not redesigned.
