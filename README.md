# PPS Inspections

Property inspection & audit app for **Property Preservation Solutions LLC**.

Admins create properties and checklist types, assign inspections to inspectors,
and manage completed reports. Inspectors fill out a Pass / Fail / N/A checklist
per item (comment + required photo on Fail) from their phone. On submit the app
generates a branded PDF report, stores it, and emails it to the property's
contact (CC to the admin inbox).

## Stack

- **Next.js 16** (App Router, TypeScript) + **Tailwind CSS v4**
- **Supabase** — Postgres, Auth (email/password), Storage (`photos`, `reports` buckets), RLS on every table
- **Resend** — report emails (branded HTML + PDF attachment)
- **@react-pdf/renderer** — PDF generation (Node runtime route handler)
- Installable **PWA** (manifest + service worker shell caching)

Note for developers: this Next.js version renames middleware to **proxy** —
the file is `src/proxy.ts` exporting `proxy()`, same API otherwise.

## Local setup

1. **Install**

   ```bash
   npm install
   cp .env.example .env.local   # then fill in every value
   ```

2. **Create a Supabase project** (free tier is fine) and run
   [`supabase/schema.sql`](supabase/schema.sql) once in the SQL editor.
   It creates tables, RLS policies, storage buckets, and the
   `handle_new_user` trigger.

   For an **existing** database, apply files in `supabase/migrations/` in
   order instead of re-running schema.sql (schema.sql's
   `create table if not exists` won't alter live tables).

3. **Security settings (required):** in the Supabase dashboard →
   Authentication → Sign In / Up, **disable "Allow new users to sign up."**
   Team members are created from `/admin/team` via the Auth Admin API, which
   still works with public signups disabled. The signup trigger always
   creates new profiles as `inspector` regardless of metadata.

4. **Seed the checklist templates** (initial setup only):

   ```bash
   npm run seed
   ```

   Reads `supabase/seed/checklists.csv` and loads the three built-in
   checklist types (~124 items). ⚠️ Re-seeding *replaces* template items and
   will fail once inspections reference them — treat it as first-run only;
   after that, manage checklists in the admin UI.

5. **Create the first admin** (there is deliberately no signup UI):

   ```bash
   node scripts/create-first-admin.mjs admin@example.com 'a-strong-password' 'Full Name'
   ```

6. **Run:**

   ```bash
   npm run dev
   ```

   Sign in at `http://localhost:3000/login`. Additional admins/inspectors are
   created from **Admin → Team**.

## Environment variables

All documented in [`.env.example`](.env.example):

| Var | Notes |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | **server-only secret** — never expose client-side |
| `RESEND_API_KEY` | Resend API key |
| `EMAIL_FROM` | must stay `onboarding@resend.dev` until a domain is verified in Resend |
| `ADMIN_EMAIL` | CC'd on every report email |

**Resend caveat:** until a domain is verified in the Resend account, Resend
only delivers to the account owner's own address — sends to real property
emails are rejected. The app surfaces this as a submit warning / failed
resend. Once a domain is verified, update `EMAIL_FROM` and it works with no
code change.

## Deploying (Vercel)

1. Import the repo in Vercel (Next.js defaults are fine).
2. Add every env var from `.env.example` in Project Settings → Environment
   Variables.
3. Deploy. Verify: log in, complete a test inspection end-to-end, download
   the PDF from Reports, and check the report email arrives.

## Project map

- `src/proxy.ts` — session refresh + logged-out redirect (middleware)
- `src/lib/auth/dal.ts` — `getSessionUser` / `getProfile` / `requireRole`; the real authorization boundary
- `src/lib/actions/*` — Server Actions (properties, checklists, team, inspections, auth)
- `src/app/api/inspections/[id]/complete` — submit pipeline: validate → PDF → upload → mark completed → email
- `src/app/api/inspections/[id]/pdf` — serves the report PDF (re-renders from DB)
- `src/app/api/inspections/[id]/resend` — admin re-send of the stored PDF
- `src/lib/pdf/` — PDF template + generation
- `src/lib/email/` — Resend email
- `supabase/schema.sql` — full schema for fresh installs; `supabase/migrations/` — deltas for live DBs

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm run lint` | ESLint |
| `npm run seed` | seed checklist templates (first run only, see above) |
| `node scripts/create-first-admin.mjs` | bootstrap the first admin account |
