# Session record — October 2026

Compiled 2026-10-12 from the agent chats that covered the intermittent 502, the VPS move, the platform audit, the docs folder, the lead reply assistant (design only), and the evening risk score (built). This is the record of what was decided and what was done. It is not a verbatim transcript.

Related files:

- Risk score operations and cron: `dev docs/RISK_SCORE_CRON_AND_FEATURE.md`
- Build file list: `dev docs/PREDICTIVE_RISK_SCORE_BUILD_RECORD.md`
- Client test: `dev docs/PREDICTIVE_RISK_SCORE_CLIENT_TEST.md`
- Product description: `dev docs/PREDICTIVE_RISK_SCORE.md`
- Coding plan: `dev docs/PREDICTIVE_RISK_SCORE_DEVELOPMENT_PLAN.md`
- Honest audit: `dev docs/PLATFORM_AUDIT.md`
- Lead reply (not built): `dev docs/LEAD_REPLY_ASSISTANT.md`
- Server notes: `dev docs/SERVER_DOCUMENTATION.md`

---

## 1. Intermittent 502 on amenityops.app

**Symptom.** The public site sometimes showed Nginx 502. The screenshot was `nginx/1.18.0`. That is the Hostinger VPS, not Vercel. `https://portal.amenityops.app` is Vercel and was not that 502.

**Cause.** The site config sent `Connection: upgrade` on every request. Next.js dropped some of those connections. Nginx answered 502. Short 502s can also happen during an on-server `npm run build` and `pm2 reload`.

**Fix in the repo.** `scripts/patch-nginx-502.sh` writes an upgrade map and 120s proxy timeouts. `.github/workflows/deploy.yml` is meant to run it after `git pull`.

**Live fix on the new server** used `/etc/nginx/conf.d/amenityops-upgrade-map.conf` and `/etc/nginx/conf.d/amenityops.conf` as `default_server` on port 80, `Connection $connection_upgrade`, 120s timeouts, 50M body.

---

## 2. Wrong VPS, then the move to the intended server

Production had been running on **148.230.108.195** (Ubuntu 22.04, nginx 1.18.0, hostname srv943655). The intended Hostinger VPS is **187.124.132.193** (Ubuntu 26.04, srv1949672, nginx 1.28.3).

Amenity Op’s was removed from the old box (PM2 process, nginx site, certbot cert `amenityops.app`, `/var/www/amenityops`). Other sites on that box (dealsoffmarket, offmarketsdeals) were left alone.

Secrets were copied to `/root/amenityops-secrets/.env.local` on the new server. The app was cloned from private `https://github.com/jeroomeb/pps.git` into `/var/www/amenityops`. Node **22.23.3** via nvm. `npm ci` failed (lockfile missing `@emnapi/runtime` and `@emnapi/core`). `npm install` then `npm run build` succeeded. PM2 name `amenityops`. systemd `pm2-root` enabled.

Nginx: first attempt left the default site answering 404. Fix was to clear `sites-enabled` and put the Amenity block in `conf.d` as `default_server`. HTTP `/login` then returned 200 from nginx 1.28.3.

DNS: `amenityops.app` and `www` were pointed at **187.124.132.193** (GoDaddy ns51/ns52). `portal.amenityops.app` stays on Vercel. HTTPS had not been issued when last checked in that chat. Certbot is:

```bash
certbot --nginx -d amenityops.app -d www.amenityops.app --redirect
```

That command can be run from any directory on srv1949672.

Do not push to `main` until GitHub Actions `VPS_HOST` points at the new server. Do not change MX / SPF / DKIM. Do not run `do-release-upgrade`.

---

## 3. Docs folder and platform audit

Project markdown now lives in **`dev docs/`**. `README.md`, `CLAUDE.md`, and `AGENTS.md` stay at the repo root. Former `docs/` files were moved.

The client asked for a sincere, non-sugarcoated audit while work continued. That is `dev docs/PLATFORM_AUDIT.md`. Findings that still stand unless later work closed them:

- Admin report page can load any inspection via the service-role client after only `requireRole('admin')` (cross-tenant leak).
- Specialist ACH bank numbers are stored in plaintext.
- Almost no automated tests existed before the risk scorer tests.
- Most clocks still use `APP_TIMEZONE` (Eastern) except the new property timezone on the score.
- Admin lists have no pagination.
- Deploys are fragile (`npm ci` lockfile drift, Hobby commit-author block on Vercel, GitHub Actions host must match the live VPS).
- Migrations are applied by hand in the SQL editor. Assuming a migration is live has already caused outages.
- Embedded-join type casts can hide query failures as empty lists or 404s.

Lead generation and the reply assistant were **explicitly later**. The client said this project is incorporating **predictive risk modeling** into the existing platform.

---

## 4. Lead reply assistant (design only — not built)

`dev docs/LEAD_REPLY_ASSISTANT.md` describes a draft-only helper for the marketing mailbox. It would read a lead reply, write a suggested answer from the outreach rules, and save a draft. A person sends it by hand. It does not send the cold sequence. Nothing was coded.

The older outreach docs still describe the large 2,500-company plan. Those were not rewritten to a later one-domain / Zoho plan unless asked.

---

## 5. Evening risk score (built)

### Client questions that locked the design

- This project is the **risk model in the existing app**, not lead gen.
- California teams cannot run on EST. **Score at 4:00 PM in the property’s own timezone.** Midnight Eastern is 9 PM Pacific; weekday patterns would be wrong on one Eastern clock.

### What was built

A 1–100 weighted failure rate in TypeScript. Daily rows in `property_risk_scores`. Freeze on first open of a pending / in-progress checklist. Flagged categories first on the open checklist (display only). Property banner, report, and PDF compare the frozen prediction with pass / fail / N/A.

Not a Python / scikit-learn service on the VPS.

### Migration

`0017_property_risk_scores.sql` **was applied** in the live Supabase SQL editor on 2026-10-10. Until it was applied, screens that selected the new columns would fail.

### Tests run

```
npm run test:risk
```

Six passed: no score under 30 days of span; Thursday appearance vs Monday; life-safety weight; rain on asset protection only; 1–100 cap; no padded flags.

`npx tsc --noEmit` was clean.

### What the UI tags are

The **Risk area** dropdown is new. It is not the old category headings (Common Area Fire & Life Safety, Aesthetic Compliance & Waste, and so on). Those headings were already in the seeded checklists.

The three score areas are Life-safety and liability, Asset protection, and Appearance and city rules. Existing questions were tagged from keywords when 0017 ran. Example: Active Plumbing Leaks → Asset protection. **Add Item → Choose an area** is empty until a new question is created.

### Screen test on Jerome’s Home

Property id `7e43b766-ca7e-4884-bf5b-43eb2245295b`. Local app `http://localhost:3002`. Sample row score **42** was inserted in the **live** database so the banner could be seen without 30 days of history. The property page showed **Evening risk score 42**. That number is **not** from the cron job.

Delete SQL is in `PREDICTIVE_RISK_SCORE_CLIENT_TEST.md` and `RISK_SCORE_CRON_AND_FEATURE.md`. The sample row may still be there until that delete is run.

### Cron job — deployed and active on VPS (2026-10-12)

Route: `GET` / `POST` `/api/cron/risk-scores` with `Authorization: Bearer $CRON_SECRET`.

Hourly run: skip before 4:00 PM local; skip if today’s row exists; skip if history is too short; otherwise insert one row.

Completed: `CRON_SECRET` configured on VPS, `src/lib/supabase/proxy.ts` bypass added for `/api/cron/`, GitHub Actions automated deploy successful, PM2 reloaded with `--update-env`, and root crontab installed. Live check returned `HTTP 200 OK` with `{"ok":true,"scored":0,"skipped":3}`.

---

## 6. Other standing facts from this period

- App name: **Amenity Op’s**. Live portal historically `https://portal.amenityops.app`. Public hostname `https://amenityops.app` is Nginx on the VPS.
- Specialist display label: **Operations Continuity Specialist**. Database `role` stays `'inspector'`. Routes stay `/inspector`.
- Next.js 16: `src/proxy.ts`, not middleware. `cookies()`, `params`, `searchParams` are Promises.
- PowerShell does not accept `&&`. `curl` on Windows is often `Invoke-WebRequest`; use `curl.exe`.
- Never write a GitHub PAT into `.git/config`.
- Migration 0016 (checklist access, building category, ACH) may still need confirming on live Supabase independently of 0017.

---

## 7. Status & next steps (as of 2026-10-12)

1. **Risk score & cron:** Fully implemented, committed, deployed via GitHub Actions, and verified on the VPS. Hourly root cron is active.
2. **Jerome's Home sample row:** Confirm whether the manual test score `42` should be removed from `property_risk_scores`.
3. **HTTPS / SSL:** Confirm certbot on the new VPS if not already completed.
4. **Lead generation & reply assistant:** Deferred until explicitly requested by the client.
