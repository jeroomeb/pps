# PPS Inspections — Project Memory

Read this file at the start of every session. It is the source of truth for
what this project is, what's built, and what's left. Update the **Status Log**
at the end of each session so the next session picks up correctly.

## What this app is

A mobile-first property inspection & audit app for **Jerome Bermudez /
Property Preservation Solutions LLC**. Two roles:

- **Admin**: creates properties, creates checklist types (three seeded:
  Luxury Condominium, 55+ Community, Commercial Multi-Tenant — admin can add
  more anytime), creates inspections (assigns a checklist type + inspector to
  a property), manages the team, views/re-sends completed reports.
- **Inspector**: sees assigned pending inspections, fills out a Pass/Fail/N/A
  checklist per item (comment + required photo on Fail), submits.

A **property can have multiple concurrent inspections of different checklist
types** (confirmed by the client after the intake call — the transcript says
"one checklist" but the follow-up chat corrected this to "multiple").

On submit: the app validates every item has a status (and every Fail has a
photo), marks the inspection completed, generates a branded PDF, uploads it
to Supabase Storage, and emails it to the property's email (CC to
`ADMIN_EMAIL`) via Resend.

Full requirements background: see the original call transcript and
`Checklists Data - Sheet1.csv` layout (Main / Service Category / Item Name /
Hover Note) that seeds the three checklist templates.

## Stack (all free-tier)

- **Next.js 16 (App Router, TypeScript), Tailwind CSS v4** — deployed to Vercel
- **Supabase**: Postgres + Auth (email/password) + Storage (`photos`, `reports` buckets), RLS everywhere
- **Resend** for report emails (branded HTML + PDF attachment)
- **@react-pdf/renderer** for PDF generation (Node runtime route handler)

### ⚠️ This Next.js version has renamed conventions — do not assume Next 14/15 docs apply verbatim

Read `node_modules/next/dist/docs/` before changing routing/auth code. Key
differences already accounted for in this codebase:
- Middleware is renamed **Proxy**. The file is `src/proxy.ts`, exporting a
  function named `proxy` (not `middleware`). Same NextRequest/NextResponse API otherwise.
- `cookies()`, `params`, and `searchParams` are all `Promise`-based (same as Next 15+).
- Everything else (Server Actions, Route Handlers, Server Components) matches
  standard modern App Router patterns.

## Design system

"Industrial Prestige" — gold primary (`#D4AF37`/`#735c00`), charcoal/slate
neutrals, off-white surface, Hanken Grotesk headlines + Inter body, 4px grid,
48px min touch targets, mobile-first with a bottom nav for admin. Tokens live
in `src/app/globals.css` (`@theme inline` block) and were derived from
`stitch_property_inspection_audit_system/industrial_prestige/DESIGN.md` in
the original project folder. Wireframe extras from the Stitch mockups (health
%, urgency badges, sync status) were intentionally **not** built — client
confirmed those aren't needed.

## Repo & environment

- GitHub: `https://github.com/jeroomeb/pps`
- Env vars (see `.env.example`): `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
  `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_EMAIL`
- **Resend limitation**: until a domain is verified in Resend, `EMAIL_FROM`
  must stay on `onboarding@resend.dev` and delivery only works to the Resend
  account owner's own address. Real property emails will start working the
  moment a domain is added in Resend — no code change needed beyond
  `EMAIL_FROM`.
- Supabase schema: run `supabase/schema.sql` once in the Supabase SQL editor
  (tables, RLS policies, storage buckets, the `handle_new_user` trigger that
  turns a new `auth.users` row into a `profiles` row).
- Seed checklists: `npm run seed` (reads `supabase/seed/checklists.csv`,
  requires `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` +
  `SUPABASE_SERVICE_ROLE_KEY`). Safe to re-run — upserts templates, replaces
  their items.
- First admin: no signup UI exists. Create the first user via Supabase Studio
  or `supabase.auth.admin.createUser` with `user_metadata: { role: 'admin', full_name: '...' }`,
  then sign in at `/login`. Inspectors are created from `/admin/team` (uses
  the service-role client, no email confirmation flow — Jerome/admin sets
  their password directly).

## Architecture map

- `src/lib/database.types.ts` — hand-written Supabase `Database` type. Must
  include `Relationships` arrays matching actual FK constraint names or
  embedded joins (`properties(name)` etc. in `.select()`) silently type as
  `never`. If you add a table/FK, update this file.
- `src/lib/supabase/{client,server}.ts` — browser/server Supabase clients.
  `createAdminClient()` uses the service-role key (bypasses RLS) — only for
  server-only operations (creating inspector accounts, PDF/email pipeline).
- `src/lib/supabase/proxy.ts` + `src/proxy.ts` — refreshes the Supabase
  session cookie and does the *optimistic* auth redirect (logged out → /login).
  Role checks are *not* done here (proxy should stay DB-free per Next.js
  guidance) — they happen in `src/lib/auth/dal.ts`.
- `src/lib/auth/dal.ts` — `getSessionUser`, `getProfile`, `requireRole`. This
  is the actual authorization boundary; every admin/inspector layout calls
  `requireRole()`.
- `src/lib/actions/*.ts` — Server Actions for properties, checklists, team,
  inspections. Each starts with `requireRole(...)`.
- `src/app/api/inspections/[id]/complete/route.ts` — the submit pipeline:
  validates all items, signs photo URLs, renders the PDF, uploads to the
  `reports` bucket, updates the inspection row, sends the email.
- `src/app/api/inspections/[id]/resend/route.ts` — admin-only re-send from
  the Reports page (re-downloads the stored PDF, doesn't regenerate it).

## Status Log

### 2026-07-14 — Initial build (session 1)
Built the full app end-to-end from the client's Fiverr call transcript +
Stitch wireframes + checklist CSV:
- Next.js scaffold, Tailwind design tokens, Supabase schema/RLS/storage, CSV seed script
- Auth + role-based routing (admin/inspector layouts)
- Admin: properties CRUD, checklist template builder (create + add items later), team (create inspectors), reports (PDF download + resend)
- Inspector: dashboard (pending/completed), active checklist (status toggle, comment, required-photo-on-fail, autosave per item, progress bar, submit validation)
- PDF generation (`@react-pdf/renderer`) + branded Resend email (logo inline via CID, PDF attached)
- `npx tsc --noEmit`, `eslint`, and `npm run build` all pass clean

### 2026-07-14 — Supabase connected, roles generalized (session 2)
- Real Supabase project connected (`lxihknznkiarqyqfulgm.supabase.co`), `supabase/schema.sql` run successfully, `npm run seed` loaded all 124 checklist items across the 3 templates.
- First admin created (`hassan.nadeemq@gmail.com` / temp password given by Jerome) via `scripts/create-first-admin.mjs` — one-off Auth Admin API call, not exposed in the UI.
- **New client requirements implemented:** admins can create *either* admins or inspectors from `/admin/team` (role dropdown + a per-member role-toggle button); an admin can also be assigned as an inspector on inspections (the "Assign Inspector" dropdown now lists all profiles, admin or inspector, labeled accordingly), and `/inspector/*` routes now accept any authenticated profile rather than being locked to `role === 'inspector'`. Admin bottom nav gained a 5th "My Inspections" tab linking to `/inspector` for this reason. See `src/lib/actions/team.ts` (`createTeamMember`, `setTeamMemberRole`).
- **Verified:** admin login + `handle_new_user` trigger (auth user → profiles row) work against the live DB; unauthenticated `/admin` correctly redirects to `/login` via proxy; PDF generation (`@react-pdf/renderer`) produces a correct multi-item report with embedded photo + logo via `scripts/test-pdf-email.mts`.
- **Known limitation — Resend account ownership:** the `RESEND_API_KEY` currently in `.env.local` belongs to the account `hello@wedontcode.com` (looks like the original Fiverr contractor's own Resend account, not Jerome's/Hassan's). Resend's sandbox mode only delivers to the account owner's own address until a domain is verified — so **real property emails will silently fail (403) until either (a) a domain is verified on that Resend account, or (b) Jerome creates his own Resend account and the key is swapped**. Jerome was asked and chose to keep the current key for now. Revisit this before going live.
- **Not yet tested:** the actual submit flow through the browser (create property → assign inspection → complete as inspector → confirm PDF upload + email) — no browser-automation tool is available in this environment, so this needs a manual click-through once deployed or run locally with `npm run dev`.

**Next session should:** deploy to Vercel (needs Jerome's/the user's own Vercel account — cannot be done headlessly with a token that wasn't provided), set the same env vars there, then do one real manual end-to-end pass in a browser.
