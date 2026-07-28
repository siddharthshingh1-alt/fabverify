# CHANGELOG.md
### What Changed, When
> Append-only. Newest at top. Every meaningful build session adds an entry. Keep entries accurate (X2) — describe what actually changed, never overstate.

Format: `## [date/session] — title` then bullets grouped by Added / Changed / Fixed / Deprecated.

---

## [2026-07-28 · Batch 2 · Stage 4] — Group 2 route auth complete and runtime-verified; temp debug routes removed
> Closes the Group 2 conversion (orders, messages/conversations, enquiries, sample-briefs — 13 handlers). Every converted handler derives caller identity from the verified session, enforces ownership, and answers through `dbErrorResponse`. **Verified by curl against a running dev server, with before/after database reads proving that a rejected request wrote nothing. The enquiry→conversation BROWSER end-to-end test has NOT been run yet** — see Not Verified.

### Removed
- **`app/api/whoami/route.ts` and `app/temp-whoami-test/` deleted.** Temporary diagnostic scaffolding from the Batch 1 auth migration, unlinked from any UI but compiled into the production route manifest — `/temp-whoami-test` would have shipped on the next deploy. Both were leaf files (they imported `lib/auth` / `lib/apiClient`; nothing imported them), so removal touched no other module. `npm run build` confirms neither appears in the route manifest.

### Verified (runtime, 2026-07-28)
- **Group 2b — messages.** `POST /api/messages` anonymous → **401**. Impersonation: authenticated as `9999999991` while the body claimed `senderPhone: 9998887799` created the row with `sender_id` = the *authenticated* caller, and the response embedded `sender: {name: "Anita sharma", phone: "9999999991"}` — the claimed identity appears nowhere. `POST /api/messages/read` anonymous → **401**; a cross-account attempt (caller A naming victim V's phone and id in the body) returned 200 but left V's three unread messages at `read_at: null`, because the receiver is derived from the session and can only ever be the caller's own inbox.
- **Group 2c — enquiries & sample-briefs.** `POST /api/enquiries` anonymous → **401**; impersonation attributed the enquiry to the authenticated caller. `POST /api/sample-briefs` anonymous → **401**; impersonation forced `buyer_id` to the caller; a manufacturer account → **403** (buyer/enterprise only). `GET /api/sample-briefs/[id]` anonymous → **401**, verified non-owner → **200** (a manufacturer must read a brief to respond). Bare listing stays **200** public by design.
- **Asymmetric PATCH on `sample-briefs/[id]`** (previously *no auth at all*): anonymous → **401**; non-owner setting `closed` → **403**; non-owner setting `cancelled` → **403**; non-owner setting `responses_received` → **200**; owner setting any status → **200**. Each reject was re-run in isolation with a database read before and after — the brief's status was unchanged every time, so "rejected" means "wrote nothing", not merely "returned an error code".
- **DB-outage 503.** Against an unresolvable Supabase host: `POST /api/enquiries`, `POST /api/messages`, `PATCH /api/sample-briefs/[id]` and `GET /api/sample-briefs?role=buyer` all returned **503** with no raw exception text.

### Not Verified
- **The browser end-to-end (enquiry → conversation appears for both parties → both can message) has NOT been run.** Confirmed in code and by curl, never watched on screen. Repeated dev-server request-log and database diffs showed no `POST /api/enquiries`, no `POST /api/messages`, and zero new rows. Still outstanding.
- Production token path untested: all runtime checks ran under `next dev`, where `getVerifiedUser` accepts the `x-dev-phone` header. This proves the authorisation logic, not the production Supabase-session branch, which is gated by `isProduction`.

### Notes
- **Still not deployable.** `dev-auth/lookup` remains unconverted (unauthenticated user-enumeration, own task), and **Issue B — the chat-logout session bug — is still open**. Removing the debug routes clears only one of the two deploy blockers. Committing is not deploying.
- Found while verifying, logged in `TASKS.md`, deliberately NOT fixed in this batch: (1) `db.ts` has ~14 `if (error) return []/null` sites that swallow a database outage into an empty result — `GET /api/sample-briefs` answered `200 {"briefs":[]}` during a total outage instead of 503; (2) discovery defaults to Silver+Gold tiers while every manufacturer signs up Bronze, so newly-onboarded suppliers are invisible in default discovery.

---

## [2026-07-27 · Batch 2a] — Orders routes: caller verification, row-level ownership, milestone scoping
> Group 2a of the route-auth conversion. Orders only — messages, enquiries and sample-briefs are still unconverted.

### Fixed
- **`PATCH /api/orders/[id]` had NO authentication of any kind.** Any unauthenticated caller who knew or guessed an order UUID could change that order's status — including cancelling it — or advance any milestone. Given DECISIONS M2 (escrow releases on verified milestones), this is the route that will eventually move money. It now requires a verified caller who is a party to the order. Verified: an unauthenticated `PATCH …{"status":"cancelled"}` returns **401** and the target order remained `confirmed`.
- **`GET /api/orders/[id]` leaked full commercial terms** — style, quantity, price per piece, total value, both parties — to anyone with the id. Now party-checked; a verified non-party gets **403**.
- **`GET /api/orders` returned any account's entire order book** to anyone naming their phone in the query string. Results are now filtered on the verified session's `users.id`, so scoping is structural rather than checked.
- **`POST /api/orders` let anyone create an order in someone else's name**, committing them to a purchase they never made. `buyer_id` is now taken from the verified session and `buyerPhone` is no longer read from the body at all — the field is absent rather than validated, so there is nothing to spoof. Verified: a POST authenticated as 9183779127 while claiming `buyerPhone: 9998887799` created the order against **9183779127**.
- **Milestone updates were not scoped to their parent order.** `updateMilestoneStatus(milestoneId, status)` matched on milestone id alone, so a party to one order could advance a milestone on a different order — the route's party check proves which *order* you may touch, not which *milestone*. It now takes `orderId`, filters `.eq("order_id", orderId)` in the same atomic statement, and returns `false` on zero rows so the route answers 404 rather than reporting a success that never happened.

### Added
- Counterparty validation on order creation: the named manufacturer must exist and must actually be a `manufacturer` account (404 / 400). Lightweight by design — enough to stop orphan and garbage orders, no more.
- Buyer-side gate accepting `buyer` **and** `enterprise` accounts, per DECISIONS I3 (enterprise access is additive — a large brand buys from the same vendors as everyone else). Written as explicit comparisons rather than `resolveAccount(...).userType === 'buyer'`, because that resolver falls back to the buyer persona for unknown or null values and an authorisation gate must not lean on a permissive default.

### Changed
- Seven client call sites moved to `authFetch` across `OrdersPage.tsx`, `OrderDetailPage.tsx`, `manufacturer/dashboard/page.tsx` and `brand/orders/new/page.tsx`. The last also stopped sending `buyerPhone`, which the server now ignores.
- CORE T6: `orders` GET and `orders/[id]` PATCH gained their first real `try/catch`; all four handlers now use `dbErrorResponse`.

### Notes
- **Party check only — no state machine.** Any party may set any status or advance any milestone: a buyer can mark a milestone complete, a manufacturer can cancel. The unauthenticated hole is closed; the role rules are not written. Deliberate — those transitions are a domain decision entangled with escrow release and are tracked separately in `TASKS.md`.
- Order-number generation (`Date.now()` slice) can still collide. Noted, deferred, logged in `TASKS.md` as DB-level hardening.

---

## [2026-07-27 · Batch 1, part 3] — Real caller verification on Group 1 routes; onboarding stops on save failure
> **Issue E is complete** — both the auth path and the data-write path now answer 503 for an unreachable database, and no raw exception text can reach a user. **Issue A is complete and proven end-to-end** against a dead database (see Verified below).
>
> Supersedes the note on part 2 below, which said Stage 3 (route conversion) was NOT done. Stage 3 is now **partially** done: 4 of 19 routes converted — those four have verification + ownership check + 503 handling. The other 15 do not. Stage 4 (removing the phone-trust path entirely, and deleting the temporary diagnostic routes) is still NOT done.

### Added
- `app/lib/auth.ts` — the single place a route asks who the caller really is, instead of trusting a phone from the request body. Two deliberately separate levels: `getVerifiedCallerPhone()` answers "which phone has this caller PROVEN they own" and works before an account row exists (account creation needs this); `getVerifiedUser()` answers "which existing `users` row is this caller". Production reads a real Supabase session token; development reads the `x-dev-phone` header, gated on `NODE_ENV` — never on the header's presence — so it cannot activate on a real deployment. Goes through `db.ts`, never imports Supabase directly (CORE T1 / DECISIONS A1).
- `app/lib/apiClient.ts` — the client half. `authFetch()` attaches the session token in production and the dev-phone header on localhost, so call sites don't hand-roll it. `readSaveError()` turns a failed response into a message that tells the user whether retrying will help.
- `app/lib/db.ts` — `getUserByPhoneOrThrow()`. Same lookup as `getUserByPhone()` but throws on a database error instead of returning `null`, so "no such user" and "database unreachable" stop being indistinguishable.
- `app/lib/apiError.ts` — `isDatabaseUnavailable()` and `dbErrorResponse()`. The single response for "a `db.ts` call threw": 503 when the database was unreachable, 500 for a genuine query error, and never the raw exception text on the 503 path. Detection is a documented heuristic on message text (Supabase exposes no "unreachable" error code); anything unrecognised falls through to 500, which is what every route did before, so a miss degrades to the previous behaviour rather than to something worse.
- `app/api/whoami/` and `app/temp-whoami-test/` — **temporary** diagnostics proving `getVerifiedUser()` resolves a real caller end-to-end. Unlinked from any UI, kept for testing Groups 2/3. Logged in `TASKS.md` for deletion in Stage 4; `/temp-whoami-test` currently compiles into the production route manifest.

### Fixed
- **Issue E — a database outage reported itself as an authentication failure.** Auth checks built on `getUserByPhone()` inherited its error-swallowing: Supabase being unreachable returned `null`, identical to "no such user", so the route answered **401 Not authenticated**. Users were told to log in again over a transient outage, and every diagnosis started down the wrong path. The auth helpers now return a discriminated `{ok:false, reason:'unauthenticated'|'unavailable'}` rather than `null`, and `authErrorResponse()` maps `unavailable` → **503** (retry may succeed) and `unauthenticated` → **401** (retry will not). `readSaveError()` mirrors the distinction client-side: 503 → "check your connection and try again", 401/403 → "your session has expired, please log in again". Token rejection stays conservatively 401 — Supabase does not reliably distinguish a network failure from an invalid token there, and the database lookup is where the distinction actually matters.
- **Issue E, second half — the DATA-WRITE path still answered 500 and leaked the raw exception.** The first pass covered only the *auth* check, so the distinction held for routes whose auth helper touches the database (`getVerifiedUser`) and silently did not for `save-profile`, which uses the phone-level `getVerifiedCallerPhone` and never queries during auth. There the outage surfaced later, inside `upsertUser`, landing in the route's generic `catch` → 500 with `getErrorMessage(error)` as the body. `readSaveError` had no case for 500, fell through to `return body?.error`, and rendered it verbatim: **a literal `"TypeError: fetch failed"` appeared on the onboarding screen.** Found by end-to-end testing against a deliberately unresolvable Supabase host — the same outage produced 503 on `save-user-type` and 500 on `save-profile`, which is what exposed it. All four Group 1 routes now return `dbErrorResponse(error)`, and `readSaveError` refuses to surface any 5xx body regardless of which route produced it (4xx bodies are still shown — those are our own validation messages, written for the user).
- **Issue A — onboarding advanced even when the save failed, creating phantom accounts.** Every one of the 8 onboarding pages caught a failed save, `console.error`d it, and routed to the next step anyway. The user reached a dashboard believing their data was stored while the database had no row for them at all — an account that existed only in the browser but behaved as if logged in. All 8 pages now block navigation on failure and surface a real error. In `onboarding/type` and `onboarding/enterprise` the localStorage mirror was additionally being written *before* the API call and kept regardless of the result — that write now happens only after the save succeeds, which is the part that actually created the phantom. `onboarding/position` has no API call and needed no change.
- **Group 1 routes accepted any phone number in the request body.** `save-profile`, `save-user-type`, `manufacturer-profile` and `profile-data` wrote to whatever account the caller named, so anyone could overwrite another user's profile, business details, or account type. All four now verify the caller and compare through `normalisePhone()` (so `+919773933279` and `9773933279` match and formatting can never cause a false 403), returning 403 on a genuine mismatch. `manufacturer-profile` additionally takes `manufacturer_profiles.user_id` from the verified session rather than a body-phone lookup.

### Changed
- The 8 onboarding pages call `authFetch` instead of bare `fetch`. `saveUserType()` and `saveManufacturerProfile()` changed shape from `void` to returning `null` on success or a user-facing message on failure, so the caller cannot advance without checking.

### Notes
- **14 of 19 routes still trust the body/query phone** — `conversations`, `dev-auth/lookup`, `enquiries`, `messages`, `messages/read`, `orders`, `orders/[id]`, `sample-briefs`, `sample-briefs/[id]`, `verification`, `manufacturers`, `manufacturers/[id]`, `test-db`, `waitlist`. The ownership hole and the 503/401 distinction are both still open there. Tracked as Groups 2/3.
- **4 routes have no `try/catch` at all** — `conversations`, `dev-auth/lookup`, `manufacturers`, `manufacturers/[id]`. A database failure there is an unhandled rejection, not a wrong status code. This violates CORE T6 and is pre-existing, not introduced here; surfaced while counting call sites for the `dbErrorResponse` rollout. Folded into Group 2, since all four are edited there anyway.
- 9 further routes still use the old `catch` → 500 + `getErrorMessage` pattern. All nine are already on the Group 2/3 list, so they adopt `dbErrorResponse()` as each is converted — no separate pass needed.

### Verified
End-to-end against a deliberately unresolvable Supabase host (`...-BROKEN.supabase.co`, a valid URL whose hostname does not resolve — a malformed URL makes `createClient` throw at module load and proves nothing):
- Status matrix all four distinct: **200** (verified caller) · **401** (no identity, and valid identity with no account row) · **403** (`x-dev-phone` ≠ body phone) · **503** (database unreachable).
- **Account takeover blocked in fact, not just in the response**: a request authenticated as one account attempting to set another account's `user_type` returned 403, and the target row was confirmed unchanged in the database afterwards.
- **No phantom account**: signing up as an unused number against a dead database left the `users` table byte-identical (7 rows before and after, zero rows for the test number). Onboarding blocked across five attempts with no write.
- `npm run build` passes clean (zero TypeScript errors, 157/157 pages). `npm run lint` reports 36 problems — verified identical at `HEAD`, so this batch adds none; they are pre-existing `react-hooks/set-state-in-effect` findings across ~20 files.
- No logic changed in this bookkeeping pass — docs and stale comments only.

---

## [2026-07-26 · Batch 1, part 2] — Login now updates React context; cross-account bleed closed
> Still part of the real-session-auth batch. Stage 3 (route conversion) and Stage 4 (removing the phone-trust path) remain NOT done.

### Fixed
- **Login never updated React context, so identity stayed stale until a hard refresh.** `UserProvider` mounts once in the root layout and its hydration effect has `[]` deps, so it never re-ran on a client-side navigation. Login wrote localStorage and called `router.push()` but never told React, so guards and routing used the *previous* session's identity. Symptom: an enterprise account logging in was routed correctly to `/enterprise/dashboard`, immediately bounced by `useEnterpriseAccess` (which read the stale `isEnterprise: false`), then sent by `/dashboard` to whatever the stale type was — "Brand Builder" on a cleared browser, "Manufacturer" if a manufacturer had used the browser before. Pre-existing bug, surfaced by moving the enterprise gate onto context state.
- **Cross-account bleed between sessions on a shared browser.** A previous account's name, city, verification tier, position and enterprise state could survive into the next login.

### Added
- `UserContext.applyIdentity(dbUser)` — loads a signed-in identity from the database row, updates React state immediately, and rewrites the localStorage mirrors. **Replaces rather than merges**, so any field the new row does not specify resets to default instead of inheriting the previous account's value. Clears the identity mirror keys; deliberately preserves `fabverify_auth` (login writes it before the lookup and the dev `authFetch` path reads it).
- `UserContext.userFromDbRow()` — the single definition of how a `users` row becomes an in-memory identity, shared by `applyIdentity` and mount-time hydration.
- `routing.getLandingRoute()` — one definition of post-login landing, replacing the duplicated `DASHBOARD_ROUTE_BY_TYPE` maps in login and signup (verified identical to `BASE_PATH` for all ten types; enterprise handled separately). The duplication is how the enterprise route came to be missing from both.

### Changed
- Login and signup call `applyIdentity` in **all** branches — existing account, account without a type, and brand-new account — so every account type lands correctly without a refresh, not just enterprise.
- Signup's dev-mode path no longer short-circuits before the database lookup; both modes now establish the session and fall through to the same lookup, which removes duplicated routing logic and stopped signup reproducing the same stale-identity symptom.
- In signup, `postVerifyRoute()` is resolved **before** `applyIdentity()` — it reads `fabverify_profile` to distinguish a returning user from a first-time signup, and `applyIdentity` rewrites that key. Commented at the call sites.
- `userFromDbRow` sources `verificationTier` from the database row rather than leaving it to a localStorage-seeded default — a small behaviour change consistent with "the database is authoritative".

### Notes
- Two `react-hooks/set-state-in-effect` lint errors in `UserContext.tsx` are **pre-existing** (verified against `HEAD`: same two effects, same two errors). Not addressed here.
- Desktop sign-out recorded as a Phase A task — the main platform still has no logout, only FabChat.

---

## [2026-07-26 · Batch 1, part 1] — Enterprise identity made a real database fact
> Part of the real-session-auth batch. The auth route conversion (Stage 3) and removal of the old phone-trust path (Stage 4) are NOT done yet.

### Fixed
- **Enterprise accounts were downgraded to "Brand Builder" on every re-login.** `app/onboarding/type/page.tsx` mapped `"enterprise-brand"` to `user_type = 'buyer'`, so enterprise identity existed only in localStorage. Logout (`ChatShell` does `localStorage.clear()`) or a single visit to `/brand/dashboard` (which actively deleted the enterprise keys) destroyed it permanently. Enterprise signups now persist `user_type = 'enterprise'`.
- **Enterprise position was never persisted.** `users.position` existed in the schema and was accepted by `upsertUser` but nothing ever wrote it; the role (MD/CEO, CFO, …) lived only in localStorage. Enterprise onboarding now saves it to the database via `db.ts`.
- **Security — non-enterprise users could pass the enterprise gate.** `useEnterpriseAccess` authorized on `position === 'md_ceo' || position === 'head_operations'`, but the `Position` and `EnterprisePosition` unions overlap on exactly those values, so a solo Brand Builder who picked "MD / CEO" during `/onboarding/position` was let through. It also accepted the mere presence of a client-writable `fabverify_enterprise` localStorage key as proof. Capability now comes from `users.user_type` in the database.
- Removed the `removeItem` block in `app/brand/dashboard/page.tsx` that wiped enterprise localStorage keys — enterprise accounts now legitimately browse `/brand/*`.

### Added
- `app/lib/accountType.ts` — the single resolver turning `users.user_type` into `accountType` (DB truth), `userType` (marketplace persona), and `isEnterprise` (capability). Documents the one-way hydration rule.
- `app/lib/db.ts` — `updateUserPosition()`.
- `supabase/migrations/001_enterprise_identity.sql` — idempotent one-time correction for accounts created before the fix. **Applied 2026-07-26: 1 row (9773933279) corrected to `user_type = 'enterprise'`, `position = 'md_ceo'`.** The file is marked applied and the UPDATE left commented out so it cannot double-run.
- "Enterprise Workspace" link in `LeftPanel` so enterprise accounts can get back from marketplace screens.

### Changed
- Enterprise accounts keep **full marketplace access** (discovery, sourcing, orders) through the derived `'buyer'` persona, and additionally get `/enterprise/*`. Default landing is `/enterprise/dashboard`.
- `userLabel` shows "Enterprise" rather than the persona's "Brand Builder".
- `/api/profile-data` accepts an optional `position`.

### Notes
- Decisions logged as I1–I7 in `DECISIONS.md`, including two deferred items (phone reassignment, decorative RLS).

---

## [Documentation session] — Google-level doc system created
### Added
- Tier 1 docs: `CLAUDE.md`, `CORE.md`, `VISION.md`, `DECISIONS.md`, `PROJECT_MEMORY.md`, `PRODUCT_PRINCIPLES.md`.
- Tier 2 docs: `docs/PRODUCT/USER_TYPES.md` (all locked per-type visions), `FEATURES.md`, `PRD.md`, `ROADMAP.md`, `BUSINESS_MODEL.md`, `CHANGELOG.md`, `CURRENT_SPRINT.md`, `TASKS.md`.
- Tier 3 docs: `docs/ARCHITECTURE/*` (DATABASE, SYSTEM_ARCHITECTURE, API_SPECIFICATION, FOLDER_STRUCTURE, TECH_STACK, CODING_STANDARDS), `docs/MODULES/*`.
### Notes
- These encode every decision locked across the full-vision session so future builds stay aligned and bug-free.

---

## [Full-vision session] — Every user type researched & locked
### Added (design-locked, not built)
- Fabric Mill (swatch, lab dips, dye lots, shade bands, colour library, meter-based verification).
- Trim Supplier (7 categories, artboard approval, MOQ reserve, care-label checker).
- Artisan (fair-price display, authenticity, GI-tag, complexity pricing, FabGovt, FabVoice).
- Job Worker (parent-linked jobs, reconciliation, dual pricing, SMV capacity, shift-proof + multi-style overtime tagging, tolerance buffer).
- Designer (full range), Master, Merchandiser (living T&A), QC Inspector (full range) + shared FabTalent profile, gig-adaptive workspace, delegated access.
- Brand/Buyer (three protective layers; cash-flow + dead-stock survival features).
- Cross-cutting: Universal Item Identity, Visual Stock Panel, QR Traceability (platform-wide, unit-adaptive), FabPricingEngine (auto-costing), Honest Credit, Government-DB Verification, Legal Escrow.
### Notes
- Escrow legal design locked: FabVerify never holds money; licensed payment-aggregator partner does.

---

## [Database-connection session] — Core features connected to real DB
### Added
- `db.ts` abstraction layer; API routes for orders, messages, conversations, sample-briefs, verification, waitlist, dev-auth, manufacturers, enquiries.
- Real: manufacturer profiles, discovery, enquiries, orders (place/accept/track + 5 milestones), messages/FabChat (poll, read receipts), sample briefs (post/respond), verification status (Bronze auto; Silver/Gold pending; tier synced to manufacturer_profiles).
- Supabase tables + RLS; `waitlist`, `verification_applications`.
### Fixed
- `NEXT_PUBLIC_SUPABASE_URL` had wrong `/rest/v1/` suffix → auth OTP hit wrong URL. Corrected to bare project URL.
- Dev OTP bypass gated to localhost only (was leaking to production).
- Phone confirmations toggle caused auto-sessions across devices → turned back ON + guarded redirects.
- Blank voice notes (`recorder.start(100)` chunking); camera opened gallery (`capture=environment`); modal overlap (createPortal); duplicate React keys (swept 436 usages).
- Supabase error handling (`getErrorMessage()` — Supabase throws plain objects).
### Notes
- Twilio connected but TRIAL — real SMS only to verified caller IDs; prod arbitrary numbers hit fallback.

---

## [Earlier sessions] — Frontend build
### Added
- Per-user-type URL restructure (thin wrappers + shared `components/pages/*`, smart `/dashboard` redirect).
- Enterprise interface (onboarding, position-adaptive dashboard, team mgmt + member modal, invite flow, vendor master, Kanban, analytics, season, upgrade modal).
- FabChat mobile (3-tab, per-type URLs, voice notes, camera, contact profile sheet, members-only guard).
- Verification identity wizard (India + international, country selector).
- Bulk order 8-step form with full document set.
### Fixed
- Adaptive-dashboard content-bleeding → per-type URLs.
- Dashboard cards duplicating nav → real status instead.

---

*Add new entries above this line.*
