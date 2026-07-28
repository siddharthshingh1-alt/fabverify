# CURRENT_SPRINT.md
### What We Are Working On Right Now
> Claude Code reads this at session start to know the current focus. Update at the start and end of each working session. Keep it short — this is "now," not the whole roadmap.

---

## SPRINT FOCUS
**The API route auth-hardening batch.** Every API route used to trust a phone number sent in the request body or query string, so any caller could act as any account. Groups 1, 2a, 2b and 2c are built; the batch is not finished and nothing is committed.

## ⚠️ READ THIS FIRST WHEN RESUMING

**Stage 4 is done except the commit.** The temp debug routes are deleted and the docs match reality. Everything is still in the working tree — do not `git checkout`, `git stash` or `git reset` anything without reading `git status` first.

**🚫 DO NOT DEPLOY.** One blocker cleared, one still open:
1. ✅ Temp debug routes removed — `app/api/whoami/` and `app/temp-whoami-test/` deleted, confirmed absent from the build's route manifest.
2. 🚫 The chat-logout session bug (**issue B**) is NOT fixed. This alone blocks deploy.

**`main` auto-deploys to Vercel on push.** Committing is safe; **pushing to `main` is a deploy** and would ship issue B. Land this on a non-`main` branch until issue B is fixed.

## DONE THIS BATCH

**Issue A — onboarding no longer advances on save failure.** All 8 onboarding pages block navigation and show a real error. Fixes phantom accounts. ✅ Verified end-to-end against a dead database: the UI blocked and the `users` table was untouched.

**Issue E — DB-outage vs auth-failure.** Both halves: the auth path and the data-write path answer **503** when the database is unreachable, **401** only for genuine auth failure, and no raw exception text can reach a user (a literal `TypeError: fetch failed` once rendered on the onboarding screen). ✅ Verified.

**Group 1 (4 routes)** — `dev-auth/save-profile`, `dev-auth/save-user-type`, `manufacturer-profile`, `profile-data`. ✅ Verified: 200 / 401 / 403 / 503 all distinct.

**Group 2a — orders (4 handlers).** `orders` GET/POST, `orders/[id]` GET/PATCH. `PATCH /api/orders/[id]` previously had **no authentication at all** — anyone with an order UUID could cancel it. `buyer_id` is now forced from the session; milestone updates are scoped to their parent order. ✅ **Fully verified**: 403 non-party · 401 anonymous (target order unchanged) · fraud POST attributed to the authenticated caller · normal UI ordering unaffected.

**Group 2b — messages & conversations (4 handlers).** ✅ **Verified by curl (2026-07-28).** `conversations` 200/403/401; `messages` POST 401 anonymous and impersonation forced to the authenticated sender; `messages/read` 401 anonymous and a cross-account attempt left the victim's unread messages untouched.

**Group 2c — enquiries & sample-briefs (5 handlers).** ✅ **Full matrix run (2026-07-28)** — 401/403/attribution on every handler, plus the asymmetric PATCH (owner any status · non-owner only `responses_received`). Each reject re-run in isolation with a DB read before and after, proving a rejected request writes nothing. DB-outage 503 confirmed on four routes.

**Stage 4 cleanup.** ✅ `app/api/whoami/` and `app/temp-whoami-test/` deleted; no code references remain; docs updated.

## REMAINING TO FINISH THE BATCH

1. **Commit** the batch (Stage 4 is otherwise complete). Not yet done — awaiting review of `git status`.
2. **The 2b browser end-to-end — STILL NOT RUN.** Enquiry → conversation appears for BOTH sides → both can message. Confirmed in code and by curl, never watched on screen. Repeated log/DB diffs showed no `POST /api/enquiries` and no new rows. Test accounts ready: buyer `9999999991` (Anita sharma) → manufacturer `9998887771` (Test Garments Co), OTP `123456`, zero message history between them. **To find the manufacturer in discovery you must tick the 🥉 bronze tier filter** — see the discovery bug in TASKS.md. The Send Enquiry button is on the manufacturer DETAIL page, not the discovery card.
3. **`dev-auth/lookup` lockdown** — deferred on purpose. It returns a full `users` row for ANY phone with no auth (enumeration + PII). It sits in the login/signup path, so a mistake locks people out. Its own careful task. All three callers already request only their own phone, so the fix should be behaviour-neutral — verify that before changing anything.
4. **Issue B — the chat-logout session bug.** The remaining deploy blocker.

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
