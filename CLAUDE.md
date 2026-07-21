# PPS Inspections — Project Memory

Read this file at the start of every session. It is the source of truth for
what this project is, what's built, and what's left. Update the **Status Log**
at the end of each session so the next session picks up correctly.

## What this app is

A responsive (desktop sidebar shell + mobile bottom-tab shell) property
inspection & audit app for **Jerome Bermudez / Property Preservation
Solutions LLC**. Two roles:

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
48px min touch targets. Tokens live in `src/app/globals.css` (`@theme` block,
real values as of session 4 — see Status Log) and were derived from
`stitch_property_inspection_audit_system/industrial_prestige/DESIGN.md` in
the original project folder, with Pass/Fail/N/A status colors (green/red/
neutral) taken from the `active_inspection_checklist` Stitch mockup since
DESIGN.md only describes them conceptually. Light-mode only — no dark variant
exists in this design system. Wireframe extras from the Stitch mockups (health
%, urgency badges, sync status) were intentionally **not** built — client
confirmed those aren't needed. As of session 5, the app is fully responsive:
`AppShell` (`src/components/AppShell.tsx`) renders a fixed left sidebar with
icon nav (lucide-react) at `lg:`+ and defers to the mobile `Header` +
`BottomNav` (icon-only tab bar, `lg:hidden`) below that. `AppShell` and
`BottomNav` take a `role: 'admin' | 'inspector'` prop and resolve nav items
from `src/lib/nav-items.ts` **internally** — never pass the nav item arrays
(they contain lucide icon components) as props from a Server Component into
these Client Components, since React component references aren't valid RSC
serialization payloads and it hard-crashes with "Only plain objects can be
passed to Client Components from Server Components."

## Repo & environment

- GitHub: `https://github.com/jeroomeb/pps`
- Env vars (see `.env.example`): `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
  `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_EMAIL`
- **Resend: resolved (session 6).** The account (`hello@wedontcode.com`) now
  has `pps.wedontcode.com` verified with sending enabled — this **is** the
  right account to keep using (confirmed with the user; earlier sessions'
  "third-party contractor account" concern is no longer a blocker). `EMAIL_FROM`
  is `PPS Inspections <reports@pps.wedontcode.com>` in both `.env.local` and
  the Vercel prod env — real property emails now deliver. If `EMAIL_FROM` ever
  gets reset to `onboarding@resend.dev`, real recipients will silently 403
  again regardless of domain verification status — that env var is what
  actually selects the sending domain, not the account's verified-domains list.
- Supabase schema: run `supabase/schema.sql` once in the Supabase SQL editor
  (tables, RLS policies, storage buckets, the `handle_new_user` trigger that
  turns a new `auth.users` row into a `profiles` row). For an **existing** DB,
  also apply `supabase/migrations/*.sql` in order — `schema.sql`'s
  `create table if not exists` won't alter live tables/policies. `0001_security_hardening.sql`
  has been applied to the live project (see session 6 below).
- **Public signup is disabled** in the Supabase dashboard (Authentication →
  Sign In / Up) as of session 6 — verified live via a real signup attempt
  returning `422 signup_disabled`. Team members are created only from
  `/admin/team` (Auth Admin API), which is unaffected by this toggle.
- **Temporary demo deployment**: `https://ppsdemo.vercel.app`, Vercel project
  `hassan-wedontcode/pps` (Hassan's personal Vercel account — client will
  redeploy on their own Vercel account for real production). Same live
  Supabase project as local dev — this is not a separate sandbox. Deployment
  Protection (SSO wall) was disabled on this project via the Vercel API so the
  link is openly shareable (`ssoProtection: null`); re-enable if the link
  needs to stop being public. A manually-added alias like `ppsdemo.vercel.app`
  does **not** move automatically on redeploy — after `vercel --prod`, re-run
  `vercel alias set <new-deployment-url> ppsdemo.vercel.app`.
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
- `src/app/error.tsx` / `global-error.tsx` / `not-found.tsx` — branded error
  boundaries (session 6); previously any thrown server error hit Next's
  default white screen.
- `REVIEW.md` — the full pre-handover audit (session 6): architecture,
  bugs, security/RLS table-by-table, performance, a11y, deployment readiness,
  with a fix log of what was actually applied vs. deferred. Re-read it before
  picking up any "Should Fix"/"Nice to Have" item left open.

## Status Log

### 2026-07-21 — Client punch list #7 (session 7)
Ten-item update from the client, all applied and build-verified (`tsc`,
`eslint`, `npm run build` all clean — only the 3 known @react-pdf alt-text
warnings remain):
1. **Completed inspections now clickable from "My Inspections"** — completed
   rows in `inspector/page.tsx` link to `/admin/reports/[id]` (desktop
   full-bleed cells + mobile card), but **only for admins**. Pure inspectors
   keep a read-only completed list, since `/admin/reports` is admin-gated —
   this preserves their permission boundary (item 2).
2. **Inspector permissions confirmed intact**: inspector layout allows any
   authenticated user; all `/admin/*` routes still `requireRole('admin')`; the
   new report link is admin-only so it can't dead-end an inspector.
3. **PDF images fixed** — root cause: both render paths passed Supabase *signed
   URLs* to `@react-pdf`'s `<Image>`, which fetches remotely on the Node server
   and fails silently. New `photoDataUri()` in `src/lib/pdf/generate.ts`
   downloads the bytes and embeds a base64 data URI (JPEG/PNG only — other
   formats are skipped, not broken-imaged), used by both the `complete` route
   and `regenerateInspectionPdf`. Report screen images were already fine
   (browser fetches the signed URL). Layout de-cluttered: PDF "All Other Items"
   is now a light divider list inside one bordered group per category (was
   stacked boxes); report screen failure cards use a photo-beside-text row.
4. **"Critical Findings" → "Failures"** everywhere (report screen + PDF section
   title + PDF Result cell: "N failure(s)" / "No failures").
5. **Team tab is now last** in `ADMIN_NAV_ITEMS`; team page alignment fixed —
   both columns now have a heading ("Current Members" / "Add Team Member") so
   their tops line up, added `items-start`, and the current user's row shows a
   "You" chip instead of an empty gap.
6. **Checklists tab is now second-to-last.** New admin order: Dashboard,
   Properties, Reports, My Inspections, Checklists, Team (still 6 icon-only
   bottom-nav tabs — count unchanged, so phone view unaffected).
7. **Report immutability confirmed** (see also below): `createInspection`
   snapshots each item's `service_category`/`item_name`/`description`/
   `sort_order` into `inspection_items` at creation, so editing/renaming a
   template item later never alters past inspections; deleting a *used*
   template item or template is FK-blocked (`inspection_items.template_item_id`
   is `ON DELETE NO ACTION`) with a friendly 23503 message. **Caveat:** the
   report screen + regenerated PDF read the checklist's *display name* live
   (`checklist_templates(name)`), so renaming a template relabels the checklist
   name shown on old reports — item content is untouched, only the header
   label follows. Flagged to the user; a true snapshot would need an
   `inspections.checklist_name` column + migration (not done this session).
8. **Removed "Failed Items" stat** from the property page (now 3 stats: Total
   Inspections / In Progress / Completed; dropped the `inspection_items` fail
   count query; grid → `sm:grid-cols-3`).
9. **Removed "Failed Audits" stat card** from the dashboard (now 2 stats;
   `failedInspectionIds` kept for the Recent Properties health badge, only the
   headline card removed; grid → `sm:grid-cols-2`).
10. Build/type/lint verified clean. **Not exercised in a live browser this
    session** (no admin credentials / Playwright harness available here) — the
    PDF-photo fix in particular should get one real click-through against live
    Supabase Storage before handover, since it depends on `storage.download`
    of real photos.

**Follow-up 2 (same session): PDF photos fixed for real + shipped live.** The
first data-URI fix still didn't show photos because phone/browser captures here
are frequently **WebP** (confirmed: a real fail item's photo was a 1024×1024
`.webp`), which `@react-pdf` cannot decode at all. `photoDataUri` now pipes
every downloaded image through **sharp → JPEG** (also auto-rotates via EXIF and
downsizes to 1600px), with a JPEG/PNG passthrough fallback. `sharp` promoted to
a direct dependency (`^0.34.5`). Verified end-to-end: rendered the actual report
for the WebP-photo inspection and confirmed the image embeds and is visible
(image XObjects present, Quick Look render checked). Also **removed the
property-level status badge** ("Critical"/"Healthy") from the dashboard Recent
Properties table + mobile cards (client request) — the column now shows the
last checklist run. Everything committed, pushed to `jeroomeb/pps`, and
deployed to `ppsdemo.vercel.app` (`vercel --prod` + re-alias; `/login` 200).

**Follow-up 1 (same session): inspectors can now view their own completed
inspections (read-only).** Previously `inspector/inspections/[id]` *redirected
away* on `status = 'completed'`, so inspectors couldn't see submitted work at
all. Now: completed + admin → redirect to `/admin/reports/[id]` (full report);
completed + inspector → new `ReadOnlyInspectionView` component (grouped items
with status/comment/photo, a "frozen — can no longer be edited" note, no
inputs). Completed rows in "My Inspections" are clickable for both roles now
(`completedHref()` picks the report vs. the read-only detail by role). Editing
is still blocked three ways for a completed inspection: RLS `status <>
'completed'` on `inspection_items` update, the `saveInspectionItem` action's
completed check, and the read-only view simply having no inputs. Build/tsc/
eslint clean.


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
- Both GitHub PATs shared in chat for pushing to `jeroomeb/pps` were treated as compromised on principle (pasted in plaintext) and the user was told to rotate them; the first one was in fact already revoked by the time it was needed again, confirming that's the right instinct going forward. Never write a token into `.git/config` — use a command-scoped `-c http.extraheader="AUTHORIZATION: basic <base64 x-access-token:TOKEN>"` on the single `git push` invocation instead (verified working in this sandbox; `git credential-cache` did not work here for unclear reasons).

**Next session should:** deploy to Vercel (needs the user's own Vercel account — cannot be done headlessly), set the same env vars there, then do one real manual end-to-end pass in a browser.

### 2026-07-15 — Local manual verification (session 3)
- User asked to run the app locally rather than deploy yet. Started `npm run dev` (backgrounded) and confirmed `/login` returns 200; handed the user `http://localhost:3000` with the admin credentials to click through the full flow themselves (create property → create inspection → complete checklist) since no browser-automation tool is available to this agent.
- Vercel deployment intentionally deferred by the user ("will do later") — still the only remaining item before this is a real production app.

### 2026-07-15 — Design tokens were never actually wired up; fixed + nav bug fixed (session 4)
User reported the app looking nothing like the design system, Pass/Fail
appearing broken with no visible selection, unwanted dark mode, and getting
stranded inside an inspection with no way back to other admin tabs. Root
cause for the first three: `src/app/globals.css` had never been edited past
the `create-next-app` scaffold (confirmed via `git log` — byte-identical
since the initial commit), despite this file's "Design system" section above
previously claiming otherwise. Only `--color-background`/`--color-foreground`
existed, so **every** design-token class already used throughout the app
(`bg-surface`, `bg-primary-container`, `text-on-surface-variant`,
`bg-success-container`, `font-headline`, etc.) resolved to nothing — Tailwind
v4 silently generated no CSS for them. The scaffold also still had its
default `@media (prefers-color-scheme: dark)` block, which is why the app
went dark under an OS/browser dark-mode setting even though this design
system is light-mode only.

Fixes:
- Rewrote `src/app/globals.css`: full `@theme` token set from `DESIGN.md`
  (all surface/on-surface/primary/secondary/tertiary/error roles), plus new
  `success`/`success-container`/`na`/`na-container` tokens (not in DESIGN.md's
  color list — pulled from the `active_inspection_checklist` mockup's
  `peer-checked:` classes instead), `--font-headline` wired to the
  already-correctly-loaded Hanken Grotesk variable, and removed the dark-mode
  media query entirely. Verified via compiled CSS output (not just visually)
  that the token classes now generate real rules and the dark-mode query is
  gone.
- No changes needed in `ChecklistItemCard.tsx` / `ActiveInspectionChecklist.tsx`
  — the Pass/Fail state/persistence logic was already correct; it just had no
  CSS to show the selected state, which read as "broken."
- Fixed the nav trap: `src/app/inspector/layout.tsx` (used for
  `/inspector` and `/inspector/inspections/[id]`) had no nav at all, unlike
  `src/app/admin/layout.tsx`. Extracted the nav item list to
  `src/lib/nav-items.ts` (`ADMIN_NAV_ITEMS`) and now render `BottomNav` in the
  inspector layout too when `profile.role === 'admin'`, so an admin retains
  full navigation after drilling into an inspection.
- `npx tsc --noEmit` and `npm run build` both pass clean; re-verified locally
  with a clean `.next` rebuild (an earlier check against a stale dev-server
  cache falsely showed the old CSS still being served — killing the server
  and removing `.next` before restarting resolved that).

### 2026-07-15 — Full responsive redesign, PDF/report overhaul, PWA (session 5)
User did a CTO/CDO-style audit against the three reference screenshots
(desktop admin dashboard, checklist, and report view — none of which exist
as Stitch exports, only the mobile screens do) and called out: the web view
had zero resemblance to the design file, the checklist "add item" form was
buried below ~40-124 items forcing a huge scroll, PDFs were unreachable, and
"so many bugs" that code changes weren't worth reviewing piecemeal. Root
cause of the desktop complaint: **the codebase had no responsive breakpoints
at all** (confirmed via grep for `sm:`/`md:`/`lg:` — zero hits) — every page
was a fixed `max-w-2xl` mobile column with a phone tab bar stretched across
desktop.

Built:
- `AppShell` (new) — desktop sidebar (240px, logo, gold-pill active nav,
  gold "Start New Audit" CTA, Support/Logout) + mobile `Header`/`BottomNav`
  fallback, see Design System note above on the RSC-serialization trap this
  hit and how it's avoided now.
- New `/admin` dashboard (previously just `redirect('/admin/properties')`)
  with real Supabase-driven stats (Total Properties, Pending Inspections,
  Failed Audits = properties whose latest completed inspection has a fail
  item) and a Recent Properties table/cards.
- Every admin/inspector page redesigned with `Card`/`Badge`/`EmptyState`
  primitives (`src/components/ui/`), desktop tables + mobile card fallbacks,
  two-column forms on desktop.
- **Checklist add-item bug fixed**: `AddChecklistItemForm` moved to the top
  of `admin/checklists/[id]/page.tsx`, item list below is now grouped into
  collapsible `<details>` sections by category so 40+ items don't require
  endless scrolling either.
- **PDF/report bug fixed**: new `src/lib/pdf/generate.ts` extracts PDF
  rendering out of the complete route and adds `regenerateInspectionPdf()` —
  re-renders and re-uploads from current DB state if the stored PDF is
  missing/unreadable. New `src/app/api/inspections/[id]/pdf/route.ts`
  (`runtime = 'nodejs'`) always serves a real PDF inline (download-first,
  regenerate-as-fallback) instead of the old approach of hiding the download
  link whenever a signed URL failed to generate. New in-app web report page
  `src/app/admin/reports/[id]/page.tsx` (paper-style, Critical Findings
  section for fail items with photos, remaining items by category,
  Download PDF + Resend Email toolbar) — matches the target screenshot
  minus the health-score/repair-estimate/bid-request extras the user
  explicitly said to skip.
- **Inspector nav trap fixed**: `inspector/layout.tsx` now always renders
  nav (a minimal `INSPECTOR_NAV_ITEMS` for inspectors, full admin nav when
  an admin is double-acting as inspector) — previously only admins got a
  `BottomNav` at all.
- Toasts (`src/components/ui/Toast.tsx`, `useToast()`) replace both
  remaining `alert()` calls (photo upload failure, submit-warning).
  `ChecklistItemCard` photo upload also no longer silently re-flags "photo
  required" when a signed URL fails post-upload — it now shows a distinct
  "saved, preview unavailable" state instead of lying about missing photos.
- Logo optimized: `public/logo.png` (2.2MB) was being loaded on every page
  render and re-inlined into every PDF/email. Generated `logo-sm.png`
  (96px), `icon-192/512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`
  via `sips`; swapped all in-app/email/PDF references to the small variant;
  deleted leftover create-next-app scaffold SVGs from `public/`.
- **PWA**: `src/app/manifest.ts` (installable manifest), hand-written
  `public/sw.js` (shell-asset caching + navigation fallback, no offline data
  sync — Supabase needs the network anyway), `SwRegister.tsx` client
  component registered in root layout, viewport/appleWebApp metadata added
  to `src/app/layout.tsx`.
- **Real bug caught during verification, not just planned**: `src/proxy.ts`'s
  matcher didn't exclude `manifest.webmanifest` or `sw.js`, so the auth
  proxy was 307-redirecting both to `/login` for logged-out visitors,
  silently breaking installability. Fixed by adding both to the negative
  lookahead in the matcher regex.

**Verified live** (not just build-clean): `npx tsc --noEmit` and
`npm run build` both pass clean; ran a full Playwright click-through against
`npm run dev` logged in as the real admin account — dashboard/properties/
team/checklists render correctly at 1440px with the sidebar and at 375px
with the icon-only bottom nav (had to switch the bottom nav to icon-only
mid-session — 6 labelled tabs literally overlapped/collided at 375px),
confirmed "Add Item" heading renders before "Checklist Items" in DOM order,
and confirmed `/api/inspections/[id]/pdf` returns a real `200
application/pdf` from the report view page. No console errors in any of the
above. **Not yet manually verified**: the inspector-side active-checklist
redesign (needs an inspector-role login / an in-progress inspection to
click through) and the PWA install prompt itself (needs a real deploy or
manual "Add to Home Screen" — service worker registration and manifest were
confirmed reachable and correctly typed, but the actual install flow wasn't
driven end-to-end).

### 2026-07-15 — Round 2 polish punch list (session 5, continued)
User reviewed on localhost and filed a hard punch list. All items fixed and
re-verified live via the same Playwright harness (admin login, real Supabase):
- **Dashboard tab stuck highlighted** — `isActive` used prefix matching, so
  `/admin` matched every admin route. Nav items now support `exact: true`
  (shared `isNavItemActive()` in `src/lib/nav-items.ts`, used by both
  `AppShell` and `BottomNav`).
- **Support button removed** from sidebar; CTA renamed **"Start Inspection"**
  → new `/admin/inspections/new` page (select property + checklist +
  inspector; `NewInspectionForm` generalized to take either a fixed
  `propertyId` or a `properties` list). `createInspection` now redirects
  **straight into the checklist when the admin assigns themselves**
  (verified: submit landed on `/inspector/inspections/[id]`).
- **Clickable rows everywhere** — dashboard Recent Properties and Properties
  tables (every cell is a full-bleed `<Link>`, View/Actions column dropped),
  reports list rows, and property-page inspection rows (completed → report
  view, open → active checklist).
- **Edit/Delete everywhere** — new server actions `deleteProperty` (cleans
  that property's photos/reports from storage first via
  `src/lib/supabase/storage-cleanup.ts`), `deleteInspection`,
  `deleteTemplate` (FK-blocked with friendly error when inspections use it,
  code 23503), `renameTemplate`, `deleteTeamMember` (blocked with count
  message when they have inspections; can't delete yourself). Reusable
  two-tap `ConfirmDeleteButton` (arms for 4s, then fires; errors surface as
  toasts) on property detail, reports rows, checklist detail (+ inline
  `RenameTemplateForm`), and team rows.
- **Property page rebuilt**: 4 stat cards (Total/In Progress/Completed/Failed
  items — failed count queried from `inspection_items`), icon subtitle,
  Edit + Delete in header, clickable inspection rows.
- **PDF completely redesigned** (`InspectionReport.tsx`): 48pt margins,
  10.5pt/1.5 line-height, fixed branded header (logo + gold rule + report
  ID) on every page, meta panel incl. a Result cell, **Critical Findings
  section first** with always-present labeled "Inspector Comments" blocks
  and 240×180 photos, then per-category item cards with photos for ANY item
  that has one (was: fail-only), page-numbered footer.
  `/api/inspections/[id]/pdf` now **always re-renders from DB** (and
  re-uploads) instead of serving the stored file, so template changes reach
  users immediately — the "missing logo/photos/comments" complaint was the
  stale stored PDF from the old template.
- **My Inspections desktop redesign**: 4-stat row, "Open Inspections" cards
  with date/status strip header, Completed as a desktop table (mobile keeps
  cards).
- **Container alignment**: new `PageHeader` component used on every page;
  removed all inner `mx-auto` centering so content is consistently
  left-aligned inside the shell container.
- Verified: tsc/build/eslint clean (only pre-existing @react-pdf alt-text
  warnings), full Playwright pass with zero console errors, PDF fetched
  (200, application/pdf) and visually confirmed via Quick Look render.

### 2026-07-17 to 2026-07-20 — Pre-handover audit, ~25 fixes applied, temp Vercel deploy, Resend + signup fully resolved (session 6)
User asked for a full inside-out audit (bugs + design, phone/web, admin/inspector) as pre-handover prep. Read all 65 source files, scanned full git history for secrets, ran `tsc`/`eslint`/`npm audit`/`npm run build`, queried live Supabase auth settings, and verified Resend SDK error behavior against `node_modules` before writing anything up. Full findings (6 Critical / 26 Should Fix / 21 Nice to Have) are in **`REVIEW.md`** — that file is the source of truth for what was found and what's still open; this entry only summarizes what changed.

**Fixed and verified live** (not just build-clean — see verification methodology below):
- **Silent email failures**: the Resend SDK resolves `{ error }` instead of throwing on API errors, so both send call sites (`complete` route, `resend` route) were reporting success on a failed send. `sendReportEmail` now throws on `result.error`.
- **Double-submit**: `complete` route now rejects an already-completed inspection (409) and uses a conditional `.neq('status','completed')` update as a compare-and-set so a race can't send two emails.
- **Admin self-signup escalation**: `handle_new_user` trigger hardcoded to always create `role: 'inspector'` regardless of signup metadata (was trusting client-supplied `role`); `createTeamMember` promotes to admin explicitly post-creation instead. Public signup itself also disabled in the Supabase dashboard (see below) — the trigger fix alone wasn't sufficient, both were needed.
- **Completed inspections frozen**: RLS on `inspections`/`inspection_items` now blocks all updates once `status = 'completed'`, even for admins — the PDF/email is meant to be the record of truth.
- **`inspection_items` unique constraint** on `(inspection_id, template_item_id)` — prevents duplicate checklist rows from a retried insert.
- Client-side: autosave (`ChecklistItemCard`) now reverts + toasts on failure instead of showing an unsaved answer as saved; submit/resend `fetch` calls wrapped in try/catch (previously an unhandled rejection could strand the button on "Submitting…"); forms (`InspectorForm`, `AddChecklistItemForm`) only reset on confirmed success, not on validation error; `saveInspectionItem` now checks assignment + completed-status server-side instead of trusting RLS alone; last-admin-demotion guard in `setTeamMemberRole`; friendly `23505` duplicate-name messages; `createTemplate` cleans up its orphan template row if the items insert fails; `sort_order` now `max+1` instead of `count` (was producing duplicates after deletes); `requireRole('admin')` added directly to `reports/[id]/page.tsx` (it queries with the service-role client and shouldn't rely solely on the parent layout as the auth boundary).
- `error.tsx` / `global-error.tsx` / `not-found.tsx` / `admin` + `inspector` `loading.tsx` skeletons added (there were none).
- A11y: toast container `aria-live="polite"` + `role="alert"`/`"status"`, `aria-pressed` on Pass/Fail/N/A buttons, real `<label htmlFor>` wiring on `InspectorForm`/`AddChecklistItemForm` (previously placeholder-only), photo `alt` text describes the item instead of `alt=""`.
- Deleted unused `public/logo.png` (2.2MB, dead — everything already used `logo-sm.png`) and `logo-512.png`; repointed `scripts/test-pdf-email.mts` to `logo-sm.png`.
- Email HTML (`reportEmail.ts`) now escapes interpolated values (property/checklist/inspector names are admin-entered, so this was a low-risk but real stored-XSS-in-email-client gap).
- **README.md rewritten** from create-next-app boilerplate into a real setup/env-vars/deploy guide — it was previously unusable by anyone but the person who built this.
- New `supabase/migrations/0001_security_hardening.sql` (trigger fix, completed-freeze RLS, unique constraint, FK indexes) — applied to the live DB by the user via the SQL editor, then functionally verified (not just assumed): a throwaway test signup with `user_metadata: { role: 'admin' }` came back `role: 'inspector'` (PASS), a duplicate `inspection_items` insert returned `23505` (PASS), and an admin-role session's update on a completed inspection's item returned 0 rows affected under RLS (PASS). Test user deleted after.

**Resend — fully resolved, not deferred:** turned out `hello@wedontcode.com` (flagged as a possible "contractor's account" in session 2) is in fact the account to keep using — user confirmed and had already verified `pps.wedontcode.com` on it (`sending: enabled`, checked via the Resend API). The actual bug: `EMAIL_FROM` was still hardcoded to `onboarding@resend.dev`, which restricts delivery to the account owner regardless of any other verified domain on the account — confirmed from the literal Vercel runtime log for a failed send (`"You can only send testing emails to your own email address..."`). Fixed by changing `EMAIL_FROM` to `PPS Inspections <reports@pps.wedontcode.com>` in `.env.local`, `.env.example`, and the Vercel prod env, then confirmed with a real direct Resend API send that succeeded (landed in the user's inbox).

**Public signup:** user disabled it themselves in the Supabase dashboard after being walked through where; verified end-to-end afterward with a real signup POST to `/auth/v1/signup` returning `422 signup_disabled` (not just checking the settings flag).

**Temporary Vercel deployment:** `npx vercel login` (device auth) → `npx vercel --yes` created project `hassan-wedontcode/pps` (GitHub auto-link to `jeroomeb/pps` failed silently — this CLI session doesn't have repo access — deploy proceeded anyway from the local upload). Pushed all six `.env.local` vars into the Vercel production env via `vercel env add ... --force`, redeployed. Aliased to `ppsdemo.vercel.app` per user request; that alias initially hit Vercel's SSO wall even though the default auto-generated alias didn't — root cause: project's `ssoProtection` was `all_except_custom_domains`, and a manually-added `*.vercel.app` alias doesn't count as a "custom domain" for that exemption. Fixed via a direct `PATCH /v9/projects/{id}` call to the Vercel API (no CLI command exposes this) setting `ssoProtection: null`. **Remember:** a manual alias doesn't follow new prod deploys automatically — re-run `vercel alias set` after every `vercel --prod`, as was needed after the `EMAIL_FROM` fix.

**Deliberately deferred** (explicit user calls, not oversights): moving the deployment to the client's own Vercel account, tests/CI, the `database.types.ts` `Relationships`/cast cleanup (28 occurrences), migrations tooling adoption, Sentry/observability, remaining Nice-to-Haves — full list in `REVIEW.md`'s "Suggested fix order."

**Verified:** `tsc --noEmit`, `eslint` (same 3 pre-existing PDF alt-text warnings only), `npm run build` all clean after every batch of fixes. Live demo confirmed reachable and functional (`307` on `/`, `200` on `/login`) at each deploy step.
