# PPS Inspections — Pre-Handover Audit (REVIEW.md)

Audited 2026-07-17 against the working tree (uncommitted session-5 changes included).
Verified live where possible: `tsc --noEmit` clean, `eslint` clean (3 pre-existing warnings), `npm run build` clean, live Supabase auth settings queried, Resend SDK behavior verified against `node_modules`, full git history scanned for secrets.

Severity legend: **[Critical]** must fix before handover · **[Should Fix]** fix soon after · **[Nice to Have]** polish.

---

## 1. Architecture & Structure

Overall: idiomatic App Router project with a genuinely good shape — a real DAL (`src/lib/auth/dal.ts`), Server Actions per domain (`src/lib/actions/*`), route handlers only where a binary response or client-side `fetch` is genuinely needed (PDF, complete, resend), UI primitives under `src/components/ui/`. Server/client component split is correct throughout; every `'use client'` file I checked actually needs it. The Next 16 rename (middleware → `src/proxy.ts`) is handled correctly.

Findings:

- **[Should Fix]** `src/lib/database.types.ts` — every embedded join in the app is then re-cast with `as unknown as { ... }` (28 occurrences across pages/routes, e.g. `src/app/api/inspections/[id]/complete/route.ts:74-80`, `src/app/admin/reports/[id]/page.tsx:46-52`). The hand-written `Database` type is missing the `Relationships` arrays for FK joins, so `properties(name)` etc. type as `never` and get force-cast — the casts mask real type errors (a renamed column would silently pass). Fix: generate types with `supabase gen types typescript` (or complete the `Relationships` arrays) and delete every `as unknown as`.
- **[Nice to Have]** `src/components/ResendEmailButton.tsx` uses a client `fetch` to a route handler while every other admin mutation is a Server Action — works, but inconsistent; could be an action with `useTransition`.
- **[Nice to Have]** `src/lib/actions/checklists.ts:124-134` (`renameTemplate`) and `src/lib/actions/auth.ts:12-13` parse with raw `String(formData.get(...))` while sibling actions use zod — pick one convention (zod) everywhere.
- **[Nice to Have]** Root `CLAUDE.md` contains internal build-session notes (including discussion of a contractor's Resend account and token-handling incidents). Prune or delete before client delivery.

## 2. Bugs & Logic Issues

- **[Critical]** `src/lib/email/sendReportEmail.ts:30` + `src/app/api/inspections/[id]/complete/route.ts:116-132` + `src/app/api/inspections/[id]/resend/route.ts:50-63` — **failed emails are silently swallowed**. The Resend SDK does not throw on API errors; it resolves with `{ data: null, error }` (verified in `node_modules/resend/dist/index.cjs` — the only `throw`s are missing-API-key and React render). Both routes wrap the call in `try/catch` and never inspect the resolved `error`, so the known sandbox 403 (and any future failure) reports **full success** to the inspector and admin. Fix: `const { error } = await sendReportEmail(...); if (error) …` and surface the existing `warning` path / 500.
- **[Critical]** `src/app/api/inspections/[id]/complete/route.ts:29-31` — no guard that the inspection isn't already `completed`. A double-tap on Submit (or a re-POST) re-generates the PDF, overwrites `completed_at`, and re-sends the email. Fix: reject when `inspection.status === 'completed'` (and ideally make the status update a conditional `.eq('status', ...)` compare-and-set before emailing).
- **[Should Fix]** `src/components/ChecklistItemCard.tsx:48-57` — autosave has zero error handling. `saveInspectionItem` throws on DB error; the throw happens inside `startTransition` with no catch, so on a flaky mobile connection the item shows as saved (local state already updated at line 60) while nothing persisted — **silent field-data loss**, and submit validation later contradicts what the inspector sees. Fix: try/catch in `persist`, toast the failure, revert local state.
- **[Should Fix]** `src/components/ActiveInspectionChecklist.tsx:56-59` — `await res.json()` with no try/catch; if the proxy 307s to `/login` (expired session) or the server returns HTML, the parse throws unhandled and the button is stuck on "Submitting…". Same pattern in `src/components/ResendEmailButton.tsx:10` (network failure → unhandled rejection, stuck "Sending…"). Fix: wrap both fetches; check `res.redirected`/content-type.
- **[Should Fix]** `src/components/InspectorForm.tsx:19-22` and `src/components/AddChecklistItemForm.tsx:17-20` — the form is `reset()` unconditionally after the action, **including when the action returned a validation error** — the user's input is wiped while the error message tells them to fix it. Fix: only reset when the action returned no error (return a success flag in state, or reset in a `useEffect` keyed on a success state).
- **[Should Fix]** `src/lib/actions/checklists.ts:58-71` (`createTemplate`) — if the items insert fails after the template insert succeeded, the orphan template row is left behind (no compensation like `createInspection` has at `inspections.ts:53,69`). Next attempt with the same name then hits the unique constraint. Fix: delete the template on items-insert failure.
- **[Should Fix]** `src/lib/actions/checklists.ts:97-107` (`addTemplateItem`) — `sort_order = count` produces duplicate sort_orders once any item is deleted; ordering (`.order('sort_order')` with no tiebreaker) then becomes nondeterministic in both the template view and copied inspections. Fix: `max(sort_order)+1`, plus a secondary order key.
- **[Should Fix]** `src/components/DeleteItemButton.tsx:17` — fire-and-forget server action: no `await`, no transition, no error handling, and native `confirm()` is inconsistent with the `ConfirmDeleteButton` two-tap pattern used everywhere else. Failures vanish. Same swallow in `src/lib/actions/checklists.ts:117-122` and `src/lib/actions/team.ts:52-57` (errors from `.delete()`/`.update()` ignored).
- **[Should Fix]** No `error.tsx` anywhere in `src/app` — any thrown server error (Supabase outage, bad ID) renders Next's default white error screen with no shell/branding, and `notFound()` gets the unstyled default 404. Add root `error.tsx`, `global-error.tsx`, `not-found.tsx`.
- **[Should Fix]** `src/lib/actions/inspections.ts:101-105` — `photo_path: parsed.photo_path ?? undefined` converts an explicit `null` ("clear photo") into "don't update", so a photo can never be removed through this action; there's also no UI to remove a photo, and replaced photos orphan the old storage object (`ChecklistItemCard.tsx:76-80` uploads under a new timestamped path each time). Minor today, but storage grows forever.
- **[Nice to Have]** `src/lib/actions/team.ts:67-76` (`deleteTeamMember`) — `if (count)` treats a `null` count (query error) as "no inspections" and proceeds to delete the auth user. Check the error explicitly.
- **[Nice to Have]** `src/app/admin/page.tsx:19-27` — property health uses the most recent inspection by `created_at`; a property whose latest completed audit had failures shows "Pending" (not "Critical") the moment any new inspection is opened. Confirm that's the intended semantics.
- **[Nice to Have]** `src/lib/actions/checklists.ts:54` — duplicate template name surfaces the raw Postgres message (`duplicate key value violates unique constraint …`). Map code `23505` to a friendly message like `deleteTemplate` already does for `23503`.
- **[Nice to Have]** `public/sw.js:29` — offline navigation falls back to `caches.match('/')`, but `/` is never cached (it's a dynamic redirect), so offline users get the browser error page anyway. Either cache a real offline page or drop the fallback.

Form validation: all forms are validated server-side with zod (or explicit checks) in addition to HTML `required` — good. `saveInspectionItem` is the only mutation with no role/status check of its own (see §3).

## 3. Security

Secrets & git history:
- ✅ Full `git log --all -p` scan: **no secret values ever committed** — only env-var *names*. `.env*` has been gitignored since the initial commit; `.env.example` exists and documents all six referenced vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_EMAIL`). Nothing sensitive carries a `NEXT_PUBLIC_` prefix; the service-role key is only referenced in server-only files (`src/lib/supabase/server.ts:34`, scripts).

- **[Critical] Public signup allows self-registration as admin.** Verified live: `GET /auth/v1/settings` on the project returns `disable_signup: false` with email auth enabled. `supabase/schema.sql:190-204` (`handle_new_user`) copies `raw_user_meta_data->>'role'` straight into `profiles.role`. Anyone who finds the project URL + anon key (both shipped to every browser) can call the public signup endpoint with `user_metadata: { role: 'admin' }`, confirm the email, and get **full admin over every property, team member, and report**. Fix (both): disable public signups in Supabase Auth settings, **and** hardcode `'inspector'` in the trigger so metadata can never mint admins (team creation via `auth.admin.createUser` still works — that path can keep the metadata role or promote via `profiles` update).
- **[Critical]** `.env.local` `RESEND_API_KEY` belongs to a third party (`hello@wedontcode.com`, the original Fiverr contractor — documented in CLAUDE.md). A third party controls (and can revoke or read metadata on) the client's outbound report email. Swap to a client-owned Resend account + verified domain before go-live; rotate the key out of any shared channels.
- **[Should Fix]** `supabase/schema.sql:144-184` — the `inspections_update` and `inspection_items_update` policies have **no status guard**: an inspector can keep editing items (and the app will happily re-serve a regenerated PDF) after the report was emailed, because `/api/inspections/[id]/pdf` re-renders from live DB state (`src/app/api/inspections/[id]/pdf/route.ts:26-31`). The signed report of record can silently change after the fact. Fix: block updates when the owning inspection is `completed` (policy predicate or a guard in `saveInspectionItem`), and/or serve the stored PDF for completed inspections and only regenerate on explicit admin request.
- **[Should Fix]** `src/lib/actions/inspections.ts:107-116` (`saveInspectionItem`) — only checks "any authenticated profile"; it relies entirely on RLS for authorization and doesn't check inspection status at all (compounds the finding above). Add an explicit assigned-inspector/admin + not-completed check.
- **[Should Fix]** `src/app/admin/reports/[id]/page.tsx:15` — the page queries with `createAdminClient()` (service role, bypasses RLS) and contains **no `requireRole('admin')` of its own**; it depends on the parent layout's check, and Next.js explicitly documents layouts as not a reliable auth boundary (layouts and pages render in parallel). Add `requireRole('admin')` at the top of the page (one line), as `/api/inspections/[id]/pdf` and `/resend` already do.
- **[Should Fix]** `src/lib/actions/team.ts:52-57` (`setTeamMemberRole`) — no guard against demoting the **last remaining admin** (the UI only hides the button for *yourself*; two admins can still demote each other into a lockout, and the server would accept self-demotion from a forged request). Add a "at least one admin must remain" check.
- **[Should Fix]** `src/lib/email/reportEmail.ts:30-43` — `propertyName`, `checklistName`, `inspectorName` are interpolated into email HTML unescaped. Values are admin-entered, so risk is low, but a property named `<img src=x onerror=…>` becomes live HTML in the recipient's mail client. Escape interpolations.
- **[Nice to Have]** `supabase/schema.sql:223-233` — storage policies let **any authenticated user** read every photo in the bucket and upsert over any photo path (`photos_write`/`photos_update` don't scope paths to the caller's own inspections). With signup locked down this is a small trusted pool, but path-scoped policies would be more correct; there's also no delete policy (cleanup relies on service role — fine).
- **[Nice to Have]** No rate limiting on `/api/inspections/*` routes or the login action beyond Supabase's built-in auth limits. Fine at this team size; note it if the app ever goes multi-tenant.

RLS table-by-table (all six tables have RLS enabled — none rely on client-side filtering):

| Table | Enabled | Read | Write | Verdict |
|---|---|---|---|---|
| `profiles` | ✅ | own row or admin | admin only | OK (trigger role issue above) |
| `checklist_templates` | ✅ | any authed | admin only | OK |
| `checklist_template_items` | ✅ | any authed | admin only | OK |
| `properties` | ✅ | any authed | admin only | OK (inspectors can read all properties incl. contact email — acceptable) |
| `inspections` | ✅ | own or admin | insert/delete admin; update own-or-admin | Missing completed-status guard |
| `inspection_items` | ✅ | via owning inspection | via owning inspection | Missing completed-status guard |

Route protection is enforced server-side (proxy redirect for unauthenticated + `requireRole`/`getProfile` in layouts, actions, and routes) — not just hidden UI. ✅

## 4. Database, Migrations & Queries

- **[Should Fix]** `supabase/schema.sql` is a single "run once" script, not versioned migrations. It *is* re-runnable (`create table if not exists`, `drop policy if exists`) and the DB **can** be rebuilt from scratch (schema.sql + `npm run seed` + `scripts/create-first-admin.mjs`) — but `create table if not exists` means future *column* changes silently no-op against an existing DB. Adopt `supabase migration` files (even just numbered SQL files) before the first post-handover schema change.
- **[Should Fix]** `supabase/schema.sql:51-62` — `inspection_items` has no `unique (inspection_id, template_item_id)`, so a retried/duplicated insert during `createInspection` can duplicate checklist rows. Add the unique constraint.
- **[Nice to Have]** Missing FK indexes: `inspection_items.template_item_id` and `inspections.template_id` (schema.sql:64-67 covers the other FKs). These make `deleteTemplate`'s FK check and template-item deletes table scans. Trivial at current scale.
- **[Nice to Have]** `src/app/admin/page.tsx:32-39` — dashboard loads **every** inspection row and **every** failed item to compute three counts; `src/lib/actions/properties.ts:85-89` similar. Use `count`/aggregates when data grows. Not an N+1 (joins are embedded, signed URLs are parallel `Promise.all`); `createSignedUrls` (bulk) would halve storage round-trips in the PDF path.
- **[Nice to Have]** Hard deletes everywhere with `on delete cascade`: deleting a property permanently destroys completed, already-emailed reports (plus storage cleanup in `src/lib/supabase/storage-cleanup.ts`). That may be exactly wrong for an audit product — flag to the client; consider soft-delete or blocking property deletion when completed reports exist. Conversely `inspections.template_id`/`inspector_id` have **no** cascade/`on delete restrict` documented intent — deletes are blocked (good) but only surfaced as a friendly error in `deleteTemplate`, not for profiles (handled in-app in `deleteTeamMember`).
- Seed: `scripts/seed-checklists.mjs` is idempotent by design (upserts templates, replaces items) and safe to re-run — but re-seeding **replaces items** and would orphan `template_item_id` references… actually blocked by the FK (`inspection_items.template_item_id references checklist_template_items` with no cascade) — so re-seeding **fails once any inspection exists**. **[Should Fix]**: document that seed is initial-setup-only, or make it skip templates in use.

## 5. Performance

- **[Should Fix]** No `loading.tsx` anywhere — every navigation between fully-dynamic pages (all routes are ƒ) gives zero feedback until the server responds; on 3G in the field this reads as "app frozen". Add route-group `loading.tsx` skeletons (dashboard, properties, checklist, inspector).
- **[Should Fix]** `public/logo.png` (2.2 MB) is still shipped in `public/` but referenced nowhere in `src` (all refs use `logo-sm.png`; only `scripts/test-pdf-email.mts` reads it). It's fetched by anyone probing `/logo.png` and bloats the deploy. Delete it (and unused `public/logo-512.png`).
- **[Nice to Have]** Signed photo URLs render via `<img>` (`ChecklistItemCard.tsx:167`, `reports/[id]/page.tsx:154`) — correct call (next/image can't cache expiring signed URLs well), but add `loading="lazy"` and explicit dimensions to avoid layout shift on the report page.
- **[Nice to Have]** Checklist page mounts up to ~40+ `ChecklistItemCard` client components each holding local state — fine at this size; no memoization needed. The only real re-render cost is `ActiveInspectionChecklist` re-rendering all cards per save; imperceptible here.
- **[Nice to Have]** `revalidatePath` coverage is mostly right but `createInspection` (`inspections.ts:73-74`) doesn't revalidate `/admin` (dashboard pending count) — with dynamic rendering this only matters for the 30s client router cache; harmless.
- Bundle: dependencies are lean (`@react-pdf/renderer` is server-only in a `runtime='nodejs'` route; lucide is tree-shaken). No dynamic-import needs found. ✅

## 6. Third-Party Failure Modes

- **Resend down / erroring:** **silently swallowed** — the flagship finding of this audit. See §2 first item: the SDK returns `{ error }` instead of throwing, so the `catch`-based handling in both email call sites never fires and the UI reports success. Today, with the sandbox-mode key, **every email to a real property address is failing 403 and the app says "submitted and report generated"** with no warning. Fix before handover.
- **Supabase down/slow:** server components throw → default white error screen (no `error.tsx`, §2); client autosave fails silently (§2); no timeouts or retries anywhere (default fetch behavior, requests can hang for the platform default). Acceptable for v1 **once** the error surfaces exist; add an `error.tsx` and autosave error handling as the minimum graceful degradation.
- **Vercel:** stateless app, nothing special; PDF generation is on-demand in a route (watch the 10s/60s function limit if checklists with many photos grow — each photo is fetched into the PDF render).
- **Cloudinary:** not used (photos live in Supabase Storage).
- **[Nice to Have]** No retry on the one truly "must not be lost" side effect (report email). Consider: mark inspection completed first (done), then email, and on failure store a `email_failed` flag the Reports page can badge — the resend button already exists as the manual retry.

## 7. Testing

- **Coverage: zero.** No test framework, no test files, no CI (no `.github/workflows`). `tsc`/`eslint` pass but nothing exercises behavior.
- Dangerously untested surfaces, in order: (1) the complete-inspection pipeline (validation → PDF → storage → email — the product's whole point), (2) RLS policies (an inspector reading/writing another's inspection), (3) role escalation paths (§3), (4) server action validation (zod rejects).
- **[Should Fix]** Minimum pre-handover set: Vitest unit tests for the zod schemas + `propertyHealth`; one integration test hitting `/api/inspections/[id]/complete` against a seeded test project (asserts 400 on incomplete items, 200 + `pdf_path` on success, and **email-failure surfaces the warning**); a Playwright happy path (login → create property → assign → complete checklist → report renders); a small pgTAP or supabase-js RLS test that a second inspector cannot read/update someone else's items. Wire into GitHub Actions on PR (`tsc && eslint && vitest && playwright`).

## 8. Accessibility

- **[Should Fix]** `src/components/ui/Toast.tsx:38-59` — toasts have no `role="status"`/`aria-live`, so screen-reader users never hear "Inspection submitted" or upload failures. Add `aria-live="polite"` (errors: `role="alert"`).
- **[Should Fix]** `src/components/InspectorForm.tsx:25-45` — name/email/password inputs have **no labels at all** (placeholder-as-label); placeholders disappear on input and aren't reliably announced. `AddChecklistItemForm.tsx:24-54` has visual labels but no `htmlFor`/`id` association. Add proper label wiring (the login and property forms do this correctly).
- **[Should Fix]** `src/components/ChecklistItemCard.tsx:122-139` — Pass/Fail/N/A buttons don't expose selection state to AT; add `aria-pressed={status === option.value}`. Selected state is also communicated by color+border only — the pressed style is distinguishable, but `aria-pressed` is the fix either way.
- **[Nice to Have]** Full-bleed row links render 4–5 identical links per table row (`admin/page.tsx:136-154`, `properties/page.tsx:51-64`) — noisy for screen readers. One link on the name cell + a row-level click handler, or `aria-hidden` on the duplicate cells' links.
- **[Nice to Have]** Report/checklist photos use `alt=""` (decorative) but are actual evidence content — use `alt={item.item_name + ' photo'}`. (Matches the 3 eslint `jsx-a11y/alt-text` warnings in the PDF component, where alt is a no-op but silences the lint.)
- Good marks: semantic tables, real `<details>/<summary>` for collapsing categories, `aria-label` on icon-only nav tabs and delete buttons, 44px+ touch targets throughout, keyboard-reachable everything (no custom widgets that trap focus). Color contrast of the token set checks out (gold-on-gold pairs `#554300` on `#d4af37` ≈ 4.9:1; body text well above AA); the only marginal text is decorative 10px uppercase badges.

## 9. Code Quality & Maintainability

- **[Should Fix]** The 28 `as unknown as` join casts (§1) are the main type-safety debt.
- **[Should Fix]** No error boundaries at all (also §2): add `src/app/error.tsx` + `global-error.tsx`.
- **[Nice to Have]** Dead code: `.industrial-gradient` class defined in `globals.css:73-75`, used nowhere; `tertiary` color tokens unused; `public/logo.png` / `logo-512.png` unused (§5); `logo.png` reference in `scripts/test-pdf-email.mts` points at the 2.2MB original.
- **[Nice to Have]** Duplication worth extracting: the signed-URL-per-item mapping appears 4× (`complete/route.ts:61-72`, `pdf` via `generate.ts:63-72`, `reports/[id]/page.tsx:35-44`, `inspector/inspections/[id]/page.tsx:41-52`) → one `signItemPhotos(items)` helper; the `toLocaleString('en-US', { dateStyle, timeStyle })` label appears 5×; the gold CTA link classes are copy-pasted across 4 pages → a `ButtonLink` primitive.
- **[Nice to Have]** `npm audit`: 2 moderate advisories, both the transitive `postcss <8.5.10` pin inside `next@16.2.10` itself — not directly fixable (`npm audit fix --force` would downgrade Next; don't). Track and bump Next when patched. `npm outdated`: everything current-major except cosmetic minors; `typescript` 7 / `eslint` 10 majors available, no need pre-handover.
- No `any`, no `@ts-ignore`/`@ts-expect-error`, no commented-out code blocks, naming is consistent. ✅

## 10. Deployment & Handover Readiness

- **[Critical]** `README.md` is untouched create-next-app boilerplate. A developer who isn't you cannot set this up from the docs: nothing about Supabase project creation, running `supabase/schema.sql`, `npm run seed`, creating the first admin (`scripts/create-first-admin.mjs`), the env vars, the Resend sandbox limitation, or Vercel deploy steps. All of this currently lives only in `CLAUDE.md` (an internal session log). Write a real README (most content can be lifted from CLAUDE.md §"Repo & environment").
- **[Critical]** Resend: client must own the account + verify a domain, and swap `RESEND_API_KEY`/`EMAIL_FROM` (§3). Until then every real report email fails — and per §6 it fails *silently*.
- **[Should Fix]** Observability: production errors are `console.error` in exactly 2 places and otherwise thrown into the void (no error boundary, no Sentry/Logflare). At minimum add error.tsx + keep Vercel function logs; ideally drop in Sentry's 5-minute Next.js setup before handover.
- **[Should Fix]** Not yet deployed — Vercel deployment (env vars incl. `SUPABASE_SERVICE_ROLE_KEY` as server-only, `RESEND_API_KEY`) is still an open item from the project log; the PWA install flow is untested until then.
- ✅ Build: `npm run build` compiles clean, zero warnings, all routes typed; proxy matcher correctly excludes `manifest.webmanifest`/`sw.js`. Env hygiene verified (§3). `.env.example` complete.

---

## Summary

| Category | Critical | Should Fix | Nice to Have |
|---|---|---|---|
| 1. Architecture | 0 | 1 | 3 |
| 2. Bugs & Logic | 2 | 7 | 4 |
| 3. Security | 2 | 5 | 2 |
| 4. Database | 0 | 3 | 3 |
| 5. Performance | 0 | 2 | 3 |
| 6. Third-party failures | (counted in §2/§10) | 0 | 1 |
| 7. Testing | 0 | 1 | 0 |
| 8. Accessibility | 0 | 3 | 2 |
| 9. Code Quality | 0 | 2 | 3 |
| 10. Deployment | 2 | 2 | 0 |
| **Total** | **6** | **26** | **21** |

## Fix log (2026-07-17, same day)

Applied after review — `tsc`, `eslint`, and `npm run build` re-verified clean:

- **Fixed:** Resend errors surfaced (SDK `{error}` now throws in `sendReportEmail`); already-completed guard + compare-and-set in complete route; `saveInspectionItem` auth/status guard with typed `{error}` returns; autosave revert+toast; submit/resend fetch try/catch; form reset only on success (+ real labels); `createTemplate` orphan cleanup; `sort_order` max+1; `DeleteItemButton`/`RoleToggleButton` error handling; last-admin guard; `deleteTeamMember` null-count; 23505 friendly messages; `requireRole` in `reports/[id]`; `error.tsx`/`global-error.tsx`/`not-found.tsx`/`loading.tsx`; toast `aria-live`; `aria-pressed`; photo alt+lazy; email HTML escaping; deleted unused `public/logo.png`+`logo-512.png`; README rewritten.
- **Schema:** trigger hardcodes `'inspector'` (admin promotion moved into `createTeamMember`); completed inspections frozen in RLS; `inspection_items` unique constraint; missing FK indexes — in `schema.sql` for fresh installs **and** `supabase/migrations/0001_security_hardening.sql` for the live DB (**run it in the SQL editor + disable public signups in the dashboard — two manual steps remaining**).
- **Deliberately not done:** Resend account/domain swap and Vercel deploy (deferred by owner); tests/CI; `database.types.ts` Relationships refactor (28 casts); migrations tooling adoption; Sentry; remaining Nice-to-Haves.

### Suggested fix order

1. **Lock down signup** (Supabase dashboard toggle + hardcode `'inspector'` in `handle_new_user`) — 15 min, closes the admin-escalation hole.
2. **Surface Resend errors** (`sendReportEmail` return check in both routes) + **already-completed guard** in the complete route — the two silent-failure bugs in the product's core flow.
3. **Client-owned Resend account + domain**, swap key (client action; blocks real email delivery).
4. **README rewrite** + prune CLAUDE.md — unblocks handover itself.
5. Autosave/submit/resend error handling in the three client components + `error.tsx`/`loading.tsx`/`not-found.tsx`.
6. Freeze completed inspections (RLS or action guard) + `requireRole` in `reports/[id]` page.
7. Form-reset-on-error, `createTemplate` orphan, `sort_order`, unique constraint, last-admin guard.
8. Regenerate `database.types.ts` and remove the 28 casts.
9. Minimum test set + CI (§7).
10. Accessibility batch (toast aria-live, labels, aria-pressed) and the Nice-to-Have cleanup list.
