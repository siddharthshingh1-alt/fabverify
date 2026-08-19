# CURRENT_SPRINT.md
### What We Are Working On Right Now
> Claude Code reads this at session start to know the current focus. Update at the start and end of each working session. Keep it short — this is "now," not the whole roadmap.

---

## ✅ ITEM 1 COMPLETE (2026-08-05) — durable auth link + auth seam

All 10 chunks done. **Zero application files import Supabase** (consumer importers 5 → 0; 5 files remain by design: 2 client factories + 3 seams). `getVerifiedUser()` resolves identity via `auth_identities` with phone fallback — **the identity path is production-proven with a real OTP**, and phone matching stays fully intact as the fallback for the 9 dev-bypass accounts that have no provider identity.

**➡️ NEXT: Launch-Ready item 2 — Password login (M10).** The migration safety net. ⚠️ **Never store passwords in Supabase Auth** — the single most expensive mistake available here.

📍 **M10 progress: 2.0 · 2.1 · 2.2 · 2.3 · 2.4 · 2.5a · 2.7 ALL DONE. NEXT IS 2.5b — the token subsystem.**

> ✅ **2.7 (LOCKOUT) LANDED 2026-08-20, ahead of 2.6 — the gate below is satisfied.** 10 failures → a 15-minute auto-expiring cooldown, per-account, zero DDL, 51/51. Decisions [I23]–[I26].
> 🛑 **2.5b IS HALF-BUILT AND UNCOMMITTED.** The standalone token module (issue + verify) is on disk untracked and its suites pass (54/54, 72/72) — but the integration half does NOT exist: [I21]'s type widening, the ladder branch, the `token_epoch` join. Zero app files import it. See the 📍 M10 STATUS block in `TASKS.md` before touching it.

> 🛑 **2.5b IS THE HIGH-RISK CHUNK. Fresh session, decisions first, nothing else that day.**
> **A bug there is an AUTH BYPASS, not a broken feature.** It is **one indivisible unit** — issue, verify, and the new resolution-ladder branch are the same piece of work. The credential half was already carved out as 2.5a and is done; what remains does not split again. The algorithm, TTL, library and secret location were deliberately left unlocked at chunk 2.0 so they could be decided against a real runtime — **write those decisions before writing the verifier.**
> ⚠️ **The Supabase fallback must survive intact** — every currently-live session is a Supabase JWT, and breaking that branch logs out every existing user at once.
> Full briefing: the 📍 M10 STATUS block in `TASKS.md`.

⚠️ **STATE OF PASSWORD LOGIN RIGHT NOW, so nobody misreads it:** a user can **SET** a password (`POST /api/account/password`), the server can **CHECK** one (`verifyPasswordCredential`), and repeated wrong guesses now **LOCK the account for 15 minutes** — but **nothing can LOG IN**, and no screen reaches any of it. The verifier still has **zero route importers on purpose**. Do not "finish the feature" by wiring login before **2.5b** (our own session token) exists.

⚠️ **2.5 was SPLIT into 2.5a (verify credentials, done) + 2.5b (issue/verify token).** 2.5b is the last high-risk chunk — fresh session, nothing else that day. A verification bug there is an **auth bypass**, and breaking the Supabase fallback logs out every currently-live user at once.

✅ **SEQUENCING GATE SATISFIED: 2.7 (lockout) landed 2026-08-20, before 2.6 (login UI).** ⚠️ **But it is PER-ACCOUNT only, so password SPRAYING is still unhandled** — one guess each against 10,000 accounts never trips any counter. Per-IP is deliberately unbuilt ([I23]). **2.6 must not merge without a decision there.**

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
