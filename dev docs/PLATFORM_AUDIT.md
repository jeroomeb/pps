# Platform audit

An honest read of Amenity Op’s as it stands. This is about the inspection platform. Lead generation and the reply assistant are separate and are not part of this project.

The platform is usable for a small number of buildings on one timezone. It is not yet safe to treat as a finished multi-tenant product. The nightly risk score should not be built on top of it until the items below are faced.

---

## Serious flaws

### A tenant admin can open another company’s finished report

The report screen checks only that the person is an admin, then loads the inspection with a key that skips the database rules. A report link is enough. That page includes the checklist, photos, and the GPS trail.

The “open this tenant’s dashboard” view only filters some lists. It does not seal the records. Pasting an address from another tenant still opens it. The same gap applies to any screen that loads a record by its id without checking the tenant, including the PDF download path that uses the same kind of key.

### Bank account and routing numbers are stored in plain text

They sit on the specialist’s profile and are loaded back into the browser in full. A database backup, a stolen admin session, or a too-wide profile query exposes them. For direct deposit, store a processor token, or encrypt the numbers and show only the last four.

### There are no automated tests

The project has already shipped bugs that a green build did not catch: inspection pages that showed “not found” because a query failed, a submit path that could not load its own data, and timezone text that threw only when a real page rendered. The next risk-score change will go through the same hole.

### The whole product runs on one Eastern clock

Schedules, “today,” and the proposed 4:00 PM score all use that one zone. A California building gets the wrong evening and the wrong weekday. Midnight Eastern is 9:00 PM in California, which falls in the middle of a night shift. Each property needs its own timezone before a nightly score means anything. People should see that local time labeled on screen (PDT, EDT, and so on).

### Every list loads every row

Properties, inspections, reports, and team have no paging. That is fine for a pilot. A regional manager with a real portfolio will get slow pages and heavier database calls. The afternoon risk job will make that worse, because it has to read months of checklist rows for every building.

### The server setup is fragile

The site and the production build share one machine, so a build or a large photo PDF can take the public site down. That is the intermittent 502. A clean install on the new server also failed because the dependency lockfile does not match the packages. Automatic deploys have to point at the current server, or the next push updates the wrong machine.

### Database changes are applied by hand

The app assumes each migration is already on the live database. This product has already gone down because a migration was recorded as done and was not there. The checklist-access, building-type, and bank-detail work depends on a migration that must be confirmed in production before those screens are trusted.

### Query failures are hidden

Several screens force a database result into the shape the page expects. When a relationship is added, those queries fail and the page treats the failure as “nothing here” or “page not found.” That has already happened twice.

---

## What is solid

Login is required. Public signup is off. A finished inspection is frozen. Photos and fail comments are enforced. The main tables have row-level rules. The checklist, the PDF, and the morning email are the real product, and they work when the database matches the code.

---

## Fix these before the risk score

1. Make a finished report, its PDF, and its photos readable only by that inspection’s own tenant.
2. Stop storing full bank account and routing numbers in plain text.
3. Give each property a timezone, and use it for schedules and for the 4:00 PM score.
4. Confirm every migration is actually on the live database.
5. Point deploys at the current server and stop building in a way that knocks the live site over.
6. Add a few tests that fail the build: one tenant cannot read another’s report, a completed checklist cannot be edited, and a California property is scored on Pacific time.

The risk score can then be a warning on top of real history. Built first, it will print a precise number from incomplete data, the wrong clock, and checklists that are not yet grouped into risk categories.
