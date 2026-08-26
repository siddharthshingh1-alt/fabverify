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

## PASSWORD SET/CHANGE DECISIONS (2026-08-08, chunks 2.2–2.4)

**[I13] argon2id via `hash-wasm`, OWASP baseline m=19456 KiB, t=2, p=1, 32-byte hash, 16-byte salt.** (2026-08-08) — **Library:** pure WebAssembly, no platform-specific binary, so it behaves identically on localhost, on Vercel and on whatever AWS target [A12] lands on. Rejected `@node-rs/argon2` and `node-argon2`: both are native bindings, **we have never deployed**, and a dependency that might not survive the platform move is the wrong shape for a project whose entire strategy is surviving one. Cost is speed (WASM is slower than native — measured **60 ms** per hash here), invisible at login volume. ⚠️ The trade-off it creates: `hash-wasm` does not generate the salt, so we do, from `randomBytes` — a static salt would pass every functional test and be catastrophic, which is why salting is proven explicitly (8 hashes → 8 distinct salts) rather than assumed.
**Parameters** are read back OUT of the emitted PHC string rather than trusted as passed in — "we passed the right options" and "the right options were applied" are different claims and only the second matters. Raising them later needs no flag day: `needsRehash()` upgrades a stored hash on the owner's next successful authentication.
**Migration cost: none.** The encoded hash is self-describing (variant, version, parameters, salt all inside the string), so it ports as an opaque TEXT column.

**[I14] Set/change is gated by a SERVER-SIDE existence check, never by caller input — and the two cases are deliberately asymmetric.** (2026-08-08)
- **Credential EXISTS (change) → the current password is REQUIRED.** This is the anti-hijack protection: a hijacked session holds the victim's *session*, not their *password*. ⚠️ There is deliberately **no "forgot my current password" escape hatch on this route** — the moment one exists, the requirement is decorative. Recovery is the OTP reset path (chunk 2.8), a separate route with its own proof.
- **Credential ABSENT (first-time set) → a valid session alone is sufficient.**
- **Which branch runs is decided by a database read keyed on the session's `users.id` and a module-constant `credential_type`.** No identity field and no "first time" flag is read from the request, and none is honoured if sent. The read **throws** on database failure, so an outage can never be misread as "no credential". Those three properties are the whole bypass argument, and each is independently tested.

⚠️ **ACCEPTED RISK, RECORDED RATHER THAN OVERLOOKED.** Allowing first-time set on the session alone means a hijacked session can mint a **durable** credential — escalating temporary access (bounded by the session, because the attacker cannot re-OTP) into access that outlives it and no longer depends on the phone. **Accepted 2026-08-08 after the alternatives were laid out.** Why the trade is defensible: it is *recoverable* — the real owner proves their phone by OTP, resets, and the `token_epoch` bump evicts every attacker session while overwriting the attacker's password. Why the stricter option was not taken: requiring a fresh OTP would gate password adoption behind a **Twilio trial that only delivers to verified caller IDs**, with a fallback that has never been exercised — for most real users that is not friction, it is a wall.
**If revisited,** the fix is additive and small: require proof of recent authentication (a freshness window on the provider's last-sign-in fact, which a token refresh does not move — ⚠️ **never** the access token's `iat`, which refresh rotation resets without any re-authentication).

**[I15] Password policy is length-over-complexity: min 12, max 128, no composition rules, never truncate.** (2026-08-08) — Per NIST SP 800-63B (OWASP follows it): forced uppercase/digit/symbol rules produce `Password1!` and irritate users for no measurable gain. **Min 12** sits between NIST's floor of 8 and its recommendation of 15. **Max 128 is a denial-of-service bound, not a security rule** — each hash costs 19 MiB of memory-hard work, so unbounded input is a cheap way to exhaust a serverless function; over-length is **rejected, never truncated**, because silent truncation weakens a credential invisibly. **NFKC normalisation before hashing**, on set and on verify, or the same password typed on a different keyboard/OS fails to verify and locks the owner out of their own account. Blocklist is a curated **head of the distribution plus structural checks** (repetition, keyboard walks, sequences, distinct-character floor, and context values — the user's own phone, name, email); ⚠️ deliberately **not** a breach corpus. HaveIBeenPwned's k-anonymity API is the known upgrade, declined for now because it adds an external network dependency on the password-set path (needing a seam per [X5]), latency, and a fail-open/fail-closed decision. **Migration cost: none** — pure application logic.

---

## PASSWORD VERIFICATION DECISIONS (2026-08-08, chunk 2.5a)

**[I16] Credential verification is SPLIT from session issuance — 2.5 is now 2.5a (verify) then 2.5b (token).** (2026-08-08) — The original plan bundled "check the password" and "issue a token" into one chunk. Splitting them means a bug in 2.5a is a wrong **answer that nothing acts on**, while a bug in 2.5b is an **auth bypass**; bundling them would have spent the same session's attention on both. 2.5a returns *"these credentials match, and they belong to this `users` row"* — no token, no session, no cookie. 2.5b turns that fact into a signed token and teaches `getIdentityFromToken` the new branch. **Migration cost: none** — it is a decomposition, not a design change.
⚠️ **`verifyPasswordCredential` does NOT return `AuthenticationResult`, and reusing that type would have been a real bug.** `AuthenticationResult.providerUid: null` already carries a specific meaning — *"this was the A10 dev bypass"* — and chunk 1.8 keys its `auth_identities` write off exactly that. A password result setting `providerUid: null` would be indistinguishable from a dev-bypass login. It returns a narrow `PasswordVerification` instead. The plan's instruction to reuse `AuthenticationResult` was checked against the real type and rejected with reason.

**[I17] Every password-verification failure is ONE indistinguishable result, and every path does identical work.** (2026-08-08) — Wrong password, no such account, and account-with-no-password-set must be indistinguishable in **value** and in **cost**, or the verifier hands out a free list of which phone numbers hold real accounts.
*Value:* the result type has exactly one failure reason (`invalid-credentials`). There is no `no-such-account` variant to accidentally return — **the type is the control**, so the guarantee survives callers written by people who never read the comment.
*Cost:* every path does **one `users` query, one `user_credentials` query, and one argon2id verify**. Two mechanisms make that true — a decoy hash verified against when no credential exists, and a deliberate second query against a guaranteed-miss UUID when no user exists.
⚠️ **The decoy is DERIVED at module load from the current parameters, never a hardcoded string** — a literal decoy silently diverges the day the cost factors are raised, reopening the leak with every test still green.
⚠️ **The wasted query is not waste.** Skipping it would make "no such account" one network round trip cheaper than every other outcome; against Supabase Singapore a round trip is *hundreds* of milliseconds, far larger than the ~45 ms argon2 cost. Equalising the hash while leaking the round trip would be timing-safety theatre.
⚠️ **Honest scope: this does not close enumeration platform-wide.** `/api/dev-auth/lookup` is still unauthenticated and returns a full `users` row for any phone, so account existence is already free to discover. This is still correct to build — lookup will be locked down and this must not need retrofitting — but do not record enumeration as solved.

**[I18] Password verification is NOT reachable over HTTP until login exists, and that is what makes deferring lockout safe.** (2026-08-08) — An endpoint answering *"are these credentials valid?"* without issuing a session is a credential-checking **oracle**: all of login's attack surface, none of its utility, and no legitimate client. So 2.5a ships as a seam function with **zero route importers** (asserted by the test suite, not just intended). Because nothing HTTP-reachable calls it, there is no brute-force surface and lockout can be deferred to its own focused chunk.
⚠️ **THE WINDOW OPENS AT 2.6 (login UI). Lockout (2.7) MUST land with or before 2.6 — TASKS.md sequences it after, and that ordering is a trap.** Shipping 2.6 alone leaves an unthrottled online guessing oracle against every account on the platform.

---

## OUR OWN SESSION TOKEN — DESIGN DECISIONS (2026-08-08, planning for chunk 2.5b)
> ⚠️ **DESIGN LOCKED ON PAPER; THE RUNTIME CHOICE IS PROVISIONAL.** Chunk 2.0 deferred these deliberately, on the principle that *"a library decision that cannot be tested is a paper decision"*. That principle still holds, so this splits in two: the **reasoning-based** decisions below are LOCKED (claims, algorithm, secret handling, TTL, the ladder branch, the bypass defences), while the **library choice is PROVISIONAL** until it runs — exactly the pattern chunk 2.0 used for hashing, where `hash-wasm` was recommended on paper and only proven at 2.2. Do not treat [I19]'s library line as settled before the smoke test.

**[I19] Our session token is a signed JWT (JWS compact), HS256, with a server-only secret that FAILS CLOSED.** (2026-08-08)
*Format:* signed, **never encrypted** — it carries no secret, so encryption would add a key-management burden for nothing.
*Algorithm:* **HS256.** The issuer and the verifier are the same server, so asymmetric signing buys nothing today. ⚠️ **Migration note with its cost stated (X5):** if verification ever moves to a separate service or the Edge runtime, asymmetric (EdDSA/ES256) would let us distribute a public key instead of copying a shared secret. Revisit at that point; the change is a key-type swap plus a re-issue window, not a redesign.
*Claims:* `iss` (`fabverify`), `aud` (`fabverify-api`), **`sub` = `users.id`**, `iat`, `exp`, `epoch` (the `token_epoch` it was minted under, [I12]), `amr: ["pwd"]` (the authentication method — recorded now so "re-authenticate for sensitive actions" can later demand a fresh factor without a token format change).
⚠️ **NO PII IN THE TOKEN — no phone, no name, no email.** It lives in `localStorage` and travels on every request. `sub = users.id` is deliberate and is also what makes this the *cheapest* branch of the resolution ladder: our own token needs no lookup to identify the account, unlike the provider branch (`auth_identities`) and the phone branch.
*Secret:* **`SESSION_TOKEN_SECRET`**, server-only, ≥32 random bytes, never `NEXT_PUBLIC_` (A4).
⚠️ **IT MUST THROW AT MODULE LOAD IF MISSING OR TOO SHORT. DO NOT COPY `supabaseAdmin.ts`'s PLACEHOLDER-FALLBACK PATTERN** (`|| "placeholder-service-role-key"`). That pattern is tolerable for a client that will simply fail its requests; for a **signing key it is a catastrophic forgery hole** — a known, published default secret means anyone can mint a valid token for any `users.id`. Fail closed, loudly, at boot.
**Migration cost: none.** A JWT we sign with our own secret is issuer-independent and works identically on Supabase, RDS or anywhere else. That is the whole point of M10 as the migration safety net.

**[I20] Access-token TTL is 7 days. NO refresh token in 2.5b.** (2026-08-08) — A refresh-token subsystem (rotation, reuse detection, storage, revocation-on-reuse) is a second security-critical build, and 2.5b is the one chunk that must stay small. Deliberately deferred.
*Why 7 days is defensible without refresh:* revocation is **real** here — `token_epoch` ([I12]) is checked on every request and a password reset invalidates every outstanding session at once. The usual argument for short TTLs is "we cannot revoke", and that does not apply.
*Accepted cost:* at day 7 a password session ends abruptly and the user logs in again. That is the [A12]-accepted standard already on record — *worst case for any user is one ordinary login*.
⚠️ **Sliding renewal is the cheap upgrade, and it belongs to 2.6, not here** — re-issuing the token when it is past half-life avoids the whole refresh-token machinery, but it requires the client to store a token returned mid-session, which is client wiring. Note it, do not build it in 2.5b.

**[I21] The resolution ladder gains a THIRD branch, ABOVE the existing two — and the trust root's return type must widen to a discriminated union.** (2026-08-08) — **This is the structural finding that shapes the chunk, and it was verified against the real types rather than assumed.**
`getIdentityFromToken` currently returns `ProviderIdentity | null` where `ProviderIdentity = { providerUid: string; phone: string }` — **both required**. A password token has *neither*: no `providerUid` ([I11]: password writes no `auth_identities` row) and no phone ([I19]: no PII in the token). **The existing type cannot represent a password identity, so 2.5b cannot be built without widening it.**
*Shape:* `{ kind: "provider"; providerUid; phone } | { kind: "local"; userId; epoch }`.
*Ladder order:* **(1) our token** → `sub` IS `users.id`, no lookup needed · **(2) provider token** → `auth_identities` (chunk 1.9, unchanged) · **(3) phone fallback** (unchanged).
⚠️ **`AuthenticationResult` is NOT the type in question, despite the plan's wording.** That type is the BROWSER-side result of `verifyOtp`; chunks 1.8 and 1.9 consume `PhoneAuthResult` and `UserAuthResult` server-side. Conflating them sends the design at the wrong file.
⚠️ **A password result must NOT be expressed as `providerUid: null`.** In `AuthenticationResult` that value already means *"this was the A10 dev bypass"*, and chunk 1.8 keys its identity write off exactly that. It would *accidentally* produce the right behaviour (skipping the write, which [I11] wants) via a signal that means something else entirely — correct by coincidence is not correct. Same trap already caught and avoided at 2.5a.

**[I22] Both token types must verify, ours is tried FIRST, and neither is ever parsed before it is verified.** (2026-08-08)
*Order:* try our verifier first (a local HMAC check, microseconds, no network), fall back to Supabase (a network call) on any failure.
⚠️ **NEVER read an unverified claim to decide which verifier to use.** Peeking at `iss` in the unparsed payload to "route" the token is the classic anti-pattern — it lets an attacker steer verification with data they control. Just *attempt* our verifier; if it fails for any reason, attempt Supabase. A Supabase token failing our HMAC check is cheap and expected.
⚠️ **THE SUPABASE FALLBACK MUST SURVIVE INTACT.** Every currently-live session is a Supabase JWT; breaking that branch logs out every existing user at once, on a platform holding their orders. This is the single highest-consequence regression available in this chunk.
*Cross-acceptance is impossible by construction:* a Supabase token cannot pass our verifier (different secret, and `iss`/`aud` are checked), and our token cannot pass Supabase's (they never signed it).
⚠️ **A password token must never satisfy a check that requires provider-level proof.** The `amr` claim exists so future sensitive-action re-authentication can demand a fresh OTP rather than accepting a week-old password session.

---

---

## LOCKOUT — DECISIONS (2026-08-20, chunk 2.7)

**[I23] Password lockout is PER-ACCOUNT: 10 consecutive failures, a fixed 15-minute auto-expiring cooldown, cleared on success and on expiry.** (2026-08-20)
*Threshold 10*, not 5 — OWASP's range is 5–10 and NIST SP 800-63B tolerates far more, so the top of the range is defensible and forgives an honest run of typos. The real brake is not the number: every attempt already costs ~45 ms of argon2id plus two database round trips.
*Duration 15 minutes, FIXED and AUTO-EXPIRING* — no admin unlock, no support queue for a team that does not exist. ⚠️ **Escalating backoff was designed and rejected.** It was free to implement (duration as a function of the counter, no new column) but it requires the counter to SURVIVE expiry — and a surviving counter means that after one lockout the user gets exactly one attempt every 15 minutes for ever. Fixed duration plus a clean slate is the friendlier failure mode.
*The cost, stated plainly:* a sustained attacker gets 10 guesses per 15 minutes, ~960/day/account. Against argon2id and a 12-character floor that is not a threat.
*Reset* on a successful password login, and on cooldown expiry — lazily, on the next attempt, so there is no cron and no background job.
⚠️ **NO time-decay window on pre-lockout failures.** Ten failures spread over months still lock. Left deliberately open rather than silently added; revisit if real users hit it.
⚠️ **PER-ACCOUNT ONLY. Per-IP is NOT built,** and it is not a simple addition: shared egress IPs (an office, a mobile carrier NAT) mean one attacker behind the same address can lock out every real user, converting a brute-force defence into a denial-of-service tool. There is also no shared state store — no Redis, and Vercel lambdas share no memory.
⚠️ **RESIDUAL, ACCEPTED NOT SOLVED: per-account lockout does NOT stop password spraying** — one guess each against 10,000 accounts never trips any single counter. **2.6 must not merge without a decision on this.**

**[I24] The locked state is revealed ONLY to a caller who supplied the correct password — amending [I17]'s "one failure reason".** (2026-08-20)
[I17] made every failure one indistinguishable value, and its strength was structural: the type admitted no other reason, so a leak was impossible rather than merely avoided. This adds a SECOND reason, `account-locked`, and it is a deliberate amendment, not drift.
*Why it is safe:* the informative response is gated behind proof of ownership. Anyone who can trigger it already holds the correct password, so "this account exists and is locked" tells them nothing they did not already know. A prober — by definition someone without the password — can never reach that branch, and what they observe is byte-identical to 2.5a.
*Made structural again:* the locked result is constructed INSIDE the `matched` branch and nowhere else, so it is unreachable without a successful argon2id verify rather than merely unreached today. Fuzz-tested (12 wrong guesses against a locked account, zero leaks) and type-asserted (exactly two failure reasons).
⚠️ **THE COST, ACCEPTED WITH EYES OPEN:** an attacker who guesses correctly DURING a cooldown is told so, instead of receiving a generic failure that might have made them discard a working password. The trade is that a real user who mistyped ten times learns to wait rather than being told their correct password is wrong.
⚠️ **NEVER ADD A THIRD REASON.** Any reason reachable WITHOUT a correct password re-opens the oracle 2.5a exists to close.

**[I25] The lockout check runs AFTER the argon2id verify, never before, and every path spends exactly one counter write.** (2026-08-20) — **the chunk's central engineering decision, and the least obvious one.**
The natural implementation checks `locked_until` first and returns early. It is precisely wrong: skipping the ~45 ms hash makes a LOCKED account answer measurably FASTER than a wrong password, which is an oracle for account existence — and one the attacker **manufactures on demand** by hammering any number ten times and then timing it. A number with an account gets fast; a number without one never changes. That is a *better* enumeration channel than the one 2.5a was built to close.
*So:* the verify runs on locked accounts too and its result is discarded; the lock is read from the row already in hand, costing no extra query; and the counter write is issued unconditionally against the same sentinel id the credential read uses, with the WHERE clause — not a branch in application code — deciding whether it matches a row. No branch means no path that can diverge. **Measured: 3 round trips and a ~46 ms local floor on all five paths.**
⚠️ **Proven by a NEGATIVE CONTROL, not by assertion.** The early-return version was deliberately written and run: it drops the locked paths to **2 round trips and 1.1 ms** and fails D1/D2/D3. The suite catches the bug it was written for.
⚠️ **The counter write is AWAITED, never fire-and-forget.** Vercel may freeze the function after the response, so a background write would sometimes vanish — and a counter that silently drops writes is a lockout that never locks. `waitUntil` would fix it and is platform-specific, which CORE T2 rules out.

**[I26] The failure counter uses optimistic concurrency with bounded retry, and its convergence limit is recorded rather than hidden.** (2026-08-20)
PostgREST cannot express `failed_attempts = failed_attempts + 1` (already documented for `token_epoch`), so the increment is read-modify-write. **Unguarded, ten simultaneous guesses all read the same counter and all write the same value — the counter advances by ONE**: a lockout that fails open under exactly the load an attacker generates, while every sequential test still passes.
*Mechanism:* `WHERE updated_at = <the value just read>`; a write that lost the race matches zero rows, and the seam re-reads and retries, bounded at 3 rounds. It gives up silently — losing a race is not a database fault, and turning contention into a 503 would hand an attacker a way to break login by generating load.
⚠️ **MEASURED LIMIT, NOT A GUESS:** each retry round lands one write, so a burst of 10 parallel attempts advances the counter by **5**, and the lock arrives after **3 bursts** rather than 1. Bounded degradation, not a bypass — sustained parallel guessing still locks the account (test G4).
⚠️ **A second, smaller residual:** only a real unlocked account can retry, so under attacker-induced concurrency the round-trip count can differ from the miss path. Far weaker than the channel it replaces — it needs deliberate parallel requests against one number, and the signal is a fraction of WAN jitter — and the uncontended path, where a prober actually operates, stays exactly equal.
*The proper fix is an atomic increment,* which PostgREST cannot express and which becomes a single statement at the [A12] RDS cutover. Revisit there, or sooner with a SQL function if 2.6 traffic warrants it.

---

---

## LOGIN WIRING — DECISIONS (2026-08-21, chunks 2.5b · 2.6a · 2.6b)

**[I27] Every account must hold a password, enforced as PERSISTENT STATE checked on every app entry — never as a one-time post-login redirect.** (2026-08-21)
*The model:* password is the PRIMARY credential (phone + password); OTP becomes the fallback/recovery path. Accounts predating M10 have no password, so they authenticate by OTP — **which is never gated** — and are routed to a mandatory set-password screen before reaching the app.
*Persistent, not one-shot:* the condition is re-evaluated on every entry (fresh login, returning session, direct deep URL). Abandoning the screen is therefore harmless — the user is simply sent back next visit. This removes an entire class of trap: there is no "half-completed" state to be stranded in.
⚠️ **THE LOOP DEFENCE IS STRUCTURAL, NOT A PATH LIST.** The gate lives in `AuthGuard` and is evaluated in **`"profile"` mode only**. `/onboarding/*` runs in `"phone"` mode, so the screen the guard redirects TO cannot be redirected away by the same condition. Max redirect depth is one, and there is no exemption list to maintain or get wrong.
⚠️ **`/onboarding/profile` MUST stay reachable, and that is a schema constraint, not a preference.** `user_credentials.user_id` is a NOT NULL FK to `users(id)`, and the `users` row is created during onboarding — so a brand-new account CANNOT have a password written for it. Sending them to the password screen first would be a guaranteed foreign-key violation on a screen they cannot leave.
⚠️ **THREE STATES, NOT TWO.** `has` → proceed · `missing` → redirect · **`unknown` → do NOT redirect.** Unknown covers sessions predating this chunk and any 503 from the status endpoint. Treating unknown as "missing" would force every user onto a set-password screen during a database outage — a screen that cannot write. Fail visible, never fail-stuck.
⚠️ **IT IS A PRODUCT REQUIREMENT, NOT A SECURITY BOUNDARY.** The gate is client-side and its mirror is client-writable, so devtools can bypass it for a flash before the background check corrects. That is acceptable because NOTHING IS PROTECTED BY IT — every API route still enforces real authorisation server-side. Building it server-side would require an exemption list (this screen, logout, the password endpoint…), and getting that list wrong locks every user out of everything. Same doctrine as AuthGuard itself.

**[I28] The login route is a thin adapter and must not re-open enumeration at the HTTP layer.** (2026-08-21)
`POST /api/auth/password-login` contains **no auth logic**: no hashing, no comparison, no lockout arithmetic, no token verification. It calls `verifyPasswordCredential` (2.5a + 2.7) and `issueSessionToken` (2.5b) and maps three outcomes onto three status codes. **If it ever grows a security decision of its own, that decision is in the wrong place.**
⚠️ **A ROUTE CAN LEAK WHAT THE FUNCTION DOES NOT** — via status code, body shape, or timing. So `invalid-credentials` and `account-locked` BOTH answer **401**, and the generic body is byte-identical for wrong password, unknown phone, and account-with-no-password. Only the locked case carries extra detail, and that reason is unreachable without a correct password ([I24]).
⚠️ **400 IS FOR A SHAPELESS BODY, NEVER FOR A BAD CREDENTIAL.** Empty strings are valid strings and are judged as credentials (401). A 400 reachable by an empty password would make the status code itself an oracle. *The first version of the test asserted the opposite and the code was right* — recorded because the mistake is easy to repeat.
⚠️ **The response is a PROJECTION, never the `users` row.** Returning `select("*")` is exactly how `/api/dev-auth/lookup` became a PII disclosure; only `id`, `phone`, `name`, `user_type` cross the wire.
*One extra read on the SUCCESS path only*, to fetch `token_epoch` for minting. Deliberate: it keeps `verifyPasswordCredential` byte-identical to the version 88 assertions were written against. A successful login is already distinguishable from a failure, so this cannot leak.

**[I29] Our session token is checked BEFORE Supabase on both sides of the seam.** (2026-08-21)
*Server* (`getIdentityFromToken`): attempt our verifier, fall back to Supabase. ⚠️ **Never peek at a claim to choose a verifier** (D9) — that hands the attacker the steering wheel. Ours first is a performance choice (local HMAC vs a network round trip); cross-acceptance is impossible by construction.
*Client* (`getSession`): read our token from localStorage first. ⚠️ **If Supabase were checked first, a password session would return "none"** — apiClient would send no Authorization header at all and every request would 401 while the user looked perfectly logged in.
*`signOut` clears ours FIRST and unconditionally* — a signed, stateless token has no server-side record to revoke, so forgetting it locally IS the logout. Clearing it after a hanging Supabase call would leave a "signed out" user still authenticated.

---

## OTP REQUEST HARDENING — DECISIONS (2026-08-24, chunk 2.6c)

**[I30] The reset timing floor is set from a PRODUCTION MEASUREMENT, and the first value was inert.** (2026-08-24) — The floor exists so a remote prober cannot read account existence off the clock: a registered reset costs a real SMS (slow), an unknown one costs a refusal (fast). `OTP_RESET_FLOOR_MS` was originally **2000**, chosen before the provider leg could be measured at all — localhost never calls it, because both the A10 browser bypass and the server's `isProductionRuntime` gate short-circuit first.

Measured against production on 2026-08-24 (real Twilio send, founder's number, LAN production build): a registered reset runs **4722 ms** end to end; unknown-number refusals run 2011–2928 ms; the raw provider refusal leg is 352 ms median. **At 2000 the sleep never fired at all on the send path** — the work already exceeded the floor, `remaining` went negative — so it masked nothing and left roughly **1800–3200 ms of existence-dependent signal exposed.** The floor is now **6000**, above the measured ceiling with tail margin and under Vercel's 10 s limit, and re-proven to BIND: the fastest reset path measures 6008 ms, pinned to the floor rather than to the work. Suite section [G] tightened as a result — the registered/unknown delta fell to **1.2 ms against a 39.3 ms jitter bar**, from 3.4 ms against 997.8 ms.

⚠️ **THE GENERAL RULE THIS BUYS: a security constant chosen before the thing it bounds could be measured is a placeholder, and must be labelled as one.** It was — the old comment said so plainly, and the reset suite carried a fails-when-fixed assertion (G4) that went red the moment a real measurement replaced the marker. **That tripwire is why this was caught rather than inherited.** Prefer an assertion that fails when a gap closes over a comment that quietly decays.

⚠️ **AND THE COST, RECORDED RATHER THAN GLOSSED: 63% of what this floor pads around is OUR OWN LATENCY** — 2981 ms of the 4722 ms is `checkOtpThrottle`'s three sequential round trips to Supabase Singapore, not the provider. The floor pays for our slowness with the user's time. **Fixing that is chunk 2.6d and a hard prerequisite of 2.8b**, deliberately NOT folded into 2.6c: a performance refactor of security-critical code does not belong in the commit that proves a security property.

**[I31] The throttle's phone read stays FIRST and keeps its early return; only the IP read and the global count may be parallelised.** (2026-08-24) — Recorded now, before 2.6d is built, because the obvious optimisation is wrong. `checkOtpThrottle` checks the per-number cooldown first because it is *"the limit an attacker actually meets and the cheapest to reject on"* — a hammered request costs ONE query. Parallelising all three reads would make every hammered request cost three, converting a throttle into an amplifier on an unauthenticated path. ⚠️ **And use `Promise.all`, never `Promise.allSettled`:** the throttle throws on any DB failure and that throw becomes a 503 with no SMS sent (D3, fail-closed). `allSettled` swallows the rejection and would quietly convert a database outage into an allow — an unthrottled SMS cannon during exactly the incident you least want one. ⚠️ **EXTENDED BY [I32]** — which adds a SECOND concurrent pair (the record write and the retention sweep) on a different safety argument. Read them together; the two pairs are safe for different reasons, and assuming otherwise is the trap.

**[I32] The record write and the retention sweep may ALSO run concurrently — and the reason is `purgeOldOtpRequests` swallowing its own errors, which is therefore a LOAD-BEARING PROPERTY, not an implementation detail.** (2026-08-24) — **Amends [I31]**, which sanctioned exactly one concurrent pair (the IP read + the global count) inside `checkOtpThrottle`. This adds a second pair inside `recordOtpAttempt`: `recordOtpRequest` (the INSERT) and `purgeOldOtpRequests` (the 48-hour DELETE sweep), which today run as two sequential awaited round trips to Supabase Singapore. Measured cost of the sweep leg: **~580 ms** of the 4722 ms production ceiling.

⚠️ **THE TWO PAIRS ARE SAFE FOR DIFFERENT REASONS, AND CONFLATING THEM IS THE TRAP.** [I31]'s pair is safe because **both** halves throw, so `Promise.all` propagates the first failure and the request fails closed. **This pair is safe for the opposite reason:** `purgeOldOtpRequests` catches everything internally — both the PostgREST `error` branch and a thrown exception — logs it as non-fatal and returns `void`. It **cannot** reject. So `Promise.all([record, purge])` can only ever reject on the record, which is precisely the half that must fail closed. The existing comment already states the intent — *"THE RECORD THROWS AND THE SWEEP DOES NOT"* — and this decision promotes that from an observation about the code into a constraint on it.

⚠️ **THEREFORE: IF A FUTURE EDIT MAKES `purgeOldOtpRequests` THROW, THIS PARALLELISATION BECOMES A BUG — and a nasty one.** A failed retention sweep would start rejecting the `Promise.all`, which the route maps to a 503 with no SMS sent. **A cosmetic cleanup of "swallowed errors" would silently convert a harmless housekeeping failure into a total outage of OTP login, signup AND reset.** That is the whole reason this is a decision entry and not a code comment: the safety rests on a property of a *different function*, and nothing in `recordOtpAttempt` will remind an editor of it. Keep the swallow, or un-parallelise in the same commit.

**Why the rows cannot collide:** the DELETE targets `created_at < now − 48h` and the INSERT adds a row at `now`. The sets are disjoint by construction, so there is no lock contention and no possibility of the sweep removing the row just written — the throttle counter cannot be corrupted by running them together. ⚠️ **This holds only while `OTP_REQUEST_RETENTION_HOURS` is comfortably positive.** A retention value at or near zero would make the sets overlap and the sweep could delete the row that was just recorded — a throttle that silently never throttles, which is [I25]'s failure mode in a new costume.

⚠️ **THE AWAIT IS STILL REQUIRED — do not "optimise" this into a floated promise.** `Promise.all` awaits both, which preserves [I25]'s reason for awaiting the sweep in the first place: the platform may freeze a serverless function after the response is returned, and a floated promise is simply lost. Concurrency is the win here; fire-and-forget is not on the table.

**Migration cost: none** — pure application-level concurrency, no schema change, no DDL, no new dependency. `git revert` restores the prior behaviour exactly.

⚠️ **OUTCOME, MEASURED 2026-08-26 — AND IT CONTRADICTS WHAT BOTH OF US EXPECTED MID-CHUNK.** On localhost this pair halved its leg (701 → 243 ms) while [I31]'s pair moved not at all (534 → 525 ms), which looked like [I31] had been a waste. **In production the opposite is true: BOTH pairs paid, and each saved almost exactly one round trip.** Same LAN build, same method, registered reset end to end:

| leg | 2.6c | 2.6d | delta |
|---|---|---|---|
| throttle check ([I31]'s pair) | 2981 ms | 2060 ms | **−921 ms** |
| record + provider ([I32]'s pair) | 1741 ms | 965 ms | **−776 ms** |
| **total** | **4722 ms** | **2915 ms** | **−1807 ms** |

**The floor dropped 6000 → 5000 and the measured ceiling 4722 → 3621 as a direct result.** ⚠️ **THE LESSON IS ABOUT WHERE YOU MEASURE, NOT ABOUT CONCURRENCY.** Localhost round trips are warm and cheap, so removing one is invisible there and the unkeyed global count dominates; production round trips to Singapore cost ~900 ms each, so removing one is the whole win. **A latency optimisation judged on localhost would have been abandoned as worthless.** Measure where the latency actually is.

⚠️ **AND WHAT IS STILL NOT FIXED: the jitter is entirely ours.** The provider leg is stable to within **15 ms** across sends (955/965/970); the throttle check swings by nearly a full second (1795–2757 ms). The floor is now sized by OUR variance, not the provider's. Squeezing it further means attacking `checkOtpThrottle`'s two remaining sequential round trips — the single-query rewrite — not more parallelism. [I31] and this decision have taken what concurrency can take.

*Append new decisions below this line with the next ID and a date.*
