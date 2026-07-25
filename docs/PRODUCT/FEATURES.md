# FEATURES.md
### The Complete Feature Catalog
> Every feature FabVerify has or will have, grouped by domain, with status. Status mirrors `PROJECT_MEMORY.md` — that file is authoritative for current state; this file is the organized catalog. ✅ LIVE · 🟡 SCREEN-ONLY · 🔴 NOT BUILT · ⚠️ TEMPORARY.

---

## AUTH & IDENTITY
- ✅ Phone OTP signup/login (Supabase + Twilio; localhost `123456` dev bypass)
- ✅ Prod fallback (WhatsApp + waitlist) on provider error
- ✅ Profile lookup by phone → correct route
- 🔴 Password login option (decided, not built)
- 🔴 Government-DB identity verification (Aadhaar/DigiLocker, PAN)
- 🔴 Business verification (GST, Udyam/MSME, CIN/MCA)
- 🔴 Global verification (passport + selfie + country registration)
- 🟡 Verification wizard screens (Bronze/Silver/Gold, India + international)
- ✅ Verification status tracking + tier badges
- 🔴 Admin verification approval panel

## DISCOVERY & PROFILES
- ✅ Manufacturer discovery (real DB, filters, loading/empty states)
- ✅ Manufacturer search at scale (search not dropdown)
- 🟡 Manufacturer profile detail (4 tabs; Overview real, rest fake)
- 🔴 Fabric mill catalogue (meters/GSM/width/swatch/ready-vs-custom)
- 🔴 Trim supplier catalogue (7 categories)
- 🟡 Artisan profile (craft/GI-tag screens)
- 🟡 FabTalent profiles (Designer/Master/Merchandiser/QC)
- 🔴 FabTalent universal search (by type + specialisation)

## ENQUIRY & RFQ
- ✅ Send enquiry (real DB, rejects unregistered, seeds chat)
- ✅ Post sample brief (real DB)
- ✅ Manufacturer respond to brief (real DB)
- 🔴 Quote comparison (side-by-side)

## ORDERS
- ✅ Place bulk order (8-step form + docs: tech pack, CAD, grading, product, quality, trim, fabric-indent, wash-care, PPM)
- ✅ Accept/decline order
- ✅ Track order + 5 auto milestones
- 🔴 Order completion + final payment release
- 🔴 Delivery address persistence
- 🔴 Reorder / repeat order flow
- 🟡 Enterprise bulk-order Kanban

## SAMPLING
- ✅ Sample brief post/respond
- 🔴 Sample round tracking (Proto/Fit/Size-Set/PP golden sample)
- 🔴 Sample photo annotation / fit feedback loop
- 🔴 Measurement-sheet handling

## MERCHANDISING
- 🔴 Living T&A calendar
- 🔴 Approval-chasing tracker
- 🔴 Multi-order health dashboard
- 🔴 Auto-generated daily to-do

## FABRIC MILL SPECIFIC
- 🔴 Swatch request/dispatch/fee-deduction
- 🔴 Lab dip approval flow
- 🔴 Shade band / dye-lot tracking
- 🔴 Colour fastness records
- 🔴 Lab dip / approved-colour library
- 🔴 Greige vs finished listing
- 🔴 Dead-stock marketplace
- 🔴 Meter-based verification

## TRIM SUPPLIER SPECIFIC
- 🔴 Trim catalogue by category
- 🔴 Artboard/sample-card approval
- 🔴 MOQ reserve system
- 🔴 Care-label compliance checker
- 🔴 Compliance test records

## ARTISAN SPECIFIC
- 🔴 Fair-price vs middleman display
- 🔴 Craft authenticity proof + certificate
- 🔴 GI-tag verification
- 🔴 Craft-complexity pricing guide
- 🔴 FabGovt scheme navigator
- 🔴 FabVoice (Hindi voice)
- 🔴 Craft knowledge library

## JOB WORKER SPECIFIC
- 🔴 Parent-order-linked job orders
- 🔴 Receive-process-return + piece reconciliation
- 🔴 Dual pricing (piece/meter)
- 🔴 SMV capacity calendar
- 🔴 Shift-proof photos + multi-style overtime tagging
- 🔴 FabPayroll (piece-rate)

## FABTALENT SHARED
- 🟡 FabTalent profile screens
- 🔴 Portfolio auto-build from gigs
- 🔴 Skill-verified badge (per-type assessment)
- 🔴 Gig-adaptive workspace
- 🔴 Delegated freelancer access (scoped, approval-gated)
- 🟡 FabMerch hire flow

## DESIGNER SPECIFIC
- 🔴 Tech pack upload + version control
- 🔴 Revision-scope boundary
- 🔴 Tech-pack → manufacturing flow
- 🔴 FabDAM portfolio

## QC SPECIFIC
- 🔴 4-Point fabric calculator
- 🔴 AQL garment calculator
- 🔴 Digital inspection report
- 🔴 Debit note on failure
- 🔴 Geo-tagged inspection proof

## COMMUNICATION (FabChat)
- ✅ Mobile 3-tab shell (per-user-type URLs)
- ✅ Real conversations + messages (5s poll, read receipts, optimistic send)
- ✅ Voice notes
- ✅ Camera capture (direct)
- ✅ Contact profile bottom sheet (shows orders)
- ✅ Members-only auth guard
- ⚠️ Photo messages (base64 → move to Storage)
- 🟡 QR scan tab (UI + manual entry; real scan pending)

## COSTING & PRICING
- 🔴 FabPricingEngine auto-costing (quick + detailed + reverse mode)
- 🟡 FabPrice benchmarks (fake)
- 🔴 Unit-economics guard
- 🔴 FabCashFlow (13-week forecast)

## TRUST, MONEY & VERIFICATION CORE
- 🔴 Real escrow (payment-aggregator partner)
- 🔴 QR traceability (milestone/bundle, geo+time+photo)
- 🔴 SMV capacity + shift-proof + tolerance engine
- 🔴 FabScore algorithm
- 🟡 FabScore display
- 🔴 Universal Item Identity
- 🔴 WhatsApp notifications
- 🔴 Supabase Storage for photos

## CREDIT (honest by design)
- 🔴 FabPay Later (30/60/90)
- 🔴 FabFloat (48hr pay)
- 🔴 FabMaterial (raw-material credit)
- 🔴 Key Fact Statement + APR transparency

## ENTERPRISE
- 🟡 Onboarding + position selection
- 🟡 Position-adaptive dashboard
- 🔴 CEO money-first landing view
- 🟡 Team management + member work-dashboard modal
- 🟡 Invite flow + pending tab + acceptance
- 🔴 Restructurable hierarchy
- 🔴 CFO builds own team
- 🔴 Real role-based permissions
- 🟡 Vendor master
- 🔴 Vendor onboarding to real DB
- 🔴 Visual Stock Panel
- 🔴 11 departments as real modules (Planning, MFP, QA, Supply Chain, Compliance, Sustainability, Design-Coord)
- ✅ Upgrade modal (portal)

## COMPLIANCE & SUSTAINABILITY (moat)
- 🔴 FabComply / FabAudit
- 🔴 FabDPP (EU Digital Product Passport)
- 🔴 FabChemical (REACH)
- 🔴 FabSustain / FabCarbon

## ANALYTICS & AI
- 🟡 Analytics dashboards (fake)
- 🔴 FabGuide (Claude assistant)
- 🔴 FabForecast (demand)
- 🔴 FabStandard (published benchmarks)

## PLATFORM / INFRA
- ✅ Per-user-type routing + smart redirect
- ✅ db.ts abstraction layer
- ✅ Supabase connected, RLS on all tables
- ✅ Vercel deploy (auto on push)
- 🔴 Notifications centre
- 🔴 Global search on real data
- ⚠️ Mobile responsiveness (main platform desktop-first)
- 🔴 True one-file theming (hardcoded-color sweep needed)

---

*For the WHY behind any feature, see `docs/PRODUCT/USER_TYPES.md`. For build order, see `ROADMAP.md`. For current status, `PROJECT_MEMORY.md` wins.*
