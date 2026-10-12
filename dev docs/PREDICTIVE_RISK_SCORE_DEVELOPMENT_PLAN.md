# Development plan: nightly risk score

How to build the predictive risk score into the existing Amenity Op’s app. This is the coding plan. It follows `PREDICTIVE_RISK_SCORE.md` and the client spec `Predictive Risk-Score Modeling.md`.

One decision overrides both of those documents. The score runs at **4:00 PM in the property’s own timezone**, not 4:00 PM Eastern for every building. A California property is scored on Pacific time. Thursday night means Thursday at that building. The client asked for this directly.

Lead generation and the reply assistant are out of scope.

---

## What “done” means

A property with at least 30 days of completed checklists shows a score from 1 to 100 after 4:00 PM local time. Life-safety failures pull the score up more than appearance failures. The two or three risk areas most likely to fail tonight are named, with a plain-language reason.

The specialist sees that score and those areas before starting. Those areas sit at the top of the checklist. Every item is still answered. Pass, fail, N/A, photos, and fail comments do not change.

The manager sees the same snapshot on the property. The morning report and the PDF show the score that was in effect when the visit began, next to what the visit actually found in those areas.

A property without enough history shows no score, and its checklist stays in the normal order.

The score does not change while a checklist is in progress.

---

## How the score is calculated

Do this in TypeScript inside the Next.js app. Do not add a Python service or scikit-learn on the VPS.

The client spec names Random Forest or logistic regression. Per property, 30 to 90 days of checklist rows is too small for a forest. It will memorize noise and still print a confident number. A second runtime on the same machine that already drops the site during a build is how this project fails in production.

The model that will succeed here is a weighted failure rate, which is the small-data form of logistic regression:

- Look back at most 90 days, and ignore anything older.
- Require completed inspections that span at least 30 days. Otherwise write no score.
- Group items by risk area, not by the checklist’s display category. The three areas are `life_safety`, `appearance`, and `asset_protection`.
- A failure counts. Pass and N/A do not.
- Weights: life-safety 3, asset protection 2, appearance 1.
- Split each area’s history by weekday. Thursday waste failures raise Thursday’s waste risk and do not raise Monday’s.
- If the property has coordinates and the evening forecast says rain, raise asset-protection risk only. Rain does not raise a gate-latch risk.
- A US federal holiday weekend slightly raises areas that have already failed on previous weekends at that property. It does not invent a risk the building has never shown.
- Turn the weighted rates into one score from 1 to 100. Cap it. A single bad night cannot produce 100 if the rest of the month was clean.
- Pick the top two or three areas whose rate is actually elevated. If only one area has ever failed, flag that one. Do not pad the list to three.
- Store a short reason built from the inputs, for example “Waste items fail here on Thursday evenings” or “Rain tonight, and leak items have failed here recently.”

The scoring function must be pure: history in, score out, no database call inside it. That is the piece that gets a test.

---

## Data

Next migration: `supabase/migrations/0017_property_risk_scores.sql`. Update `supabase/schema.sql` and `src/lib/database.types.ts` in the same change.

**Tag the questions.** Add `risk_domain` on `checklist_template_items`, limited to `life_safety`, `appearance`, or `asset_protection`. Copy that value onto `inspection_items` when an inspection is created, the same way `service_category` is already copied. Old and in-progress inspections then keep the tag they were created with.

Backfill existing template items with keyword rules (gate, fire, egress, lock, trash, dumpster, curb, valve, leak, parcel, temperature). Leave a null where the rule is unsure. An admin can set the domain on the template item. Items with no domain are ignored by the scorer and stay in their normal checklist position.

**Property timezone.** Add `properties.timezone` as an IANA name, default `America/New_York`. The property form sets it. The city and state are not a reliable substitute, so the form has an explicit zone. Display of this property’s score and “Thursday” uses this zone. The rest of the app can keep `APP_TIMEZONE` until a later pass.

**Daily score, not a single column on the property.** The client spec says to write the score onto the property. That loses yesterday and lets a later run change the number a morning report already showed. Add `property_risk_scores`:

- `property_id`
- `local_date` (the evening this score is for, in the property’s zone)
- `score` (1–100)
- `flags` (the areas, in order, with the rate that earned the flag)
- `summary` (the plain-language reason)
- `weather` (what was used, or empty when coordinates are missing)
- `calculated_at`
- one row per property per local date

**Freeze the prediction on the visit.** On `inspections`, add `predicted_score`, `predicted_flags`, `predicted_summary`, and `predicted_local_date`. The first time a specialist opens a pending or in-progress checklist after that evening’s score exists, copy the score onto the inspection if those columns are still empty. Later refreshes do not overwrite them. The morning report reads the inspection, not the property’s latest score.

Row-level security: a tenant admin and an assigned specialist can read scores for their properties. Only the server job writes them.

---

## Weather and holidays

Use the property’s existing latitude and longitude. Call a free forecast that needs no API key (Open-Meteo is enough) for rain on that local evening. If the property has no coordinates, score from history and weekday only, and say so in the summary. Do not block the job on a weather outage. Cache the forecast for that property and local date so the hourly job does not call out on every run.

Holidays for the first version are US federal holidays plus the adjacent weekend. Anything more local waits until a tenant actually needs it.

---

## When it runs

There is no scheduler inside the Next.js process. Add `src/app/api/cron/risk-scores/route.ts`, protected by a `CRON_SECRET` header. A cron entry on the VPS calls it once an hour.

Each run:

1. Loads active properties.
2. Skips a property whose local time is before 4:00 PM.
3. Skips a property that already has a `property_risk_scores` row for today’s local date.
4. Loads that property’s completed inspection items from the last 90 days.
5. Runs the pure scorer.
6. Inserts the daily row, or inserts nothing when history is under 30 days.

Running hourly is what makes California and New York both hit 4:00 PM local without a second clock. One cron at 4:00 PM Eastern would score California at 1:00 PM Pacific and would call Thursday evening “Friday” after 9:00 PM Pacific.

---

## Screens

**Checklist order is display-only.** `ActiveInspectionChecklist` already groups items by `service_category`. When the inspection has frozen flags, render the categories that contain flagged domains first. Do not rewrite `sort_order` on the template or on `inspection_items`. A reorder would permanently change the checklist and would fight the template reorder screen.

**Specialist.** On the assigned property, before the questions, show the score, the flagged areas, and the summary. Hide the block when the inspection has no frozen prediction.

**Manager.** On the property page, show today’s score when a row exists for the property’s local date. This is the pre-shift alert.

**Morning report and PDF.** In `src/app/admin/reports/[id]/page.tsx` and `src/lib/pdf/InspectionReport.tsx`, add one section: predicted score, flagged areas, and the pass / fail / N/A counts from this visit inside those areas. Omit the section when the inspection has no frozen prediction.

**Template editor.** Each template item needs a risk-area control so a wrong backfill can be corrected. New items require a domain before save.

**Property form.** Timezone field, default Eastern, labeled in plain language (“Pacific Time”, not only `America/Los_Angeles`).

---

## Build order

Each phase is finished only when its check passes. Do not start the next phase on a failed check.

### Phase 1 — Tags, timezone, and storage

Migration `0017`, types, template-item domain, property timezone, daily score table, inspection snapshot columns, keyword backfill.

Check: existing templates have a domain on the obvious items and null on the rest. Creating an inspection copies the domain onto its items. A property saves a timezone. `npx tsc --noEmit` is clean.

### Phase 2 — Scorer

`src/lib/risk-score.ts` plus a small `node:test` file with fixed histories. No database.

Check, from the tests:

- No score under 30 days of history.
- A Thursday-only waste pattern flags appearance on Thursday and not on Monday.
- A life-safety failure outranks a larger number of appearance failures.
- Rain raises asset protection and does not raise life-safety.
- The score stays inside 1–100.
- Fewer than two real patterns does not invent extra flags.

### Phase 3 — Afternoon job

Cron route, weather helper, holiday helper, hourly VPS cron, secret.

Check: calling the route twice on the same local date does not create two rows. A property before 4:00 PM local is skipped. A property with no coordinates still gets a score from history. A bad weather response does not fail the whole run.

### Phase 4 — Freeze, screens, and PDF

Copy the score onto the inspection on first open. Specialist banner. Category display order. Manager snapshot. Report section. PDF section.

Check: open a checklist, then run the scorer again, and confirm the inspection’s stored prediction did not change. Flagged categories are first. The other categories follow in their previous order. Submit still requires every item. The PDF section matches the on-screen section. A property with no score looks like today’s checklist.

### Phase 5 — Confirm on a real property

Use one property that already has completed visits, set its timezone, run the job by hand, open the checklist as the specialist, submit, and read the morning report.

Check: the number on the specialist screen, the manager screen, and the PDF are the same number. The reason text matches the history (the Thursday example, if the data has that shape).

---

## Files to add or change

| Piece | Where |
| --- | --- |
| Migration | `supabase/migrations/0017_property_risk_scores.sql`, `supabase/schema.sql` |
| Types | `src/lib/database.types.ts` |
| Scorer and tests | `src/lib/risk-score.ts`, `src/lib/risk-score.test.ts` |
| Weather and holidays | `src/lib/weather.ts`, `src/lib/us-holidays.ts` |
| Job | `src/app/api/cron/risk-scores/route.ts` |
| Copy domain onto new items | the inspection-creation path that already snapshots checklist rows |
| Freeze score on open | `src/app/inspector/inspections/[id]/page.tsx` |
| Checklist order and banner | `src/components/ActiveInspectionChecklist.tsx` |
| Manager snapshot | `src/app/admin/properties/[id]/page.tsx` |
| Template control | template item form on `src/app/admin/checklists/[id]` |
| Property timezone | `src/components/PropertyForm.tsx` and the property actions |
| Morning report | `src/app/admin/reports/[id]/page.tsx`, `src/lib/pdf/InspectionReport.tsx`, `src/lib/pdf/generate.ts` |

---

## Rules that keep the build from going wrong

- Do not mark an item failed because it was predicted. Only the specialist’s answer does that.
- Do not email anyone from this feature.
- Do not read or write the marketing mailbox.
- Do not change checklist validation, photo rules, or the completed-inspection freeze.
- Do not let the cron use the anon key. It uses the service role, like the other server jobs, and the route rejects calls without `CRON_SECRET`.
- Do not deploy the job until migration `0017` is applied on the live database. This project has already broken by assuming a migration was there.
- Apply the migration in the Supabase SQL editor and confirm the new columns exist before testing the screens.
