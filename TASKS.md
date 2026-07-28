# TASKS.md
### The Task List
> Granular, actionable tasks. Grouped by phase. Check off as done and move status in `PROJECT_MEMORY.md`. This is the working to-do; `ROADMAP.md` is the strategic order.

Status: `[ ]` todo · `[~]` in progress · `[x]` done

---

## PHASE A — Make what exists trustworthy
- [ ] Real SMS: upgrade Twilio to paid OR build 2Factor.in custom API route (India, cheaper). Decide + implement.
- [ ] Supabase Storage: replace base64 photo storage in `messages.media_url` and everywhere photos are stored. Migrate the pattern in `db.ts` + upload flow.
- [ ] Admin verification approval panel: list pending Silver/Gold applications; approve/reject; on approve, set tier + `*_verified_at` + sync `manufacturer_profiles.verification_tier`.
- [ ] Order completion flow: mark delivered → final milestone → (simulated) final release → order status closed.
- [ ] Delivery address: add column(s) to `orders`; persist from bulk-order form; show on order detail.
- [ ] Password login option: add password set/reset; login = OTP OR password; enterprise default password.
- [ ] Escrow (simulated): build escrow UX + release-on-milestone logic with simulated money; abstract so real partner API drops in later.
- [x] **Onboarding saves no longer advance on failure (Issue A).** All 8 onboarding pages (`profile`, `type`, `artisan`, `brand-builder`, `enterprise`, `manufacturer`, `supplier`, `talent`) now do the database write FIRST, block navigation when it fails, and show the user a real error instead of `console.error`-ing and routing onward. Fixes phantom accounts — identity in localStorage with no row in the database. `type` and `enterprise` also had their localStorage mirror writes moved to AFTER the successful save (writing the mirror first was the actual phantom-account mechanism). `onboarding/position` has no API call, so there is nothing to gate.
- [x] **DB-error vs auth-error, 503 not 401 (Issue E).** `app/lib/auth.ts` returns a discriminated failure (`unauthenticated` → 401, `unavailable` → 503) instead of `null`, backed by `db.ts getUserByPhoneOrThrow()`. `apiClient.ts readSaveError()` maps those to messages that tell the user whether retrying will help. A Supabase outage no longer looks like an auth failure and no longer sends users to re-authenticate.
- [x] **Group 1 route auth — 4 of 19 routes** (`dev-auth/save-profile`, `dev-auth/save-user-type`, `manufacturer-profile`, `profile-data`) now verify the caller and check ownership (403 on mismatch) instead of trusting the phone in the request body.
- [x] **DB-outage handling on the WRITE path (Issue E, second half).** `apiError.ts dbErrorResponse()` returns 503 for an unreachable database and 500 for a genuine query error, never leaking the raw exception. Applied to the 4 Group 1 routes. `readSaveError()` additionally refuses to surface any 5xx body — an outage previously rendered a literal `"TypeError: fetch failed"` on the onboarding screen. The first Issue E pass covered only the auth check, which is why `save-profile` (authenticates without touching the DB) still answered 500.
- [ ] **CORE T6 GAP — unguarded DB calls. Audit PER HANDLER, not per file.** Four routes have no `try/catch` anywhere: `conversations`, `dev-auth/lookup`, `manufacturers`, `manufacturers/[id]`. Four more are partly unguarded despite having a catch somewhere in the file: `orders` GET, `messages` GET and `sample-briefs` GET have none (only their POSTs do), and `messages/read` makes both `getUserByPhone` calls *before* its try block. A database failure in any of these is an unhandled rejection, not a handled status. CORE T6 requires every API route to be defensive (input validation, try/catch, correct status codes). Pre-existing — not introduced by the auth work; found while counting `dbErrorResponse` call sites, and the per-file count initially undercounted it. **Fix during Group 2**, in the same edit as caller verification: wrap every handler, add `dbErrorResponse(error)`. Do not let the auth conversion land without this.
- [ ] **Adopt `dbErrorResponse()` in the 9 remaining routes that DO have a `try/catch`** but still use the old `catch` → 500 + `getErrorMessage` pattern: `enquiries`, `messages`, `messages/read`, `orders`, `orders/[id]`, `sample-briefs`, `sample-briefs/[id]`, `verification`, `waitlist`. All nine are on the Group 2/3 list — convert error handling and auth in the same edit, not as a second pass.
- [ ] **MARKETPLACE BUG — newly-onboarded manufacturers are invisible in discovery.** Discovery defaults to Silver+Gold tiers only (`DiscoveryPage.tsx:47` `DEFAULT_TIERS = ["gold","silver"]`, applied at `:579` `matchesTier`), but all manufacturers are Bronze by default and Silver/Gold need an admin approval panel that doesn't exist — so newly-onboarded manufacturers are invisible in default discovery. **Fix: default the tier filter to include Bronze (show all tiers by default), so real suppliers are discoverable.** Found 2026-07-27 while setting up the Group 2b browser test: both real manufacturer profiles (`Test Garments Co` / `hi`) are `is_visible = true` and ARE returned by `GET /api/manufacturers`, yet the page rendered an empty list — the filter is purely client-side. Every other default is permissive (category `All`, `minRating` 0, cities empty, MOQ blank); tier is the sole exclusion. Ties together DECISIONS M8 (Bronze auto-approves on signup) and the known gap that Silver/Gold applications sit pending forever with no admin UI — the combination means 100% of new suppliers are undiscoverable. Not part of the auth batch; recorded, not fixed. NOTE: the two tier controls are ANDed — the checkbox group (`selectedTiers`) and the dropdown (`selectedTierDropdown`) — so setting the dropdown to "Bronze Verified" alone does NOT reveal bronze while the checkboxes remain gold+silver.
- [ ] **DB LAYER — swallowed DB outages on read paths (LOW PRIORITY, pre-existing).** `db.ts` has ~14 `if (error) return []` / `return null` sites that swallow DB outages into empty results — apply the Issue E pattern (throw-or-null) so outages surface as 503 on read paths too. Found 2026-07-27 while verifying Group 2c: with an unreachable database, `GET /api/sample-briefs` (public, unauthenticated) returned **200 `{"briefs":[]}`** instead of 503, because `getSampleBriefs` (`db.ts:641`) never throws — so the route's `dbErrorResponse` is unreachable on that path. `getSampleBriefsByBuyer` (`db.ts:659`) has the same swallow, currently masked because `getVerifiedUser` fails first. Effect is a misleading empty state ("no briefs available") during an outage — **no leak, nothing breaks**, which is why it is logged rather than fixed mid-batch. Same class of bug as Issue E's `getUserByPhone` → `getUserByPhoneOrThrow` split; that fix was applied only to the auth path. Fixing all ~14 sites is its own task.
- [ ] **DB HARDENING — order-number collision race.** `createOrder` builds the order number as `"ORD-" + Date.now().toString().slice(-6)`, so two orders created in the same millisecond — or whose timestamps share the last six digits — produce the same `order_number`. No uniqueness constraint enforces it. Noted 2026-07-27 and **deliberately deferred**: too rare at current volume to justify touching the order path mid-auth-conversion. Proper fix is DB-level (a Postgres sequence or `UNIQUE` + retry), not application-level, and must stay standard PostgreSQL per CORE T2. Revisit before any real order volume.
- [ ] **Order status-transition rules (state machine).** Group 2a implements a PARTY check on `PATCH /api/orders/[id]` — any buyer or manufacturer on the order may change any status or advance any milestone. That closes the unauthenticated hole but does not encode WHO may do WHAT: as it stands a buyer could mark a milestone complete, and a manufacturer could cancel. Deliberate decision 2026-07-27 — the transition rules are a domain question entangled with escrow release (DECISIONS M2, "money follows proof"), and guessing them inside an auth conversion would bury a business rule in a security fix. Define the allowed transitions per role, then enforce them.
- [ ] **SECURITY — unauthenticated user-enumeration via `/api/dev-auth/lookup`.** The route returns a full `users` row (name, city, `user_type`, `profile_data`) for ANY phone number, with no authentication at all. Anyone can probe whether an account exists and read its profile. **Deliberately excluded from Group 2** (2026-07-27 decision) because it sits in the login/signup path and a mistake there locks people out — it gets its own isolated task immediately after Group 2. Approach: split it so login keeps only the minimal check it needs pre-session, and lock the rest behind `getVerifiedCallerPhone` + caller-is-the-requested-phone. All three callers (`login/page.tsx:234`, `signup/page.tsx:244`, `chat/components/ChatWindow.tsx:105`) already only ask about their OWN phone, so the lockdown should be behaviour-neutral — verify that before changing anything. Leave login working as-is until then.
- [x] **Group 2a — ORDERS routes converted and verified (2026-07-27).** `orders` GET/POST and `orders/[id]` GET/PATCH now use `getVerifiedUser` + ownership + `dbErrorResponse`; 7 client call sites moved to `authFetch`. `PATCH /api/orders/[id]` previously had NO authentication at all — anyone with an order UUID could cancel it. `buyer_id` is now forced from the session. `updateMilestoneStatus` is scoped to its parent order. Verified: 403 non-party · 401 unauthenticated (target order unchanged) · fraud POST attributed to the authenticated caller · normal UI ordering unaffected.
- [x] **Group 2b/2c route auth — DONE and runtime-verified (2026-07-28).** `conversations`, `messages`, `messages/read`, `enquiries`, `sample-briefs`, `sample-briefs/[id]` all now derive the caller from the verified session, enforce ownership, and use `dbErrorResponse`. Verified by curl: 401 anonymous, 403 cross-account, impersonation attributed to the authenticated caller, asymmetric PATCH on `sample-briefs/[id]` (owner any status · non-owner only `responses_received`), and DB-outage 503. Every reject re-run in isolation with a DB read before and after, proving a rejected request writes nothing. ⚠️ The 2b **browser** end-to-end (enquiry → conversation both sides → both message) is still NOT run. Remaining unconverted: `dev-auth/lookup` (next task), `verification`, `waitlist`, `test-db`, plus `manufacturers` + `manufacturers/[id]` which stay public by decision.
- [x] **REMOVED `app/temp-whoami-test/` and `app/api/whoami/` (Stage 4, 2026-07-28).** Both were temporary debug scaffolding kept only for testing Groups 2/3; unlinked from any UI, but `/temp-whoami-test` compiled into the production route manifest and would have shipped. Both were leaf files (importing `lib/auth` / `lib/apiClient`, imported by nothing), so removal touched no other module — confirmed by grep: zero references remain anywhere in `app/`. `npm run build` re-run and neither appears in the route manifest.
- [ ] Desktop sign-out: there is currently NO logout on the main platform — the only one is in FabChat (`app/chat/components/ChatShell.tsx`, which does `localStorage.clear()`). Add a sign-out to the desktop shell that clears the identity mirrors and the Supabase session (`supabase.auth.signOut()`), then redirects to `/`. Until it exists, switching accounts for testing requires clearing site data by hand.

## PHASE B — Trust core
- [ ] QR generation on order creation (milestone-level first: 5 QRs/order).
- [ ] FabChat scan tab: real scan (PWA camera) + manual fallback; POST to backend.
- [ ] Geo-tagged photo proof: capture GPS + server timestamp on production photos; mark as verified update.
- [ ] SMV/capacity engine: store per-style SMV; capacity math; shift-proof photo capture; multi-style overtime tagging; 10–15% tolerance; three-level response.
- [ ] FabScore algorithm: define inputs (on-time, quality-pass, count-accuracy, verified scans); compute; write `fabscore_history`; surface on profiles.
- [ ] Government-DB verification: integrate provider APIs (Aadhaar/DigiLocker, PAN, GST, Udyam, CIN); consent flow; store status not raw IDs; cross-link entity.

## PHASE C — Public user types (each: screens → DB → verification hooks)
- [ ] Fabric Mill: catalogue (meters/GSM/width/composition/price/MOQ/ready-vs-custom), swatch request+dispatch+fee, lab dip approval, dye-lot + shade-band tracking, colour library, dead-stock marketplace, meter-based verification. Numbering FAB/LD/LOT/SB/COL.
- [ ] Trim Supplier: 7-category catalogue, artboard approval, MOQ reserve, care-label checker, compliance records. Numbering TRIM/ART/RSV/TRM.
- [ ] Artisan: fair-price-vs-middleman display, authenticity proof + cert, GI-tag verification, complexity pricing guide, FabGovt navigator, FabVoice, craft library. Numbering CRAFT/AUTH/GI/TECH.
- [ ] Job Worker: parent-linked job orders, receive-process-return + reconciliation, dual pricing, SMV capacity calendar, shift-proof + overtime tagging. Numbering JOB.
- [ ] FabTalent shared: portfolio auto-build, per-type skill-verified badges, gig-adaptive workspace, delegated approval-gated access. Numbering TAL.
- [ ] Designer: tech-pack upload + version control (TP-…-vN), revision-scope boundary, tech-pack→manufacturing flow, FabDAM.
- [ ] Master: sample-round tracking (Proto/Fit/SizeSet/PP), annotation loop, measurement sheet, golden-sample lock. Numbering SMP.
- [ ] Merchandiser: living T&A calendar (TNA-), approval-chasing, multi-order health, daily to-do.
- [ ] QC: 4-Point + AQL calculators, digital inspection report, debit note, geo-tagged proof.
- [ ] FabPricingEngine: auto-costing (quick/detailed/reverse), pulls FAB/TRIM/FabPrice + SMV; smart defaults; live recalc.
- [ ] Universal Item Identity: master ID + aliases, barcode + spec-fingerprint matching, enterprise reconciliation.

## PHASE D — Enterprise
- [ ] CEO money-first landing view (revenue/spend/margin/profit-per-order first, then dept switch).
- [ ] 11 department modules (Merchandising, Sourcing, Planning, MFP, QA, Production, Finance, Supply Chain, Compliance, Sustainability, Design-Coordination).
- [ ] Restructurable hierarchy + CFO builds own team + real role-based permissions + approval chains.
- [ ] Vendors area — ONE page, TWO-TAB toggle, never a separate URL (see DECISIONS P14):
  - [ ] Tab "My Vendors" (DEFAULT view) — who the enterprise works with; keeps the CEO glance-view clean (P4).
  - [ ] Tab "Find Vendors" — browse the full marketplace of verified partners without leaving the enterprise workspace: same look, same nav, reusing the existing marketplace discovery underneath (no second implementation).
  - [ ] "Add vendor" from Find Vendors moves that partner into My Vendors.
  - [ ] Vendor onboarding to real DB (invite → vendor becomes platform user).
- [ ] **No order-placement entry point inside the enterprise workspace** (neither MD/CEO nor merchandiser). Enterprise needs marketplace actions — discover, enquire, place order — reachable from within the enterprise interface, tied to the "Find Vendors" tab decision (DECISIONS P14). Today the only real ordering flow is on the marketplace/brand side (`/brand/orders/new`); the enterprise screens are still mockups, so an enterprise account has to leave its workspace to buy anything. Consistent with I3 (enterprise access is ADDITIVE — a large brand buys from the same vendors as everyone else) and P4 (keep the CEO glance-view clean). Noted 2026-07-27 as a product gap, not a security bug — the server-side ownership checks are identical whichever UI creates the order.
- [ ] Visual Stock Panel (photo-based, category, dye-lot separation + "do not mix" warning, Inventory-Manager role).

## PHASE C/D — FABCHAT AS THE COMMUNICATION HUB (see DECISIONS P15)
> Vision recorded 2026-07-27. **Not started.** Build order is LOCKED — do not jump ahead.

**Stage 1 — finish the auth security batch** (prerequisite, tracked in Phase A above)
- [ ] Complete Groups 2b/2c + remaining routes; nothing below starts until route auth is done.

**Stage 2 — basic conversations work**
- [ ] Wire enquiry → conversation reliably end to end, so an enquiry always produces a thread visible to BOTH parties.
- [ ] Order → conversation: placing/accepting an order should open or link a thread (today only enquiries seed one). Decide whether the opening message is from the buyer or a system message.
- [ ] Surface seed-message failures instead of swallowing them into `console.error`.

**Stage 3 — internal chat backbone, done well**
- [ ] **Persistent searchable history** — search across all conversations by text, party, date, order. Not WhatsApp-style infinite scroll.
- [ ] **Order / enquiry linking** — every conversation tied to the order or enquiry it concerns, with click-through both ways. Context must never be lost.
- [ ] **Images and media in-conversation** — samples, defects, fabric, tech packs. Depends on moving off base64 to Supabase Storage (Phase A) — do not scale media on base64.
- [ ] Universal across ALL party types (buyer, manufacturer, artisan, mill, freelancer, enterprise), not just buyer↔manufacturer.

**Stage 4 — EXTERNAL EMAIL INTEGRATION (its own dedicated project, NOT part of the above)**
- [ ] Connect Gmail, Outlook and other mail services; view and send external email from inside FabChat, so it becomes one inbox for the user's whole work life, tied to orders and history.
- [ ] ⚠️ **DO NOT START until auth is fully hardened AND internal chat works.** This means OAuth with Google/Microsoft and access to users' real mailboxes — the heaviest security and privacy surface in the platform. Requires its own security review, its own scoped-token design, and its own decision entries before any code.

## PHASE E — Moat
- [ ] FabComply / FabAudit / FabDPP (EU Digital Product Passport) / FabChemical.
- [ ] FabSustain / FabCarbon.
- [ ] FabGuide AI (Claude assistant), FabNegoBot.
- [ ] FabStandard published benchmarks, FabForecast.

## ONGOING / TECH DEBT
- [ ] Mobile responsiveness pass on main platform.
- [ ] Hardcoded-color sweep → true one-file theming.
- [ ] `CREATE POLICY IF NOT EXISTS` guards (or DROP POLICY IF EXISTS) for idempotent schema re-runs.
- [ ] Notifications centre; global search on real data.
- [ ] Keep PROJECT_MEMORY / CHANGELOG / DECISIONS updated every session.

---

*When you finish a task: check it off, update `PROJECT_MEMORY.md`, add to `CHANGELOG.md`, commit accurately.*
