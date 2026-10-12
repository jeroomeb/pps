# Evening risk score and the hourly cron job

This is the operations guide for the feature built in October 2026. The product description is `PREDICTIVE_RISK_SCORE.md`. The file list is `PREDICTIVE_RISK_SCORE_BUILD_RECORD.md`. The client walkthrough is `PREDICTIVE_RISK_SCORE_CLIENT_TEST.md`. This file is how the score works, how the cron job is meant to run, and what is still not installed on the VPS.

Lead generation and the reply assistant are not part of this feature.

---

## What was added

Each property can receive a **1–100 evening risk score** from its own completed checklists. The score is ready at **4:00 PM in that property’s timezone**. A California building is not scored on an Eastern clock.

The three checklist templates (55+ Active Adult, Commercial Multi-Tenant, Luxury Condominium) were already in the app. This work did not replace them. It added:

1. A **risk area** tag on each question (`life_safety`, `appearance`, `asset_protection`, or unused).
2. A **timezone** on each property.
3. One **daily score row** per property per local date.
4. A **frozen copy** of that score on the inspection when a pending or in-progress checklist is first opened.
5. An **hourly HTTP job** that writes the daily row after 4:00 PM local.

The specialist still answers every item. Photos, fail comments, and Pass / Fail / N/A rules did not change. The score does not mark any item failed. Flagged categories move to the top of the open checklist for display only. Template `sort_order` is not rewritten.

---

## How the score is calculated

The scorer is TypeScript inside the Next.js app (`src/lib/risk-score.ts`). There is no Python service and no Random Forest. Per property, 30–90 days of checklist rows is too small for that, and a second runtime on the VPS is how 502s happen.

Rules:

- Look back at most **90 days**.
- Write **no score** if completed answers do not span at least **30 days**.
- Only Pass and Fail count. N/A and unanswered items are ignored.
- Weights: life safety **3**, asset protection **2**, appearance **1**.
- If the same weekday has at least **2** answered items in an area, that weekday’s failure rate is used. Otherwise the overall rate for the area is used.
- Rain (Open-Meteo precipitation probability ≥ 50) multiplies the **asset-protection** rate by **1.25**, capped at 100 percent. Rain does not raise life-safety. Missing coordinates or a failed weather fetch skip the rain adjustment; they do not fail the job.
- On a US federal holiday weekend, a higher weekend failure rate is blended in when the weekend sample has at least two answers.
- Up to **three** areas with a failure rate above zero are kept, ranked by weight × rate. Empty areas are not added to fill the list.
- The number is rounded into **1–100**.

`npm run test:risk` covers six of those rules and passed.

---

## Database (migration 0017)

`supabase/migrations/0017_property_risk_scores.sql` was applied in the live Supabase SQL editor on 2026-10-10. It is idempotent.

It added:

| Piece | Purpose |
| --- | --- |
| `checklist_template_items.risk_domain` | Tag on the template question |
| `inspection_items.risk_domain` | Snapshot copied when a visit is created |
| `properties.timezone` | IANA zone, default `America/New_York` |
| `inspections.predicted_score`, `predicted_flags`, `predicted_summary`, `predicted_local_date` | Frozen copy for the morning report |
| `property_risk_scores` | One row per property per local date |

Existing questions were tagged from keywords (gate, fire, lock, trash, leak, HVAC, and so on). Life-safety wins when more than one area matches. An admin can change the tag on the checklist template.

Select RLS lets a global admin, a same-tenant admin, or a specialist assigned to the property read scores. The hourly job writes with the **service role**. There is no user insert policy.

---

## What people see

**Checklist template.** Each question has a Risk area dropdown. **Add Item** requires an area. Reordering an item keeps the area.

**Property edit.** Property timezone. The note says the score is ready at 4:00 PM in that timezone.

**Property page.** After a score exists for today’s local date, a banner shows the number, the summary, and **Check first**.

**Open checklist (pending or in progress).** The same banner. Categories that contain a flagged area sit first. Opening the visit copies today’s score onto the inspection. Reloading does not replace it if a later job writes a new property row.

**Completed report and PDF.** Predicted score next to pass / fail / N/A counts for each flagged area. A visit opened before any score existed has no prediction section.

A building with fewer than 30 days of history shows **no banner**. That is correct, not a failed job.

---

## The cron job

The Next.js process does not score itself on a timer. The VPS must call the app once an hour.

### Route

- File: `src/app/api/cron/risk-scores/route.ts`
- Methods: `GET` and `POST`
- Runtime: Node, max 60 seconds
- Job code: `src/lib/risk-score-job.ts` → `refreshDueRiskScores()`

### Auth

The header must be:

```
Authorization: Bearer <CRON_SECRET>
```

`CRON_SECRET` is read from the app process environment. If it is unset, or the header does not match, the route returns **401**. Documented in `.env.example`. It is not on the VPS until someone writes it into `/var/www/amenityops/.env.local` and reloads PM2.

Do not call this route with the anon key. The job uses the service-role client, like the other server jobs.

### What one run does

1. Load every **active** property.
2. Skip a property whose local hour is **before 16** (4:00 PM).
3. Skip a property that already has a `property_risk_scores` row for **today’s local date**.
4. Load completed inspections and their items.
5. Fetch rain from Open-Meteo when latitude and longitude exist (8 second timeout, in-memory cache).
6. Run the pure scorer.
7. Insert one row, or skip when history is too short.

A duplicate insert (`23505`) is treated as “already scored today,” not as a crash.

A California property and a New York property both hit 4:00 PM local because the job is **hourly**. One 4:00 PM Eastern cron would score California at 1:00 PM Pacific.

### Response

```json
{ "ok": true, "scored": 1, "skipped": 4 }
```

`skipped` includes: before 4:00 PM, already scored today, not enough history, or a write that did not insert a new row.

### Freeze on open (not the cron)

`freezeEveningScore()` runs when someone opens a pending or in-progress inspection. It copies today’s property row onto the inspection if `predicted_score` is still null. The cron does not freeze visits. The checklist page does.

---

## Install the cron on the VPS (not done yet)

Status as of 2026-10-12:

- Code is in the local repo.
- Migration 0017 is on the live database.
- The sample score **42** for Jerome’s Home was inserted by hand for a screen test (see below).
- `CRON_SECRET` is **not** confirmed in `/var/www/amenityops/.env.local`.
- No root crontab calls this route.
- The live site at amenityops.app does not show this until the code is deployed.

After deploy, on the VPS (`187.124.132.193`, app at `/var/www/amenityops`, PM2 name `amenityops`):

1. Put a long random value in `/var/www/amenityops/.env.local`:

```
CRON_SECRET=replace-with-a-long-random-string
```

2. Reload the app so the process can read it:

```bash
pm2 reload amenityops
```

3. Confirm a missing header is rejected:

```bash
curl -i http://127.0.0.1:3000/api/cron/risk-scores
```

Expect `401`.

4. Confirm a correct header runs:

```bash
CRON_SECRET=$(grep '^CRON_SECRET=' /var/www/amenityops/.env.local | cut -d= -f2-)
curl -i -H "Authorization: Bearer ${CRON_SECRET}" http://127.0.0.1:3000/api/cron/risk-scores
```

Expect `200` and JSON with `ok`, `scored`, `skipped`.

5. Install hourly cron as **root**:

```bash
0 * * * * CRON_SECRET=$(grep '^CRON_SECRET=' /var/www/amenityops/.env.local | cut -d= -f2-) && curl -fsS -H "Authorization: Bearer ${CRON_SECRET}" http://127.0.0.1:3000/api/cron/risk-scores
```

Add it with `crontab -e` (root). Call **127.0.0.1:3000**, not the public hostname, so Nginx and TLS are not in the path.

6. After 4:00 PM in a property’s timezone, check:

```sql
select property_id, local_date, score, summary, weather, calculated_at
from public.property_risk_scores
order by calculated_at desc
limit 20;
```

Running the job twice the same evening must not create two rows for the same property and local date.

---

## Screen test that was already done

On 2026-10-10:

- `npm run test:risk` — 6 passed.
- `npx tsc --noEmit` — clean.
- Migration 0017 applied.
- Checklist **55+ 'Active Adult' Community Operational Audit**: plumbing / HVAC items showed **Asset protection**.
- Sample score inserted for **Jerome’s Home** (`7e43b766-ca7e-4884-bf5b-43eb2245295b`). Property page showed **Evening risk score 42**.

That **42** did **not** come from the cron. It was this SQL (use today’s local date if you repeat it):

```sql
insert into public.property_risk_scores (property_id, local_date, score, flags, summary, weather)
select p.id,
       (now() at time zone 'America/New_York')::date,
       42,
       '[{"domain":"life_safety","label":"Life-safety and liability","rate":0.25}]'::jsonb,
       'Life-safety and liability items fail here on Friday evenings.',
       'dry'
from public.properties p
where p.name = 'Jerome''s Home'
returning property_id, local_date;
```

Remove the sample (does not delete a future real score with a different summary):

```sql
delete from public.property_risk_scores s
using public.properties p
where s.property_id = p.id
  and p.name = 'Jerome''s Home'
  and s.summary = 'Life-safety and liability items fail here on Friday evenings.';
```

The sample row may still be in the live database until that delete is run.

---

## Files for this feature

**New:** `supabase/migrations/0017_property_risk_scores.sql`, `src/lib/risk-domain.ts`, `src/lib/property-timezones.ts`, `src/lib/us-holidays.ts`, `src/lib/weather.ts`, `src/lib/risk-score.ts`, `src/lib/risk-score.test.ts`, `src/lib/risk-score-job.ts`, `src/app/api/cron/risk-scores/route.ts`, `src/components/RiskScoreBanner.tsx`, `scripts/ts-extension-loader.mjs`, `scripts/register-ts-extension.mjs`.

**Changed:** schema and types; checklist / inspection / property actions; PropertyForm; checklist editor; inspector page; ActiveInspectionChecklist; property page; reports page; complete route; PDF generate and InspectionReport; `.env.example`; `package.json` (`test:risk`).

---

## What this feature must not do

- Do not mark an item failed because it was predicted.
- Do not email anyone from the score.
- Do not read or write the marketing mailbox.
- Do not change photo rules or the completed-inspection freeze.
- Do not deploy the job until 0017 is applied (it is applied).
- Do not treat 4:00 PM Eastern as the rule for every property.
