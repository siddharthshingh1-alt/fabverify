# CHANGELOG.md
### What Changed, When
> Append-only. Newest at top. Every meaningful build session adds an entry. Keep entries accurate (X2) — describe what actually changed, never overstate.

Format: `## [date/session] — title` then bullets grouped by Added / Changed / Fixed / Deprecated.

---

## [2026-08-30 · blank-screen fix, Part 1] — The guard safety net: a blank screen is now impossible by construction

> **MERGE BLOCKER, found by the chunk 1.10 production test.** Part 1 of two. Variant-independent — it does not diagnose the root cause, it makes any such failure visible instead of silent. Part 2 (the root cause) is still open.

### The incident
- A real first login on the artisan (`9654324268`) — the **first ever production test on a NON-ENTERPRISE account** — reached a **blank screen** and stayed there. No error, no spinner, no redirect. Retrying reproduced it exactly.
- ⚠️ **The auth half PASSED.** `via PHONE FALLBACK` then `via IDENTITY` in the server log, `auth_identities` written at 19:35:07 (**1.8's first-ever execution**), `user_credentials` written at 19:35:28. Three of chunk 1.10's five proofs are done. The failure is entirely in the client render layer.
- ⚠️ **WHY IT WAS NEVER CAUGHT: every prior production test ran on the founder's ENTERPRISE account, and `/enterprise/dashboard` is the ONE dashboard that uses `useEnterpriseAccess` instead of `useTypeGuard`.** All of M10 was proven on the single account type that routes around the bug.
- **Blast radius: all six non-enterprise types (artisan, brand, jobworker, manufacturer, mill, supplier), on first login specifically** — the [I27] password gate fires for any account with no credential, which is every real user's first login.

### Fixed — the guards can no longer render nothing forever
- **`app/lib/guardRecovery.ts` (new)** — the floor under all three client guards.
- **`app/components/GuardFallback.tsx` (new)** — `0-600ms` bare `null` (**the original fast path, unchanged — no spinner flash on normal navigation**), then spinner, then a real error card with a working way out.
- **`AuthGuard`** renders `GuardFallback` instead of a bare `null`; **`useTypeGuard` / `useEnterpriseAccess`** cannot render, so instead they **guarantee their `null` is transient** via a stuck timer that always ends in a navigation.
- ⚠️ **NO PAGE FILES TOUCHED. There are 132 `if (!authorized) return null` sites across 124 files** — changing them was never an option, and they were not the bug. The fix works entirely inside the guards.

### Added — the loop budget (an addition beyond the approved decisions, approved separately)
- ⚠️ **A PER-MOUNT TIMER CANNOT CATCH A REDIRECT LOOP.** Every lap remounts the guard, so each mount is short-lived and no stuck-timer ever fires — the user sees a blank flicker forever while no single component waits long enough to notice. The counter must outlive the component, so it lives in `sessionStorage`: **4 redirects / 4s**, cleared on every successful resolve so ordinary navigation cannot accumulate into a false trip.
- On trip, `recoverToLogin(reason)` clears the identity mirrors and hard-navigates to **`/login?recovered=<which-guard>`**. It clears the mirrors deliberately — reaching there means the guards cannot agree who the user is, so leaving them in place would loop straight back. It does **NOT** revoke the server session: a client guard is not an authorisation boundary, and nothing is destroyed.
- **The `?recovered=` reason may pin the root-cause variant on its own**, without any console reading.

### Verified
- **`scripts/verify-guard-recovery.ts` 18/18** — timing constants, budget exhaustion, clearing on success, window expiry, recovery (navigates, carries the reason, clears every mirror, leaves unrelated keys, resets the budget), and blocked-storage degradation (a guard must never throw).
- `tsc` silent, build exit 0 at 162 pages, eslint **0 errors**, five routes 200, auth matrix unchanged (401s), and the new strings confirmed present in the shipped client bundles.
- ⚠️ **The TIMING behaviour is React in a browser and HTTP cannot exercise it** — the same limitation `verify-login-wiring.ts` records for `AuthGuard`. Proven by the browser run on a non-enterprise account, not here.

### Still open
- **Part 2 — the root cause.** Leading hypothesis is a redirect loop: the log falls **completely silent after the password POST**, and both `/login` and a failed stage-1 check make no authenticated calls, which fits a `dashboard -> /login -> dashboard` loop. ⚠️ An earlier hypothesis (`fabverify_user_type` never written) was **recorded and then withdrawn** — the OTP path calls `applyIdentity(dbUser)` before redirecting, which writes it.
- ⚠️ **THE MERGE STAYS BLOCKED until Part 2 lands AND is proven on a non-enterprise first login.**

---

## [2026-08-29 · merge gate 2] — The eslint decision: 29 errors downgraded to warnings, on the record

> **Config + docs only, zero application code.** Launch-Ready merge gate 2, taken so the first deploy is not blocked on a style sweep.

### Changed
- **`eslint.config.mjs`: `react-hooks/set-state-in-effect` and `react-hooks/use-memo` set to `"warn"`.** Those two rules produced **all 29 errors** (27 + 2) — confirmed by a per-rule severity audit, not by reading the summary line. Result: **0 errors, 40 warnings.** Build and `tsc` unaffected (exit 0, 162 pages).
- **What actually happened:** an `eslint-plugin-react-hooks` bump introduced rules that did not exist when this UI was written, turning 29 working call sites into errors overnight. No code changed; the standard did. That silently broke CLAUDE.md §3's promise that the build passes clean.

### Decision
- ⚠️ **WARN, NOT OFF — that distinction is the point.** The findings stay visible on every run; they no longer block. Turning them off would delete the information, which is what the 2.8a doc-drift incident taught us not to do.
- **Rejected: fixing all 29 now.** Refactoring working effect sites immediately before this project's first production deploy is the worst possible moment to touch working UI for a style rule.
- **Rejected: leaving it red.** A permanently-red lint is one everyone learns to ignore, and it makes a documented standard false.
- **When to revisit:** after the first deploy is validated and the Launch-Ready items land. `set-state-in-effect` flags a real pattern and several of the 27 are probably genuine cleanups — fix them as their screens are touched for other reasons, not as a 29-site sweep. When the count hits zero, delete the block and let the rules error again. **Not a licence for new violations:** this covers pre-existing sites only.
- The reasoning is written into `eslint.config.mjs` itself, not only here — the next person to run eslint sees it where they are standing.

---

## [2026-08-29 · Step 0] — `/api/verification` auth conversion: an unauthenticated tier-grant path, closed

> The first build after M10, and it is a security fix rather than a feature. Taken ahead of Launch-Ready items 3–8 because it was a live unauthenticated write path that granted a verification tier, sitting on the branch heading for `main`.

### Fixed
- **`/api/verification` had NO authentication on either handler.** Reachable with no credentials, against **any phone number**: grant **Bronze** to a stranger's account (under [M7] Bronze is the minimum to transact); write an application with an arbitrary `tier` string and arbitrary `documents` JSON, setting the victim's `verification_status`; and read back any account's verification state **including the documents payload**. ⚠️ **Self-granting Silver/Gold was NOT reachable** — the auto-approve branch is hardcoded to `bronze`. Stated that way deliberately: it is a tier-grant and disclosure hole, **not** a full privilege escalation, and overstating it would have been its own bug.
- Both handlers now: `getVerifiedUser` → `authErrorResponse` → ownership gate → work inside `try/catch` → `dbErrorResponse`.

### Added
- **`mayActOnAccount(caller, targetPhone)` — a NAMED, single-expression ownership gate.** Shaped this way on purpose: the admin verification panel (item 5) needs the OPPOSITE rule, an admin acting on someone ELSE's account, and that must be one `||` here rather than an unpicking of inlined comparisons at three call sites. Typed structurally as `{ phone: string }` so an admin column widens it without touching the signature. Follows the existing `isPartyToOrder` pattern in `orders/[id]`.
- **Tier allowlist** (`bronze`/`silver`/`gold`, per [M8]), placed **after** the auth gate so an unauthenticated caller learns nothing about which tiers exist. The value was previously persisted unvalidated — item 5's panel reads that column to decide what it is approving.
- `try/catch` + `dbErrorResponse` on the GET; POST's `getErrorMessage` → 500 swapped for `dbErrorResponse`. Combined into this edit per the standing TASKS.md instruction ("convert error handling and auth in the same edit, not as a second pass").

### Changed
- **The four client call sites moved to `authFetch`** — `LeftPanel:98`, `VerificationPage:793` and `:815`, `verification/identity:3023`. ⚠️ **None used `authFetch` before**; converting the route without this would have 401'd every verification read and write. Shipped as a separate additive part first, proven neutral (identical `200`, byte-identical JSON) while the route still ignored the header.
- **`getUserByPhone` removed from both handlers** — `getVerifiedUser` already resolved the row, so it was a second round trip for an answer already held. Its 404 goes with it: an authenticated caller has a `users` row by construction.

### Verified (localhost, dev bypass)
- GET: no header **401** · wrong owner **403** · owner **200** · no phone param **400**.
- POST: no header **401** · attacker→victim bronze **403** · tier `"platinum"` **400** · missing tier **400** · owner bronze **200** `autoApproved: true` · owner **silver → `autoApproved: false`, tier stayed bronze, application pending** ([M8] intact).
- **Rejections wrote nothing** — both accounts re-read after every reject, identical to baseline. **The founder's enterprise account stayed `tier=none status=unverified` throughout**; the only write went to the dev-bypass test account.
- DB outage → **503**, no raw exception text. `.env.local` restored **byte-identical** (md5 `d771e757aa2c5f994f9899661690ba65`).
- Neighbouring routes unregressed (orders 401/200/403 · conversations 200 · manufacturers 200 public). `tsc` silent · `npm run build` exit 0, 162 pages · eslint clean on `route.ts`, with the 2+2 errors in the two page files confirmed **pre-existing at HEAD by stashing and re-linting**.

### Carried forward — three flags, recorded so they are not lost
- 🔴 **GET still returns a false `200 "unverified"` if the database dies AFTER the auth gate.** The proven 503 comes from `getVerifiedUser`; beneath it `getVerificationStatus` and `getLatestVerificationApplication` both `if (error) return null`. **The `try/catch` added to that handler cannot fire today — it becomes load-bearing when the `db.ts` swallow-site chunk lands** (item 8's other half). Excluded deliberately: shared `db.ts` functions, and changing their semantics inside a security commit is the scope creep 2.6c refused.
- ⚠️ **Pre-existing cosmetic bug, not introduced and not fixed:** the POST response reports the application as `status: "pending"` even when just auto-approved — `submitVerificationApplication` returns its snapshot before the approval UPDATE. No caller reads it today; item 5's panel will.
- ⚠️ **Test data changed:** dev-bypass account `9999999991` is now `bronze` with a pending `silver` application. Reversible.

### Also fixed — a seven-route documentation drift
- **The item-8 register claimed 9 routes still needed `dbErrorResponse`. A per-handler audit of all 23 routes found 4** (`dev-auth/lookup` POST, `manufacturers` GET, `manufacturers/[id]` GET, `waitlist` POST). Seven were converted during the Group 2 batch and the list never moved. The **CORE T6 GAP** entry was stale in the same direction — every handler it named as unguarded now has both `try/catch` and `dbErrorResponse`. ⚠️ Same failure mode as the 2.8a incident, in the direction that costs rework: a session trusting the register would have "fixed" what was already fixed. Both entries **corrected in place, not deleted**, so the trap leaves a trace.

---

## [2026-08-28 · chunk 2.9] — The M10 docs sweep. No code. M10 is complete.

> **Docs only — zero code, zero suite runs**, agreed explicitly before starting. The rule that kept 2.8a's docs pass honest: if the sweep finds something needing a code change, it stops and reports rather than fixing it inside a documentation chunk. Nothing did.

### The problem this fixed
Twenty days of chunks were recorded by **appending** to status rows rather than rewriting them, so several documents ended up asserting the new truth and the old one at once. Three were outright self-contradictions:

- `TASKS.md`'s M10 STATUS said **"2.8b … NOT BUILT"** three lines above **"2.8b DONE"**.
- `PROJECT_MEMORY.md`'s reset row opened **"LIVE AND PRODUCTION-PROVEN (chunk 2.8b)"** and later, in the *same row*, said **"2.8b = route + UI + production test (NOT BUILT)"**.
- The same file's password row still listed **"STILL OPEN, IN ORDER: 2.6d → 2.8b → 2.9"** after both had shipped.

⚠️ **One was self-inflicted and is worth naming.** Marking 2.10 done spliced a new clause into the middle of an existing sentence, producing: *"…logged in normally **and 2.6a merged without the decision that was supposed to gate it.**"* Two unrelated clauses fused into nonsense. Repaired, and the original meaning preserved as an explicit history note.

### Two files nobody had touched all milestone
- ⚠️ **`docs/SECURITY/AUTHENTICATION.md` was the most stale document in the repository** — nineteen lines describing the pre-M10 world. It listed password login under **PLANNED**, said *"rate-limit OTP requests **when built**"*, and mentioned neither our own session token, `token_epoch`, lockout, reset, the throttles, nor anti-spraying. **It is the file a session opens to learn how authentication works.** Rewritten from scratch.
- ⚠️ **`docs/SECURITY/AUTHORIZATION.md` named RLS as security layer #1**, contradicting **[I8]**, which retired RLS on 2026-07-29. Corrected, with the API-route checks named as the actual boundary and RLS struck through.
- `docs/SECURITY/THREAT_MODEL.md`: the auth-abuse row listed rate limits as aspiration; now records what is built, adds password spraying, and adds SIM swap as **undefended and the floor under every account**.
- `docs/ARCHITECTURE/MIGRATION.md` §4.2 was headed 🔴 and read *"nothing can authenticate with one … Next is 2.5"* — the state on 2026-08-08, twenty days stale. ⚠️ **§4.2.1's "the secret must be carried across the cutover, never regenerated" was preserved byte-identically**; it is the most valuable line in the file and was never stale.
- `github/MILESTONES.md` still listed password login as remaining.

### Carried forward, into PROJECT_MEMORY rather than TASKS alone
The open items lived only in `TASKS.md`, which is not the file `CLAUDE.md` §1 says to read second. They now head **KNOWN ISSUES**:
- 🛑 **Twilio is on a TRIAL account, so no real user can authenticate.** Everything M10 built was proven on the founder's own verified number and **is unreachable by a real user today**. ⚠️ It is not in the Launch-Ready milestone list — it sits in Phase A, which is why it keeps being missed.
- Three gates before `main`: chunk 1.10's owed production session · the 29-error eslint decision · a deliberate merge knowing it deploys.
- The >15 s login-latency anomaly, cause **unknown** and labelled a hypothesis.
- `/api/dev-auth/lookup` unauthenticated; the outage-routes-users-into-onboarding bug; the spray log-volume note; signup-with-gate never run end-to-end; reset does not evict a stolen Supabase session; the SIM-swap floor.

### DECISIONS gains a closing note
[I1]–[I36], no gaps or duplicates. A table now records what supersedes what — **[I8] over [I7]**, **[I9] over [I6]**, **2.6a ending [I18]**, **[I35] over [I23]**, **[I36] excepting D3** — with the two live traps stated: never call [I35] "per-IP rate limiting", and never copy [I36]'s fail-open elsewhere.

### One true story
Every stale `NEXT: 2.6c / 2.6d / 2.8b` pointer removed. One floor value everywhere: **5000 ms**, not 6000. The 2.8a/2.8b split now reads *split, then completed*. Historical text kept wherever it teaches — the doc-drift incident, the PAUSED-block inversion, the twenty-day-stale migration paragraph — but marked unmistakably as history.

**M10 is complete: 2.0–2.8b, 2.9, 2.10. Nothing is deployed.**

## [2026-08-27 · chunk 2.10] — Password spraying is handled, by inverting the objection that blocked it for a week

> **The last security chunk of M10**, and the "hard must-do before merge to `main`" the open-item register had demanded since 2.6a merged without it. Per-account lockout never sees a spray: one guess each against ten thousand accounts trips no single counter.

### The design, and why it is not what [I23] refused
[I23] rejected per-IP limiting for a good reason — a naive attempt cap behind an office or carrier NAT lets one attacker lock out every real user. This does not fight that objection, it **inverts** it: count **distinct accounts that FAILED** from one address. Spraying is one password against many accounts, so it produces that signal by definition and cannot be performed without it; a NAT'd office is many people on their own accounts mostly **succeeding**, and produces almost none. ⚠️ **Never restate this as "per-IP rate limiting"** — that is the design [I23] refused, and counting ATTEMPTS instead of DISTINCT FAILED ACCOUNTS silently becomes it.

### Added
- `checkLoginSprayThrottle` — 10 distinct failed accounts per rolling 15 minutes, matching [I23]'s lockout and [I33]'s verify window so the platform imposes one outage length.
- Wired into `/api/auth/password-login`: **check before the argon2 verify** (a sprayer must not get 45 ms × 19 MiB free per guess), **record after, on failure only**, **clear on success**.
- `scripts/verify-login-spray.ts` (16) and `scripts/verify-login-spray-route.ts` (20).
- Storage reuses `otp_requests` with `purpose = "login-fail"`. **No DDL** — and inert to the OTP counters by construction, because [I33] made the `purposes` parameter **required**.

### Decisions
- **[I35]** supersedes [I23]'s per-IP prohibition, loudly. ⚠️ **Clear-on-success is load-bearing and was found by writing the NAT TEST, not the code**: ten people in a 200-person office each mistyping once inside fifteen minutes is ordinary traffic, so raw distinct-failure counting would have tripped on it.
- **[I36]** the check **fails OPEN**, departing from D3 — fail-closed would lock every user out of the platform on a database blip and buy nothing, since the same outage stops `verifyPasswordCredential` authenticating anyone. **Must not be generalised**; the OTP send and reset verify stay fail-closed.
- The block returns a **generic 401, not a 429**. A 429 is enumeration-safe but tells a sprayer they were detected and cues them to rotate addresses.

### Verified in production (2026-08-27)
A 12-number spray from the laptop blocked that address — probe → **401 in 0.6 s writing no row**, i.e. refused before the verify — and **while it stayed blocked, a real login from the founder's phone succeeded.** Since the check precedes the verify, a blocked address can never reach `verifyPasswordCredential`, so the success is itself proof of a different address. The phone's deliberate wrong-password attempt was recorded and then **cleared by its own success** — [I35] observed on live data. Credential untouched throughout (epoch 1, `failed_attempts` 0); no `ANTI-SPRAY CHECK UNAVAILABLE` line.
⚠️ **What the run could not show directly:** the phone's `ip_hash` value, because the success deleted the row carrying it first. The property does not depend on the value, but the observation is an inference from control flow rather than a printed hash — recorded rather than glossed.

### Mutation-tested, because green proves nothing until it can go red
Counting attempts instead of distinct accounts → **B3 red**. Removing clear-on-success → **B1 red**. Failing closed → **D1 red**. Each reverted and re-run clean.
⚠️ **And the HTTP NAT cell did not discriminate at first** — 20 attempts across only 2 real accounts never approaches a threshold of 10, and it passed with clear-on-success deleted. Restructured to sit one account either side of the line.

### Fixed along the way — five suites, one bug class
`verify-password-login` C5 and `verify-password-lockout` H1 scanned importers by **raw text**, so a documentation comment naming `verifyPasswordCredential` registered as a caller; both now strip comments (the W1 lesson from 2.6c, applied where missed), and the lockout suite was additionally still on `git grep`, which searches tracked files only. `verify-password-reset` H1 asserted **zero** route importers — 2.8b legitimately ended that and the tripwire fired correctly; now an allowlist of one. And `verify-password-lockout`, `verify-password-login` and `verify-set-password` all asserted the **whole** `user_credentials` table was empty at cleanup — the third, fourth and fifth suites carrying the 2026-08-22 bug class.

### Known-open
- ⚠️ **A login occasionally takes >15 s. Cause unknown, not reproduced.** Observed once during this test; the server completed the request correctly and six clean logins immediately afterwards ran 1.0–1.9 s. **Not an anti-spray bug** — the blocked path is the fast path at 1.0 s. "Provider spike" is the leading hypothesis, **not a finding**.
- The `SPRAY PATTERN` line fires on **every** blocked attempt, not once per spray — attacker-driven log volume.

## [2026-08-27 · chunk 2.8b] — Password reset goes live, and the gate caught two takeover-class bugs on the way

> **Users can now recover their own accounts.** Proven end to end on a real number against the LAN production build. The build itself is the smaller story: gating this chunk surfaced two bugs that would each have shipped, and one of them would have fired on the very production test that was about to run.

### Added
- `POST /api/auth/password-reset` — a thin adapter ([I28]). It delegates every decision: `resetPasswordByOtp` (2.8a) for gate/resolve/policy/write, `checkOtpVerifyThrottle` ([I33]) for the brute-force limit, `otpVerifyClient` ([I34]) for the provider call, `issueSessionToken` (2.5b) for the token.
- `/reset-password` — the two-stage forgot-password screen, plus a **Forgot password?** link on `/login` rendered **unconditionally**, for the same enumeration reason the password field is.
- `checkOtpVerifyThrottle` + `recordOtpVerifyAttempt` — 5 guesses per rolling 15 minutes, counted separately from sends.
- `scripts/verify-otp-verify-throttle.ts` (15) and `scripts/verify-password-reset-route.ts` (34).

### Fixed — both found by gating, not by testing
- 🛑 **THE RESET SUBMIT WAS AN UNTHROTTLED ACCOUNT-TAKEOVER VECTOR.** Unauthenticated, gated only by a 6-digit code, and a success writes a password and bumps `token_epoch` — takeover that also evicts the real owner. **Nothing counted verify attempts:** `otp_requests` records sends, 2.7's counter is for password attempts on a different table. ⚠️ The pending anti-spraying chunk would **not** have covered it — different endpoint, different credential.
- 🛑 **`verifyOtp` WAS POISONING THE SHARED ADMIN CLIENT** ([I34]). It calls `_saveSession`, which under `persistSession:false` still retains the session **in memory**, and `_getAccessToken()` returns `sessionToken ?? supabaseKey` — so a session outranks the service role key. One production reset would have downgraded every `db.ts` call in the process to that user, breaking the reset two statements later against deny-all RLS, *after* the code was consumed. **The production test about to be run is exactly what would have triggered it.**
- ⚠️ **`verify-token-ladder.ts` Z1 counted the WHOLE `user_credentials` table** and began failing once a real credential existed that it did not create. Its DELETEs were already scoped so nothing was at risk, but the assertion described a platform with no real users. The sibling suites were scoped on 2026-08-24; this one was missed.

### Verified in production (2026-08-27)
`token_epoch` **0 → 1** · one send row, one verify row · `users` 11, `auth_identities` 1, `user_credentials` 1 — **no phantom account**. The admin client survived, proven three ways: the reset's own write to deny-all `user_credentials` succeeded; a later wrong-code submit returned **401 not 503** (deny-all `otp_requests` still readable) in the same process; `/api/manufacturers` still returns real rows. ⚠️ **And the server log proved what localhost structurally cannot** — `[auth] resolved … via OUR OWN TOKEN (sub=users.id)`, the ladder's local branch accepting the reset's token with its epoch check, on a branch gated behind `NODE_ENV === "production"`.

### Four assertions that were wrong before they were right
C1/C2 claimed a pre-reset token is refused by a real route. It was — but because `auth.ts:144` gates the **entire** token branch on production, so under `next dev` a freshly-minted **valid** token got 401 too. **C1 was a false pass that would have stayed green with the feature deleted.** D3 asserted whole-table ownership of `user_credentials` and failed against the founder's real credential. F3 compared source positions and failed on its own import list. E2 compared raw bodies and would have flaked: `retryAfterSeconds` legitimately differed by 1 s between two callers.

### Known-open
- 🛑 **Login-route anti-spraying — entry still unwritten, HARD MUST-DO BEFORE MERGE TO `main`.** `/api/auth/password-login` has per-account lockout only: no per-IP, no global, no alerting.
- **A 5 s reset is what ships.** The D4 floor dominates. If that is too slow for real users, the single-query throttle rewrite is the next lever.

## [2026-08-26 · chunk 2.6d] — The OTP send path gets faster, and the floor comes down with real evidence behind it

> **The headline is a measurement lesson, not a concurrency one.** Two pairs of sequential Supabase round trips now run concurrently. On localhost one of the two showed no improvement at all and looked like wasted work; in production it was half the win. A latency optimisation judged on localhost would have been abandoned.

### Changed
- `checkOtpThrottle` runs the IP read and the global count under one `Promise.all` ([I31]). ⚠️ The phone read stays **first, sequential and alone**, so a hammered request still costs ONE query — parallelising all three would turn a throttle into an amplifier on an unauthenticated path.
- `recordOtpAttempt` runs the INSERT and the 48 h retention sweep under another `Promise.all` ([I32]).
- **`OTP_RESET_FLOOR_MS`: 6000 → 5000**, and `MEASURED_CEILING_MS` 4722 → 3621, moved together in one commit as G4 requires.
- `toDescendingTimes` extracted — the phone and IP reads had identical copies and now live in different places, which is exactly where two copies drift apart.

### Measured (production, LAN build, real Twilio sends, floor lowered so the work was unmasked)

| leg | 2.6c | 2.6d | delta |
|---|---|---|---|
| throttle check | 2981 ms | 2060 ms | **−921 ms** |
| record + provider | 1741 ms | 965 ms | **−776 ms** |
| **registered reset, total** | **4722 ms** | **2915 ms** | **−1807 ms** |

Registered sends n=3: 2640 · 2915 · 3621 ms. Unknown-number refusals n=11: 1693–3514 ms, median 2086.

### Fixed
- ⚠️ **A MEASUREMENT THAT LOOKED USABLE AND MEASURED THE WRONG THING.** A registered send timed **6018 ms** against the 6000 ms floor and was briefly read as a ceiling that had risen. It was not a ceiling: an unknown number, doing far less work, returned **6016 ms** under the same conditions — the floor was setting the number, not the work. Recording 6018 as the ceiling would have pinned a value no send ever took, **the inert-2000 error in a new costume**. The floor must be lowered before re-measuring, then restored and re-proven.
- ⚠️ **A NEW TEST CELL THAT COULD NOT HAVE FAILED.** The fail-closed assertion added for the concurrent pair was mutation-tested: rewriting the pair as `allSettled` with fulfilled-value fallbacks — the version that returns `{allowed:true}` during an outage — left it **still passing**, because a broken database URL makes the sequential phone read throw first and the concurrent pair is never reached. It is now labelled for what it proves, and the actual guard is a separate comment-stripped source assertion that **does** go red on that mutation.
- ⚠️ **An ad-hoc measurement script polluted the live throttle.** It called `recordOtpAttempt` 21 times under one IP with no cleanup, exhausting the per-IP hourly cap of 20, which made the verification suite's later sends get refused — a green suite turned red for a reason unrelated to the code. Same rule the suites adopted after the `user_credentials` incident, in a new costume: **a script must not leave state it created behind.** Cleanup added.

### Verified
`verify-otp-send` **63/63** (56 + 7 new cells: D9–D13 scope-order, E3/E4 fail-closed) · `verify-password-reset` **42/42** · `verify-login-wiring` **38/38** · `tsc` clean · build exit 0 · floor re-proven binding after restore at 5011–5036 ms.

### Known-open (recorded, not fixed)
- **The remaining jitter is entirely ours.** The provider leg is stable to within 15 ms across sends; `checkOtpThrottle` swings 1795–2757 ms. The floor is now sized by our variance, not the provider's. Concurrency has taken what it can — going below ~5 s needs the **single-query rewrite**, its own chunk.
- ⚠️ **Every number here comes from a warm, long-running `next start`. A Vercel cold start is unmeasured** and would be slower. If the floor is ever seen to go inert in real deployment, raise it.
- **A 5 s reset is better than 6 s and is still slow.** Whether that ships to real users in 2.8b is a deliberate UX call, not something this chunk settles.

## [2026-08-24 · chunk 2.6c] — OTP request hardening: the send moves server-side, gets throttled, and the timing floor turns out to have been inert

> **PRODUCTION-PROVEN, not merely built.** The chunk's code was written 2026-08-22 and parked in a WIP safety commit (`b6ca242`) that explicitly disclaimed being done. This entry is the real landing: the table exists, the suites are green, and the whole path was exercised on a real LAN production build against a real Twilio send.

### Added
- `app/api/auth/otp/send/route.ts` — the OTP send now runs on our server instead of browser-direct against Supabase. Shape rejections are 400 and happen before the provider is ever called.
- `app/lib/otpThrottle.server.ts` — HMAC-keyed phone/IP hashing plus the throttle decision. The key is **derived** from `SESSION_TOKEN_SECRET` (`fabverify/otp-throttle-hash/v1`), so there is no second secret to deploy or lose, and the module refuses to load without it.
- `app/lib/otpPolicy.ts` — browser-safe constants: 45 s cooldown, 5/hr + 10/day per number, 20/hr + 60/day per IP, 500/day global, 48 h retention, the reset timing floor.
- `otp_requests` table (`supabase/migrations/004_otp_requests.sql`), created by hand in the Supabase SQL Editor. **RLS deny-all proven from outside** — an anon `INSERT` returns `42501`. No FK to `users` by design: counting requests for numbers with no account is the entire point.
- `scripts/verify-otp-send.ts` — 56 assertions, including a section [0] safety guard that **refuses to run against a production build**, where the same requests would send real SMS.

### Changed
- **`OTP_RESET_FLOOR_MS`: 2000 → 6000.** See Fixed below — this is the substantive finding of the chunk.
- The reset suite's **G4 was inverted, not deleted** (matching how G1/G2 were inverted when 2.6c landed). It now asserts the floor clears the recorded ceiling, so *lowering the constant* goes red — which a comment-only marker would not have caught.
- Verification suites no longer wipe the whole `user_credentials` table; both are scoped to their own accounts. A routine run on 2026-08-22 had destroyed the founder's real enterprise password and it went unnoticed for two days.

### Fixed
- ⚠️ **THE D4 TIMING FLOOR WAS INERT, AND HAD BEEN SINCE IT WAS WRITTEN.** The value 2000 was chosen before the provider leg could be measured — localhost never calls it, because the A10 browser bypass and the server's `isProductionRuntime` gate both short-circuit first. Measured in production: a registered reset runs **4722 ms** end to end (throttle check 2981 ms / record + send 1741 ms), unknown-number refusals run 2011–2928 ms, the raw provider refusal leg is 352 ms median. **At 2000 the sleep never fired at all** on the send path — `remaining` went negative — so the floor masked nothing and left roughly **1800–3200 ms of existence-dependent signal exposed.** Now 6000, re-proven to bind: the fastest reset path measures 6008 ms, pinned to the floor rather than to the work. Section [G]'s registered/unknown delta fell to **1.2 ms against a 39.3 ms jitter bar** (was 3.4 ms against 997.8 ms). Decisions **[I30]**, **[I31]**.
- Two status documents that had gone stale in the *opposite* direction from the 2.8a incident below: TASKS.md's ⏸️ PAUSED block and CURRENT_SPRINT.md's pause block both predicted a `git status` that the WIP commit had already absorbed, and PROJECT_MEMORY.md still said `otp_requests` did not exist. **A pause record must be updated by the act that ends the pause.**

### Known-open (recorded, not fixed)
- **Chunk 2.6d — OTP send-path latency, a HARD PREREQUISITE of 2.8b.** 63% of what the floor now pads around is our own latency: `checkOtpThrottle` makes three sequential awaited round trips to Supabase Singapore. A 6 s reset is acceptable for a founder measuring it and not for a real user meeting it in the reset UI, and 2.8b is the chunk that puts this path in front of real users. ⚠️ Parallelise only the IP read and the global count — the phone read must stay first and keep its early return, or a hammered request costs three queries instead of one.
- Repo-wide eslint is red (29 errors, all pre-existing `react-hooks` violations lit up by a plugin bump). Zero are in this chunk's files.

## [2026-08-21 · docs-only correction pass] — The docs had drifted from git. Fixed before building anything.

> **No code changed. Three status documents were lying.** Chunk **2.8a** (password reset via OTP — the seam) was committed as `267271c` with **40/40 passing and ZERO markdown changes**. For the rest of that day `TASKS.md`, `CURRENT_SPRINT.md` and `PROJECT_MEMORY.md` all still listed reset as unstarted, and the **2.8a / 2.8b split existed only inside a commit message**. A session trusting the docs would have **rebuilt a proven, security-critical function from scratch** — a Prime Directive #1 violation caused by the docs, not by carelessness. Caught by reading `git log` against the 📍 STATUS line.

### Fixed
- **`TASKS.md`** — 📍 M10 STATUS now lists **2.8a as DONE**. Chunk 2.8 **split into 2.8a (seam, done, fully written up) and 2.8b (route + UI + production test, not built)**. **2.6a and 2.6b written up as DONE entries** (they had shipped while the list still showed an unchecked "2.6"). **New 2.6c entry** for OTP request hardening. 2.9 gained a **carry-forward open-item register**.
- **`CURRENT_SPRINT.md`** — removed the paragraph claiming **"nothing can LOG IN"** (true until 2026-08-21, then three chunks stale) and the block calling **2.5b "half-built and uncommitted"** (done and committed as `ad2c66f`, 156/156).
- **`PROJECT_MEMORY.md`** — new **Password RESET** row; `user_credentials` no longer claims **"0 rows in the real database"** (the founder's account has held a real password since 2026-08-21); the **"`verifyPasswordCredential` has zero route importers"** claim retired — 2.6a legitimately ended it, and the suites now assert an allowlist of one.

### Changed
- **Ordering correction, and it is a security one: 2.6c is now a HARD PREREQUISITE of 2.8b.** Reset requests an OTP on an **unauthenticated** path, and the OTP **send** is still browser-direct against Supabase — unthrottleable, and willing to SMS a number with no account. Shipping the reset UI first would publish a **free SMS cannon aimed at arbitrary numbers**. ⚠️ **Same class of error as scheduling 2.6 before 2.7, which this file already got backwards once.**

### Recorded rather than left to decay
- ⚠️ **Password SPRAYING is undefended and the gate meant to stop that was already passed.** The docs said *"2.6 must not merge without a decision"* on per-IP throttling; **2.6a merged and the decision was never made.** Lockout is per-account only; per-IP stays deliberately unbuilt ([I23]).
- ⚠️ **New-user signup is covered STRUCTURALLY by 2.6b's gate, never observed.** A fresh account is routed to `/onboarding/password` once onboarding creates the `users` row — an inference from the design, **not** an end-to-end run.
- ⚠️ **A reset does not evict a stolen SUPABASE session** — the epoch bump reaches our tokens only. **Never write "reset ends all your sessions."**
- ⚠️ `/api/dev-auth/lookup` remains unauthenticated, returning `select("*")` on `users`.

### The rule this bought
> **Git is the ground truth for what EXISTS; these documents are the ground truth for what it MEANS. When they disagree, git wins and the doc is the bug.** Run `git log --oneline -5` against the 📍 STATUS line as the **first act of every session**. And: **a chunk is not done until its STATUS line moves** — the same failure as the 2.2 and 2.5b traps, where code sat uncommitted; here it was committed, proven, and undocumented.

---

## [2026-08-21 · Chunks 2.5b + 2.6a + 2.6b] — Password login goes live, and is proven in production.

> **A user can now log in with a phone number and a password.** Proven end to end on the real production path: a real OTP login on the founder's enterprise account, a password set through the real screen, then a password login that reached the dashboard with real data loading. Password login is no longer a backend capability nothing reaches — it is the primary way into FabVerify.

### Added
- **`POST /api/auth/password-login`** — the first HTTP surface on the credential path, and what ends [I18]'s deferral. A thin adapter: no hashing, no comparison, no lockout arithmetic, no token verification. All of that was already proven upstream.
- **Password field on `/login`**, primary, with **"Log in with OTP instead"** as an unconditional fallback link.
- **`app/onboarding/password/page.tsx`** — the mandatory set-password screen.
- **`app/api/account/password-status`** — `{ hasPassword }` about the CALLER only. Deliberately a separate endpoint rather than a field on `/api/dev-auth/lookup`, which is unauthenticated and takes a phone — bolting it there would have built an enumeration oracle with a helpful face.
- **`app/lib/passwordGate.ts`** — the three-state client mirror (`has` / `missing` / **`unknown`**).
- **`scripts/verify-login-wiring.ts`** — 38 assertions over real HTTP and the real served HTML.
- **DECISIONS [I27] [I28] [I29]**.

### Changed
- **`AuthGuard` gained ONE condition, in `"profile"` mode only** — the mandatory-password gate. Onboarding runs in `"phone"` mode, so the screen the guard redirects TO is structurally incapable of being redirected away by it. No path exemption list exists to be got wrong.
- **`login/page.tsx`'s OTP handler is unmodified.** Password login reuses OTP's proven success tail — the localStorage mirror, `applyIdentity`, the routing decision — rather than growing a second landing sequence that could drift.

### The test that would have caught a whole wasted session
⚠️ Every backend suite can be green while the login page ships **without a password field** — and for one session, that is exactly what happened: 286 assertions passing against seam functions that no page reached. `verify-login-wiring.ts` fetches the page the browser actually receives and asserts the field is in it. **"The function is correct" and "a user can log in" are different claims**, and only the second one is a feature.

### Proven, and how
- **PRODUCTION (real build, real Twilio, LAN):** OTP login → set password → dashboard → log out → **phone + password → dashboard with real data**. Landing was not accepted as proof; the dashboard had to load real rows, because a token that mints but fails the ladder looks identical for half a second.
- **THE GATE (localhost, dev account):** OTP login on a password-less account → **forced to `/onboarding/password`** · navigating directly to a dashboard URL → **bounced back** · reloading the screen → **no loop** · a too-short password → **clear error, form still usable**, then a valid phrase → dashboard.
- **HTTP layer:** 5 prober paths → **one distinct status+body** · lockout live on the wired path (9 fails still admit the correct password, the 10th locks, the correct password is then refused) · a prober during lockout gets the generic failure, byte-identical to an unknown phone.

### ⚠️ One discrepancy, recorded not smoothed over
The browser gate test's final step reported a successful password set, but **no credential row for that account existed when checked minutes later** — only the enterprise row. The write path was then proven working directly (`{"success":true,"created":true}`, row created immediately). So the gate's *routing* behaviour is confirmed by observation, and the *write* is confirmed by the HTTP suite and by the production enterprise set — but the browser step-4 write itself was never corroborated by a row. Cause unknown. Not treated as proven.

### Known and unchanged
- **OTP request hardening is NOT in this chunk.** The send still runs browser-direct against Supabase, so it cannot be rate-limited by us and still SMSes unknown numbers. Same posture as before — no regression, but not yet the enumeration/spam-safe model.
- **`/api/dev-auth/lookup` is still unauthenticated** and returns `select("*")`.
- **Password spraying is still unhandled** — per-account lockout never trips on one guess each against many accounts.

## [2026-08-20 · Chunk 2.7] — Lockout. Ten tries, fifteen minutes, and nothing a prober can read.

> Built AHEAD of 2.6, which is the point: password verification has no HTTP surface yet, and 2.6 is what opens one. Shipping the login UI first would have left an unthrottled guessing oracle against every account on the platform ([I18]).

### Added
- **Per-account lockout inside `verifyPasswordCredential`** — 10 consecutive failures set a **fixed 15-minute auto-expiring cooldown**. No admin unlock, no support queue. Cleared on a successful login and lazily on expiry.
- **`recordFailedPasswordAttempt` / `clearFailedPasswordAttempts` in `db.ts`** — two guarded single-round-trip updates. Deliberately dumb: handed the values to store, never deciding them.
- **`PASSWORD_LOCKOUT_THRESHOLD` / `PASSWORD_LOCKOUT_MINUTES` in `passwordPolicy.ts`** — policy in one findable place, not buried in a query builder.
- **`scripts/verify-password-lockout.ts`** — 51 assertions across threshold, entry-refusal, enumeration, cost, expiry, reset, concurrency, isolation and outage.
- **DECISIONS [I23] [I24] [I25] [I26]** — the policy, the ownership-gated disclosure, the after-the-hash ordering, and the concurrency mechanism with its measured limit.
- **Zero DDL.** 2.1 built these columns inert in advance; this chunk only starts writing them, so it reverts with one `git revert`.

### Changed
- ⚠️ **[I17]'s "one failure reason" is AMENDED, not broken** — `PasswordVerification` now has two failure reasons, and the second is reachable only by a caller who supplied the **correct password**. Someone holding valid credentials learns nothing from "this account is locked"; a prober can never reach the branch. Enforced structurally — the locked result is constructed inside the `matched` branch and nowhere else — then fuzz-tested (12 wrong guesses against a locked account, zero leaks) and type-asserted at exactly two reasons.
- ⚠️ **Three assertions in `scripts/verify-password-login.ts` were INVERTED, not deleted.** They encoded *"2.7 is unbuilt"* — five failures must leave `failed_attempts` at 0 — which was correct on 2026-08-08 and is a silent security failure today. They now assert the counter moves. T1's *"exactly 2 round trips"* became *"all paths equal"*: pinning the literal number turned a security property into a change-detector that a correct future chunk has to edit, which is how a real assertion quietly gets weakened.
- Section [C] of that suite now reseeds first — the timing section fires enough wrong passwords to trip the new lockout, which is the lockout working on a suite written before it existed.

### The one that matters
- ⚠️ **The lock is checked AFTER the argon2id verify, never before** ([I25]). The obvious early return is precisely wrong: skipping the ~45 ms hash makes a **locked account answer measurably faster than a wrong password**, which is an oracle for account existence — and one an attacker **manufactures on demand** by hammering any number ten times and then timing it. A number with an account gets fast; a number without one never changes. That would have been a *better* enumeration channel than the one 2.5a was built to close.
- **Proven by a negative control rather than by assertion.** The early-return version was deliberately written and run: locked paths drop to **2 round trips / 1.1 ms** against the correct build's uniform **3 round trips / 45.9–49.6 ms**, failing D1/D2/D3. The suite catches the bug it was written for.
- **Exactly one counter write on every path**, issued unconditionally against the same sentinel id the credential read uses. The WHERE clause — not a branch in application code — decides whether it matches a row. No branch means no path that can diverge.

### Known and recorded, not fixed
- ⚠️ **Password spraying is still unhandled.** Per-account lockout never trips on one guess each against 10,000 accounts. Per-IP is deliberately unbuilt: shared office/carrier NAT IPs make naive per-IP a denial-of-service tool, and there is no shared state store. **2.6 must not merge without a decision here.**
- ⚠️ **The counter race has a measured limit** ([I26]). PostgREST cannot express `failed_attempts + 1`, so the increment is read-modify-write with optimistic concurrency and 3 retry rounds. **A 10-parallel burst advances the counter by 5, and the lock arrives after 3 bursts** rather than 1. Bounded degradation, not a bypass — sustained parallel guessing still locks. Proper fix is an atomic increment, free at the [A12] RDS cutover.
- **No time-decay window** — ten failures spread over months still lock. Left open deliberately.
- **2.8 must clear the lock on reset**, or the recovery path cannot recover a locked account.

### Verified
9 failures still let the correct password in (the off-by-one direction real users hit) · the 10th locks · **the correct password is refused during cooldown** · hammering extends neither the cooldown nor the counter · six prober-reachable paths collapse to **one distinct value** · expiry restores login and restarts the counter at **1, not 11** · success resets to 0 · sequential attempts count exactly 1..10 · an outage **throws** (subprocess, cold module graph — the trap that produced a false pass at 2.5a) · **zero route importers**, so [I18] still holds · verification logs nothing · cleanup leaves 0 credential rows and `auth_identities` at 1.
**Regression:** 2.2 42/42 · 2.4 75/75 · 2.5a 37/37 · 2.5b module 54/54 + 72/72 · `npm run build` clean, exit 0, 156 pages · `tsc --noEmit` silent.

## [2026-08-08 · Chunk 2.5a] — Verify a password. Issue nothing.
> Chunk 2.5 was **split**: 2.5a checks credentials, 2.5b issues the session token. A bug in 2.5a is a wrong answer nothing acts on; a bug in 2.5b is an auth bypass. Bundling them would have spent one session's attention on both.

### Added
- **`verifyPasswordCredential(phone, plain)` on `authProvider.server.ts`** — returns *"these credentials match, and they belong to this `users` row"*. No token, no session, no cookie.
- **`scripts/verify-password-login.ts`** — 38 assertions. Plus `scripts/ts-resolve-hook.mjs` + `register-ts-resolve.mjs`, which let a plain Node script import the app's real modules and test a security function **directly instead of through HTTP**.
- **DECISIONS [I16] [I17] [I18]** — the split, the enumeration model, and why no endpoint exists yet.
- **Zero `db.ts` changes** — 2.4's `getUserCredential` and the existing `getUserByPhoneOrThrow` were already the right shape.

### Changed
- ⚠️ **`AuthenticationResult` deliberately NOT reused, contradicting the recorded plan.** That type's `providerUid: null` already means *"this was the A10 dev bypass"*, and chunk 1.8 keys its `auth_identities` write off exactly that — a password result setting it null would be indistinguishable from a dev-bypass login. Checked against the real type and rejected with reason; a narrow `PasswordVerification` is returned instead.

### Fixed (both found by running, both had passed review)
- ⚠️ **The timing test was worthless and was rewritten.** Wall-clock medians reported *wrong password* (1173 ms) as SLOWER than *correct password* (506 ms) — two paths that do byte-identical work. WAN latency to Supabase Singapore swamps the ~45 ms argon2 signal entirely. Replaced with `fetch` instrumentation that splits each call into network and local time: round-trip count is **exact**, local floor isolates the hash.
- ⚠️ **The outage test reported a FALSE PASS.** Re-importing `authProvider.server.ts` in-process with a cache-busting query string still resolves its `./db` import to the **already-cached** module holding a working client — the broken host was never used and the call succeeded. Now run in a subprocess with a cold module graph. Second outage-test trap in two chunks.

### Verified
- **38/38.** Correct password verifies and resolves the right `users.id` · two accounts sharing an identical plaintext resolve to their **own** distinct ids · four phone formats resolve the same account.
- ⚠️ **Enumeration, the point of the chunk:** wrong password, non-existent account, and account-with-no-password-set return **byte-identical** objects (`{"ok":false,"reason":"invalid-credentials"}`), and every path does **exactly 2 database round trips** with local floors of **42.3 / 44.3 / 45.3 / 45.4 ms** — no path skips the hash, none skips a query.
- **A dead database THROWS** rather than reporting "invalid credentials" — an outage can never tell a user their correct password is wrong.
- **No route imports it** (asserted by `git grep` in the suite; the symbol is tree-shaken out of the server bundle entirely). Repeated failures leave `failed_attempts` at **0**, confirming lockout is genuinely unbuilt rather than half-built.
- Regression: hashing **42/42**, set-password **75/75**, build clean 156 pages, `tsc` silent, 184 client chunks free of every server-only marker, `user_credentials` back to 0 rows, `auth_identities` still 1.

### Explicitly NOT done
- **No HTTP surface** — no endpoint, deliberately ([I18]). ⚠️ **This is what makes deferring lockout safe today, and 2.6 is what ends it: 2.7 must land with or before 2.6, not after.**
- **No token issuance** — strictly 2.5b.
- **Enumeration is not closed platform-wide** — `/api/dev-auth/lookup` still hands out a full `users` row for any phone, unauthenticated.

---

## [2026-08-08 · Chunks 2.2 / 2.3 / 2.4] — Password hashing, the seam operation, and the set-password endpoint
> A user can now SET a password. **Nothing can authenticate with one** — there is still no password login path, deliberately. Credential storage ships and gets exercised before anything trusts it.

### Added
- **`app/lib/passwordHash.server.ts` (chunk 2.2)** — argon2id via `hash-wasm`. `hashPassword` / `verifyPasswordHash` / `needsRehash`. Server-only, enforced at **build time** by `import "server-only"` (strictly stronger than the convention-plus-grep used elsewhere). ⚠️ Written in a prior session and left **uncommitted and never run**; this session audited it and ran its suite — **42/42 pass** — before anything was built on it.
- **`app/lib/passwordPolicy.ts` (new)** — length-over-complexity validation per [I15]. Pure, no I/O.
- **`setPassword()` on `authProvider.server.ts` (chunk 2.3)** — the credential lifecycle, including the re-verification gate. ⚠️ Placed on the seam, not in the route, because **a gate implemented in a route is a gate the next route can forget**. `verifyPassword` is still NOT declared — it must mint a session, which is chunk 2.5.
- **`db.ts`: `getUserCredential` + `upsertUserCredential` + `PASSWORD_CREDENTIAL_TYPE`** — first code to read or write `user_credentials`.
- **`POST /api/account/password` (chunk 2.4)** — sets or changes the caller's own password. Deliberately **not** under `/api/dev-auth/*`.
- **`scripts/verify-set-password.ts`** — committed, re-runnable, 75 assertions.
- **DECISIONS [I13] [I14] [I15]** — hashing library + parameters, the re-verification model with its accepted risk, and the password policy.

### Changed
- **`db.ts` header: upsert count 2 → 3**, and `MIGRATION.md` §1.2 with it.
- **The `FUTURE (M10)` block in `authProvider.ts` replaced** with what was actually decided; the open question it carried ("is password a `users` column or an `auth_identities` row?") is closed by [I10]/[I11].

### Fixed (found by the verification suite, not by review)
- ⚠️ **The password policy ACCEPTED `password928374`.** Two of its own rules cancelled each other: leet-normalisation maps `8→b`, `7→t`, `4→a`, so the string became `password92beta` and the "weak base followed by digits" test found no digits to match. Now checked against **both** the leet-mapped and plain forms, with a **length-ratio** test (weak word ≥ half the password) instead of "the remainder is all digits". A real gap that only a run could find — review had passed it twice.
- **Test isolation in the D group.** One wrongly-accepted password created a credential, so every later case hit the change-gate and failed with a misleading 403 — one real finding presenting as eight. Each case now cleans up after itself.

### Verified
- **75/75** on the endpoint suite (localhost, `next dev`, curl + service-role reads). First-time set · change gated · cross-account impossible · policy · malformed input · no leak · non-regression.
- ⚠️ **The bypass group specifically:** body-supplied `credential_type` / `credentialType` / `isFirstTime` / `skipVerification` all **ignored** → still 403, **no second credential row created**, hash and `token_epoch` unmoved. A change cannot be disguised as a first-time set.
- ⚠️ **The outage bypass ([I14]'s load-bearing property), proven at unit level with a control:** against an unresolvable host, `getUserCredential` **throws** while `getUserByPhone` (a legacy swallow site) returns null on the identical failure. Had it swallowed, an outage would read as "no credential exists" and skip re-verification. The first attempt at this test through HTTP was **discarded as inconclusive** — `getVerifiedUser` also hits the database and answers 503 first, so the route-level 503 proved nothing about the credential read.
- Build clean, exit 0, **156 pages** (155 + the new route); `tsc --noEmit` silent.
- **184 client chunks free of** `argon2` / `hash-wasm` / `passwordHash` / `user_credentials` / `supabaseAdmin` / `SUPABASE_SERVICE_ROLE_KEY` / `getIdentityFromToken`, with the same markers **present** in server bundles so the scan is a live test rather than a vacuous pass.
- `users` fingerprint byte-identical before and after (`ecfae37db1c314e7`); `auth_identities` still **1** row (password writes none — [I11]); `user_credentials` returned to **0** rows.

### Explicitly NOT done
- **Nothing is wired into the signup or login UI.** No user can reach this endpoint from a screen.
- **`token_epoch` increments but is INERT** — nothing issues or verifies our own tokens yet, and live sessions are Supabase JWTs that do not carry it. It revokes nothing until chunk 2.5. Recorded as inert, not believed to be protecting anything.
- **No rate limiting** on the route (chunk 2.7). It is authenticated and only ever touches the caller's own account, so it is not an enumeration oracle — but it is not throttled.
- **Not exercised in production.** Localhost proves the whole route: nothing in it sits behind a production-only branch, and the identity path it stands on was production-proven in 1.5/1.9.

---

## [2026-08-06 · Chunks 2.0 / 2.1] — M10 begins: password decisions locked, `user_credentials` table created (schema only)
> First two chunks of password login. **No credential handling, no hashing, no token logic, and nothing authenticates by password.** Docs + one table.

### Added
- **`user_credentials` table** (`supabase/migrations/003_user_credentials.sql`, mirrored into `supabase/schema.sql`). 12 columns, RLS deny-all, `UNIQUE (user_id, credential_type)`, FK `ON DELETE CASCADE`. **0 rows; zero references under `app/`.** First writer is chunk 2.4.
- **DECISIONS [I10] [I11] [I12]** — storage shape, no `auth_identities` row for password, and `token_epoch` revocation.

### Changed
- **A fuller schema than planned, by decision:** the lockout (2.7) and reset (2.8) columns were included upfront rather than added later, since altering a credentials table is more disruptive than carrying empty ones. Every one of them is nullable or NOT NULL-with-default, so they are inert until their chunk — **proven by an INSERT naming only `(user_id, password_hash)`**, not asserted.
- **`MIGRATION.md` §4.2 corrected.** It said *"hashes in our `users` table"*; that is now a separate table per [I10], with the reason recorded.
- **A doc claim corrected before it could mislead:** the M10 plan said 1.9's resolution ladder would be "untouched". Its existing identity and phone branches are, but chunk 2.5 adds **one new branch above them** for our own tokens. Fixed now rather than discovered at 2.5, the auth-bypass chunk.

### Decided, deliberately NOT locked
- **argon2id parameters and the hashing library move to 2.2; JWT algorithm/TTL/library move to 2.5** — a library decision that cannot be tested against the deployed runtime is a paper decision. ⚠️ We have never deployed, so proving Vercel compatibility means a **preview** deploy from this branch, which needs an explicit go-ahead.

### Verified
- Table shape 12 columns / 3 constraints (FK confirmed `ON DELETE CASCADE`) / 2 indexes / **0** policies / **0 rows read with the service-role key**.
- **RLS proven by an anon `INSERT` returning `42501`**, run side by side with `auth_identities` as a control and returning byte-identical errors. An anon `SELECT` returned `200 []` on both tables — which proves nothing on an empty table, and is exactly why the INSERT is the test.
- Build clean, exit 0, 155 pages · `tsc --noEmit` silent · grep zero `user_credentials` under `app/` · auth matrix **9/9** (orders, messages, conversations: 200 own / 401 anonymous / 403 cross-account) · all three account types log `via PHONE FALLBACK`, byte-identical to 1.9/1.10 · `users` **11** and `auth_identities` **1** before and after — the session created nothing.

### Worth keeping (two "failures" that were reading artifacts)
- The Supabase SQL Editor returns **only the LAST result set**, so a two-statement verify block hid the `relrowsecurity` answer and showed `policy_count = 0` in its place — making correct RLS look disabled on a table meant to hold password hashes. **One statement per verify block.**
- The SQL Editor connects as a role that **bypasses RLS**, so it can never prove RLS works; that proof has to come from outside against PostgREST with the anon key.

---

## [2026-08-05 · Chunks 1.8 / 1.9 / 1.10] — Item 1 COMPLETE: the durable auth link is live, and identity resolution is production-proven
> The last three of the 10 chunks, in one session. **Item 1 (durable auth link + auth seam) is DONE.** Password login (M10), RLS retirement, remote logout and the whole A12 dual-verify phase were all blocked on this.

### Added
- **`auth_identities` is now written on authentication (1.8).** `db.ts ensureAuthIdentity()` + `recordIdentityOnce()` in `getVerifiedUser()`. Written there, not at login/signup, because at OTP-verify time a new signup has no `users` row yet — `getVerifiedUser` is the only place a provider identity and a `users.id` are both known server-side. INSERT-only (`ON CONFLICT DO NOTHING`), never repoints an existing mapping, and structurally excludes the dev bypass (`providerUid` is null there).
- **Identity-first resolution with phone fallback (1.9).** `db.ts getUserByProviderUid()` + the resolution ladder in `getVerifiedUser()`. **This is the actual decoupling of identity from phone number** (DECISIONS I9, mitigating I6). Contracts are deliberately inverted: the phone lookup THROWS (an outage must be 503, not a bogus 401), the identity lookup NEVER throws (it is an optional enhancement and must not be able to break auth). `auditAgainstPhone` logs any identity/phone disagreement — the only detector for the one failure the fallback cannot catch, an identity row resolving confidently to the *wrong* account.
- **`SessionResult` on the auth seam (1.10)** — a discriminated `session` / `none` / `error`, replacing a nullable session.

### Changed
- **`AuthGuard`, `UserContext` and `apiClient` now go through the seam (1.10).** **Zero application files import Supabase.** Consumer importers 5 → 0; 5 files remain by design (2 client factories + 3 seams).
- **Doc target restated:** *"Supabase referenced in ONE file"* was never achievable — `db.ts` must import `supabaseAdmin` as the data seam, and a factory must exist to be imported. Corrected in TASKS.md and MIGRATION.md §1.1/§4.1, along with a stale `UserContext` comment citing login/signup as precedent for direct client imports (untrue since 1.6/1.7).

### Fixed
- **A latent bug the 1.10 swap would otherwise have shipped.** The seam's `getSession()` swallowed errors into `null`, collapsing "signed out" into "couldn't tell". `AuthGuard` would then have bounced users to `/login` on any flaky connection — its raw-client `.catch()` existed precisely to prevent that — and `apiClient` would have told signed-in users to re-authenticate over a transient glitch. The client-side twin of Issue E.

### Nothing removed
- 1.10 orphaned no code; the seam's `getSession`/`signOut` went unused → used. `providerFallback.ts` was specifically **kept** despite being unreachable by construction (chunk 1.7's explicit decision — "unreachable today" is not "dead"). The phone fallback in `getVerifiedUser` was never touched.

### Verified
- **Identity path PRODUCTION-PROVEN** with a real OTP: `[auth] resolved users.id=1ac55487-… via IDENTITY (auth_identities) — phone lookup agrees`. Corroborated by that auth user's `last_sign_in_at` moving to `2026-08-05T06:30:35Z`.
- Localhost: build clean (155 pages), `tsc` silent, auth matrix 10/10 (200/401/403), browser dev login + sign-out (`localStorage` empty, API 401) + fresh-number signup → `/onboarding/profile` not bounced. 181 client chunks free of service-role markers. `users` 11 and `auth_identities` 1 throughout — the tests created nothing.

### Not yet verified
- **1.8's write has never executed**, and **1.9's miss-then-fallback branch** plus **1.10's two production-only branches** are unproven. All are behind production gates localhost cannot reach. One combined production session on the still-unlinked artisan account closes all of them — recorded in TASKS.md under chunk 1.10.

---

## [2026-07-31 · Chunk 1.7] — The signup page is on the auth seam, proven by a REAL production signup on a fresh number
> Seventh of the 10 chunks of Launch-Ready item 1, and the last delicate login-flow chunk — a mistake here blocks NEW users. **3 files** (`app/signup/page.tsx`, `app/login/page.tsx`, new `app/lib/providerFallback.ts`), +108/−119. **Zero `supabase` references remain in the signup page** (was 4). Both auth pages are now fully on the seam.

### Changed
- `signup/page.tsx`: `signInWithOtp` → `providerSendOtp`, `verifyOtp` → `providerVerifyOtp`, `signOut` → `providerSignOut`, inline hostname check → `isDevBypassHost()`. Same aliasing requirement as 1.6 (the page defines local `sendOtp`/`verifyOtp`), so again **zero JSX changes**.
- The dev and production branches of `verifyOtp` collapse into ONE seam call plus one `fabverify_auth` write, with `devMode` from `result.isDevBypass` and `storageUserId` preserving the legacy `dev-user-<alldigits>` format byte-for-byte.
- Small improvement inherited from the seam: the old inline `supabase.auth.verifyOtp` was not wrapped in try/catch, so a network throw was an unhandled rejection. It now shows a real error.

### Added
- **`app/lib/providerFallback.ts`** — one shared `looksLikeProviderProblem`, imported by both auth pages. In 1.6 this was a module-local const in `login/page.tsx`; signup needed the same backup, so it was **extracted rather than copied**, precisely to prevent the login/signup drift the seam exists to eliminate.
- ⚠️ **Deliberately NOT placed inside `authProvider.ts`.** It is insurance against the SEAM's own heuristic being narrowed, and a backup that lives in the same file as the thing it backs up is not a backup. It remains **unreachable by construction** (the seam classifies with the identical three-substring test on the identical string) — stated in the file so nobody misreads its presence as evidence the structured signal is insufficient.

### Preserved deliberately (NOT harmonised with login)
- Signup's routing tail is intentionally different. **ORDER MATTERS:** `postVerifyRoute()` is resolved into `next` BEFORE `applyIdentity()`, because `applyIdentity` rewrites the `fabverify_profile` key that `postVerifyRoute` reads. All three destinations stay wrapped in `postVerifyRoute() ?? …`, and signup keeps its own `checkAuth` shape (no `chatRedirectPending`).
- The `fabverify_auth` write stays BEFORE the lookup and navigation — load-bearing, because `/onboarding/*` is guarded at PHONE level. A navigation before that write bounces every new signup straight to `/login`. Now documented at the line itself.

### Verified
- **PRODUCTION: a genuine first-time signup on a fresh number.** `9654324268`, confirmed beforehand as absent from BOTH `users` and Supabase `auth.users` and not one of the two known orphaned auth users. Real SMS → real code → `/onboarding/profile` → profile + type → `/artisan/dashboard`. New auth user `de9c220c-f1ed-4541-bbea-3bc67644403b` with `phone_confirmed_at 2026-07-30T22:30:20Z`; `users` row `c9545590-6d92-4085-b319-64740e20eb30` created 10 s later. **The A10 dev bypass is positively ruled out** — it creates no auth user and no `phone_confirmed_at`.
- **Bundle forensics** (`next start` logs no requests, so this is the proof the seam ran and not leftover code): signup's own client chunk carries `provider_unavailable` / `isDevBypass` / `storageUserId`, and the old inline marker `console.error("OTP error:", …)` is now **absent from all 181 client chunks** — it was still present in signup's chunk after 1.6, which is exactly what 1.6 recorded as the remaining tell. Service-role leakage still zero.
- **Localhost:** build clean (155 pages) · dev-bypass login `9999999991` → `/brand/dashboard` · dev-bypass signup on an EXISTING account `9654324268` → `/artisan/dashboard`, not onboarding · dev-bypass signup on a FRESH number `9876543210` → `/onboarding/profile`, rendered, not bounced · wrong code → stays on the OTP step with `localStorage` completely empty · invalid phone `5123456789` → correct error with the WhatsApp fallback correctly NOT shown · auth matrix 200/401/403 · `auth_identities` still **1 row**.

### Fixed (documentation of a long-standing unknown)
- ✅ **Closes "UNTESTED — new-user signup through the guarded onboarding path"** (open since 2026-07-29, risk stated as "if the mode is wrong, every new signup is bounced to login forever"). `AuthGuard mode="phone"` is correct, now proven twice — dev bypass and real production OTP.

### Traps recorded (both cost real time)
- ⚠️ **`next dev` blocks cross-origin dev resources.** Browsing a dev server from a phone over the LAN fails to hydrate (`Blocked cross-origin request to Next.js dev resource /_next/webpack-hmr`), so a React-controlled input never updates state and the "Send OTP" button stays permanently disabled — which looks exactly like a broken form. **Do NOT fix with `allowedDevOrigins`:** that unblocks the button while leaving `NODE_ENV=development`, where `x-dev-phone` is accepted, invalidating the whole production test. Use `npm run build && npm start`.
- ⚠️ **The LAN IP Next.js prints can be the wrong adapter** — it announced `192.168.137.1` (Mobile Hotspot) while Wi-Fi was `172.23.18.191`. Both answer 200 from the host, so only the phone can tell them apart. Enumerate with `Get-NetIPAddress` and confirm from the device.

### Kept test account (do NOT delete)
- `9654324268` · `users.id` **`c9545590-6d92-4085-b319-64740e20eb30`** · auth uid **`de9c220c-f1ed-4541-bbea-3bc67644403b`** · artisan. The only account with a real Supabase identity and **no `auth_identities` row**, making it chunk 1.8's exact verification target. ⚠️ 1.8 must use `users.id` for `user_id` and the auth uid for `provider_uid` — independent UUIDs, easily conflated since the token's `sub` is the auth uid. Totals: `users` 11 · `auth.users` 4 · `auth_identities` 1 · orphaned auth users still 2.

---

## [2026-07-30 · Chunk 1.6] — The login page is on the auth seam, verified with a real production OTP
> Sixth of the 10 chunks of Launch-Ready item 1, and the first to touch the real login UI. **1 file** (`app/login/page.tsx`, +92/−90). **Zero `supabase` references remain in the login page.**

### Changed
- `signInWithOtp` → `providerSendOtp`, `verifyOtp` → `providerVerifyOtp`, `signOut` → `providerSignOut`. Phone validation, E.164 formatting, the A10 localhost bypass and provider-error classification now all live in the seam — so **login and signup can no longer drift** on any of them (until 1.7 moves signup, they are deliberately on different code paths).
- ⚠️ **Aliased imports were mandatory:** the page already defines local handlers named `sendOtp` and `verifyOtp`, so an unaliased seam import is a duplicate declaration. Aliasing also meant **zero JSX changes** — the JSX still calls the local handlers.
- `DEV_OTP_BYPASS` and the inline hostname check removed from the page; `isDev` now comes from the seam's `isDevBypassHost()` at module scope, preserving the existing SSR-false-then-true behaviour exactly.
- `devMode` in `fabverify_auth` now comes from **`result.isDevBypass`** — the seam's own gate — so it can never disagree with the branch that actually ran. `storageUserId` preserves the legacy `dev-user-<alldigits>` format byte-for-byte.

### The fallback — belt-and-suspenders, by explicit decision
- **Primary:** the seam's structured `provider_unavailable`. **Backup:** the original message-text check, retained alongside it.
- ⚠️ **Documented honestly at the call site: the backup is currently UNREACHABLE by construction.** The seam derives `provider_unavailable` using the identical three-substring test on the identical string, so any message the backup would catch has already been classified upstream. It is kept as insurance against the seam's heuristic being narrowed later, and can be deleted once the structured signal is proven in production over time. **Its presence is not evidence the structured signal is insufficient** — that note is in the code so a future reader cannot misread it.
- Verified there is **no false positive**: `invalid_phone` correctly shows the validation message and does **not** trigger the WhatsApp fallback.

### Fixed (small, intentional)
- The old inline `supabase.auth.verifyOtp` call was **not wrapped in try/catch** — a network throw surfaced as an unhandled rejection. The seam wraps it, so the user now sees a real error message instead.

### Verified — production PASSED
- Real OTP on `9773933279` via `npm run build && npm start` + the machine's LAN IP: `method=otp`, `sub c3772075…`, landed on **`/enterprise/dashboard`**. Same identity proven in chunks 1.3 and 1.5.
- ⚠️ **Proof the SEAM handled it, not leftover code.** `next start` logs no requests, so the server log cannot show this — instead, **bundle forensics**: located login's own client chunk (contains `"Welcome back"`, not `"Create your account"`) and confirmed the seam markers `provider_unavailable` / `isDevBypass` / `storageUserId` are all **PRESENT**, while the old inline path's unique marker `console.error("OTP error:", …)` is **ABSENT**. That string still appears in **signup's** chunk — which is exactly chunk 1.7's remaining work, and independently confirms the two pages are now on different code paths.
- ⚠️ **The browser-safe seam is now genuinely compiled into a client chunk** (login is `"use client"`), while `supabaseAdmin` / `SUPABASE_SERVICE_ROLE_KEY` / `service_role` remain **absent from all client bundles**. The 1.4 browser/server split is proven under real client-side use, not merely by import-graph inspection.

### Verified — localhost
- `npm run build` clean, TypeScript pass, **exit 0**, 155 pages.
- Invalid phone `5123456789` → `"Please enter a valid Indian mobile number"`, WhatsApp fallback correctly **not** shown.
- Wrong dev code → `"Development mode: enter 123456 to continue"`, stays on the OTP step.
- **All three account types land correctly:** buyer `9999999991` → `/brand/dashboard` (`userId: "dev-user-9999999991"`, `devMode: true`), manufacturer `9999999992` → `/manufacturer/dashboard`, enterprise `9773933279` → `/enterprise/dashboard` with the enterprise mirror intact.
- Stale-session mount redirect still works (a leftover session on `/login` redirects to the landing route).
- Auth matrix **200/401/403** + conversations **200/401** · `/api/test-db` 200 · `auth_identities` still **1** row · `users` snapshot hash unchanged.

### Not tested — recorded as its own task
- ⚠️ **The `provider_unavailable` fallback itself has never been exercised.** With Twilio on a trial that only delivers to verified caller IDs, **this is the path most real users would hit.** Testing it requires a number Twilio will reject, and any well-formed Indian mobile could belong to a real person — so it was deliberately not attempted. Whether a Twilio trial "unverified number" error matches the text heuristic is **unknown**; it may fall through to a plain error, leaving a real user at a dead end with no fallback offered. Pre-existing — 1.6 preserves the behaviour exactly. Proper fix: stop guessing from message text (use the provider's error code, or treat any production send failure as fallback-worthy, since a user who cannot receive a code is stuck either way).

---

## [2026-07-30 · Chunk 1.5] — Auth leaves the data layer, and the production token path is tested for the first time
> Fifth of the 10 chunks of Launch-Ready item 1. **2 files**, server-side only — no UI, no client code. The delicate login-path work is 1.6/1.7.

### Changed
- **`app/lib/auth.ts:103`** now calls `getIdentityFromToken` from `./authProvider.server` instead of `getPhoneFromAccessToken` from `./db`. It reads **`.phone` only** — `providerUid` is deliberately left unused until chunk 1.9, so 1.5 does not absorb 1.9's risk or its much heavier test burden.
- **`app/lib/db.ts`** — `getPhoneFromAccessToken` deleted. **The file now contains zero `supabaseAdmin.auth` references: `db.ts` is data only.** That mixing of auth logic into the database abstraction is a large part of why the Supabase seam leaked (DECISIONS X5). A "MOVED OUT" comment marks the spot so the removal reads as deliberate.

### ⚠️ How the production-only path was actually tested (reusable technique)
The changed line sits behind `isProduction` (`NODE_ENV === "production"`), so **`next dev` can never reach it** — the dev-header branch bypasses it entirely. The technique that worked, worth keeping for any future production-gated change:

- The **server** gate is `NODE_ENV`; every **client** gate (`login/page.tsx:25`, `apiClient.ts:18`, `AuthGuard.tsx:85`) is `window.location.hostname`. **Different signals.**
- So: `npm run build && npm start`, then browse via the machine's **LAN IP rather than `localhost`**. The server is in production mode *and* the client is out of dev-bypass mode → a **real OTP** is sent → a real Bearer token is attached → the changed code executes.
- Setup validity was confirmed *before* testing: `x-dev-phone` returned **401** (the same call is **200** under `next dev`), proving the production branch was genuinely active.
- Rejected alternatives: temporarily forcing `isProduction = true` (edits the file under test, risks surviving into a commit) and minting a token via a throwaway password user (writes a password into Supabase Auth against M10, and a token for a phone with no `users` row returns 401 either way — indistinguishable from failure, so it proves nothing).

### Verified — production path PASSED
- Real SMS to `9773933279`, real code, landed on **`/enterprise/dashboard` with data**. The dashboard cannot render unless authenticated calls succeeded, and every one of them ran through the changed line.
- **Independently corroborated server-side:** the provider's record for auth user `c3772075…` shows `last_sign_in_at` moved from `2026-07-25T20:45:16Z` (as recorded in chunk 1.3) to **`2026-07-30T05:09:23Z`** — proof a fresh real authentication occurred, not merely a user report of one.
- **Full chain asserted:** JWT `sub` `c3772075…` → `getIdentityFromToken` → `{providerUid: c3772075…, phone: 9773933279}` → `auth_identities` → **`users.id 1ac55487…`** (enterprise) — **and the phone path resolves to the same account.** That agreement is precisely what makes chunk 1.9's swap safe. Asserted without the live access token being pasted or written anywhere.
- ⚠️ **This was the first execution of the production token branch in the project's history.** PROJECT_MEMORY previously carried the caveat that every runtime check in the whole security batch ran under `next dev` and therefore proved "the authorisation logic, **not** the production Supabase-session branch". That long-standing gap is now closed.
- ⚠️ **The client-bundle check became a LIVE regression test** — `authProvider.server.ts` gained its first real importer here. `getIdentityFromToken` is **present** in server bundles and **absent** from all 181 client chunks, as are `supabaseAdmin`, `SUPABASE_SERVICE_ROLE_KEY` and `service_role`. The browser/server split from 1.4 holds under a real import, not just in theory.
- **Localhost regression, re-run after the production test:** `npm run build` clean (155 pages) · dev auth matrix unchanged (`orders` **200**/**401**/**403**, `conversations` **200**/**401**) · `/api/test-db` **200** · no remaining callers of `getPhoneFromAccessToken` · `auth_identities` still **1** row · `users` snapshot hash unchanged.
- ⚠️ **Not separately confirmed: a WRITE through `getVerifiedUser` on the production path** (FabChat message send). Reads are proven by the dashboard rendering; writes use the identical code path, so no distinct risk is expected — recorded as unconfirmed rather than assumed.

### Security note recorded while testing
- **Supabase sign-out does NOT reliably invalidate an already-issued access token.** Access tokens are stateless signed JWTs; `signOut()` revokes the *refresh* token and deletes the session, stopping new tokens being minted, but an existing access token stays cryptographically valid until its `exp` (~1h by default). Newer GoTrue versions embed a `session_id` and *may* reject a revoked session at `/user`, but that is version-dependent and was not measured here. **If a token is ever exposed, treat it as live until expiry — sign-out is not a kill switch.** Directly relevant to the "Active session visibility + remote logout" item in the Account Security & Recovery group.

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
