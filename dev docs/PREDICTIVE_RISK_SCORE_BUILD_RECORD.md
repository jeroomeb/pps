# Predictive risk score — build record

Built 2026-10-10. This is the record of the nightly risk score that was added to Amenity Op's. The product description is `dev docs/PREDICTIVE_RISK_SCORE.md`. The coding plan is `dev docs/PREDICTIVE_RISK_SCORE_DEVELOPMENT_PLAN.md`. This file is what changed in the code, and how to test it.

The score is a number from 1 to 100 for one property for one local evening. It is a weighted failure rate over completed checklists, calculated in TypeScript. It is not a separate Python or machine-learning service.

## What the feature does

- Each property has its own IANA timezone. The score for that property is written once the local time is 4:00 PM or later. A California property is not scored on an Eastern clock.
- The lookback is 90 days. If the completed answers do not span at least 30 days, there is no score. The checklist stays in its normal order.
- Only Pass and Fail answers count. N/A and unanswered items are ignored.
- Three risk areas, with weights: life safety 3, asset protection 2, appearance 1. A question with no area is left out of the score.
- When the same weekday has at least two answered items in an area, that weekday's failure rate is used. Otherwise the overall rate for the area is used.
- Rain (forecast chance of precipitation at least 50) multiplies the asset-protection rate by 1.25, capped at 100 percent. If coordinates are missing or the weather request fails, rain is not applied.
- On a US federal holiday weekend, a higher weekend failure rate is blended in when the weekend sample has at least two answers.
- Up to three areas with a failure rate above zero are kept, ranked by weight times rate. Empty areas are not added to fill the list.
- The score does not mark any checklist item failed. Category order on the open checklist is display only. Template `sort_order` is not rewritten.
- The first time someone opens a pending or in-progress inspection, today's property score is copied onto that inspection. Later score runs do not replace it. The morning report and the PDF compare that frozen prediction with what this visit actually recorded.

## Database

Apply `supabase/migrations/0017_property_risk_scores.sql` in the Supabase SQL editor before using the screens. It is idempotent. `supabase/schema.sql` matches it for a fresh install. Until 0017 is applied, pages that select the new columns will fail.

The migration adds:

- `checklist_template_items.risk_domain` and `inspection_items.risk_domain` (`life_safety`, `appearance`, `asset_protection`, or null)
- `properties.timezone` (default `America/New_York`)
- `inspections.predicted_score`, `predicted_flags`, `predicted_summary`, `predicted_local_date`
- table `property_risk_scores` (one row per property per local date)
- a keyword backfill on template items, then a copy of those areas onto existing inspection items
- a select policy so a global admin, a same-tenant admin, or a specialist assigned to the property can read scores. The hourly job writes with the service role.

Life-safety keywords win over appearance and asset protection when a question matches more than one area. An admin can change the area on the checklist template afterward.

## Files added

- `supabase/migrations/0017_property_risk_scores.sql`
- `src/lib/risk-domain.ts` — areas, labels, weights, keyword inference
- `src/lib/property-timezones.ts` — US timezone list and local date/hour helpers
- `src/lib/us-holidays.ts` — observed US federal holidays and the attached weekend
- `src/lib/weather.ts` — Open-Meteo daily precipitation probability
- `src/lib/risk-score.ts` — the pure scorer, flag parser, and outcome counts
- `src/lib/risk-score.test.ts` — six tests for the scorer
- `src/lib/risk-score-job.ts` — hourly refresh and freeze-on-open
- `src/app/api/cron/risk-scores/route.ts` — `GET` and `POST`, Bearer `CRON_SECRET`
- `src/components/RiskScoreBanner.tsx` — score, summary, and "check first" line
- `scripts/ts-extension-loader.mjs` and `scripts/register-ts-extension.mjs` — let Node run the TypeScript test without changing app imports

## Files changed

- `supabase/schema.sql` — same columns, table, and select policy as the migration
- `src/lib/database.types.ts` — `RiskDomain`, `RiskFlag`, and the new columns and table
- `src/lib/actions/checklists.ts` — infer or save the risk area; keep it when items are reordered
- `src/lib/actions/inspections.ts` — copy the area onto items when an inspection is created
- `src/lib/standing-inspections.ts` — same copy when a standing checklist opens a new visit
- `src/lib/actions/properties.ts` — save `timezone` on create and update
- `src/components/PropertyForm.tsx` — property timezone select
- `src/app/admin/properties/[id]/edit/page.tsx` — loads the saved timezone into the form
- `src/app/admin/properties/[id]/page.tsx` — today's score on the property page
- `src/components/AddChecklistItemForm.tsx` — required risk area on a new item
- `src/components/ChecklistItemReorder.tsx` — change an item's risk area
- `src/app/admin/checklists/[id]/page.tsx` — loads `risk_domain` for that editor
- `src/app/inspector/inspections/[id]/page.tsx` — freezes the score and passes it to the checklist
- `src/components/ActiveInspectionChecklist.tsx` — banner, and flagged categories first
- `src/app/admin/reports/[id]/page.tsx` — predicted score next to this visit's results
- `src/app/api/inspections/[id]/complete/route.ts` — the PDF created on submit includes the frozen comparison
- `src/lib/pdf/generate.ts` — regenerated PDFs include the same comparison
- `src/lib/pdf/InspectionReport.tsx` — evening risk section in the PDF
- `.env.example` — `CRON_SECRET`
- `package.json` — `npm run test:risk`
- `dev docs/PREDICTIVE_RISK_SCORE.md` — the afternoon time is the property's timezone, not a single Eastern clock
- `CLAUDE.md` — status log entry for this build

## Checks already run

- `npm run test:risk` — 6 passed
- `npx tsc --noEmit` — clean

Migration `0017` was applied in the live Supabase SQL editor on 2026-10-10. The hourly cron is in the repo and is **not** installed on the VPS (`CRON_SECRET` + root crontab). See `dev docs/RISK_SCORE_CRON_AND_FEATURE.md`. A sample score of 42 was inserted for Jerome’s Home during the screen test and may still be in `property_risk_scores` until the delete SQL in the client test file is run. Nothing here was committed in that session.

## How to test

### 1. Apply the migration

In the Supabase SQL editor, run `supabase/migrations/0017_property_risk_scores.sql` once. Confirm a checklist template item now has a `risk_domain` where the name matched a keyword, and that `properties.timezone` exists.

### 2. Scorer tests (no database)

From the repo:

```bash
npm run test:risk
```

These cover: no score under 30 days of span, a Thursday appearance pattern that does not flag on Monday, life safety outranking appearance, rain raising only asset protection, the 1–100 cap, and a single flag not being padded.

### 3. Tags and timezone in the app

Sign in as an admin.

- Open a checklist template. Each item has a risk area: Life safety, Appearance, Asset protection, or Not used in the score. Change one, reload, and confirm it stuck. Reorder an item and confirm the area did not clear.
- Add a new item and confirm the risk area is required.
- Edit a property. Set Property timezone. The note under the field says the score is ready at 4:00 PM in that timezone. Save and reopen the edit page to confirm it saved.

### 4. Turn on the hourly job

Add `CRON_SECRET` to `.env.local` and to the server env at `/var/www/amenityops/.env.local`, then reload PM2 so the app process can read it. On the VPS, as root, a hourly call against the local app:

```bash
0 * * * * CRON_SECRET=$(grep '^CRON_SECRET=' /var/www/amenityops/.env.local | cut -d= -f2-) && curl -fsS -H "Authorization: Bearer ${CRON_SECRET}" http://127.0.0.1:3000/api/cron/risk-scores
```

A call without the header returns 401. A call with the header returns JSON `{ "ok": true, "scored": N, "skipped": N }`.

Before 4:00 PM in a property's timezone that property is skipped. After 4:00 PM it is scored once for that local date. Running the job again the same evening does not write a second row.

A property whose completed checklists span fewer than 30 days is skipped and shows no banner. That is the correct result, not a failed job.

### 5. What people see

After a score exists for today:

- The property page shows the evening risk score, the summary, and the areas to check first.
- Opening the assigned checklist shows the same banner. Categories that contain a flagged area move above the others. Every item is still on the checklist.
- Refresh the checklist. The score on the inspection does not change if a later job writes a new property score.
- Submit the visit. The report page and the downloaded PDF show the frozen score and, for each flagged area, how many items passed, failed, or were not applicable.
- A completed visit that was opened before any score existed has no prediction section. That is expected.

### 6. Optional check when a building has no 30-day history

The UI can be checked without waiting 30 days by inserting today's row in the SQL editor. Use the property's local date, not UTC. Example shape:

```sql
insert into public.property_risk_scores (property_id, local_date, score, flags, summary, weather)
values (
  '<property uuid>',
  '<YYYY-MM-DD in that property timezone>',
  42,
  '[{"domain":"life_safety","label":"Life safety","rate":0.25}]'::jsonb,
  'Life safety items fail here on Friday evenings.',
  'dry'
);
```

Open the property, then open a pending checklist for it. Remove the test row when finished. This does not test the scorer. `npm run test:risk` does that.
