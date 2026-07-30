# CHANGELOG.md
### What Changed, When
> Append-only. Newest at top. Every meaningful build session adds an entry. Keep entries accurate (X2) — describe what actually changed, never overstate.

Format: `## [date/session] — title` then bullets grouped by Added / Changed / Fixed / Deprecated.

---

## [2026-07-30 · Chunk 1.4] — The auth seam exists: two new files, nothing imports them yet
> Fourth of the 10 chunks of Launch-Ready item 1, and the file everything later routes through. **Zero existing files modified** — same zero-risk shape as 1.2's unused table. Required by DECISIONS **X5** (seam before first call site); auth is the cautionary tale that produced that rule.

### Added
- **`app/lib/authProvider.ts` — browser-safe half.** `sendOtp`, `verifyOtp`, `getSession`, `signOut`, plus all shared types and the A10 dev bypass. Imports only `./supabase` (anon client).
- **`app/lib/authProvider.server.ts` — server-only half.** `getIdentityFromToken`. Imports `./supabaseAdmin`.

### Why two files (deviation from the plan, and it re-scopes chunk 1.5)
- Token verification is the one auth operation that genuinely needs the **service role**; everything else runs on the browser anon client. **`apiClient.ts` is reachable from `"use client"`** and will import the seam in 1.10 — a single combined file would drag `supabaseAdmin` into the browser module graph. `SUPABASE_SERVICE_ROLE_KEY` is not a `NEXT_PUBLIC_` var so the real key would **not** be inlined, but `supabaseAdmin.ts` would silently fall back to its placeholder and construct a broken admin client client-side, breaking the SERVER-ONLY contract documented at `db.ts` and `supabaseAdmin.ts` for no benefit. The split mirrors the existing `supabase.ts` / `supabaseAdmin.ts` division, for the same reason.
- Consequence: chunk 1.5's TASKS.md wording is corrected — `app/lib/auth.ts` imports from **`authProvider.server`**, not `authProvider`. `auth.ts` is already server-only (it imports `NextResponse`), so that is the correct side.

### Design decisions
- **`getSession()` added to the operation list** — it was absent from this chunk's original four and 1.10 cannot complete without it. Two live call sites (`AuthGuard.tsx:143`, `apiClient.ts:75`) need it; it returns `{accessToken, providerUid}` so both are served from one function.
- ⚠️ **`getIdentityFromToken` returns `{providerUid, phone}`, not just the phone.** `db.ts getPhoneFromAccessToken` returns only the phone and **discards `data.user.id`** — which is exactly the `auth_identities.provider_uid` chunk 1.9 must look up. **1.9 could not have been built on the old signature**; this is the reason the function is reshaped rather than moved verbatim.
- ⚠️ **`verifyOtp` marks the dev bypass structurally**, via `providerUid: null` + `isDevBypass: true` rather than a magic `"dev-user-"` string prefix each caller must remember to check. A `123456` login creates no Supabase auth user, so there is no provider identity — and **chunk 1.8 must write an identity row only when `providerUid` is non-null**, or it would fabricate `('supabase', 'dev-user-9999999991')` rows and pollute the table 1.3's backfill was careful to keep honest.
- **`sendOtp` returns a discriminated result** (`invalid_phone` / `provider_unavailable` / `error` / `unknown`) rather than a boolean or a throw. The login page currently sniffs `error.message` for `"not configured"/"provider"/"sms"` to decide between the WhatsApp/waitlist fallback and a retryable error; flattening that would silently dead-end real users on unverified Twilio numbers. The provider-specific heuristic moved **into** the seam, which is where vendor knowledge belongs — same shape as `isDatabaseUnavailable()` in `apiError.ts`, and equally a heuristic by necessity since Supabase exposes no code for it.
- **Password ops deliberately NOT declared** (M10 / item 2). The `provider_uid` meaning for `provider='password'` is still undecided (parked in 1.2): the credential lives in our own `users` table, so there is no external id. A guessed signature is worse than none, because 1.6–1.10 could build against it and item 2 would then have to break it; adding a method later is a one-line change with no migration cost. **What is already accounted for:** the success type is named **`AuthenticationResult`** — after authentication, not OTP — so a future `verifyPassword` returns the same shape and nothing downstream (1.8's identity write, 1.9's resolution) is reshaped when it lands. Recorded as a `FUTURE (M10)` note in the file itself.
- The A10 dev bypass is **hostname-gated, never `NODE_ENV`**, and now has ONE definition instead of being reimplemented in `login/page.tsx:25` and `AuthGuard.tsx:88`.

### Audited while building
- **`fabverify_auth` is read at 22 call sites and every one reads only `.phone`.** The `userId` field is **write-only** — nothing consumes it. The seam still returns it (as `storageUserId`, explicitly documented as *not* an identity key) purely so chunks 1.6/1.7 remain behaviour-identical swaps rather than quiet behaviour changes.
- ⚠️ **Note for chunk 1.10:** `AuthGuard.tsx:143-144` splits its call across lines (`supabase.auth` then `.getSession()`), so a single-line grep for `supabase\.auth\.` **misses it**. Do not use a one-line grep to confirm that file is converted.

### Verified (2026-07-30)
- `npm run build` clean, 155 static pages, zero TypeScript errors — the seam compiles despite having no callers.
- **Zero importers**: grep finds `authProvider` mentioned only inside the two new files.
- ⚠️ **No service-role in client bundles** — the check that proves the split rather than assuming it. All **181** client chunks in `.next/static/` are free of `supabaseAdmin`, `SUPABASE_SERVICE_ROLE_KEY`, `service_role` and `placeholder-service-role-key`. Backed by a comment-stripped import-graph trace: `authProvider.ts → ./supabase → @supabase/supabase-js`, with no `supabaseAdmin` and no `next/server` anywhere in that graph. The shared type crosses the boundary via `import type`, which is erased at compile time and pulls in no runtime module.
- All 6 original Supabase auth call sites confirmed **unchanged** — nothing was moved this chunk.
- Auth matrix intact: `orders` **200** own / **401** anonymous / **403** cross-account; `conversations` **200** own / **401** anonymous. `/api/test-db` **200**. `auth_identities` still **1** row (the seam writes nothing — that is 1.8). `users` snapshot hash unchanged.
- ⚠️ **Browser dev login NOT run.** The Chrome extension still lacks host permission for `localhost` (same blocker as chunk 1.3). Not claimed as passed; the API-level auth matrix above is the substantive evidence.

---

## [2026-07-30 · Chunk 1.3] — `auth_identities` backfilled: 1 identity created, 9 dev-bypass accounts correctly skipped
> Third of the 10 chunks of Launch-Ready item 1, and the first to touch real user data. Throwaway script, **scratchpad-only — never committed** (it consumes the service-role key). **Zero application files changed**; the only durable effect is one row in a table no code reads yet.

### The finding that mattered
- ⚠️ **The two sides store different phone formats.** `users.phone` is bare 10-digit (`"9773933279"`); Supabase `auth.users.phone` is `91`+10 digits with **no leading `+`** (`"919773933279"`). **A naive exact-string match would have linked nothing, inserted nothing, and exited successfully** — a silent no-op reporting success, leaving chunk 1.9 to be built on identities that were never created. Matching normalises both sides to the last 10 digits, byte-identical to `normalisePhone` (`app/lib/auth.ts:34`), already the key the app uses for every ownership comparison. Caveat recorded: `slice(-10)` is lossy and collides across country codes — safe today (all `+91`), wrong under international expansion.

### Result
- **1 identity created out of 10 accounts** — the founder's enterprise account (`users.id 1ac55487…` ↔ auth uid `c3772075…`), the only one with both a real OTP authentication and a profile row.
- **9 accounts are dev-bypass (A10) with no Supabase auth user** → skipped as `no_auth_user`, left phone-resolved. Expected, not a failure; chunk 1.8 gives each an identity on its first real authentication.
- ⚠️ **Consequence for chunk 1.9: the phone fallback is the PRIMARY path in this environment, not the exception.** 9 of 10 accounts resolve by phone. 1.9's risk is the fallback being correct, not the identity lookup — a materially different risk profile than the chunk description assumed.

### Safety design (all enforced, not just documented)
- **Dry-run is the DEFAULT**; `--apply` is required to write. An accidental invocation is inert. Verified by audit: exactly one `.insert(` in the file, sitting *after* the apply guard, and zero `.update(` / `.delete(` / `upsert` calls anywhere.
- **Insert-only.** `users` and Supabase auth are read-only — `listUsers` only, no `updateUserById`, no `deleteUser`.
- **Never guess.** Duplicate phone in `users` skips **both** rows (picking either invents a link); duplicate auth uid for one phone skips; malformed phone skips. All logged individually with reasons. All four buckets were 0 this run.
- **Conflict screams.** An existing `(provider, provider_uid)` pointing at a *different* `user_id` is an integrity problem: reported, untouched, refuses to proceed, non-zero exit. Deliberately did **not** use `upsert(ignoreDuplicates)`, which would have hidden exactly this case.
- **Accounting check** — every `users` row must land in exactly one bucket, or the script aborts rather than proceeding on a partial view.
- **Reversible:** `DELETE FROM auth_identities WHERE provider = 'supabase'` — ⚠️ clean **only until 1.8 ships**, after which real logins also create those rows. The script prints this caveat itself rather than leaving it as a footgun.

### Verified (2026-07-30)
- **15 independent checks**, deliberately re-derived from the database rather than trusting the backfill script's own output: count = 1 · correct `user_id`/`provider_uid`/`provider` · `created_at` and surrogate `id` populated · the linked phones genuinely agree when re-normalised (`"9773933279"` vs `"919773933279"`) · no orphaned identities · no user with 2+ supabase identities · 9 dev-bypass accounts detected and **none** linked · both orphaned auth users untouched.
- **`users` snapshot hash byte-identical before and after (`4d791d42182a42fb`)**, row count 10 → 10 — proving nothing outside `auth_identities` was modified.
- **Idempotency proven by re-running `--apply`:** planned **0** inserts, classified the existing row `already_linked`, table still 1 row. A half-failed run is safe to re-run.
- `npm run build` clean (155 pages) · `GET /api/test-db` 200 · **auth matrix intact**: `orders` **200** own / **401** anonymous / **403** cross-account · `dev-auth/lookup` resolves the correct account.
- ⚠️ **One planned check not run: the browser dev login.** The Chrome extension lost host permission for `localhost` mid-session. Substituted API-level verification of the same path, which additionally asserts the 401/403 outcomes — but the UI landing was not re-confirmed.

### Observation recorded, not acted on
- **2 Supabase auth users exist with no `users` row** (`70****44`, `96****11`, both 2026-07-25, both with a real `last_sign_in_at`). They completed a real OTP verification and never got a profile — the phantom-account shape Issue A addressed. Untouched by the backfill: there is nothing to link them to, and creating `users` rows would invent accounts. Logged in TASKS.md as needing its own decision, not a silent cleanup.

---

## [2026-07-30 · Chunk 1.2] — `auth_identities` table created (schema only, nothing reads it yet)
> Second of the 10 chunks of Launch-Ready item 1. The table that decouples identity from phone number (DECISIONS **I9**, resolves **I6**) now exists. **Zero application files touched** — no `.ts`/`.tsx` change, no `db.ts` function. Applied in the Supabase SQL Editor.

### Added
- **`supabase/migrations/002_auth_identities.sql`** — `id` (surrogate PK), `user_id → users(id)`, `provider`, `provider_uid`, `created_at`, `UNIQUE (provider, provider_uid)`, plus `idx_auth_identities_user_id`. Standard PostgreSQL only (CORE T2 / A2). **Fully idempotent** — `IF NOT EXISTS` throughout and `ENABLE ROW LEVEL SECURITY` is a no-op when already on, so unlike the `CREATE POLICY` statements in `schema.sql` this file is safe to re-run.
- **The same block appended to `supabase/schema.sql`.** That file is the canonical full schema and the likely source for the AWS RDS build in A12 Phase 3; if the table lived only in `migrations/`, a fresh environment or the RDS build would silently lack the foundation table all of item 1 stands on. The two copies are byte-identical in their statements (verified) — keep them in sync.

### Design decisions recorded at the schema
- **`ON DELETE CASCADE` — a deliberate deviation** from every other FK here (all bare `REFERENCES users(id)`). An identity outliving its user is actively harmful, not untidy: the orphan still occupies the `UNIQUE` constraint so that provider identity could never be re-registered, and once chunk 1.9 reads this table a stale row could resolve a live session to a deleted account. `RESTRICT` would instead block user deletion outright. Free to get right now — no user-deletion flow exists.
- **No `CHECK` constraint on `provider`.** I9's list is open-ended, and the A12 parallel run must be able to add a provider *without* a DDL change at the moment of cutover. Also matches convention — `users.user_type` and every `status` column are plain `TEXT`.
- **`provider_uid` is `TEXT`, not `UUID`.** A Supabase auth uid is a UUID, but a Cognito `sub`, social-provider id or email-derived id is not; `UUID` would force a type change at the worst possible moment.
- **Two indexes, both needed.** The `UNIQUE (provider, provider_uid)` is auto-indexed and serves the hot path ("a token from provider X carries uid Y — which user?"), with `provider` leading so it also serves `WHERE provider = …` (the 1.3 backfill audit, the Phase 4 retirement count). `idx_auth_identities_user_id` exists because **Postgres does not auto-index foreign-key columns** — only the referenced side — and the reverse lookup is the query behind remote logout and per-device session visibility.
- **Considered and deliberately NOT added: `UNIQUE (user_id, provider)`.** It would make chunk 1.8's no-duplicates requirement structural, but I9 did not lock it and 1.8's upsert should conflict-target `(provider, provider_uid)` anyway — the correct key for "this same provider identity authenticated again". Adding an unlocked constraint that later proves wrong is harder to undo than adding it in 1.8.
- **Open question deferred to chunk 1.6 / M10:** for `provider = 'password'` the credential will live in our own `users` table, so there is no external id — either `users.id` doubles as the uid, or password is a `users` column and never a row here. The schema supports either; recorded now rather than discovered later.

### Security
- ⚠️ **RLS enabled with ZERO policies = deny all.** This is *not* a contradiction of **I8**, which retires `auth.uid()` policies as an *authorisation mechanism* — none is written here. But `NEXT_PUBLIC_SUPABASE_ANON_KEY` is public by design, so a new table left with RLS **off** is directly readable from any browser, and this table maps provider UIDs to internal user IDs — anon read access would be an enumeration goldmine, strictly worse than the `dev-auth/lookup` disclosure already logged. Same pattern already used for `waitlist`: RLS on, no policy, service-role client (which bypasses RLS) does the work. Costs nothing at migration — on RDS you simply do not grant the table to a public role.
- `NOTIFY pgrst, 'reload schema';` included so PostgREST picks up the table. PostgREST-specific with no RDS equivalent, but an **operational** command rather than business logic in the database, so it does not breach X5 / CORE T2.

### Verified (2026-07-30)
- **In the SQL Editor:** 5 columns with correct types/nullability/defaults · 3 constraints, with the FK definition confirmed to contain `ON DELETE CASCADE` · 3 indexes · `relrowsecurity = true` · **0** policies · 0 rows.
- **From Node against PostgREST** — the one thing the SQL Editor cannot test, since it talks to Postgres directly while the app talks through PostgREST's cached schema: table visible and empty, all 5 columns selectable by name, and the existing `users` table still reachable (control).
- **Conclusive RLS proof: an anon `INSERT` is rejected with `42501` "new row violates row-level security policy".** An anon `SELECT` returning 0 rows was *inconclusive* — an unprotected empty table returns 0 rows too — so the read check alone was not evidence. The rejected insert is, and it persists nothing; a follow-up count confirmed 0 rows.
- `npm run build` clean, 155 static pages. `grep` confirms **zero** `auth_identities` references anywhere in `app/` — the chunk is genuinely schema-only.
- `GET /api/test-db` → 200. **Real browser dev login** (`9999999991` / `123456`, A10 localhost bypass) → `/brand/dashboard` as Anita sharma / Brand Builder, correct account, with `POST /api/dev-auth/lookup` 200 in the server log. Auth path confirmed untouched.
- **The table was still empty after that login**, which is the runtime proof that no code path writes to it yet.

---

## [2026-07-30 · Chunk 1.1] — Last direct-Supabase API route moved onto `db.ts`; false migration note corrected
> First of the 10 chunks of Launch-Ready item 1 (durable auth link + auth seam). Deliberately the safest one, so an early session banks a verified win. Touches no auth path. 2 code files + 2 doc files.

### Fixed
- **CORE T1 / DECISIONS A1 violation closed.** `app/api/test-db/route.ts` queried `supabase.from("users")` directly — the only 1 of 18 API routes bypassing the abstraction layer. It now calls `db.ts checkDatabaseConnection()`. **18 of 18 API routes go through `db.ts`**, and `grep` confirms **zero** `.from(` calls anywhere outside it.
- **`db.ts`'s header claimed "All queries use standard PostgreSQL. No Supabase-specific features used." That was false**, and a migration planned against it would have badly underestimated the work. Replaced with the audited inventory — 16 embedded-resource joins, 8 `.maybeSingle()`, 2 `.upsert(..., { onConflict })` across 813 lines / 35 exported functions — plus the distinction that actually matters: the **data model** is standard PostgreSQL and ports to RDS as-is; the **query syntax** is a PostgREST client feature and does not.
- **Two doc numbers that were provably wrong**, corrected rather than left to be re-derived next session:
  - `.upsert(onConflict)` count **3 → 2** (`TASKS.md`, `MIGRATION.md` §1.2). The real sites are `db.ts:77` (`users`, onConflict `phone`) and `db.ts:158` (`manufacturer_profiles`, onConflict `user_id`). The other two counts verified exact.
  - **`app/lib/apiClient.ts` was missing from the Supabase-importer inventory** (`MIGRATION.md` §1.1 listed 8 files; the real count was 9). It imports the client at line 16 and calls `supabase.auth.getSession()` at line 75 inside `authFetch` to attach the bearer token. The "Supabase is in 5 files" figure is therefore **6**.

### Added
- **`db.ts checkDatabaseConnection(): Promise<void>`** in a new `── HEALTH ──` section. Two deliberate design calls, both documented at the function:
  - **Throws instead of returning a boolean.** A boolean collapses "database unreachable" and "query failed" into one `false`, and the caller needs that distinction to answer 503 vs 500. Same reasoning as `getUserByPhoneOrThrow` (Issue E).
  - **Runs on the service-role path**, because that is the path every real route uses through this file. The old call used the anon client from inside the route, which exercised RLS — formally retired as a security mechanism in DECISIONS **I8** — rather than what the application actually depends on. This is a behaviour change, not a pure move.

### Changed
- `test-db` now returns **503** for an unreachable database and **500** for a genuine query fault, via the shared `dbErrorResponse()`, instead of a flat 500. A 9-line local reimplementation of `getErrorMessage()` was deleted. The error body shape changed from `{success:false, error}` to `{error}`; safe because `grep` confirms **no code anywhere calls this route** — it is a manual browser/curl diagnostic.
- **Chunk 1.10 re-scoped from 2 files to 3** as a direct consequence of the `apiClient.ts` finding. Left uncorrected, item 1 would have "finished" with Supabase still imported in two files and every authenticated client request still bound to the provider. Noted at the chunk: `apiClient.ts` is reachable from `"use client"` code, unlike the other four auth importers, so its replacement seam function must be browser-safe (no service-role import).

### Verified (2026-07-30)
- `npm run build` — **clean**, zero TypeScript errors, zero lint warnings. `/api/test-db` present in the route manifest.
- `GET /api/test-db` → **200** `{"success":true,"message":"Database connected!"}`, confirmed in the server log. Reproduced via both `localhost` and `127.0.0.1`.
- **Outage path** — `NEXT_PUBLIC_SUPABASE_URL` pointed at an unresolvable host (`…-BROKEN.supabase.co`, a valid URL so `createClient` does not throw at module load) → **503** `{"error":"Service temporarily unavailable. Please try again."}`. No raw exception text in the response and **no unhandled rejection or stack trace in the server log** — the CORE T6 point. Server was **hard-restarted** for this rather than trusting Next's `Reload env` hot-reload, because `supabaseAdmin` builds its client at module load and a hot reload could have left the old client alive and produced a false pass.
- `.env.local` restored **byte-identical** (`diff -q` clean against a pre-test backup) and the health check **re-run after restoring** → 200, proving the environment is genuinely healthy rather than merely correct on disk. Confirmed still gitignored, so it cannot enter a commit.
- `isDatabaseUnavailable()` matches on message text by necessity (Supabase exposes no "could not reach server" code). It caught this case cleanly; that remains a heuristic, and an unrecognised shape degrades to 500 — the pre-existing behaviour, not a regression.

## [2026-07-29 · Issue B + Platform Auth Guard] — Sign-out truly ends the session; platform routes now require one
> Closes the last two deploy blockers. Both fixes verified in a real browser against a pre-test baseline, not inferred from code.

### Fixed
- **Issue B — sign-out did not end the session.** FabChat's sign-out ran `localStorage.clear(); router.push("/")` and **never called `supabase.auth.signOut()`**. Because `router.push` is a CLIENT-side navigation the in-memory Supabase client was never rebuilt: it kept the access + refresh token, `autoRefreshToken` kept renewing them, and `authFetch` carried on attaching a valid Bearer token — a "signed-out" user stayed authorised by the API until a hard refresh. There is now ONE shared `signOut()` on `UserContext`, ordered deliberately: `supabase.auth.signOut()` FIRST while storage is intact (supabase-js needs its own token entry to find and revoke the refresh token server-side) → `applyIdentity(null)` (kills the identity in React memory, which `localStorage.clear()` never did) → mirror keys removed LAST (`applyIdentity` rewrites `fabverify_user`, so clearing first would be undone). Clears the 7 `IDENTITY_MIRROR_KEYS` **plus `fabverify_auth`** — the latter is deliberately excluded from that array (login writes it before the user lookup) but sign-out must remove it, or `apiClient` keeps authorising a signed-out user via the `x-dev-phone` header in dev.
- **NO platform route required a session.** `useTypeGuard` compares `user.userType` against the expected type, but a signed-out `UserContext` falls back to `defaultUser` — whose `userType` is `'buyer'` — so **every buyer route authorised a signed-out visitor**. Anyone could type `/brand/dashboard` and browse the shell; a signed-out user pressing Back landed straight back on it and could keep navigating. New `app/components/AuthGuard.tsx`, modelled on the existing `ChatAuthGuard`, applied via one `layout.tsx` per protected tree so every current and future page inherits it.

### Added
- **Desktop sign-out.** The platform previously had no logout at all outside FabChat. Added to `LeftPanel` and `EnterpriseLeftPanel` (enterprise runs a separate shell and would otherwise have been the only account type with no way out), both using the shared helper.
- **`AuthGuard` hybrid check:** a fast synchronous localStorage read for an instant decision (no spinner flash), then a real `supabase.auth.getSession()` confirmation in the background. The background stage is **skipped on `localhost`/`127.0.0.1`** — the `123456` dev bypass (DECISIONS A10) never creates a Supabase session, so enforcing it locally would bounce every developer on every page load. A network failure during that stage deliberately does NOT sign the user out; the API is the real boundary and answers 401 on its own.
- **Two guard modes**, mirroring the server-side split: `"profile"` for platform routes, `"phone"` for `/onboarding/*` — a first-time user has proven their phone but has no profile yet, since onboarding is what creates it. Same reasoning as `getVerifiedCallerPhone` vs `getVerifiedUser`.
- Back/forward handling: the check keys on `pathname` so it re-runs on client-side navigation (this is what fixes the Back symptom), plus a `pageshow`/`persisted` listener for genuine bfcache restores.

### Verified (real browser, 2026-07-29)
- **Sign-out:** `localStorage` **completely empty** afterwards; READ `/api/orders` **401**, READ `/api/conversations` **401**, WRITE `POST /api/messages` **401**, and the database unchanged — the write probe persisted nothing.
- **Stranger test** (clean storage): `/brand/dashboard`, `/manufacturer/orders`, `/enterprise/dashboard`, `/talent/designer/dashboard` → all bounce to `/login`.
- **Back button:** signed out, then Back three times through real history (`/login` → `/chat/brand` → `/brand/orders`) — every attempt landed on `/login`, `showsOrdersUI: false`. The dashboard never returns, no hard refresh needed.
- **Logged in:** `/brand/dashboard`, `/brand/orders`, `/brand/samples`, `/brand/manufacturers`, `/brand/profile`, `/dashboard`, `/chat/brand` all load normally. No false bounces, no redirect loop, no double-guard with `ChatAuthGuard`.
- **Dev bypass** (`123456` on localhost) unaffected.
- Coverage audit: **143 pages guarded** + 12 on `ChatAuthGuard`; only `login`, `signup`, `manufacturers` and `/` are public.

### Added — public marketplace browsing (same session, after the guard landed)
- **Narrow public allowlist in `AuthGuard`.** The guard initially blocked pre-login browsing, because `/manufacturers` and `/manufacturers/[id]` are redirect shims into `/brand/manufacturers` — which the guard now covered. `PUBLIC_EXACT` + `PUBLIC_PREFIXES` reopen exactly four paths and nothing else. **Only the BUYER discovery path is public**: every other user type's discovery slug is `buyers`/`clients` (routing.ts `DISCOVERY_SLUG`), which browse private buyer data. Verified with a 19-path matcher test before building — `/manufacturer/dashboard`, `/manufacturer/buyers`, `/mill/buyers`, `/talent/designer/clients` and the loose-prefix traps `/brand/manufacturers-admin` and `/brand/manufacturersX` all stay guarded. Trailing slashes on the prefixes are what stop the last two matching.
- **Clean public view — no logged-in chrome for strangers.** `ThreePanelLayout` renders a public shell (slim `PublicHeader` + centre only, no side panels) when there is no session. Previously a signed-out visitor on discovery saw the inside of a workspace: "Good morning, 👋" with an empty name, a FabScore card, navigation to pages they'd be bounced from, and a **Sign Out button for a session they never had**. Chrome is decided in the one component that already owns chrome, rather than asking each page to branch — a page that forgot would leak the workspace frame, the same fail-open shape as the original unguarded routes.
- `app/components/PublicHeader.tsx` (FabVerify wordmark + Sign In / Sign Up) and `app/hooks/useIsSignedIn.ts` (reads `fabverify_profile`, the same signal both guards use, via a lazy initialiser so the public shell paints correctly on first render and never flashes the left panel).
- **Conversion affordances:** manufacturer profiles show **"Sign in to enquire"** → `/login` for signed-out visitors, desktop and mobile, replacing CTAs that dead-ended (`EnquiryModal` already refused without a phone). Discovery's mobile header shows **Sign In** instead of a 🔔 that a stranger cannot use.

### Fixed — discovery hid the entire marketplace
- **`DEFAULT_TIERS` now includes bronze** (`["gold","silver","bronze"]`), applied **globally — logged-in and logged-out alike**. Discovery defaulted to Silver+Gold, but every manufacturer signs up Bronze (DECISIONS M8) and Silver/Gold need an admin approval panel that does not exist, so **no real manufacturer could ever clear the default filter**. Both live profiles are bronze, so discovery rendered an empty list on first paint — the page looked broken rather than filtered, with nothing on screen explaining why. Both consumers inherit the change: the `selectedTiers` initial state and `handleClearAll`, which would otherwise have re-hidden everything on "Clear all". Users can still untick tiers to narrow.

### Notes
- ⚠️ **Signed-out visitors have search, category and city filters but NOT the tier/MOQ controls** — those live in `manufacturersRightPanel`, which the public shell drops. With all tiers shown by default this is a missing refinement rather than a broken page; giving the public view its own filter bar is folded into the Public Marketplace task.
- ⚠️ **`AuthGuard` is a UX/perception guard, not the security boundary.** Real authorisation is the server-side API auth from Groups 1/2 — which is exactly why the shell a signed-out visitor could previously reach was always *empty*. This change fixes what the app LOOKS like, which on a trust/money platform matters on its own.
- ⚠️ **`middleware.ts` is not viable today.** The project has no `@supabase/ssr` and `supabase.ts` uses `persistSession: true` with default **localStorage** storage; the dev credential is localStorage too. Server middleware sees only cookies/headers, so it would be blind. Real server-side route protection requires migrating the session to cookies — a project of its own, logged not built.
- ⚠️ **REGRESSION, shipped knowingly:** `/manufacturers` and `/manufacturers/[id]` are redirect shims into `/brand/manufacturers`, which is now guarded — so pre-login marketplace browsing is blocked, contradicting the "browsing pre-login is core to the marketplace" intent. API routes remain public; this is UI-layer only. Decision pending in `TASKS.md`.
- ⚠️ **UNTESTED:** first-time signup through `/onboarding/*` under `mode="phone"`. Verified by reading, never run with an unregistered phone. If wrong, new signups bounce to login forever.

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

### Verified — browser end-to-end (added 2026-07-28, after the commit above)
> The commit `9c09db8` message says "browser E2E not yet run". That was accurate when written. The test has since been run; this section records the result rather than rewriting pushed history.

- **Group 2b enquiry → conversation, proven in a real browser.** Buyer `9999999991` (Anita) → manufacturer `9998887771` (Test Garments Co), against a pre-test log + database baseline. `POST /api/enquiries` **200** created enquiry `348040c5`; the seeded opening message landed **212 ms** later (21:17:26.896 → 21:17:27.108) carrying the enquiry subject — which is precisely what `conversationSeeded: true` reports. The thread appeared for BOTH parties (`GET /api/conversations` 200 for each party's own phone) and messages flowed both directions.
- **Per-message attribution correct on every row:** Anita → TGC ("…hey i am looking…"), TGC → Anita ("hi i would happy to do it"), Anita → TGC ("ok"). Each `sender_id` matches whoever was actually logged in — no impersonation, no misattribution.
- **The 503 outage path fired under a real outage.** An unplanned transient Supabase outage occurred mid-test: `conversations` and `messages` returned **503** for ~7 s — not 401, not raw exception text — then recovered unaided. Stronger evidence than the simulated unresolvable-host test.
- One **401** appeared on `GET /api/messages` at the moment site data was cleared to switch accounts: `authFetch` found no phone in localStorage and sent an anonymous request, which the route correctly rejected. Expected behaviour, not a defect.

### Not Verified
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
