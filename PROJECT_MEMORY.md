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

Schema file: `supabase/schema.sql`. Note: `CREATE POLICY` has no `IF NOT EXISTS` — re-running errors on policies. After DDL, may need `NOTIFY pgrst, 'reload schema';`.

---

## THE ABSTRACTION LAYER

| File | Status | Notes |
|---|---|---|
| `app/lib/supabase.ts` | ✅ | client; trailing-slash-stripped URL; persistSession |
| `app/lib/db.ts` | ✅ | THE single DB layer. All DB access goes here. Migration = change only this file. |

---

## AUTH

| Feature | Status | Notes |
|---|---|---|
| Signup (real Supabase OTP) | ✅ | prod real OTP; localhost `123456` bypass |
| Login (real Supabase OTP) | ✅ | same; auto-redirects if already logged in |
| Dev bypass gated to localhost | ✅ | `window.location.hostname` check, not NODE_ENV |
| Prod WhatsApp/waitlist fallback | ✅ | shows only on provider-specific errors |
| Phone format E.164 cleanup | ✅ | +91 + last 10 digits, validate 6–9 start |
| Profile lookup by phone routes correctly | ✅ | dashboard / onboarding-type / onboarding-profile |
| Server-side identity verification (`app/lib/auth.ts`) | ✅ | `getVerifiedCallerPhone()` (phone level, works before a users row exists) + `getVerifiedUser()` (existing account). Prod = real Supabase session token; dev = `x-dev-phone` header, gated on `NODE_ENV`, never on header presence. |
| DB-outage vs auth-failure distinction (Issue E) | ✅ | **Both halves done.** *Auth path:* helpers return a discriminated `{ok:false, reason:'unauthenticated'\|'unavailable'}`, never `null`; `authErrorResponse()` → **503** unreachable, **401** not logged in. Backed by `db.ts getUserByPhoneOrThrow()`, which throws instead of swallowing like `getUserByPhone()`. *Write path:* `apiError.ts dbErrorResponse()` does the same for any `db.ts` call that throws inside a route. The write path was missed in the first pass — `save-profile` authenticates without touching the DB, so its outage surfaced in `upsertUser` and returned 500 with the raw exception text. Verified end-to-end against an unresolvable Supabase host. |
| Raw error text never reaches users | ✅ | `readSaveError()` refuses to surface any 5xx body — a database outage once rendered a literal `"TypeError: fetch failed"` on the onboarding screen. 4xx bodies are still shown; those are our own validation messages. |
| Client-side error mapping (`app/lib/apiClient.ts`) | ✅ | `authFetch()` attaches the session token (prod) / dev-phone header. `readSaveError()` maps 503 → "retry will help", 401/403 → "log in again", so users aren't sent to re-authenticate over a transient outage. |
| Onboarding stops on save failure (Issue A) | ✅ | All 8 onboarding pages. Previously every page `console.error`d a failed save and routed onward, creating **phantom accounts** — identity in localStorage, no row in the database. Now the DB write happens first, failure blocks navigation, and the user sees a real error. |
| Password login option | 🔴 | decided (M10) but NOT built |

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
⚠️ **STILL NOT verified: the browser end-to-end** (enquiry → conversation appears for BOTH sides → both can message). Confirmed in code and by curl, never watched on screen.

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
⚠️ All runtime checks ran under `next dev`, where `getVerifiedUser` accepts the `x-dev-phone` header. This proves the authorisation logic, **not** the production Supabase-session branch (gated by `isProduction`).

**STILL UNCONVERTED — 6 routes:**
- `dev-auth/lookup` — **deferred deliberately, NEXT TASK** (sits in the login path; returns a full `users` row for ANY phone with no auth — enumeration + PII. See TASKS.md).
- `manufacturers`, `manufacturers/[id]` — **stay PUBLIC by decision** (browsing pre-login is core to the marketplace; require auth to ACT, never to look). They still need `try/catch` for CORE T6.
- `verification`, `waitlist`, `test-db` — not yet converted. `verification` takes `?phone` and returns personal verification status, so it is the highest-value one remaining.

**Error handling:** every converted handler now uses `dbErrorResponse()` (503 unreachable / 500 real fault, never raw exception text). The remaining CORE T6 gap is confined to the 6 unconverted routes above.

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
- ⚠️ **6 of 19 API routes still trust the phone in the request body/query** (down from 14 — Groups 1, 2a, 2b, 2c are converted and runtime-verified). Of the 6, two stay public by decision (`manufacturers`, `manufacturers/[id]`); the live exposures are `dev-auth/lookup` (enumeration + PII, next task) and `verification` (returns personal verification status for any `?phone`).
- ⚠️ **Unguarded DB calls across several routes** — `conversations`, `dev-auth/lookup`, `manufacturers`, `manufacturers/[id]` have no `try/catch` at all; additionally `orders` GET, `messages` GET, `sample-briefs` GET are unguarded even though those files' POST handlers have one, and `messages/read` calls the DB before its try block. Database failures there are unhandled rejections rather than handled statuses. Direct **CORE T6** violation, pre-existing. Audit per-handler, not per-file. Scheduled into Group 2.
- 🚫 **STILL DO NOT DEPLOY.** One of the two blockers is now cleared, one is not:
  1. ✅ **Temp debug routes removed (Stage 4, 2026-07-28)** — `app/api/whoami/` and `app/temp-whoami-test/` are deleted and confirmed absent from the build's route manifest.
  2. 🚫 **The chat-logout session bug (issue B) is NOT fixed** — this alone still blocks deploy. Related known gap: the only logout on the platform is in FabChat (`app/chat/components/ChatShell.tsx`), which does a blanket `localStorage.clear()`; there is still no desktop sign-out.
  Also outstanding before deploy: `dev-auth/lookup` is still unconverted (unauthenticated user-enumeration + PII on any phone).
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
