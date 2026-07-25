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

*Append new decisions below this line with the next ID and a date.*
