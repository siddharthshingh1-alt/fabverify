# CHANGELOG.md
### What Changed, When
> Append-only. Newest at top. Every meaningful build session adds an entry. Keep entries accurate (X2) — describe what actually changed, never overstate.

Format: `## [date/session] — title` then bullets grouped by Added / Changed / Fixed / Deprecated.

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
