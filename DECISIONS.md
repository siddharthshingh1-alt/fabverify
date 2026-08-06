# DECISIONS.md
### The Locked Decision Log
> Every entry here is a decision that has been made and locked. Claude Code must NOT silently reverse any of these. To change one, add a new dated entry that explicitly supersedes the old one, with reasoning. Format: `[ID] DECISION — rationale.`

---

## HOW TO USE THIS FILE
- Before implementing anything that touches architecture, money, verification, routing, or user-type behavior, check here.
- If a user request conflicts with a locked decision, quote the decision, explain the conflict, and ask before proceeding.
- New decisions get appended with the next ID and a date.

---

## ARCHITECTURE DECISIONS

**[A1] All database access goes through `app/lib/db.ts`.** Only `db.ts` and `app/lib/supabase.ts` import Supabase. — Enables one-file migration to AWS RDS; prevents scattered, inconsistent DB logic.

**[A2] Standard PostgreSQL only; no Supabase-specific features.** — Migration-readiness; no vendor lock-in.

**[A3] Migrate to AWS RDS later by changing only `db.ts`.** — Confirmed target; every choice serves it.

**[A4] Environment variables for all config; secrets server-only.** `NEXT_PUBLIC_*` for browser-safe values only; service-role key never in `NEXT_PUBLIC_*`, never committed. — Security + config hygiene.

**[A5] Separate URL per user type; no shared adaptive `/dashboard`.** Routes: `/brand/*`, `/manufacturer/*`, `/mill/*`, `/supplier/*`, `/artisan/*`, `/jobworker/*`, `/talent/{designer,master,merchandiser,qc}/*`, `/enterprise/*`. Smart redirect at `/dashboard`. — A shared adaptive dashboard caused content-bleeding between user types.

**[A6] Shared page components live in `app/components/pages/*`; per-user-type routes are thin wrappers** that check user type, redirect if wrong, and render the shared component with a `userType` prop. — DRY without content-bleeding.

**[A7] Build order: screens with fake data → Supabase connection → real integrations → advanced features.** — Logic without a datastore is meaningless; screens enable demos early.

**[A8] Same codebase for FabChat now (`/chat/*` routes); can split to a separate Next.js project at large scale by copying the `/chat` folder.** — Simplicity now, separability later.

**[A9] Dynamic API routes use `params: Promise<{id}>` and `await params`.** — Required by this Next.js version.

**[A10] Dev OTP bypass (`123456`) is gated to `localhost`/`127.0.0.1` ONLY** via `window.location.hostname`, never `NODE_ENV`. Production requires real OTP. — A production bypass is a critical security hole.

**[A11] Modals that overlay the full screen use `createPortal(..., document.body)` with a `mounted` guard.** — Inline rendering caused modals to render inside the left panel.

---

## TRUST, MONEY & VERIFICATION DECISIONS

**[M1] FabVerify never holds customer money.** Escrow is via a licensed RBI payment-aggregator partner in an escrow/nodal account at a scheduled bank. FabVerify controls release logic only. — Holding funds directly is illegal (PSSA). Do NOT open a FabVerify bank to hold escrow.

**[M2] Escrow releases on verified milestones** (QR scan + geo-tag + timestamp + photo, within tolerance), not on claims. — Money follows proof.

**[M3] Build escrow screens/logic now with simulated money; connect real money when the licensed partner integration clears** (same pattern as Twilio for OTP). — Partner onboarding takes time.

**[M4] Credit is honest by design.** One all-in APR, plain-language Key Fact Statement (local language + voice), all charges itemized, no hidden fees, no prepayment penalty (RBI 2026), humane recovery (8am–7pm). Only RBI-registered lending partners. — The mission forbids exploitative lending; RBI rules require transparency.

**[M5] FabScore honestly lowers cost of credit.** Better verified track record → genuinely lower risk → genuinely lower APR. — Reward integrity, not fake rates.

**[M6] Verification is government-database-backed, never self-declared.** India: Aadhaar (DigiLocker, consent-based, status stored not number) + PAN + GST + Udyam/MSME + CIN/MCA, cross-linked to one entity. Global: passport + selfie + country-specific registration (UK Companies House, EU VAT, US EIN, UAE Trade Licence). — Real trust vs a fakeable directory.

**[M7] Verification gates money.** Only verified users receive escrow funds; Bronze minimum to transact; tiers unlock higher limits/credit. — Anti-fraud.

**[M8] Tiers: Bronze (identity, instant/auto), Silver (business, 2–3 days), Gold (physical audit + video + compliance, EU-ready).** Bronze auto-approves; Silver/Gold go to pending admin review. — Graduated trust.

**[M9] `manufacturer_profiles.verification_tier` syncs with `users.verification_tier` on silver/gold approval; bronze stays the signup default.** — The two tier systems must not contradict on the discovery badge.

**[M10] Login = OTP OR password (user chooses).** Password primarily for enterprise/desktop users. (Password not yet built — see PROJECT_MEMORY.) — Serve both convenience and habit.

---

## VERIFICATION-ENGINE (QR / SMV) DECISIONS

**[V1] QR traceability is platform-wide**, not a single-user feature. Nodes: dye lot → fabric dispatch → manufacturer receipt → cutting/bundles → job-worker process → QC → finished goods → dispatch → buyer receipt. — The spine of trust.

**[V2] QR is at BUNDLE level (12–24 pieces), not per-piece**, by default. Piece-level QR is an optional premium for luxury/artisan items. Milestone-level QR (5 per order) is the simplest starting point. — Practical, affordable, industry-standard.

**[V3] Verification math is unit-adaptive:** pieces × SMV for manufacturers/job workers; meters (weaving m/day or dye batch × cycles) for fabric mills, with 3–5% natural shrinkage expected. — Fabric is not counted in pieces.

**[V4] Overtime is verifiable via geo-tagged, timestamped shift-boundary photos**, tagged per style with machine count when multiple styles run. Proven minutes feed capacity math. — Overtime is neither assumed nor magically detected; it is declared + proven by timestamps.

**[V5] A 10–15% tolerance buffer applies to all capacity/reconciliation checks.** Three-level response: silent → soft internal note → hard flag (notify buyer + FabVerify team, hold payment) only for genuinely impossible discrepancies. — Real production varies; the system must not false-alarm on normal 10–20 piece / 3–5% swings.

---

## PRODUCT / USER-TYPE DECISIONS

**[P1] One Brand experience for all brands (solo → large).** No split. Enterprise is a separate interface. — Today's small brand is tomorrow's large brand.

**[P2] Freelancer experience adapts to the specific gig hired for** — for all freelancer types, not just merchandiser. — Same person, different workspace per hire.

**[P3] FabTalent is a universal specialist marketplace.** Designer covers apparel/print/woven/knit/embroidery/colorist/surface; QC covers fabric-4point/in-line/final-AQL/pre-production/lab. Any platform user can hire any specialist for their need (e.g. a mill hires a print designer; an enterprise hires a fabric inspector). — Matches real hiring.

**[P4] Enterprise is completely separate;** runs the whole business (fabric sourcing → accounts). CEO's default view is money/profit first, then a button to switch between departments. CEO sees everything in one glance, no meetings. — The core enterprise vision.

**[P5] Enterprise hierarchy (CEO → dept heads → teams) is the DEFAULT but the Owner can restructure it.** CFO can add their own accounts/finance team; each dept head builds their own team. — Flexible org.

**[P6] Enterprise has 11 departments; Design is coordination-only (no design tools, since design uses Illustrator/CAD).** The 11: Merchandising, Sourcing/Buying, Planning, Merchandise Financial Planning, Quality Assurance, Production/Operations, Finance/Accounts, Supply Chain/Logistics, Compliance, Sustainability, Design Coordination. — Complete real-company structure; design tools are out of scope.

**[P7] Enterprise onboards existing vendors, who then USE FabVerify** (the public platform) for everything. — One record in one place; vendors become platform users.

**[P8] Universal Item Identity:** one physical item = one master FabVerify ID + unlimited aliases (FabVerify no., supplier code, each brand's code, barcode). Matching via manual link, barcode, or AI spec-fingerprint. Applies to fabric, trims, styles. — Solves enterprise SKU-mismatch and makes reserve/reorder reliable.

**[P9] Visual Stock Panel:** enterprise inventory found by looking at photos (by category), not codes. Covers fabrics (with dye-lot separation + "do not mix" warning), greige, trims (7 categories), finished goods. Supplier photos auto-flow into stock. Inventory-Manager role lives here; feeds CEO glance-view. — Inventory managers work by sight.

**[P10] Delegated freelancer access:** hired freelancer gets scoped, approval-gated access to the hirer's workspace. Default = propose-mode needing owner approval; owner can loosen low-risk tasks; money/commitments always need approval; hard limits (escrow, financials, permissions, deletion) never delegable. Works for any hirer. — Control with delegation.

**[P11] Auto-costing (FabPricingEngine):** user fills only known values; platform auto-calculates every component live (consumption geometry, fabric/trim from listings, CMT via SMV, overhead, IE reject gross-up, margin, final price). Quick mode (beginner) + detailed mode (merchandiser) + reverse mode. Available to every user type that needs costing. — Democratizes the hardest industry skill.

**[P12] Dashboards show what needs attention now, not cards that duplicate left-panel navigation.** — Removing duplicated quick-action cards was an explicit fix.

**[P13] Design uses different tools (Illustrator/CAD/AI) — FabVerify does NOT build design tools.** It handles everything around design: brief, delivery, version control, hand-off to manufacturing. — Out-of-scope boundary.

**[P14] The enterprise Vendors area is ONE page with a two-tab toggle — never a separate URL.** (2026-07-26)
- **Tab 1 "My Vendors"** — who the enterprise already works with. This is the DEFAULT view, so the CEO glance-view stays clean (P4).
- **Tab 2 "Find Vendors"** — browse the full marketplace of verified partners WITHOUT leaving the enterprise workspace: same look, same nav, reusing the existing marketplace discovery underneath rather than a second implementation.
- Adding a vendor from "Find Vendors" moves them into "My Vendors".
- There is never a separate URL for finding vendors; it is a tab, not a route.
— Keeps sourcing inside the enterprise workspace instead of bouncing the user out to the public marketplace and losing context, and avoids a duplicate discovery implementation. Extends P7 (enterprise onboards vendors who then use the platform).

**[P15] FabChat is the universal communication hub of the platform — not a side feature.** (2026-07-27) — VISION RECORDED, NOT BUILT.

The vision:
- **Every message between any parties** — buyer, manufacturer, artisan, mill, freelancer, enterprise — flows through FabChat, WhatsApp-style.
- **Persistent, searchable HISTORY** — unlike WhatsApp's endless scroll or scattered email threads.
- **ORDER / ENQUIRY LINKING** — every conversation is tied to the order or enquiry it is about, click through to it, context never lost.
- **IMAGES and media inside conversations** — samples, defects, fabric, tech packs.
- **FUTURE, its own major project: external EMAIL INTEGRATION** — connect Gmail, Outlook and other mail services to view and send external email from inside FabChat, making it one inbox for the user's entire work life (internal messages + external email), all tied to orders and history.

**BUILD ORDER (locked):**
1. Finish the auth security batch.
2. Make basic conversations work (wire enquiry → conversation).
3. Internal chat backbone done well — history, order-linking, images.
4. External email integration as its own dedicated, security-reviewed project, AFTER the foundation is solid.

**Email integration is NOT to be started until auth is fully hardened and internal chat works.** It involves OAuth with Google/Microsoft and access to users' real email — security- and privacy-heavy, and a category of risk unlike anything else in the platform. Starting it on a half-hardened auth layer would put real mailboxes behind checks we have not finished writing.

— Communication is where trust is actually built or lost in this industry, and today it is scattered across WhatsApp, email and phone calls with no history and no link to the order it concerns. Owning that surface — with history and order context — is a genuine moat. The staged build order exists because each stage is worthless if the one beneath it is not solid.

---

## BUSINESS DECISIONS

**[B1] Multiple revenue streams, never take-rate alone.** Take rate (3–5%), verification fees (Silver ₹999 / Gold ₹4,999), FabTalent commission (10–15%), credit spread, enterprise SaaS (the profit engine). — Take-rate-only killed Zilingo/ReshaMandi.

**[B2] Enterprise SaaS is the profit engine; the Fabindia relationship is the shortcut to the first client.** — Highest-value, most defensible revenue.

**[B3] Stay lean and grow profitably; never burn to chase vanity GMV; no inventory risk.** — The three killers of failed B2B marketplaces.

**[B4] Asset-light + AI-built.** FabVerify holds no inventory; Claude Code replaces large human-ops teams. — Structural cost advantage.

---

## TOOLING DECISIONS

**[X1] Do NOT install the "ponytail" tool (write-least-code philosophy).** Use its mindset ("simplest correct solution") but FabVerify's standard is "most reliable code" for safety-critical parts. — Conflicts with the quality bar.

**[X2] Accurate commit messages only; never overstate what changed.** — An overstated "auth connected" message was corrected; accuracy is the standard.

**[X3] Photos currently stored as base64 in `media_url` — TEMPORARY. Must move to Supabase Storage before scale.** — base64 will break at scale.

**[X4] Theme is centralized in `app/theme.ts`; a full one-file theme swap requires a sweep of hardcoded colors first.** — Known limitation to fix for true theming.

---

## THE DESIGN-SYSTEM CONSTANTS (locked)

Background `#07122a` · Cards `#0D1B33` · Border `#1C3050` · Gold accent `#f2ca50` · Text primary `#E2E8F0` · Text secondary `#7A8FA8` · Headings Montserrat · Body Inter · Danger `#e34948`.

---

## IDENTITY DECISIONS (2026-07-26)

**[I1] Account identity is a server-side database fact, never localStorage.** `users.user_type` is the single source of truth for what an account is. localStorage (`fabverify_user_type`, `fabverify_enterprise`, `fabverify_enterprise_position`, …) is a display MIRROR written from the database at login, never read as identity. Losing it must degrade to "logged out", never to "wrong identity". — Enterprise identity previously lived only in localStorage, so every logout silently downgraded an enterprise CEO to a Brand Builder.

**[I2] Enterprise is a real account type, resolved into three fields.** `users.user_type = 'enterprise'` is the DB truth; `app/lib/accountType.ts` derives from it: `accountType` (DB truth, the only value ever written back), `userType` (marketplace persona — enterprise resolves to `'buyer'`), and `isEnterprise` (capability flag). — Keeps all eighteen `Record<UserType, …>` config maps valid with their existing ten keys, and needs no changes at the 114 `useTypeGuard` call sites.

**[I3] Enterprise access is ADDITIVE, not exclusive.** An enterprise account has full public-marketplace access (discovery, sourcing, ordering from mills/manufacturers) via the derived `'buyer'` persona, PLUS the `/enterprise/*` workspace. Default landing is `/enterprise/dashboard`; the marketplace stays fully reachable both ways. — A large brand still buys from the same vendors as everyone else; enterprise adds capability rather than replacing it.

**[I4] Never write the derived `userType` back to the database.** For an enterprise account `userType` is deliberately `'buyer'`; persisting it to `users.user_type` would silently downgrade a real enterprise account. Hydration is one-way (DB → context); only `accountType` may be written. — Documented at the resolver in `app/lib/accountType.ts`.

**[I5] Enterprise capability is checked via `user_type`, never `position`.** The `Position` union (`solo_founder`, `md_ceo`, …) and `EnterprisePosition` overlap on `md_ceo` and `head_operations`, so `position` cannot distinguish a solo Brand Builder from an enterprise CEO. `users.position` answers "which role inside an enterprise", never "is this an enterprise". — `useEnterpriseAccess` previously authorized on `position === 'md_ceo' || position === 'head_operations'` OR the mere presence of a client-writable localStorage key; both let non-enterprise users through the enterprise gate.

**[I6] ✅ RESOLVED BY [I9] (2026-07-29)** — the durable link is an `auth_identities` table rather than the `users.auth_user_id` column proposed below. Original entry kept for context:
**[I6] NOTED, NOT YET DECIDED — phone reassignment.** Identity resolves through the verified phone number, so a telco-reassigned number could inherit an existing account. Pre-existing, not introduced by the auth work. A durable `users.auth_user_id` column is the likely fix. — Deferred; log a decision when addressed.

**[I7] ✅ DECIDED BY [I8] (2026-07-29)** — RLS is formally retired as a security mechanism; server-side authorisation is the boundary. Do not write new `auth.uid()` policies. Original entry kept for context:
**[I7] NOTED, NOT YET DECIDED — RLS is currently decorative.** `users.id` is a generated UUID and never equals `auth.uid()`, so the `users_own_data` policy can never match. Real access control for now is the server-side `getVerifiedUser()` ownership checks in the API routes, NOT RLS. Fix the policies as a separate follow-up once every account has a durable auth link. — Do not rely on RLS for protection until then.

---

## MIGRATION DECISIONS (2026-07-29)
> Full inventory, strategy and per-item build rules: `docs/ARCHITECTURE/MIGRATION.md`.

**[A12] Supabase → AWS RDS migrates by PARALLEL RUN / gradual cutover, in four phases.** (2026-07-29) — **Decouple** (own identity via `auth_identities`, password credentials we control, one auth seam) → **dual-verify** (new provider stood up; `getIdentityFromToken` tries the new issuer and falls back to Supabase, so both token types resolve to the same `users` row and nobody is logged out) → **data migration** (logical replication Supabase → RDS; auth already decoupled, so this is purely a data operation) → **retire Supabase** (stop issuing old tokens, keep the fallback verifier until the longest legacy session TTL expires, then delete the dependency).

**Target: seconds of downtime at the flip, executed in a low-traffic window. ACCEPTED: some users may need ONE re-verification (re-OTP or set password) at cutover — that is normal for an auth migration, not a failure.**

— A session is not data. A Supabase JWT is signed by Supabase's keys and no other issuer can validate it, so replication cannot move sessions and a single-moment provider switch would log out every user at once, on a platform holding their orders and money. The parallel run means a user's ability to authenticate is never withdrawn: live sessions stay valid, and anyone whose session expires simply logs in again. Worst case per user is one ordinary login. Rejected: big-bang cutover (mass lockout) and "migrate the auth database" (impossible — tokens are signed, not stored).

**[I8] RLS is FORMALLY RETIRED as a security mechanism. Server-side authorisation is the boundary.** (2026-07-29) — **Supersedes the open question in [I7].** The 10 policies in `supabase/schema.sql` reference `auth.uid()`, which `users.id` never equals, so they have never matched anything; and `auth.uid()` has no AWS RDS equivalent, so investing in them builds something the migration deletes. Real access control is the server-side `getVerifiedUser()` / `getVerifiedCallerPhone()` + ownership checks proven end-to-end across Groups 1, 2a, 2b and 2c — verified by curl and browser testing, including that a rejected request writes nothing. **If a compliance requirement later demands defence-in-depth, rewrite policies against `current_setting('app.user_id')` set per-transaction** — standard PostgreSQL, portable to RDS (CORE T2). Do NOT write new `auth.uid()` policies. — We are not dependent on RLS precisely because the security batch put authorisation in the application; that is what makes retiring it free.

**[I9] The durable auth link is an `auth_identities` TABLE, not a `users.auth_user_id` column.** (2026-07-29) — **Resolves [I6]** (phone reassignment) and unblocks [I8], remote logout, and the whole Account Security & Recovery group. Shape: `user_id → users.id`, `provider` (`'supabase' | 'cognito' | 'password' | …`), `provider_uid`, `created_at`, `UNIQUE (provider, provider_uid)`. — I6 proposed a single column, which does solve phone reassignment but holds only ONE identity and therefore cannot express "this user exists in both the old and new provider at once" — which is exactly what the A12 parallel run *is*. A column forces a hard flip; the table makes the overlap a normal, representable state, and gives social/email login later for free. **Identity lives in our tables; providers only authenticate.** Today the sole link between a session and an account is the phone number, which is why a telco reassignment can inherit an account and why there is no key to map identities across providers at cutover.

**[X5] Every external dependency gets a SEAM FILE before its first call site.** (2026-07-29) — auth (`authProvider.ts`), storage (`storage.ts`), payments (`payments.ts`), and whatever comes next. Corollaries, all learned from this audit: **store keys/IDs in the database, never vendor URLs** (a stored `https://<ref>.supabase.co/...` turns a one-file swap into a data migration); **no vendor SQL, triggers or cron carrying business logic**; and if a feature can only be built on a vendor-specific capability, that is a decision to log here with its migration cost stated — never a silent one. — `db.ts` proves the pattern works: 17 of 18 API routes go through it and the data layer is genuinely portable. Auth proves the cost of skipping it: five files coupled to Supabase because no seam existed when OTP was first wired in.

---

## PASSWORD-LOGIN DECISIONS (2026-08-06, chunk 2.0)
> These are M10's foundational decisions. Locked BEFORE the table was created, because one of them determines a column in it. Implementation choices deliberately NOT locked here — argon2id parameters and the JWT library are decided at chunks 2.2 and 2.5, where they can be verified against a real runtime instead of on paper.

**[I10] Password hashes live in their OWN `user_credentials` table — never a `users` column, and NEVER in Supabase Auth.** (2026-08-06) — Two independent reasons, either one sufficient.
*Security:* `/api/dev-auth/lookup` has no authentication at all, accepts any phone, and returns `getUserByPhone(phone)` — which is `.select("*")` on `users` (`db.ts:38-39`) — as the entire row. A hash on `users` would be handed to an anonymous caller for **any phone number on the platform**: free offline-cracking material for the whole user base. `users` has five unqualified select sites in `db.ts` (38, 55, 66, 86, 264) and `getVerifiedUser` passes the full row to 13 route call sites, several of which embed user objects in responses — so a column would have multiple escape routes, not one. A separate table cannot be reached by `select("*")` on `users`, making the leak impossible **by construction** rather than prevented by remembering a column projection at 5+ call sites forever.
*Migration:* a credential FabVerify owns works identically before, during and after the AWS RDS move and is the fallback if the token cutover goes wrong ([A12]). Storing it in Supabase Auth would re-couple us to the provider we are leaving and rules out `supabase.auth.signInWithPassword()`, which is the convenient thing that looks like it solves M10.
**Migration cost: none.** Standard PostgreSQL table, standard FK; ports as-is.

**[I11] Password authentication writes NO `auth_identities` row.** (2026-08-06) — **Resolves the open question parked in migration 002 and chunk 1.4.** The credential lives in our table, so there is no external provider and no external id; a `provider='password'` row would be self-referential noise (`provider_uid` = the very `user_id` it maps to). **Consequence for [I9]/chunk 1.9: the existing identity and phone branches are untouched by M10.** ⚠️ But the resolution ladder is NOT unchanged, and the M10 plan's original wording ("1.9's ladder is untouched") was too optimistic: at chunk 2.5 the ladder gains **one new branch above** the existing two, for tokens we issue ourselves, where `sub = users.id` needs no lookup at all. Recorded as a correction rather than discovered at 2.5, the auth-bypass chunk — the worst place to meet a contract mismatch.

**[I12] Session revocation is a `token_epoch` integer on the credential row, not a sessions table.** (2026-08-06) — Our own session tokens are **signed, not stored**, so they cannot be deleted once issued. Chunk 2.8 requires that a password reset ENDS existing sessions, or a reset does not evict an intruder — which is the entire point of having it. The issued token carries the epoch it was minted under; verification rejects any token below the current value; a reset is a `+1` that invalidates every outstanding session for that account at once. One integer, one read. — A `sessions` table is the more powerful answer and is what per-device remote logout will eventually want; this decision does not block adding one later, and deliberately buys the smaller thing now. **Migration cost: none** (a plain integer column).

---

*Append new decisions below this line with the next ID and a date.*
