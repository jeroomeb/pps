# Evening risk score — what was added, and how to test it

This is for Jerome. It explains the evening risk score in plain language, then walks through one test on **Jerome's Home**.

The three checklists were already in the app (55+ Active Adult, Commercial Multi-Tenant, and Luxury Condominium). This update does not replace them. It adds a risk tag on each question and an evening score for each property.

---

## What the score is

Each property can show a number from **1 to 100** for tonight.

- A higher number means that building is more likely to have problems tonight.
- Life-safety problems count more than asset problems. Asset problems count more than appearance problems.
- The score is ready at **4:00 PM in that property’s own timezone**. A California building is not scored on an Eastern clock.
- The specialist still answers every question. The score does not mark anything failed.
- The areas most likely to fail are named, and those categories move to the top of that night’s checklist.
- The morning report keeps the score from when the visit was opened, and shows it next to what the visit actually found.

A building with fewer than about 30 days of finished checklists does not get a real score yet. The checklist stays in its normal order. That is expected.

## What a risk area is

Every checklist question can have one of three tags:

- **Life-safety and liability** — gates, fire exits, locks, alarms
- **Asset protection** — leaks, water, HVAC, pipes
- **Appearance and city rules** — trash, dumpsters, curb, landscaping

These tags are separate from the category names already on the checklist, such as “Common Area Fire & Life Safety.”

When the database update was applied, existing questions were tagged from words in the question. For example, **Active Plumbing Leaks** became **Asset protection** because it mentions leaks and water. An admin can change any tag on the checklist template. A question left as **Not used in the score** is ignored by the score.

---

## Before you test

Sign in as an admin on the copy of the app that has this update. During development that is:

http://localhost:3002

The public site does not show this until the update is published.

Use **Jerome's Home** for this test. Do not delete the property.

---

## 1. Confirm the tags on a checklist

1. Go to **Checklists**.
2. Open **55+ 'Active Adult' Community Operational Audit**.
3. Open **Asset Preservation & Liability**.

**Pass:** Questions such as Active Plumbing Leaks, Floor Moisture Contaminants, and HVAC Climate Fluctuations show **Risk area: Asset protection**.

The **Risk area** menu on **Add Item** is only for a new question. The three choices are Life-safety and liability, Appearance and city rules, and Asset protection.

---

## 2. Put a sample score on Jerome's Home

A real score needs 30 days of finished visits, so the page stays empty until then. This step writes one sample score so you can see the screen. It is not the real calculation. The number **42** is only for this test.

In the Supabase SQL editor, run:

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

**Pass:** The result shows a property id and today’s date. One row is enough. If it says the row already exists, the sample is already there. Go to the next step.

This editor is the live database. Remove the sample when you finish, using the SQL at the end of this page.

---

## 3. See the score on the property

1. Go to **Properties**.
2. Open **Jerome's Home**.

Direct link on the local app:

http://localhost:3002/admin/properties/7e43b766-ca7e-4884-bf5b-43eb2245295b

**Pass:** A banner at the top says:

- **Evening risk score**
- **42**
- **Life-safety and liability items fail here on Friday evenings.**
- **Check first: Life-safety and liability**

---

## 4. See the score on an open checklist

1. On **Jerome's Home**, open a checklist that is **Pending** or **In Progress**.
2. Look at the top of the checklist.
3. Reload the page.

**Pass:** The same banner is at the top. Categories that contain life-safety questions sit above the others. After reload, the number is still **42**.

A finished checklist does not pick up this sample. Open one that is still unfinished.

---

## 5. Remove the sample score

Run this when you are done looking. It removes only the test sentence, not a future real score.

```sql
delete from public.property_risk_scores s
using public.properties p
where s.property_id = p.id
  and p.name = 'Jerome''s Home'
  and s.summary = 'Life-safety and liability items fail here on Friday evenings.';
```

Refresh **Jerome's Home**.

**Pass:** The evening risk score banner is gone.

---

## What a real evening will do later

After a property has about 30 days of finished checklists, the app writes the score by itself at 4:00 PM in that property’s timezone. No one pastes SQL. The specialist opens the checklist, sees that night’s number, and starts with the flagged areas. The morning report compares that number with the pass, fail, and not-applicable counts from the visit.
