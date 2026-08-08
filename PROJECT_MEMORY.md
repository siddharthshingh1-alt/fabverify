# PROJECT_MEMORY.md
### What Actually Exists Right Now
> This is the single source of truth for build status. Claude Code reads this before building ANYTHING, to avoid rebuilding what exists. Update this file every time a feature moves status. Last major update: end of database-connection + full-vision-lock session.

**Status legend:** ✅ LIVE (real DB, tested) · 🟡 SCREEN-ONLY (fake data) · 🔴 NOT BUILT · ⚠️ TEMPORARY/known-issue

---

## DEPLOYMENT & INFRASTRUCTURE

| Item | Status | Notes |
|---|---|---|
| Live URL | ✅ | `fabverify.vercel.app` (auto-deploys on push to `main`) |
| GitHub repo | ✅ | `github.com/siddharthshingh1-alt/fabverify` |
| Local path | — | `C:\Users\sidda\Desktop\fabverify` |
| Supabase project | ✅ | ref `ehoifdlresiazmwxsdqy`, region Singapore |
| Vercel env vars | ✅ | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| Twilio OTP | ⚠️ | Connected in Supabase; TRIAL account — only sends to verified caller IDs. Prod users on arbitrary numbers hit WhatsApp/waitlist fallback. Needs upgrade or 2Factor.in switch. |
| Founder WhatsApp (fallback) | ✅ | +91 97739 33279 |

---

## DATABASE (Supabase, all RLS-enabled)

| Table | Status | Notes |
|---|---|---|
| `users` | ✅ | + `profile_data` JSONB, `verification_tier/status`, `bronze/silver/gold_verified_at` |
| `manufacturer_profiles` | ✅ | + `unit_type`, `moq_unit`, `specialisations[]`, `about`, `notable_clients[]`, UNIQUE(user_id) for upsert |
| `orders` | ✅ | |
| `order_milestones` | ✅ | auto-creates 5 on order |
| `messages` | ✅ | photos as base64 in `media_url` ⚠️ |
| `sample_briefs` | ✅ | |
| `enquiries` | ✅ | |
| `fabscore_history` | ✅ | table exists; no algorithm writes to it yet |
| `verification_applications` | ✅ | |
| `waitlist` | ✅ | |
| `auth_identities` | ✅ | ⚠️ **STILL 1 ROW as of 2026-08-05 — written by 1.8, READ by 1.9, and the identity path is PRODUCTION-PROVEN.** The single row (founder's enterprise account) resolved a real production OTP login end to end: the server logged `via IDENTITY (auth_identities) — phone lookup agrees`, token `sub c3772075…` → `users.id 1ac55487…`. ⚠️ **1.8's WRITE has still never executed** — it only fires on a real-token request for an account with no row, and no such login has happened yet. The artisan (`users.id c9545590…` / auth uid `de9c220c…`) remains deliberately unlinked as its single-use test target. Historical note below kept for context. ⚠️ **STILL 1 ROW as of 2026-07-31 — re-confirmed after the chunk 1.7 production signup. NOTHING in the app reads or writes it yet; 1.8 is what starts writing.** The new artisan account (`users.id c9545590-6d92-4085-b319-64740e20eb30`, auth uid `de9c220c-f1ed-4541-bbea-3bc67644403b`) has a REAL Supabase identity and NO row here — deliberately kept as **chunk 1.8's verification target**. ⚠️ 1.8 must write `user_id = c9545590…` (our `users.id`) and `provider_uid = de9c220c…` (the auth uid / token `sub`); these are independent UUIDs and conflating them builds 1.8 on a key that matches nothing. Account totals now: `users` **11**, `auth.users` **4**, orphaned auth users still **2**. **Created 2026-07-30 (chunk 1.2), backfilled in 1.3.** Backfill result: **1 identity of 10 accounts** (the founder's enterprise account, the only one with both a real OTP auth user and a profile row). The other **9 are dev-bypass (A10) accounts with no Supabase auth user** — correctly skipped, still phone-resolved. ⚠️ **Therefore the phone FALLBACK is the primary resolution path in this environment, which is what chunk 1.9 must get right.** ⚠️ The two sides store different phone formats — `users.phone` bare 10-digit, Supabase auth `91`+10 with no `+` — so matching MUST normalise to the last 10 digits (as `normalisePhone` does); an exact-string match links nothing and silently reports success. The durable link between a `users` row and the provider identity that authenticated it (DECISIONS **I9**, resolves **I6**). `id`, `user_id → users(id)` **ON DELETE CASCADE**, `provider`, `provider_uid`, `created_at`, `UNIQUE (provider, provider_uid)` + `idx_auth_identities_user_id` (Postgres does not auto-index FK columns). RLS on with **zero policies** = deny-all — verified by an anon `INSERT` returning `42501`; the anon key must never read this table. In both `supabase/migrations/002_auth_identities.sql` and `supabase/schema.sql`. Filled by 1.3 (backfill), written by 1.8, read by 1.9. |

| `user_credentials` | ✅ | **Created 2026-08-06 (chunk 2.1); FIRST WRITTEN 2026-08-08 (chunk 2.4).** ⚠️ **Currently 0 rows in the real database** — the 2.4 verification suite created rows for two dev-bypass accounts and deleted them; no real user has set a password, because nothing in the UI reaches the endpoint yet. Read/written only by `db.ts getUserCredential` / `upsertUserCredential`, called only from `authProvider.server.ts setPassword`, called only from `POST /api/account/password`. Password hashes FabVerify owns (DECISIONS **M10**, **I10**). ⚠️ **A SEPARATE TABLE, NOT a `users.password_hash` column, and that is a security decision, not a style one:** `/api/dev-auth/lookup` is unauthenticated and returns `getUserByPhone(phone)` = `.select("*")` on `users` (`db.ts:38-39`), so a hash on `users` would be handed to an anonymous caller for any phone on the platform. A separate table cannot be reached by `select("*")` on `users` — the leak is impossible by construction. 12 columns: `id`, `user_id → users(id)` **ON DELETE CASCADE**, `credential_type` (no CHECK), `password_hash` (the argon2id ENCODED string — carries its own salt AND parameters, so no separate salt/params column), `token_epoch` (revocation, **I12**), `failed_attempts`/`last_failed_at`/`locked_until` (chunk 2.7), `password_changed_at`/`must_change_password` (chunk 2.8 + enterprise default password), `created_at`, `updated_at` (application-maintained, not a trigger). `UNIQUE (user_id, credential_type)` — which is what makes "re-setting a password replaces rather than duplicates" structural, and, because it LEADS with `user_id`, why there is deliberately **no separate FK index** here unlike `auth_identities`. ⚠️ Every column beyond `user_id`/`password_hash` is nullable or NOT NULL-with-default, so all of it is inert until its chunk is built; the counters are NOT NULL DEFAULT 0 on purpose, since `failed_attempts + 1` is NULL on a nullable column — a lockout that never locks. ⚠️ **No `reset_token` column by design** — reset proves the phone by OTP; no email reset links. RLS on with **zero policies** = deny-all, **proven by an anon `INSERT` returning `42501`** run side by side with `auth_identities` as a control (an anon `SELECT` returns `200 []` on both and proves nothing on an empty table). In both `supabase/migrations/003_user_credentials.sql` and `supabase/schema.sql`. |

Schema file: `supabase/schema.sql`. Note: `CREATE POLICY` has no `IF NOT EXISTS` — re-running errors on policies. After DDL, may need `NOTIFY pgrst, 'reload schema';`.

⚠️ **Verifying a new table in the Supabase SQL Editor: ONE STATEMENT PER BLOCK.** It returns only the LAST result set, so a two-statement block silently hides the first answer — which in chunk 2.1 made a correct `policy_count = 0` look like `relrowsecurity = false`, i.e. RLS apparently off on a table meant to hold password hashes. Also: the SQL Editor connects as a privileged role that **bypasses RLS**, so it can never prove RLS works. That proof must come from outside, against PostgREST with the anon key.

---

## THE ABSTRACTION LAYER

| File | Status | Notes |
|---|---|---|
| `app/lib/supabase.ts` | ✅ | client; trailing-slash-stripped URL; persistSession |
| `app/lib/db.ts` | ✅ | THE single DB layer. **18 of 18 API routes go through it as of chunk 1.1 (2026-07-30)** — the last direct caller (`test-db`) was moved onto `checkDatabaseConnection()`, and zero `.from(` calls exist outside this file. ⚠️ Migration is NOT a one-line client swap: the header now records the real PostgREST surface (16 embedded joins, 8 `.maybeSingle()`, 2 `.upsert(onConflict)`). The data model ports as-is; the query syntax does not. |
| `app/lib/authProvider.ts` | ✅ | **THE AUTH SEAM (browser-safe half). Added chunk 1.4, 2026-07-30 — UNUSED, nothing imports it yet.** `sendOtp`, `verifyOtp`, `getSession`, `signOut`, shared types, and the single definition of the A10 dev bypass (hostname-gated). ⚠️ **Must stay browser-safe** — may import only `./supabase`, never `./supabaseAdmin`, because `apiClient.ts` (`"use client"`-reachable) imports it in 1.10. `verifyOtp` returns `providerUid: null` + `isDevBypass: true` for the `123456` path; **1.8 must write an identity only when `providerUid` is non-null** or it fabricates `('supabase','dev-user-…')` rows. `sendOtp` returns a discriminated result carrying `provider_unavailable` so the WhatsApp/waitlist fallback survives 1.6. |
| `app/lib/authProvider.server.ts` | ✅ | **THE AUTH SEAM (server-only half). Added chunk 1.4 — UNUSED.** `getIdentityFromToken` → **`{providerUid, phone}`**, not just the phone: `db.ts getPhoneFromAccessToken` discards `data.user.id`, which IS the `provider_uid` chunk 1.9 needs, so 1.9 could not be built on the old signature. Separate file because it imports the service-role client. |
| `app/lib/passwordHash.server.ts` | ✅ | **Added chunk 2.2 (written 2026-08-06, audited + verified + committed 2026-08-08).** argon2id via `hash-wasm`: `hashPassword`, `verifyPasswordHash`, `needsRehash`. ⚠️ **SERVER-ONLY ENFORCED AT BUILD TIME** by `import "server-only"` — a Client Component importing it fails the build, which is strictly stronger than the convention-plus-grep protecting `authProvider.server.ts`. ⚠️ It had been sitting **uncommitted and never executed** for two days; the suite (`scripts/verify-password-hash.ts`, **42/42**) was run before anything was built on it. Parameters are read back out of the emitted PHC string, never trusted as passed in. Salt is ours (`randomBytes`) because `hash-wasm` does not generate one — proven by 8 hashes → 8 distinct salts. |
| `app/lib/passwordPolicy.ts` | ✅ | **Added chunk 2.4.** DECISIONS [I15]: min 12 / max 128 / no composition rules / NFKC / never truncate / blocklist + structural checks + per-user context. Pure, no I/O, no secrets. ⚠️ **Its first version had a real hole found only by running it** — leet-normalisation (`8→b`, `7→t`) turned `password928374` into `password92beta`, so the "weak base + digits" rule found no digits and accepted it. Now checked against both the leet-mapped and plain forms with a length-ratio test. |
| `app/lib/providerFallback.ts` | ✅ | **Added chunk 1.7 (2026-07-31).** Single shared definition of `looksLikeProviderProblem`, the BACKUP text-check behind the seam's structured `provider_unavailable`. Imported by both `login/page.tsx` and `signup/page.tsx` — extracted rather than copied, so the two auth pages cannot drift on it. ⚠️ **Deliberately NOT inside `authProvider.ts`:** it is insurance against the SEAM's heuristic being narrowed, and a backup inside the thing it backs up is not a backup. ⚠️ Still **unreachable by construction** — the seam classifies with the identical three-substring test on the identical string. Browser-safe, no imports. |
| ✅ **Auth seam — WIRING COMPLETE (6 of 6, 2026-08-05)** | ✅ | ✅ `db.ts` (1.5 — auth removed entirely) · ✅ `auth.ts` (1.5, production-proven) · ✅ `login/page.tsx` (1.6, production-proven) · ✅ `signup/page.tsx` (1.7, proven by a real production signup on a fresh number) · ✅ **`UserContext` + `AuthGuard` + `apiClient` (1.10)**. **Zero application files import Supabase**; what remains is 2 client factories + 3 seams (`authProvider.ts`, `authProvider.server.ts`, `db.ts`). The old "Supabase in ONE file" target was never achievable and has been restated — see MIGRATION.md §1.1. ⚠️ `AuthGuard.tsx:143-144` split `supabase.auth` / `.getSession()` across lines, so single-line greps missed it — the conversion used a multiline regex **plus import-statement matching**, which is the reliable check. ⚠️ **1.10 was 4 files, not 3:** the seam's `getSession()` returned `ProviderSession \| null`, collapsing "signed out" into "couldn't tell". Straight-swapping it would have made `AuthGuard` bounce users to `/login` on any flaky connection and made `apiClient` tell signed-in users to re-authenticate over a transient glitch. Fixed by widening it to a discriminated **`SessionResult`** (`session`/`none`/`error`) — the client-side twin of Issue E. ⚠️ **NOT yet exercised in production:** `AuthGuard` stage 2 and `apiClient`'s token branch are both behind production-only gates that localhost cannot reach. |

---

## AUTH

| Feature | Status | Notes |
|---|---|---|
| Platform auth guard (`app/components/AuthGuard.tsx`) | ✅ | Added 2026-07-29. One shared guard applied via a `layout.tsx` per protected tree — 143 pages across 18 trees + `/onboarding` at phone level. Hybrid: fast localStorage read, then a real `getSession()` check (skipped on localhost, since the `123456` bypass creates no session — A10). Re-runs on `pathname` change + `pageshow`, which is what fixes the signed-out Back button. ⚠️ **UX guard, not the security boundary** — real authorisation is the server-side API auth. |
| Sign-out (shared, both products) | ✅ | `signOut()` on `UserContext`: `supabase.auth.signOut()` → `applyIdentity(null)` → clear mirrors + `fabverify_auth`. Used by FabChat, `LeftPanel`, `EnterpriseLeftPanel`. Redirects to `/login`. |
| Desktop sign-out | ✅ | Added 2026-07-29 to `LeftPanel` and `EnterpriseLeftPanel`. Previously the platform had NO logout outside FabChat. |
| Signup (real Supabase OTP) | ✅ | prod real OTP; localhost `123456` bypass. **On the AUTH SEAM since chunk 1.7 (2026-07-31) — zero `supabase` references in the page.** ✅ **Proven by a genuine first-time PRODUCTION signup on a fresh number** (`9654324268`, confirmed absent from both `users` and Supabase `auth.users` beforehand): real SMS → real code → `/onboarding/profile` → onboarding → `/artisan/dashboard`. Dev bypass positively ruled out — the provider set `phone_confirmed_at`, which the A10 bypass can never do. Seam-handled proven by bundle forensics (old `console.error("OTP error:"…)` marker now absent from all 181 client chunks). ⚠️ Signup's routing tail is deliberately NOT identical to login's — `postVerifyRoute()` must be resolved BEFORE `applyIdentity()` (which rewrites the key it reads), and `fabverify_auth` must be written BEFORE navigating, or `AuthGuard mode="phone"` bounces every new signup to `/login`. |
| Login (real Supabase OTP) | ✅ | same; auto-redirects if already logged in. **On the AUTH SEAM since chunk 1.6 (2026-07-30) — zero `supabase` references in the page.** Production-verified with a real OTP; proven to be the seam handling it (not leftover code) by bundle forensics. ⚠️ The WhatsApp/waitlist fallback for unreachable numbers is **preserved but still never exercised** — see TASKS.md; with Twilio on a trial it is the path most real users would hit. |
| Dev bypass gated to localhost | ✅ | `window.location.hostname` check, not NODE_ENV |
| Prod WhatsApp/waitlist fallback | ✅ | shows only on provider-specific errors |
| Phone format E.164 cleanup | ✅ | +91 + last 10 digits, validate 6–9 start |
| Profile lookup by phone routes correctly | ✅ | dashboard / onboarding-type / onboarding-profile |
| Server-side identity verification (`app/lib/auth.ts`) | ✅ | `getVerifiedCallerPhone()` (phone level, works before a users row exists) + `getVerifiedUser()` (existing account). Prod = real Supabase session token; dev = `x-dev-phone` header, gated on `NODE_ENV`, never on header presence. **Since chunk 1.5 (2026-07-30) token verification comes from the AUTH SEAM** (`getIdentityFromToken` in `authProvider.server.ts`), not from `db.ts`. Reads `.phone` only; `providerUid` is reserved for 1.9. ✅ **The production token branch is runtime-proven** — real OTP, chain asserted to `users.id`. |
| DB-outage vs auth-failure distinction (Issue E) | ✅ | **Both halves done.** *Auth path:* helpers return a discriminated `{ok:false, reason:'unauthenticated'\|'unavailable'}`, never `null`; `authErrorResponse()` → **503** unreachable, **401** not logged in. Backed by `db.ts getUserByPhoneOrThrow()`, which throws instead of swallowing like `getUserByPhone()`. *Write path:* `apiError.ts dbErrorResponse()` does the same for any `db.ts` call that throws inside a route. The write path was missed in the first pass — `save-profile` authenticates without touching the DB, so its outage surfaced in `upsertUser` and returned 500 with the raw exception text. Verified end-to-end against an unresolvable Supabase host. |
| Raw error text never reaches users | ✅ | `readSaveError()` refuses to surface any 5xx body — a database outage once rendered a literal `"TypeError: fetch failed"` on the onboarding screen. 4xx bodies are still shown; those are our own validation messages. |
| Client-side error mapping (`app/lib/apiClient.ts`) | ✅ | `authFetch()` attaches the session token (prod) / dev-phone header. `readSaveError()` maps 503 → "retry will help", 401/403 → "log in again", so users aren't sent to re-authenticate over a transient outage. |
| Onboarding stops on save failure (Issue A) | ✅ | All 8 onboarding pages. Previously every page `console.error`d a failed save and routed onward, creating **phantom accounts** — identity in localStorage, no row in the database. Now the DB write happens first, failure blocks navigation, and the user sees a real error. |
| Password login option | 🟡 | decided (M10), **chunked into 2.0–2.9; 2.0+2.1 done 2026-08-06, 2.2+2.3+2.4 done 2026-08-08**. ⚠️ **A user can now SET a password; NOTHING can authenticate with one, and no screen reaches the endpoint.** That gap is deliberate — credential storage ships and gets exercised before anything trusts it. Login by password is 2.5 (our own token) + 2.6 (the UI). ⚠️ M10 requires us to issue our OWN session tokens (Supabase will not sign a JWT for a credential it does not hold), which pulls A12 Phase 2 dual-verify forward; roughly half of M10 is the token subsystem, not the credential. Highest-risk chunks: **2.2 (argon2id hashing — fails silently and retroactively)** and **2.5 (our own token verify — a bug is an auth bypass)**. |

---

## API ROUTE AUTHORISATION (19 routes, converted in groups)

Every route below used to trust the phone number sent in the request body/query — meaning any caller could name any phone and read or overwrite that account. Conversion replaces that with `getVerifiedUser()` / `getVerifiedCallerPhone()` from `app/lib/auth.ts` plus a `normalisePhone()` ownership check (403 on mismatch).

**Group 1 — DONE (4 routes + 1 diagnostic):**

| Route | Level | Notes |
|---|---|---|
| `/api/dev-auth/save-profile` | `getVerifiedCallerPhone` | Account **creation** — a first-time signup has a verified session but no users row yet, so `getVerifiedUser` would wrongly reject it. Write still anchored to a proven phone. |
| `/api/dev-auth/save-user-type` | `getVerifiedUser` | Runs after the row exists. |
| `/api/manufacturer-profile` | `getVerifiedUser` | `manufacturer_profiles.user_id` now comes from the verified session, not a body-phone lookup. |
| `/api/profile-data` | `getVerifiedUser` | Also accepts optional `position` → `users.position`. |
| ~~`/api/whoami`~~ | — | ✅ **DELETED in Stage 4 (2026-07-28)**, together with `app/temp-whoami-test/`. Both were temporary diagnostics; `/temp-whoami-test` had been compiling into the production route manifest. |

**Group 2a — DONE (orders, verified end-to-end 2026-07-27):**

| Route | Level | Notes |
|---|---|---|
| `/api/orders` GET | `getVerifiedUser` | Results filtered on the verified `users.id`, so scoping is structural. |
| `/api/orders` POST | `getVerifiedUser` | `buyer_id` FORCED from session; `buyerPhone` no longer read from the body. Buyer **or** enterprise may buy (I3). Manufacturer counterparty validated (exists + is a manufacturer). |
| `/api/orders/[id]` GET | `getVerifiedUser` + party | Row-level: caller must be `buyer_id` or `manufacturer_id`. |
| `/api/orders/[id]` PATCH | `getVerifiedUser` + party | Had **no auth at all** before. Milestone updates scoped to the parent order via `updateMilestoneStatus(…, orderId)`. |

Verified by test: 403 on another party's order · 401 unauthenticated PATCH (target order unchanged) · fraud POST claiming another `buyerPhone` created the order against the *authenticated* account · UI ordering and list scoping work normally.
⚠️ **Party check only — no status state machine.** Any party may set any status or advance any milestone (a buyer can complete a milestone, a manufacturer can cancel). Tracked in TASKS.md.

**Group 2b — BUILT AND VERIFIED by curl (messages & conversations, verified 2026-07-28):**

| Route | Level | Notes |
|---|---|---|
| `/api/messages` GET | `getVerifiedUser` | `userId` from session; the query already filters `sender_id = me OR receiver_id = me`, so non-participant rows are unreachable by construction. |
| `/api/messages` POST | `getVerifiedUser` | `sender_id` FORCED from session; `senderPhone` no longer read. Closed the impersonation hole — anyone could previously send a message AS any user. |
| `/api/messages/read` POST | `getVerifiedUser` | Receiver derived from session; can only ever mark the caller's own inbox. |
| `/api/conversations` GET | `getVerifiedUser` | The profile leak: previously returned any account's full conversation list — partner names, phones, account types, order numbers — to an anonymous caller. |

✅ Verified: `conversations` 200 own · **403** another account · **401** anonymous.
✅ Verified 2026-07-28: `messages` POST **401** anonymous; impersonation (authenticated as one account while the body claimed another's `senderPhone`) wrote `sender_id` = the **authenticated caller**, and the response embedded that caller's name/phone — the claimed identity appears nowhere. `messages/read` **401** anonymous; a cross-account attempt returned 200 but left the victim's three unread messages at `read_at: null` (receiver is derived from the session, so it can only touch the caller's own inbox). No `db.ts` changes were needed here.
✅ **BROWSER END-TO-END VERIFIED 2026-07-28.** Real browser run, buyer `9999999991` → manufacturer `9998887771`: `POST /api/enquiries` **200** created enquiry `348040c5`; its seed message landed **212 ms** later (21:17:26.896 → 21:17:27.108), which is exactly what `conversationSeeded: true` reports. The thread appeared on BOTH sides — `GET /api/conversations` 200 for each party's own phone — and messages flowed both ways. Per-message attribution correct on all three rows: Anita → TGC, TGC → Anita, Anita → TGC, each `sender_id` matching whoever was logged in. Proven by request log + database diff against a pre-test baseline, not assumed.
✅ **Bonus: the 503 outage path fired for real.** An unplanned transient Supabase outage hit mid-test; `conversations` and `messages` returned **503** (not 401, not raw exception text) for ~7 s and recovered on their own. Issue E proven under a genuine outage, not a simulated one.

**Group 2c — BUILT AND VERIFIED by curl (enquiries & sample-briefs, verified 2026-07-28):**

| Route | Level | Notes |
|---|---|---|
| `/api/enquiries` POST | `getVerifiedUser` | `sender_id` FORCED from session. Recipient validated. Returns `conversationSeeded` so a failed seed message is reported, not swallowed. |
| `/api/sample-briefs` GET | mixed | `role=buyer` branch verified + scoped to session id; **bare listing stays PUBLIC** (manufacturers browse open briefs). |
| `/api/sample-briefs` POST | `getVerifiedUser` | `buyer_id` FORCED from session; buyer **or** enterprise only (same gate as orders). |
| `/api/sample-briefs/[id]` GET | `getVerifiedUser` | Any verified user — a manufacturer must read a brief to respond. No ownership restriction. |
| `/api/sample-briefs/[id]` PATCH | `getVerifiedUser` + **asymmetric** | Owner may set ANY status; any other verified user may set ONLY `responses_received`. Had **no auth at all** before. |

✅ **Full 2c matrix run 2026-07-28.** `enquiries` POST **401** anonymous; impersonation attributed the enquiry to the authenticated caller. `sample-briefs` POST **401** anonymous; impersonation forced `buyer_id` to the caller; manufacturer account **403** (buyer/enterprise only). `sample-briefs/[id]` GET **401** anonymous, **200** verified non-owner. PATCH: **401** anonymous · **403** non-owner setting `closed` · **403** non-owner setting `cancelled` · **200** non-owner setting `responses_received` · **200** owner setting any status. Every reject was re-run in isolation with a DB read before and after — status unchanged each time, so a rejected request provably writes nothing.
✅ **DB-outage 503** confirmed against an unresolvable Supabase host on `enquiries` POST, `messages` POST, `sample-briefs/[id]` PATCH and `sample-briefs?role=buyer` GET — no raw exception text in any response.
⚠️ All runtime checks ran under `next dev`, where `getVerifiedUser` accepts the `x-dev-phone` header. This proves the authorisation logic, **not** the production Supabase-session branch (gated by `isProduction`). ✅ **PARTIALLY CLOSED 2026-07-30 (chunk 1.5): the production token branch has now been executed for the first time** — real OTP on the enterprise account via `npm start` + the machine's LAN IP (server gate is `NODE_ENV`, client gates are `hostname`, so browsing the LAN IP puts the server in prod mode while the client sends a real OTP). Token → identity → `users.id` chain asserted end to end. This proves the production **token-verification** path; the per-route 401/403 matrix above was still only exercised on the dev branch.

**STILL UNCONVERTED — 6 routes:**
- `dev-auth/lookup` — **deferred deliberately, NEXT TASK** (sits in the login path; returns a full `users` row for ANY phone with no auth — enumeration + PII. See TASKS.md).
- `manufacturers`, `manufacturers/[id]` — **stay PUBLIC by decision** (browsing pre-login is core to the marketplace; require auth to ACT, never to look). They still need `try/catch` for CORE T6.
- `verification`, `waitlist` — not yet converted. `verification` takes `?phone` and returns personal verification status, so it is the highest-value one remaining.
- ~~`test-db`~~ — ✅ **resolved 2026-07-30 (chunk 1.1)**, though never an auth exposure: it accepts no input and returns no user data, so there was nothing to authorise. It now goes through `db.ts checkDatabaseConnection()` (closing the CORE T1 violation) and uses `dbErrorResponse()`, so its CORE T6 gap is closed too. **5 routes remain unconverted**, two of which stay public by decision.

**Error handling:** every converted handler now uses `dbErrorResponse()` (503 unreachable / 500 real fault, never raw exception text). The remaining CORE T6 gap is confined to the **5** unconverted routes above (`test-db` adopted `dbErrorResponse` in chunk 1.1, 2026-07-30).

---

## PUBLIC USER-TYPE FEATURES

| Feature | Status | Notes |
|---|---|---|
| Signup → profile → type → dashboard | ✅ | writes to `users` via service-role dev-auth routes |
| Manufacturer onboarding + profile save | ✅ | upsert via UNIQUE(user_id) |
| Manufacturer discovery (real fetch) | ✅ | loading + empty states; filters |
| Manufacturer profile detail (4 tabs) | 🟡 | Overview real; Catalogue/Reviews/Certifications fake |
| Manufacturer search (10k+ scale) | ✅ | search not dropdown |
| Enquiries (send, real DB) | ✅ | rejects unregistered phones 404; seeds initial chat message |
| Orders — place (8-step bulk form) | ✅ | real DB |
| Orders — accept/decline | ✅ | real DB |
| Orders — track + milestones | ✅ | auto 5 milestones; both sides see real data |
| Messages / FabChat | ✅ | 5s poll, read receipts, optimistic send, photos base64 ⚠️ |
| Sample briefs — post | ✅ | folds wizard fields into description |
| Sample briefs — manufacturer respond | ✅ | sends message, flips status |
| Verification status (Bronze/Silver/Gold) | ✅ | Bronze auto; Silver/Gold pending; badges in LeftPanel; tier synced to manufacturer_profiles |
| FabMerch (hire talent) | 🟡 | screens only |
| FabPrice benchmarks | 🟡 | fake data |
| FabScore display | 🟡 | display only, no algorithm |
| Analytics dashboards | 🟡 | fake data |

---

## FABCHAT (mobile, `/chat/*`)

| Feature | Status | Notes |
|---|---|---|
| 3-tab mobile shell (Chats/Orders/Scan) | ✅ | per-user-type URLs |
| Real conversations + messages | ✅ | via `/api/conversations`, `/api/messages` |
| ChatAuthGuard (members-only) | ✅ | strangers see members-only screen; returning users → login |
| Voice notes | ✅ | MediaRecorder, `start(100)` fix |
| Camera capture (`capture=environment`) | ✅ | direct camera |
| Contact profile bottom sheet | ✅ | shows that contact's orders |
| QR scan tab | 🟡 | UI + manual code entry (dev); real scanning needs native/PWA + backend |
| Photo messages | ⚠️ | base64; move to Supabase Storage |

---

## ENTERPRISE (`/enterprise/*`) — all 🟡 SCREEN-ONLY unless noted

| Feature | Status | Notes |
|---|---|---|
| Onboarding + position selection | 🟡 | MD/CEO, CFO, Head-Ops, Head-Merch, IT-Head, Other |
| Dashboard (position-adaptive) | 🟡 | fake data; CEO money-first view 🔴 not built |
| Team management + member detail modal | 🟡 | full work-dashboard modal, fake |
| Invite flow + pending invitations tab | 🟡 | |
| Invitation acceptance (`/invite/[token]`) | 🟡 | |
| Vendor master | 🟡 | |
| Bulk-order Kanban | 🟡 | |
| Analytics | 🟡 | |
| Season plan | 🟡 | |
| Enquiries | 🟡 | |
| Upgrade modal (createPortal) | ✅ | works (portal fix applied) |
| Enterprise guards (redirect non-enterprise) | ✅ | |
| CEO money-first landing view | 🔴 | designed, not built |
| 11 departments as real modules | 🔴 | Planning, MFP, QA, Supply Chain, Compliance, Sustainability, Design-Coord not built |
| Restructurable hierarchy | 🔴 | |
| CFO builds own team | 🔴 | |
| Role-based permissions (real) | 🔴 | |
| Visual Stock Panel | 🔴 | designed, not built |
| Universal Item Identity | 🔴 | designed, not built |

---

## TRUST & MONEY CORE — mostly 🔴

| System | Status | Notes |
|---|---|---|
| Real escrow (payment-aggregator partner) | 🔴 | needs licensed partner integration |
| QR traceability (milestone/bundle) | 🔴 | designed in full; not built |
| Geo-tagged photo proof | 🔴 | |
| SMV capacity + shift-proof + tolerance engine | 🔴 | designed in full; not built |
| FabScore algorithm | 🔴 | table exists; no calc |
| WhatsApp notifications | 🔴 | |
| Supabase Storage for photos | 🔴 | currently base64 ⚠️ |
| Admin verification approval panel | 🔴 | Silver/Gold sit pending forever |
| Order completion + final payment release | 🔴 | no way to close an order |
| Delivery address persistence on orders | 🔴 | no column |
| Real government-DB verification APIs (Aadhaar/GST/Udyam/CIN) | 🔴 | verification screens exist; real API checks not wired |

---

## DESIGNED-BUT-NOT-BUILT (named features)

Credit: FabFloat, FabPay Later, FabMaterial · Production: FabPLM, FabFloor, FabPayroll, FabHR, FabSAM · Quality: FabQMS (AQL/4-point calculators) · Planning: FabForecast, MFP · Money: FabAccounts, FabMargin, FabPricingEngine (auto-costing), FabMarkdown · Compliance: FabComply, FabAudit, FabDPP (EU passport), FabChemical · Sustainability: FabSustain, FabCarbon · Logistics: FabWarehouse, FabInventory · Export: FabExportDocs, FabLC · AI: FabGuide, FabNegoBot · Assets: FabDAM, FabReorder, FabApproval · Access: FabMultilingual, FabVoice, FabGovt, FabStart · Cash: FabCashFlow (13-week forecast).

---

## PER-USER-TYPE VISION (fully researched & LOCKED this session — see docs/PRODUCT/USER_TYPES.md)

✅ Locked visions (design complete, build pending): Fabric Mill · Trim Supplier · Artisan · Job Worker · Designer (full range) · Master · Merchandiser · QC Inspector (full range) · Brand/Buyer (3 protective layers) · plus cross-cutting: Universal Item Identity · Visual Stock Panel · QR Traceability · FabTalent Profile System · Gig-Adaptive Workspace · Delegated Freelancer Access · FabPricingEngine (auto-costing) · Honest Credit · Government-DB Verification · Legal Escrow (partner-based). Enterprise (11 depts, CEO money-first, restructurable) locked earlier.

**These are DESIGN-locked, not BUILT.** Building them is the roadmap.

---

## KNOWN ISSUES / TECH DEBT

- ⚠️ Photos are base64 in DB — move to Supabase Storage before scale.
- ⚠️ Twilio trial restricts real SMS — upgrade or switch to 2Factor.in.
- ⚠️ Silver/Gold verification applications sit pending — no admin approval UI.
- ⚠️ No order-completion flow; no delivery-address column.
- ⚠️ Some components have hardcoded colors — full theme swap needs a sweep.
- ⚠️ `CREATE POLICY` re-run errors (no IF NOT EXISTS) — known when re-running schema.
- ⚠️ **5 of 19 API routes still trust the phone in the request body/query** (down from 14 — Groups 1, 2a, 2b, 2c are converted and runtime-verified). Of the 5, two stay public by decision (`manufacturers`, `manufacturers/[id]`); the live exposures are `dev-auth/lookup` (enumeration + PII) and `verification` (returns personal verification status for any `?phone`). Was 6; `test-db` left the list in chunk 1.1 — accurately, it was never a phone-trust exposure at all (no input, no user data), so this count previously overstated the auth surface by one.
- ⚠️ **Unguarded DB calls across several routes** — `conversations`, `dev-auth/lookup`, `manufacturers`, `manufacturers/[id]` have no `try/catch` at all; additionally `orders` GET, `messages` GET, `sample-briefs` GET are unguarded even though those files' POST handlers have one, and `messages/read` calls the DB before its try block. Database failures there are unhandled rejections rather than handled statuses. Direct **CORE T6** violation, pre-existing. Audit per-handler, not per-file. Scheduled into Group 2.
- ✅ **DEPLOY BLOCKERS CLEARED (2026-07-29).** All three, verified in a real browser:
  1. ✅ **Temp debug routes removed** — `app/api/whoami/` and `app/temp-whoami-test/` deleted, confirmed absent from the build's route manifest.
  2. ✅ **Issue B fixed** — sign-out now calls `supabase.auth.signOut()`, clears the React identity and removes the mirrors + `fabverify_auth`. After sign-out, `localStorage` is empty and reads AND writes to the API return 401. Desktop sign-out added (`LeftPanel` + `EnterpriseLeftPanel`) using the same shared helper.
  3. ✅ **Platform auth guard added** — found while testing Issue B: NO platform route required a session, so a stranger could type `/brand/dashboard` and browse the shell. 143 pages now guarded.
  Still open but NOT deploy-blocking: `dev-auth/lookup` PII disclosure (read-only, no account access, deprioritised by decision 2026-07-29), the pre-login browsing regression, and the untested onboarding signup path — all in TASKS.md.
- ⚠️ **`main` auto-deploys to Vercel on push.** Committing to git is not deploying, but **pushing to `main` IS** — it would ship issue B. Until issue B is fixed, the batch must land on a non-`main` branch.
- ⚠️ RLS is decorative (DECISIONS I7) — real access control is the server-side `getVerifiedUser()` checks, now on 13 handlers across Groups 1, 2a, 2b and 2c.
- ⚠️ **`db.ts` swallows DB outages on read paths** — ~14 `if (error) return []/null` sites. `GET /api/sample-briefs` (public) answered `200 {"briefs":[]}` during a total outage instead of 503. Misleading empty state; no leak. Logged in TASKS.md, low priority.
- ⚠️ **Discovery hides every new manufacturer** — the tier filter defaults to Silver+Gold (`DiscoveryPage.tsx:47`) while all manufacturers sign up Bronze and Silver/Gold need an admin panel that doesn't exist. Newly-onboarded suppliers are invisible in default discovery. Logged in TASKS.md.

---

## WHAT THE PLATFORM CAN DO TODAY (honest)

A real brand can: sign up (real account) → find a real manufacturer → send an enquiry → post a sample brief → place a bulk order → chat in FabChat → track the order and milestones. A manufacturer can: onboard → appear in discovery → receive enquiries/briefs → accept orders → chat → track. All with real accounts in a real database.

## WHAT IT CANNOT DO YET

Move real money (escrow), prove work happened (QR), notify users (WhatsApp), run a full enterprise, send real SMS to arbitrary numbers (Twilio trial), or approve Silver/Gold verification (no admin panel).

---

*When you finish a task, update the relevant row(s) here BEFORE committing.*
