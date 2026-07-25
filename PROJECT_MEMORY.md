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
| Password login option | 🔴 | decided (M10) but NOT built |

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

---

## WHAT THE PLATFORM CAN DO TODAY (honest)

A real brand can: sign up (real account) → find a real manufacturer → send an enquiry → post a sample brief → place a bulk order → chat in FabChat → track the order and milestones. A manufacturer can: onboard → appear in discovery → receive enquiries/briefs → accept orders → chat → track. All with real accounts in a real database.

## WHAT IT CANNOT DO YET

Move real money (escrow), prove work happened (QR), notify users (WhatsApp), run a full enterprise, send real SMS to arbitrary numbers (Twilio trial), or approve Silver/Gold verification (no admin panel).

---

*When you finish a task, update the relevant row(s) here BEFORE committing.*
