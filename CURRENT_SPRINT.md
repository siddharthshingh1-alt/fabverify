# CURRENT_SPRINT.md
### What We Are Working On Right Now
> Claude Code reads this at session start to know the current focus. Update at the start and end of each working session. Keep it short — this is "now," not the whole roadmap.

---

## ✅ ITEM 1 COMPLETE (2026-08-05) — durable auth link + auth seam

All 10 chunks done. **Zero application files import Supabase** (consumer importers 5 → 0; 5 files remain by design: 2 client factories + 3 seams). `getVerifiedUser()` resolves identity via `auth_identities` with phone fallback — **the identity path is production-proven with a real OTP**, and phone matching stays fully intact as the fallback for the 9 dev-bypass accounts that have no provider identity.

**➡️ NEXT: Launch-Ready item 2 — Password login (M10).** The migration safety net. ⚠️ **Never store passwords in Supabase Auth** — the single most expensive mistake available here.

📍 **M10: PASSWORD LOGIN IS LIVE (2026-08-21).** 2.0 · 2.1 · 2.2 · 2.3 · 2.4 · 2.5a · 2.5b · 2.6a · 2.6b · 2.7 · **2.8a** ALL DONE — a real phone+password login reached the enterprise dashboard with real data on the LAN production build.
**➡️ WHAT IS LEFT: 2.9 (docs sweep) — the last M10 chunk — plus the LOGIN-ROUTE ANTI-SPRAYING chunk, whose entry is still unwritten and which is a HARD MUST-DO BEFORE MERGE TO `main`.** ✅ **2.8b DONE and production-proven 2026-08-27** (reset end to end, epoch 0 → 1, isolated verify client held on first real execution). ✅ **2.6c DONE and production-proven (2026-08-24); 2.6d DONE and production-measured (2026-08-26)** — registered reset 4722 → 2915 ms, floor 6000 → 5000, re-proven binding. ⚠️ **Still owed and easy to lose: the login-route anti-spraying chunk — its TASKS entry is STILL UNWRITTEN and it is a HARD MUST-DO BEFORE MERGE TO `main`.** **Nothing is deployed** — every M10 commit is local-only on `auth-hardening-batch`.

> ## ✅ 2.6c DONE AND PRODUCTION-PROVEN (2026-08-24) — this was the pause block, kept inverted
>
> **⚠️ IT USED TO SAY "PAUSED MID-2.6c" AND TO PREDICT A `git status` OF 10 MODIFIED + 5 UNTRACKED. THAT WENT STALE THE MOMENT THE WIP COMMIT (`b6ca242`) LANDED**, and it briefly alarmed a session on 2026-08-24 that found only 4 modified files. The files were not lost — they were inside the commit. Inverted rather than deleted, so the trap leaves a trace. ⚠️ **The lesson is new and worth keeping: a pause record that predicts a `git status` must be updated by the act that ends the pause**, or it becomes a second source of drift pointing the opposite way from the 2.8a incident below.
>
> **WHAT WAS DONE:** the `otp_requests` table was created by hand in the Supabase SQL Editor (RLS deny-all proven from outside — anon `INSERT` → `42501`) · the throttle suite runs green · **the production OTP test was run on the real LAN production build** and proved the server→Supabase send works, the SMS arrives, **`verifyOtp` still succeeds even though the send no longer creates a pre-verification session in the browser** (the one genuinely risky change here), the [I27] gate fired, password login works, OTP fallback works, and the throttle refused the repeat.
>
> **🔴 THE ONE PLACE THE PLAN WAS WRONG — D4.** The floor was `2000` "as a conservative starting point". Measured in production it was **inert**: a registered reset runs **4722 ms**, so the sleep never fired at all and ~1800–3200 ms of existence-dependent signal stayed exposed. `OTP_RESET_FLOOR_MS` is now **6000** and re-proven to BIND (fastest reset path 6008 ms). The reset suite's **G4 fails-when-fixed tripwire fired exactly as designed** and is now inverted. Decisions **[I30]**, **[I31]**.
>
> **⚠️ WHAT IT COST: 63% of what the floor pads around is OUR OWN LATENCY** — 2981 ms of the 4722 ms is `checkOtpThrottle`'s three sequential round trips to Singapore. **That is chunk 2.6d and a HARD PREREQUISITE of 2.8b** — a 6 s reset is fine for a founder measuring it, not for a real user meeting it in the reset UI.
>
> **GREEN AT COMMIT:** build clean exit 0 · `tsc` silent · eslint 0 errors on the chunk's files · **`verify-otp-send` 56/56** · **`verify-password-reset` 42/42** (G4 inverted) · **`verify-login-wiring` 38/38**.

> ✅ **RESET LOGIC ALREADY EXISTS — 2.8 WAS SPLIT.** **2.8a (the seam: `resetPasswordByOtp`, server-side OTP gate, epoch bump, lockout clear) is DONE and committed — `267271c`, 40/40, zero route importers.** What remains is **2.8b: the route + UI + a production test.** ⚠️ **Do not rebuild 2.8a.**
> ✅ **2.6c CAME BEFORE 2.8b, AS REQUIRED — that gate is now satisfied (2026-08-24).** The OTP send was browser-direct against Supabase — unthrottleable, and it would SMS a number with no account; reset requests an OTP on an **unauthenticated** path, so shipping the reset UI first would have published a free SMS cannon aimed at arbitrary numbers. 🛑 **2.8b IS STILL GATED, NOW BY 2.6d** (latency): the reset path currently takes ~6 s because the D4 floor pads around our own sequential DB round trips. Fix the speed before real users can reach it.
> ✅ **2.7 (LOCKOUT) LANDED 2026-08-20, ahead of 2.6 — that gate is satisfied.** 10 failures → a 15-minute auto-expiring cooldown, per-account, zero DDL, 51/51. Decisions [I23]–[I26].
> ✅ **2.5b IS DONE AND COMMITTED** (`ad2c66f`, 156/156) — our own session token, issued and verified, with the ladder branch live and the Supabase fallback intact. *(This block previously said "half-built and uncommitted." It was stale.)*

> 🛑 **DOC-DRIFT INCIDENT, 2026-08-21 — THE REASON THIS BLOCK WAS REWRITTEN.** Chunk 2.8a was committed with **zero markdown changes**, so for the rest of that day all three status docs said reset was unstarted, and the 2.8a/2.8b split existed **only in a commit message**. A session trusting the docs would have **rebuilt a proven, security-critical function from scratch** — Prime Directive #1, caused by the docs themselves.
> ⚠️ **THE RULE: run `git log --oneline -5` and compare it to the 📍 STATUS line as the FIRST act of every session.** Git is the ground truth for what *exists*; these files are the ground truth for what it *means*. When they disagree, **git wins and the doc is the bug.**
> ⚠️ **AND: a chunk is not done until its STATUS line moves.** Same failure as the 2.2 and 2.5b traps in a new costume — there the code was uncommitted; here it was committed, proven, and undocumented.

> ⚠️ **STILL OPEN AND EASY TO LOSE — the full register lives under chunk 2.9 in `TASKS.md`:** password **spraying** is undefended (2.7 is per-account only; per-IP deliberately unbuilt, [I23]) and **2.6a merged without the decision that was supposed to gate it** · `/api/dev-auth/lookup` is **still unauthenticated** and returns `select("*")` on `users` · a reset's epoch bump evicts **our** tokens only, so **a stolen Supabase session survives it** — never write "reset ends all your sessions" · **new-user signup is covered structurally by 2.6b's gate but has never been run end-to-end on a genuinely new account.**

✅ **STATE OF PASSWORD LOGIN RIGHT NOW, so nobody misreads it:** a user can **SET** a password, **LOG IN** with one (`POST /api/auth/password-login` + the field on `/login`), and is **forced to set one** before reaching the app ([I27] gate). Repeated wrong guesses **lock the account for 15 minutes**. The server can also **RESET** a forgotten password from a fresh OTP (`resetPasswordByOtp`) — **but that function has no route and no screen yet (2.8b)**, so no user can reach it. *(This paragraph previously read "nothing can LOG IN." That was true until 2026-08-21 and is now three chunks out of date.)*

✅ **THE LOGIN MODEL IS NOW FULLY TRUE OF THE RUNNING APP — the OTP SEND (2.6c) LANDED 2026-08-24.** It was browser-direct against Supabase, unthrottleable, and would SMS a number with no account. It is now server-side, throttled, enumeration-uniform, and production-proven. *(This line previously said the send was still browser-direct and 2.6c was uncommitted and unproven. True until 2026-08-24, then stale.)*

⚠️ **PASSWORD SPRAYING IS UNDEFENDED, and the gate that was supposed to stop this has already been passed.** 2.7's lockout is **per-account only** — one guess each against 10,000 accounts trips no counter. Per-IP is deliberately unbuilt ([I23]: shared office/carrier NAT makes naive per-IP a DoS tool, and there is no shared state store). ⚠️ **This file used to say "2.6 must not merge without a decision there." 2.6a merged on 2026-08-21 and the decision was never made.** Recorded plainly rather than left to decay: **the surface is live and undefended.**
✅ **DECIDED 2026-08-22 (2.6c decision D5) — and it is a SPLIT, not a fix.** 2.6c throttles the **OTP send** only; login-route anti-spraying is deliberately a separate, named chunk, because mixing a second security surface into a chunk that touches the login path is how chunks break. 🛑 **That chunk entry is ITSELF still unwritten** — deferred until 2.6c's suites are green — and it must land in TASKS.md flagged **hard must-do before merging to `main`**. The honest risk picture (only one account currently holds a password; the exposure grows with every account [I27]'s gate converts) is recorded in TASKS.md's open-item register under 2.9.

Two findings from the original plan still shape the work:
- **M10 requires us to issue our OWN session tokens** (chunk 2.5). Supabase will not sign a JWT for a credential it does not hold, and holding it there is what M10 forbids — so password login pulls **A12 Phase 2 dual-verify forward**. Roughly half of M10 is the token subsystem, not the credential.
- ⚠️ **A `users.password_hash` COLUMN would be publicly readable today.** `/api/dev-auth/lookup` is unauthenticated and returns `select("*")` on `users` to any caller — a hash there would be handed out for any phone number. M10 therefore recommends a separate `user_credentials` table, which makes the leak impossible by construction.

Highest-risk chunks, each to be built on a fresh session: **2.2 (hashing design — fails silently and retroactively)** and **2.5 (our own token verification — a bug there is an auth bypass)**.

⚠️ **One open task against item 1, not a blocker for item 2 but do it before merging to `main`:** a single combined production login (artisan `9654324268` via `npm start` + LAN IP — re-confirm the IP, it is DHCP and has already changed once) proves 1.8's first-ever write, 1.9's miss-then-fallback branch, and 1.10's two production-only branches in one session. Details under chunk 1.10 in TASKS.md.

---

## ➡️ NEXT UP — LAUNCH-READY (order locked 2026-07-29)

The auth security batch is **complete and committed**. Next milestone is **Launch-Ready**, sequenced by migration dependency — see the locked order in `TASKS.md` and the full strategy in **`docs/ARCHITECTURE/MIGRATION.md`**.

**Item 1 (durable auth link + auth seam) is a MULTI-SESSION build, split into 10 chunks** — each one buildable, testable and committable in a single short session, each leaving the app fully working if you stop after it. Password login, RLS and remote logout all depend on item 1, and the AWS RDS cutover stands on it.

> 📍 **The chunk list and a STATUS line live in `TASKS.md` under "1. Durable auth link + auth seam".** Read that first — it says exactly which chunk is next. Update the STATUS line as the last act of every session.
>
> **Chunk order at a glance:** 1.1 housekeeping (T1 fix + doc note) · 1.2 create `auth_identities` · 1.3 backfill · 1.4 build `authProvider.ts` unused · 1.5 move `getPhoneFromAccessToken` out of `db.ts` · 1.6 login OTP through seam · 1.7 signup OTP through seam · 1.8 write identities on auth · 1.9 **resolve via identities (highest risk)** · 1.10 `AuthGuard`+`UserContext` through seam.
>
> Chunks 1.1–1.4 are additive and near-zero risk; 1.5–1.9 touch the login path, where a mistake locks users out.

Locked decisions: **A12** parallel-run migration · **I8** RLS retired · **I9** `auth_identities` · **X5** seam before first call site.

---

## SPRINT FOCUS
**The API route auth-hardening batch.** Every API route used to trust a phone number sent in the request body or query string, so any caller could act as any account. Groups 1, 2a, 2b and 2c are built; the batch is not finished and nothing is committed.

## ⚠️ READ THIS FIRST WHEN RESUMING

**All three deploy blockers are cleared** (2026-07-29), each verified in a real browser:
1. ✅ Temp debug routes removed — absent from the build's route manifest.
2. ✅ **Issue B fixed** — sign-out genuinely ends the session; after it, `localStorage` is empty and API reads AND writes return 401. Desktop sign-out added.
3. ✅ **Platform auth guard added** — found while testing Issue B: no platform route required a session, so a stranger could type `/brand/dashboard` and browse the shell. 143 pages now guarded.

**`main` auto-deploys to Vercel on push.** Work lives on branch **`auth-hardening-batch`**. Committing is safe; **pushing `main` IS a deploy** — merge deliberately, not by habit.

**Before merging, decide two open items** (both in TASKS.md, neither blocking a commit):
- **Pre-login browsing regression** — `/manufacturers*` are redirect shims into the now-guarded `/brand/*`, so prospective buyers can't browse before signing up. Contradicts the locked "browsing pre-login is core to the marketplace" intent. API routes unaffected.
- **Onboarding signup path untested** — `/onboarding/*` uses `mode="phone"`; verified by reading, never run with an unregistered phone. If wrong, every new signup bounces to login.

## DONE THIS BATCH

**Issue A — onboarding no longer advances on save failure.** All 8 onboarding pages block navigation and show a real error. Fixes phantom accounts. ✅ Verified end-to-end against a dead database: the UI blocked and the `users` table was untouched.

**Issue E — DB-outage vs auth-failure.** Both halves: the auth path and the data-write path answer **503** when the database is unreachable, **401** only for genuine auth failure, and no raw exception text can reach a user (a literal `TypeError: fetch failed` once rendered on the onboarding screen). ✅ Verified.

**Group 1 (4 routes)** — `dev-auth/save-profile`, `dev-auth/save-user-type`, `manufacturer-profile`, `profile-data`. ✅ Verified: 200 / 401 / 403 / 503 all distinct.

**Group 2a — orders (4 handlers).** `orders` GET/POST, `orders/[id]` GET/PATCH. `PATCH /api/orders/[id]` previously had **no authentication at all** — anyone with an order UUID could cancel it. `buyer_id` is now forced from the session; milestone updates are scoped to their parent order. ✅ **Fully verified**: 403 non-party · 401 anonymous (target order unchanged) · fraud POST attributed to the authenticated caller · normal UI ordering unaffected.

**Group 2b — messages & conversations (4 handlers).** ✅ **Verified by curl (2026-07-28).** `conversations` 200/403/401; `messages` POST 401 anonymous and impersonation forced to the authenticated sender; `messages/read` 401 anonymous and a cross-account attempt left the victim's unread messages untouched.

**Group 2c — enquiries & sample-briefs (5 handlers).** ✅ **Full matrix run (2026-07-28)** — 401/403/attribution on every handler, plus the asymmetric PATCH (owner any status · non-owner only `responses_received`). Each reject re-run in isolation with a DB read before and after, proving a rejected request writes nothing. DB-outage 503 confirmed on four routes.

**Stage 4 cleanup.** ✅ `app/api/whoami/` and `app/temp-whoami-test/` deleted; no code references remain; docs updated.

## REMAINING

1. ✅ **2b browser end-to-end — RUN AND PASSED (2026-07-28).** Enquiry `348040c5` posted, seed message 212 ms later, thread visible to both parties, three messages with correct per-message `sender_id`. Proven by log + DB diff against a pre-test baseline.
2. **Decide the pre-login browsing regression** (see above) before merging to `main`.
3. **Test first-time signup** through the guarded onboarding path with an unregistered phone.
4. **`dev-auth/lookup`** — deprioritised by decision 2026-07-29. Read-only, grants no account access, OTP gates real login; it is a PII disclosure (full row incl. email), not an access hole. Fix with rate-limiting + minimal response when convenient. **Use `getVerifiedCallerPhone`, not `getVerifiedUser`** — the route must still answer for first-time signups with no `users` row.
5. **Account Security & Recovery** (Phase A group) — session visibility, remote logout, re-auth for sensitive actions, recovery, password 2FA. Blocked on a durable `users.auth_user_id` link (DECISIONS I6).

## KNOWN NON-BLOCKERS (recorded, deliberately not fixed)
- Order status transitions are party-checked but have no state machine — a buyer can advance a milestone, a manufacturer can cancel.
- Order-number generation can collide (`Date.now()` slice). DB-level fix, deferred.
- 6 routes still unconverted: `dev-auth/lookup`, `verification`, `waitlist`, `test-db`, and `manufacturers` + `manufacturers/[id]` (the last two stay **public by decision** — browse without auth, act with it).

## DEV ENVIRONMENT NOTES
- **Blanket 404s on every API route** = `.next` left in a production-build state after running `next build` then `next dev`. Fix: stop the server, `rm -rf .next`, restart. Happened twice.
- Testing against a broken database: set `NEXT_PUBLIC_SUPABASE_URL` to a **valid URL with an unresolvable hostname** (`https://<ref>-BROKEN.supabase.co`). A malformed URL makes `createClient` throw at module load and proves nothing. **Restore it afterwards** — the real value is `https://ehoifdlresiazmwxsdqy.supabase.co`.
- Switching accounts needs a manual site-data clear; there is still no desktop sign-out.

## NOTES FOR CLAUDE CODE
- Before building anything, read `PROJECT_MEMORY.md` for status and `DECISIONS.md` for locked choices.
- The established route pattern is: `getVerifiedUser` + ownership check + `dbErrorResponse` + client callers on `authFetch`. Fields identifying the CALLER are derived from the session, never read from the body.
- FabChat's full vision is locked as **DECISIONS P15** with a locked 4-stage build order. External email integration is stage 4 and must not start until auth is hardened.
