# CURRENT_SPRINT.md
### What We Are Working On Right Now
> Claude Code reads this at session start to know the current focus. Update at the start and end of each working session. Keep it short — this is "now," not the whole roadmap.

---

## ✅ ITEM 1 COMPLETE (2026-08-05) — durable auth link + auth seam

All 10 chunks done. **Zero application files import Supabase** (consumer importers 5 → 0; 5 files remain by design: 2 client factories + 3 seams). `getVerifiedUser()` resolves identity via `auth_identities` with phone fallback — **the identity path is production-proven with a real OTP**, and phone matching stays fully intact as the fallback for the 9 dev-bypass accounts that have no provider identity.

**➡️ NEXT: Launch-Ready item 2 — Password login (M10).** The migration safety net. ⚠️ **Never store passwords in Supabase Auth** — the single most expensive mistake available here.

📍 **M10: PASSWORD LOGIN IS LIVE (2026-08-21).** 2.0 · 2.1 · 2.2 · 2.3 · 2.4 · 2.5a · 2.5b · 2.6a · 2.6b · 2.7 · **2.8a** ALL DONE — a real phone+password login reached the enterprise dashboard with real data on the LAN production build.
**➡️ WHAT IS LEFT: 2.9 (docs sweep). ONE CHUNK.** ✅ **2.10 (login anti-spraying) DONE and production-proven 2026-08-27** — that was the last SECURITY chunk and the "hard must-do before merge to `main`" the open-item register had demanded since 2.6a. Decisions [I35] + [I36]. ✅ **2.8b DONE and production-proven 2026-08-27** (reset end to end, epoch 0 → 1, isolated verify client held on first real execution). ✅ **2.6c DONE and production-proven (2026-08-24); 2.6d DONE and production-measured (2026-08-26)** — registered reset 4722 → 2915 ms, floor 6000 → 5000, re-proven binding. ⚠️ **Still owed and easy to lose: the login-route anti-spraying chunk — its TASKS entry is STILL UNWRITTEN and it is a HARD MUST-DO BEFORE MERGE TO `main`.** **Nothing is deployed** — every M10 commit is local-only on `auth-hardening-batch`.

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

> ⚠️ **STILL OPEN AND EASY TO LOSE — the full register lives under chunk 2.9 in `TASKS.md`:** password **spraying** is undefended (2.7 is per-account only; per-IP deliberately unbuilt, [I23]) and **2.6a merged without the decision that was supposed to gate it** · `/api/dev-auth/lookup` is **still unauthenticated** and returns `select("*")` on `users` · 🔴 **`GET /api/sample-briefs`'s public branch returns buyer name, city AND PHONE to anonymous callers with no input at all** (found 2026-08-31, pre-existing, verified against `76b64f2`) · a reset's epoch bump evicts **our** tokens only, so **a stolen Supabase session survives it** — never write "reset ends all your sessions" · **new-user signup is covered structurally by 2.6b's gate but has never been run end-to-end on a genuinely new account.**

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

# 🚀 M10 IS COMPLETE AND **DEPLOYED** (merged 2026-08-31). `5b7dfa3` IS LIVE.

All fifteen chunks are done and production-proven — password login, our own
session token, per-account lockout, server-side throttled OTP, password reset,
and login anti-spraying. **All of it is now on `main` and serving from
`fabverify.vercel.app`**, together with Item 1's auth seam. All 6 verification
points passed on the live site.

⚠️ **`main` AUTO-DEPLOYS. IT IS NO LONGER A SAFE PLACE TO COMMIT — not even
docs.** A docs-only push to `main` rebuilds and redeploys production. Work on a
branch; merge deliberately, the way this one was.

⚠️ **DEPLOYED IS NOT LAUNCHED, AND IT IS NOT EVEN BETA-READY.** Twilio is still
on trial and 9 of 11 signup personas are a blank screen on a phone. See
"BEFORE ANY BETA INVITE" in the handoff block below.

*(Historical: this read "NOTHING IS DEPLOYED … `main` has none of it." True
from 2026-08-28 until the merge on 2026-08-31.)*

## 🚀 THE FIRST DEPLOY HAPPENED — 2026-08-31. `5b7dfa3` IS LIVE ON `fabverify.vercel.app`.

**ALL THREE GATES ARE CLOSED. ALL 6 VERIFICATION POINTS PASSED.** Item 1 (durable auth link + auth seam) and M10 (password login) are **in production**, serving real traffic paths for the first time. `origin/main` moved `76b64f2` → `5b7dfa3` — **53 commits**, fast-forward, no merge commit.

⚠️ **`main` NOW AUTO-DEPLOYS AND IS NO LONGER A SAFE PLACE TO COMMIT.** Every future push to `main` is a production deploy. Build on a branch; merge deliberately, exactly as this one was.

⚠️ **THE DEPLOY DID NOT OPEN THE FRONT DOOR, AND THE BETA IS NOT UNBLOCKED.** Twilio is still on trial (verified caller IDs only) and **9 of 11 signup personas land on a blank screen on a phone**. See "BEFORE ANY BETA INVITE" below. Deploying and inviting are separate acts; only the first one is done.

*(Historical: this block read "THE NEXT SESSION IS THE FIRST DEPLOY — the next session's job is ONE thing: the deliberate merge." That was true until 2026-08-31, when the merge was taken.)*

### GATE SHEET
| Gate | Status |
|---|---|
| 1. Chunk 1.10 production session | ✅ **CLOSED 2026-08-30 — all 5 proofs, no asterisk.** Sign-out confirmed to leave **0** localStorage keys after `40b7486`. |
| 2. Repo-wide eslint decision | ✅ **DONE** — `4861b28`, 29 errors → warnings, reasoning in `eslint.config.mjs` |
| 3. A deliberate merge | ✅ **CLOSED 2026-08-31 — TAKEN AND VERIFIED.** `git push origin main` → Vercel build ● Ready in 59s → all 6 points passed. |

**What chunk 1.10 proved, so nobody re-runs it:** 1.9's miss-then-fallback branch (`via PHONE FALLBACK`, single-use state, spent correctly) · 1.8's first-ever identity write (`auth_identities` 1 row → 2) · `apiClient`'s seam token attach in production · `AuthGuard`'s production branch (stage 2 ran for the first time and did not bounce a valid session) · sign-out: no-token API **401**, direct dashboard URL **bounced**, and — the one that matters — **replaying the pre-sign-out access token returned 401, proving sign-out ends the session SERVER-SIDE. Issue B holds in production.**

### ✅ WHAT WAS RUN, 2026-08-31 — the record, so nobody re-runs it
**Pre-flight:** working tree clean · `auth-hardening-batch` 0/0 against its remote · no dev server on port 3000 · `SESSION_TOKEN_SECRET` confirmed present on Vercel, Production scope, via `npx vercel env ls production` (checked live, not from prose) · `origin/main` re-fetched and confirmed still at `76b64f2` immediately before the merge.
**Clean build LAST:** `rm -rf .next && npm run build` → **exit 0**, route manifest **162 static + 27 dynamic**.
**The merge:** `git checkout main` → `git pull origin main` (*"Already up to date"* — expected, `origin/main` was BEHIND local main by `9c09db8`) → `git merge auth-hardening-batch` → **fast-forward, single parent, no merge commit** → `git push origin main` → `76b64f2..5b7dfa3`.
**The build:** Vercel picked it up automatically, `● Ready` in **59s**, aliased to `fabverify.vercel.app`.

⚠️ **ONE THING THE OLD PLAN GOT WRONG, WORTH KEEPING.** It said the push would move `origin/main` by **52** commits. It moved **53**. Local `main` had been sitting 1 commit ahead of `origin/main` (`9c09db8`, the July auth batch — committed to main locally, never pushed). It was already an ancestor of `auth-hardening-batch`, so nothing diverged and the fast-forward was unaffected — but **the count in a handoff doc was wrong because nobody had run `git rev-list --count origin/main..HEAD` against the actual remote.** Same class as every other drift incident in this file: a number written from memory instead of derived.

### ✅ 6-POINT PRODUCTION VERIFICATION — ALL 6 PASSED (2026-08-31)
| # | Check | Result |
|---|---|---|
| 1 | Login page loads **with a password field** | ✅ 200, field present. `main` had never had one — the fastest proof the right code shipped. |
| 2 | Authenticated route unauthenticated → **401, not 500** | ✅ 401 on `orders` + `conversations`; 401 on a garbage Bearer token. **Zero 500s anywhere** — the module-load throw never fired, so the secret is correct and long enough. |
| 3 | **Real OTP login** on `9773933279` | ✅ SMS arrived, code worked, dashboard with **real data rendered** (landing alone was not accepted). |
| 4 | **Password login**, enterprise account | ✅ dashboard with data. |
| 5 | ⚠️ **Dev bypass DEAD** — `123456` must fail | ✅ **failed, stayed on the OTP step.** Corroborated server-side: an `x-dev-phone` header on a production API route returns **401**, i.e. the server ignores it entirely. |
| 6 | Unauth `GET /api/verification?phone=…` → 401 | ✅ 401. |
**Also checked, because a prerendered 200 proves nothing:** all 10 JS chunks referenced by `/login` return **200**, so the page can actually hydrate.

⚠️ **A TESTING TRAP FOUND WHILE VERIFYING POINT 2, worth keeping.** `GET /api/orders` with no token first returned **400**, not 401 — which looks like a broken auth gate. It is not: `app/api/orders/route.ts:17` returns 400 for a missing `phone` param **before** `getVerifiedUser` runs at line 21, so the request never reached the gate. **A 400 here means the test was malformed, not that auth is missing.** Always pass the route's required params when probing an auth gate, or you are testing the param validator.

### ⚠️ WHAT THE DEPLOY DID AND DID NOT CHANGE
- **It did NOT open the front door.** Twilio is still on TRIAL, so no real user on an arbitrary number can receive an OTP — they cannot sign up, log in, or reset. Unchanged by the merge; still the launch blocker (DLT registration, founder-owned, in progress).
- **That is exactly what made it the safest first deploy available:** there was no traffic to break. It was deployed into the quiet rather than waiting for the branch to grow.
- 🔴 **9 dashboards were blank on mobile and SHIPPED THAT WAY.** Pre-existing on `main`, not a regression from this branch, and it correctly did not block the merge. ✅ **Fixed on `beta-readiness` 2026-08-31 — not yet merged, so production still serves the blank version.** The fix deploys with the next deliberate merge.

### 🛑 BEFORE ANY BETA INVITE — three things, in this order
**Deploying and inviting are separate acts. Only the first is done.** A tester invited today would sail through login and signup on their phone (those pages render fine) and hit a **blank screen at the moment they arrive** — the worst possible shape of bug, and unfalsifiable feedback: a tester cannot tell "broken layout" from "my account is broken" from "this product is broken."
1. ✅ **THE MOBILE FIX — DONE 2026-08-31, 13/13 measured checks.** All nine previously-blank dashboards render real content at 375px with a working 5-item bottom nav derived per persona. Option A as decided: one default mobile branch in `ThreePanelLayout`, **opt-OUT** (23 files pass `mobile={false}`), right-panel content at the bottom, **one header** — the compact bar was dropped because `TopBar` could be made to fit. New file `app/components/MobileBottomNav.tsx`. Two `TopBar` bugs found by measuring and fixed: `h-16` clipped its own wrapped title (+14px at 375px, +33px at 320px) and the notification dropdown ran off the **left** edge (26px at 375px — ⚠️ a width clamp did NOT fix it, the anchor was the problem). Full record in TASKS.md.
   ⚠️ **STILL OWED BEFORE THE INVITE: the real-phone pass.** Everything was verified in headless Chrome at an emulated 375px. **It has not been opened on an actual phone in portrait.** One talent type + one marketplace type.
2. **Twilio verified caller IDs.** The friend's number **and** a second founder-controlled test number. Trial delivers only to verified IDs; an unverified number gets no SMS and ⚠️ `providerFallback.ts:25-30` records that whether the trial rejection even matches the fallback heuristic is **UNKNOWN**, so the likely experience is a silent dead end on "code sent". Verify, then **prove one real SMS lands before scheduling anything** — carriers can accept and silently drop.
3. **Dry-run a fresh signup on the second number, founder first.** ⚠️ The [I27] set-password gate **has never been run end-to-end on a genuinely new account** (TASKS.md:556) — it is an inference from the gate's design, not an observation. The friend must not be its first execution.

### AFTER THE MERGE — ORDER REVISED 2026-08-31, AND THE REASON IS THE BETA
**The old order read:** three easy error-handling routes (`manufacturers`, `manufacturers/[id]`, `waitlist`) → the `db.ts` swallow sites → the mobile fix → Launch-Ready items 3-8. ⚠️ **That order was written before a beta tester existed.** It puts three low-risk cleanups ahead of the one defect that makes a phone-based beta impossible.
**The order now:**
1. 🔴 **THE MOBILE FIX (Option A)** — the beta blocker. Decision first, then code.
2. **The two PII routes, together** — `dev-auth/lookup` and the `sample-briefs` public branch (below). Both hand out real people's contact details to anonymous callers, and a beta puts a real person's data behind them for the first time.
3. Twilio verification + the founder's own fresh-signup dry run → **then** the beta invite.
4. The three error-handling routes → the `db.ts` swallow sites → Launch-Ready items 3-8.

---

## 🛑 WHAT IS ACTUALLY NEXT — AND IT IS NOT THE NEXT MILESTONE ITEM

**✅ DECIDED 2026-08-28: Supabase Send SMS Hook → our own Next.js route → an Indian provider (MSG91 vs 2Factor.in still the founder's call). DLT registration STARTED — that is the long pole, and no code begins until it clears.** Full plan: TASKS.md Phase A "REAL SMS"; summary: PROJECT_MEMORY Known Issues.
Twilio is on a TRIAL account and sends only to verified caller IDs, so **a real
user on an arbitrary number cannot receive an OTP at all** — they cannot sign
up, cannot log in, cannot reset. Every control M10 built was proven on the
founder's own number and **is unreachable by a real user today.** It is a
billing-and-config decision, it is cheap, and ⚠️ **it is not in the Launch-Ready
milestone list** — it sits in Phase A, which is exactly why it keeps getting
missed.

## ✅ STEP 0 DONE (2026-08-29) — `/api/verification` auth conversion

**The first build after M10, and it was a security fix, not a feature.** `/api/verification` had NO authentication on either
handler: anyone could grant **Bronze** to any phone number ([M7]: Bronze is the minimum to transact), write applications with
an arbitrary tier and arbitrary documents JSON, and read any account's verification state. Self-granting Silver/Gold was NOT
reachable — the auto-approve branch is hardcoded to bronze — so it was a tier-grant and disclosure hole, not full escalation.

Both handlers now go through `getVerifiedUser` + a **named, single-expression `mayActOnAccount` gate deliberately shaped so
item 5's admin panel extends it with one `||`** rather than unpicking inlined comparisons. Tier allowlist added, placed after
the auth gate. Error handling combined into the same edit per the TASKS.md instruction. Built in two parts (call sites →
`authFetch` first, additive; route second), each leaving the app working.

Verified on localhost: 401 unauthenticated · 403 wrong owner · 200 owner · 400 bad tier · **rejections wrote nothing** ·
**the founder's enterprise account untouched throughout** · silver still does not auto-approve ([M8] intact) · 503 on DB
outage · build + `tsc` + eslint clean. Full record and three carried-forward flags: TASKS.md, the STEP 0 entry.

⚠️ **Carried forward, do not lose:** GET still returns a false `200 "unverified"` if the DB dies *after* the auth gate — the
`db.ts` swallow sites are item 8's other half, and the `try/catch` added here only becomes load-bearing once they land.

⚠️ **Also corrected in the same commit: the item-8 register was SEVEN ROUTES out of date** — it listed 9 routes needing
`dbErrorResponse`; a per-handler audit of all 23 found **4**. Same drift class as the 2.8a incident.

**Then the three gates before `main`:** chunk 1.10's owed production session ·
the repo-wide eslint decision (29 errors from a plugin bump) · a deliberate
merge taken knowing it deploys.

**Then Launch-Ready items 3–8:** RLS cleanup · photos → Storage · admin
verification panel · order completion + delivery address · escrow (simulated) ·
error-handling polish. Items 1 and 2 are ✅.

> *(Historical: this block read "SPRINT FOCUS — The API route auth-hardening
> batch … the batch is not finished and nothing is committed." That was true in
> late July. Groups 1/2a/2b/2c were finished and committed long before M10
> began, and the line survived the entire milestone unnoticed — the same drift
> the 2.8a incident below is about.)*

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
- 5 routes still unconverted: `dev-auth/lookup`, `waitlist`, `test-db`, and `manufacturers` + `manufacturers/[id]` (the last two stay **public by decision** — browse without auth, act with it). *(`verification` was on this list until 2026-08-29, when it was converted — it was an unauthenticated tier-grant path.)*

## DEV ENVIRONMENT NOTES

- 🛑 **A PRODUCTION BUILD SERVED FROM LOCALHOST CANNOT TEST ANY AUTHENTICATED FLOW.** `apiClient.ts` decides "am I in dev" by HOSTNAME; `auth.ts` decides by `NODE_ENV`. Under `next start` on `localhost` they disagree: the client sends `x-dev-phone` with no Bearer token, the server requires a Bearer token and ignores the header, and **every authenticated call 401s silently**. It cost a full verification round on 2026-08-30 — the mandatory [I27] password gate appeared not to fire, which looked like a serious bug and was actually the test rig. Use `next dev` on localhost, or a production build on the LAN IP with a real session. Full entry in TASKS.md.
- ⚠️ **A prerendered HTML 200 proves NOTHING about whether the app works.** A stale `next start` serves the document fine while 404ing every JS chunk — the page loads and cannot hydrate. **Always check the assets:** fetch the chunk URLs the HTML references and confirm they are 200, not just the page.
- ⚠️ **`pkill` does not kill these processes on Windows.** A silent `EADDRINUSE` leaves the OLD server answering, which looks exactly like a broken build. Kill by port: `Get-NetTCPConnection -LocalPort 3000 -State Listen` then `Stop-Process -Id <pid> -Force`.

- **Blanket 404s on every API route** = `.next` left in a production-build state after running `next build` then `next dev`. Fix: stop the server, `rm -rf .next`, restart. Happened twice.
- Testing against a broken database: set `NEXT_PUBLIC_SUPABASE_URL` to a **valid URL with an unresolvable hostname** (`https://<ref>-BROKEN.supabase.co`). A malformed URL makes `createClient` throw at module load and proves nothing. **Restore it afterwards** — the real value is `https://ehoifdlresiazmwxsdqy.supabase.co`.
- Switching accounts needs a manual site-data clear; there is still no desktop sign-out.

## NOTES FOR CLAUDE CODE
- Before building anything, read `PROJECT_MEMORY.md` for status and `DECISIONS.md` for locked choices.
- The established route pattern is: `getVerifiedUser` + ownership check + `dbErrorResponse` + client callers on `authFetch`. Fields identifying the CALLER are derived from the session, never read from the body.
- FabChat's full vision is locked as **DECISIONS P15** with a locked 4-stage build order. External email integration is stage 4 and must not start until auth is hardened.
