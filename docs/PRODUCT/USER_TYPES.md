# USER_TYPES.md
### The Complete Locked Vision for Every User Type
> This is the reference Claude Code uses when building anything for a specific user type. Every vision here is DESIGN-LOCKED (researched against the real industry, confirmed by the founder). "Locked" means the design is decided; it does not mean built — check `PROJECT_MEMORY.md` for build status. Numbering formats are in `CORE.md`.

---

## THE ROSTER

**10 public user types:** Brand/Buyer · Manufacturer · Fabric Mill · Trim Supplier · Artisan · Job Worker · Designer · Master · Merchandiser · QC Inspector.
**Enterprise:** a separate interface (see `docs/MODULES/` and DECISIONS P4–P9).
**Cross-cutting systems** (apply to many types): Universal Item Identity · Visual Stock Panel · QR Traceability · FabTalent Profile · Gig-Adaptive Workspace · Delegated Freelancer Access · FabPricingEngine · Honest Credit · Government-DB Verification · Legal Escrow.

Guiding rules: one Brand experience scales solo→large (P1); freelancers adapt to the gig (P2); FabTalent is a universal specialist marketplace (P3); design tools are out of scope (P13).

---

# 1. BRAND / BUYER
*One experience for all brands, solo founder → large. Enterprise is separate. Today's small brand is tomorrow's large brand.*

**Who they are & why they fail:** 90% of clothing brands fail — not from bad products but from cash-flow timing and dead stock. Failures trace to: skipped sampling, weak tech info, rushed approvals, poor fit control, unrealistic MOQ/price expectations, and picking the cheapest quote (the most expensive mistake).

**FabVerify's job:** stop the mistakes that kill brands, across three protective layers.

### The three protective layers (the core of the Brand vision)
**Layer 1 — Before ordering (prevent the fatal mistake):**
- Verified manufacturer discovery filterable by MOQ (find 50–100 pc makers), category, city, FabScore, tier.
- Auto-costing (FabPricingEngine) + FabPrice benchmarks → know the true/fair price before negotiating.
- Unit-economics guard: warns if target retail price won't cover ~3–4× cost + overhead + marketing.
- Low-MOQ matching + validate-first guidance; guided journey (FabStart) that won't let them skip sampling.

**Layer 2 — During the order (protect the transaction):**
- Escrow + QR-verified milestones + real-time tracking.
- Hire expertise per-gig (FabMerch/FabTalent) — a solo brand operates like a big one.
- FabChat with manufacturer.

**Layer 3 — After ordering (keep them alive):**
- FabPay Later (pay 30/60/90 days; manufacturer paid immediately via FabFloat) — attacks the #1 killer, paying months before earning.
- FabCashFlow: 13-week rolling forecast → 40% fewer emergency-financing situations.
- Fast, consistent reorder (approved colour library COL- + golden sample PP) — reorder instead of over-ordering.
- Dead-stock marketplace — list unsold stock for other small brands (connects to mill dead-stock); recover locked capital.

### The Brand journey → what FabVerify gives
Find manufacturer (trust signals) → know fair price (auto-costing) → sample brief → sampling (proto/fit/PP via Master) → digital approval → **only then** bulk order (escrow) → track (QR) → reorder (consistent).

### Dashboard (survival-aware)
New brand: guided next step ("3 steps from your first order"). Active brand: attention items (samples awaiting approval, orders in production, payments due, delays), cash-flow health, margin health, reorder suggestions for what's selling, dead-stock alerts, market prices, suggested manufacturers. No cards duplicating nav (P12).

### Numbering
Brand `BRD-[BrandCode]` · Sample brief `SB-[BrandCode]-[Seq]` · Bulk order `ORD-[Year]-[Seq]`. The ORD orchestrates FAB/TRIM/TP/SMP/JOB/QC beneath it.

### Grows with them
Solo → guided journey, per-gig hiring, low-MOQ makers. Growing → multiple orders, season view, analytics, credit. Large → full order portfolio, team hiring, advanced analytics, and the door to Enterprise. Same platform, progressive revelation.

---

# 2. MANUFACTURER
*The factories that make garments.*

**Core vulnerability solved:** manufacturers get ghosted and chase payment. FabVerify gives them proof, protection, and fast fair payment.

### What they need
- Onboarding + profile; appear in buyer search (real trust signals).
- Receive enquiries + sample brief requests; accept/decline orders.
- Update milestones with photo proof (→ QR).
- **QR milestone/bundle scanning** — receive-produce-dispatch verified (the trust core).
- **FabFloat** — get paid in 48 hours on verified proof.
- **FabMaterial** — raw-material credit (no 24% moneylender).
- **Production capacity calendar** (SMV-based) — show what's free to book.
- **Sub-contractor management** — link job workers within one order (the whole chain visible).
- FabChat with buyers; verification.

### Verification math
Pieces × SMV. Capacity = (available minutes × efficiency) ÷ SMV. Overtime verifiable via shift-boundary photos, tagged per style. 10–15% tolerance buffer (V4).

### Dashboard
Active orders (pieces), pieces due this week, pending payments, FabScore, active-order status table, payment tracker (what they'll receive and when), new enquiries. Not "find manufacturer" cards.

### Numbering
Order `ORD-…`; sub-contracted job work shows `JOB-…` linked to parent order.

---

# 3. FABRIC MILL
*Sells by the METER, not the piece. The swatch and the dye lot are everything.*

**Four numbers that matter:** GSM, width, composition, price/meter. MOQ in meters (100–2000+). Ready-stock vs custom-dyed is a fundamental distinction.

### What they need — catalogue & selling
- Fabric catalogue: composition, GSM, width, colours, price/meter, MOQ (meters), ready-or-custom, lead time.
- **Swatch request system**: buyer requests → mill dispatches physical swatch → fee tracked → auto-deducted from bulk. (The single most important mill feature.)
- Ready-stock vs custom toggle; GSM-consistency badge; colour matching; meter-based orders; test reports (Oeko-Tex, shrinkage, fastness); **dead-stock/overstock marketplace** (solves small-brand MOQ).

### The dye-lot problem (core trust issue — deeper than price)
Shade drifts lot-to-lot even with the same recipe. Two lots in one garment ruins it. FabVerify digitizes the industry's solution:
- **Lab dip approval flow**: mill uploads dip photos + recipe; buyer approves / approves-with-comments; no bulk dyeing until approved.
- **Shade band / dye-lot tracking**: each vat = one lot; shade band per lot; order spanning multiple lots is flagged; feeds the QR graph as the first node.
- **Colour fastness records**: wash/rub/light fastness (≤3% variation for premium).
- **Lab dip library / approved colour**: approved colour saved (COL-) → reorder matches exactly (the reorder superpower).
- **Greige vs finished** listing; **process-control badge**.

### Verification math (meter-based, NOT pieces)
Weaving capacity = looms × m/day. Dyeing capacity = vats × batch × cycles/day. Reconciliation expects **natural shrinkage 3–5%** greige→finished (never flagged); only impossible loss flags. Shift photos prove extra dyeing cycles/overtime; output measured in meters.

### Numbering
Fabric `FAB-[MillCode]-[Seq]` · Lab dip `LD-[FabricNo]-[Seq]` · Dye lot `LOT-[FabricNo]-[Letter]` · Shade band `SB-[LotNo]` · Approved colour `COL-[MillCode]-[Seq]`. Every entity has an optional mill custom-code; findable by number, name, or own code.

### Dashboard
Active orders (meters), swatch requests, enquiries, meters dispatched, payments pending, most-enquired fabrics.

---

# 4. TRIM SUPPLIER
*Buttons, zips, labels — under 3% of garment value, but 67% of production delays.*

**7 categories:** closures, labels, hangtags/packaging, elastic/drawcord/interlining, thread, decorative, compliance-tested. Codes: BTN, ZIP, LBL, HTG, ELS, THR, PKG, DEC.

**Core pains:** MOQ mismatch (labels 1000pc, zippers 3000pc MOQ vs 200pc run → over-order & store excess). Care labels legally mandated in 40+ countries with incompatible rules. ~32-day lead time. Artboard approval before bulk.

### What they need
- Trim catalogue by category (type/material/size/colours/MOQ/price/lead-time/branded-or-generic).
- **Artboard / sample-card approval flow** (like lab dips) — no bulk until approved.
- **MOQ reserve system** (killer cash-flow feature): order 2000, use 200 now, 1800 reserved for future; next order auto-draws reserve; "you have 1,800 reserved with this supplier."
- **Care-label compliance checker** by destination market (which languages/symbols) — prevents customs rejection.
- Trim-to-parent-order linking; compliance test records (REACH/AZO/lead/nickel); physical sample-card tracking.

### Numbering
Trim `TRIM-[SupplierCode]-[Category]-[Seq]` · Artboard `ART-[TrimNo]-[Seq]` · Reserve `RSV-[BrandCode]-[TrimNo]` · Approved trim `TRM-[SupplierCode]-[Seq]`.

### Dashboard
Active trim orders (quantities), artboard approvals waiting, sample cards to dispatch, reserved stock across brands, orders arriving-soon vs delayed (they cause delays), new enquiries, most-ordered trims.

---

# 5. ARTISAN
*The heart of the mission. Make the karigar's share the largest, paid directly, fast, and fairly.*

**Research truth:** karigar earns ₹200–500/day piece-rate; a middleman chain (designer→village stitcher→city→wash→finish→trader→boutique) each takes a cut; the karigar gets the smallest share. 90% are women, home-based. The craft is dying because the next generation opts out.

### Four problems → four solutions
1. **Middleman chain** → direct connection + transparent margin ("you earn ₹X directly vs ₹Y via middleman").
2. **Delayed piece-rate pay** → escrow + FabFloat (48hr); money secured before they start.
3. **Can't afford raw materials** → FabMaterial credit (thread, fabric, zari on credit).
4. **Skill gap kills premium** (no pro photos/English/online-order skills) → FabVerify IS their professional face (photos, product story, order handling).

### Craft-specific features
- **Authenticity proof**: photograph the reverse/detail of hand-work vs power-loom fakes → authenticity certificate (AUTH-) → justifies premium.
- **GI-tag verification** (Sambalpuri/Pochampally/Chanderi/Pashmina): premium + protection.
- **Craft-complexity pricing guide**: taar count, stitch types (murri/phanda/jali/bakhia/tepchi); simple 1–2 wk, dense months → fair-price calculator so beginners can't lowball and complexity isn't exploited.
- **Time-honest timelines** (no impossible deadlines that force fakes).
- **FabGovt scheme navigator**: PM Vishwakarma, SFURTI (30–60% subsidy), NHDP, insurance (PMJJBY/PMSBY) — tell each artisan what they qualify for.
- **Women-first, home-based UI**: basic phone, local language, FabVoice (Hindi), 30-second use.
- **Institutional knowledge preservation**: master techniques recorded to a craft library (TECH-).

### Numbering
Craft order `CRAFT-[ArtisanCode]-[Seq]` · Authenticity `AUTH-[CraftOrderNo]` · GI tag `GI-[Craft]-[ArtisanCode]` · Craft library `TECH-[ArtisanCode]-[Seq]`.

### Dashboard (dignified, honest)
"You earned ₹X this month — directly, no middleman." Active craft orders (honest timelines), payment secured in escrow (shown before they start), raw-material credit available, new brand orders, government schemes they qualify for, and monthly: "a middleman would have taken ₹Y." (That line is the soul.)

---

# 6. JOB WORKER
*Handles ONE production stage (stitching/embroidery/printing/washing/finishing). Receives semi-finished, returns after their process. "The workshop is the weakest, most easily-replaced element" — FabScore makes them non-replaceable.*

**Prices two ways:** per-PIECE (stitching ₹100/pc, embroidery ₹1200/pc) OR per-METER (fabric embroidery ₹50–300/m). Must support both. CMT = cut-make-trim. Types: stitching/CMT, embroidery (computerised/hand), printing (screen/digital, priced by colours/MOQ), washing/finishing.

### What they need
- **Job order linked to PARENT manufacturer order** (always part of a bigger production; whole chain visible).
- Receive-process-return tracking with counts.
- Dual pricing (per-piece / per-meter).
- **Piece-count reconciliation** (received 500 must return 500; small variance OK).
- **Capacity calendar** (SMV-based) — when free to book; also a fraud check.
- FabScore reliability (on-time-return, quality-pass, count-accuracy).
- Piece-rate payroll (FabPayroll link); sub-contractor relationship with manufacturer.

### Capacity, overtime & verification (the rigorous loop)
- **SMV-based capacity** per garment (complexity-aware); capacity = available min × efficiency ÷ SMV.
- **Shift-proof photos**: geo-tagged, timestamped shift-start / shift-end / overtime-boundary photos; reminder near shift-end. Two taps normal day, +two for overtime.
- **Multi-style overtime tagging**: tag which styles + machine count the overtime applies to; proven minutes split per style.
- QR bundle scans cross-checked against each style's proven capacity.
- **10–15% tolerance buffer**: normal 10–20 pc swings never flag. Three-level response; only impossible discrepancies notify buyer + FabVerify team and hold payment.
- Bronze declares; Silver adds shift photos; Gold adds QR scans (shift photos prove hours, QR scans prove pieces — together strong).

### Numbering
Job order `JOB-[JWCode]-[Process]-[Seq]` (STITCH/EMB/PRINT/WASH/FINISH); always shows parent ("Part of ORD-2024-002"); reconciliation shown.

### Dashboard
Active jobs, pieces processing, due this week, payments pending, capacity tracker (% booked, available date), new job requests, on-time-return rate.

---

# FABTALENT (Designer / Master / Merchandiser / QC) — SHARED SYSTEMS

## FabTalent Profile System (shared by all four; type-adaptive)
Storefront where anyone (brand, mill, manufacturer, enterprise, solo owner) discovers and hires specialists.
Contains: identity + verification + **skill-verified badge** (real assessment), FabScore + rating + repeat-hire rate, specialisation, **portfolio that builds automatically from completed gigs**, rates + availability calendar, reviews.
Verification per type: Designer → design test; Master → physical sample assessment; Merchandiser → senior-panel interview; QC → AQL/4-point certification. Only verified specialists get the badge; brands can filter to verified only. Merit-based visibility — good work rises.
Numbering: `TAL-[Type]-[Code]` (TAL-DSN-PRI, TAL-MST-RAJ, TAL-MER-MEE, TAL-QC-SUN).

## Gig-Adaptive Workspace (shared)
The workspace shapes to the specific hire (one deliverable vs full season vs sketches-only). Freelancer toggles between "my work" and "working inside [Client]'s delegated workspace."

## Delegated Freelancer Access (shared — see P10)
Scoped access to the hirer's dashboard; propose-by-default (owner approves); owner can loosen low-risk tasks; money/commitments always need approval; hard limits (escrow, financials, permissions, deletion) never delegable; owner has one-tap approval queue.

---

# 7. DESIGNER (full range)
*FabVerify does NOT build design tools (Illustrator/CAD/AI do that). It handles everything AROUND design.*

**Types (all hireable via FabTalent):** Apparel/Fashion (tech packs, flats), Textile/Surface Print (mills hire for print collections), Woven (jacquard/stripes/checks), Knit, Embroidery (digitized files), Colorist/Colourway, Textile Stylist.

### What they need
- Gig-adaptive workspace (single tech pack / multi-style / sketches-only).
- Receive structured design brief (garment, references, market, fabric, budget, timeline).
- **Tech pack delivery (upload, not create)**: upload finished PDF + source; platform stores, **versions**, delivers to brand AND to the manufacturer who produces it.
- **Version control** (top pain point solved): v1→v2→v3, clear revision history, everyone knows the current approved version.
- **Revision scope boundary**: brand can't demand a whole new style under "revision" — protects the designer.
- Approved tech pack flows into the manufacturing order; BOM feeds fabric/trim sourcing (the platform advantage over Fiverr).
- Portfolio/DAM; escrow with milestone/per-style release.

### Numbering
Design project `DSN-[DesignerCode]-[Seq]` · Tech pack `TP-[ProjectNo]-[Style]` · Version `TP-…-v[N]` (v3 approved → feeds ORD, BOM → FAB/TRIM).

### Dashboard
Active projects, tech packs awaiting approval, revision requests (scoped), payments escrow/released, new hire requests, portfolio views + rating.

---

# 8. MASTER (Sample / Pattern Maker)
*Turns the designer's tech pack into the first physical garment. Hired for judgment, not just sewing — a good Master flags what won't work before bulk.*

**Sample stages:** Proto (construction feasibility) → Fit (measurements/drape) → Size Set (grading) → **PP / golden sample** (binding standard; no bulk cutting until approved; QC later measures bulk against it). Good tech pack → ~1.4 rounds; complex → 4+.

### What they need
- Receive the approved tech pack directly (seamless designer→master handoff).
- Sample round tracking (Proto→Fit→Size Set→PP), numbered.
- Sample photo submission with construction detail (front/back/seams/collar/cuffs).
- Fit feedback / annotation loop (brand marks up photos; structured revision).
- Measurement-sheet handling (POM; record actual vs spec, within tolerance).
- **PP golden-sample lock** → becomes the production standard the manufacturer produces against AND the QC benchmark.

### Numbering
Sample job `SMP-[MasterCode]-[Seq]` · rounds `SMP-…-PROTO / -FIT-01 / -SIZESET / -PP`. Chain: `TP-…-v3 → SMP-…-PP → ORD → QC measures against SMP-…-PP`.

### Dashboard
Active samples + round, samples awaiting feedback, revision requests (annotated), payments, new sample requests, rating + average rounds-to-approval.

---

# 9. MERCHANDISER
*"The heart and soul of the company." The single person who holds the whole order together, buyer↔manufacturer. Lives in the T&A calendar.*

**Full journey:** before-order (costing, negotiation, win) → sampling (get samples, collect comments, approvals, lab dips, trims) → sourcing (book fabric/trims) → production (daily follow-up vs T&A, flag delays, QC) → shipment (inspection, dispatch, docs) → after (relationship). Handles many orders across seasons.

### What they need
- **Living T&A Calendar** (the core tool; updated daily): every milestone has planned/actual date, delay days, responsible party, status; auto-calculates delays; auto-updates as scans/approvals happen. `TNA-[OrderNo]`.
- View across buyer AND manufacturer sides; FabChat to both.
- **Costing sheet + negotiation** via FabPricingEngine (pulls real FAB/TRIM/FabPrice data).
- **Approval chasing** (biggest daily pain): every pending approval, who it waits on, days pending, one-tap reminder.
- **Multi-order dashboard** with per-order T&A health (on-track/at-risk/delayed).
- **Auto-generated daily to-do** from all their T&As combined.
- Sits at the center orchestrating lab dips, samples, tech packs, QC, fabric/trim booking, production (QR).

### Gig-adaptive
One order (full T&A) / whole season (master T&A) / sourcing-costing only. Hired by small brands (can't afford ₹8–15L/yr full-timer), enterprises (as team members), manufacturers/buying houses.

### Numbering
`MER-[MerchCode]-[Seq]` manages `ORD-…`; orchestrates TP/LD/SMP/FAB/TRIM/QC on `TNA-[OrderNo]`.

### Dashboard
Today's auto to-do, all orders with T&A health, pending approvals being chased (days-waiting), delays needing action, new hire requests, rating + on-time record.

---

# 10. QC INSPECTOR (full range)
*Many kinds of inspection at many stages. Any user can hire the inspector they need.*

**Types (all hireable):** Fabric Inspector (4-Point System, ASTM D5430 — enterprise/manufacturer hires to inspect mill fabric), In-line/During-Production, Final/Pre-Shipment (AQL), Pre-Production, Container-Loading, Lab Testing (yarn count, composition, tensile, fastness).

### What they need — type-specific tools
- **Fabric Inspector**: digital 4-Point calculator (defects by length/severity → penalty points/100yd → pass/fail), check vs fabric spec (GSM/width/shade), inspect rolls across dye lots for batch variation.
- **Final Garment Inspector**: digital AQL calculator (lot size → sample size → accept/reject number), defect classification (critical/major/minor), measurement vs the golden sample (SMP-…-PP), photo evidence, geo-tagged proof of factory visit, digital inspection report, debit note on failure.
- All feed the QR chain (scan what's inspected, attach report → part of garment history).

### Numbering / chain
Inspection links to the ORD and the golden sample it measures against; report attaches to the QR node.

### Dashboard
Inspections this month, upcoming scheduled, reports pending, earned this month, upcoming inspections (factory/brand/type/date/location), reports due, new inspection requests, cities available, certification status.

---

# CROSS-CUTTING SYSTEMS (summaries; full rules in CORE.md)

## Universal Item Identity (P8)
One physical item = one master FabVerify ID + unlimited aliases (FabVerify no., supplier code, each brand's code, barcode/EAN). Matching: manual link once / barcode scan / AI spec-fingerprint (match on specs not names). Applies to fabric, trims, styles. Powers enterprise inventory reconciliation (X matched / Y possible-duplicates / Z unmatched) and makes MOQ-reserve + reorder reliable.

## Visual Stock Panel (P9)
Enterprise inventory found by LOOKING at photos, by category — not by code. Covers: Fabrics (by meter, with dye-lot + approved-colour attached, **lots kept visually separate + "do not mix in one garment" warning**), Greige/raw, Trims (7 categories by piece), Finished Goods (by piece). Add stock = photo + category + quantity (name/code optional). Find by looking / by own name / by photo-match. Supplier photos auto-flow into stock. Universal ID works silently underneath. Inventory-Manager role lives here; feeds CEO glance-view of total physical inventory value.

## QR Traceability (V1–V5, P-locked platform-wide)
The spine. Every node scanned (dye lot → fabric dispatch → manufacturer receipt → cutting/bundles → job-worker process → QC → finished goods → dispatch → buyer receipt), each with geo-tag + timestamp + photo + verified identity. Bundle-level default (12–24 pc); milestone-level (5/order) is the simplest start; piece-level optional premium. Unit-adaptive math (pieces×SMV vs meters). Escrow release tied to verified scans. Auto-generates EU Digital Product Passport at Gold.

## FabPricingEngine — Auto-Costing (P11)
Formula: Fabric + Trims + Labour(CMT) + Overhead + Other(freight/pack/test + reject gross-up) + Margin. User fills only known values; platform auto-calculates everything live (consumption via geometry, fabric/trim from listings, CMT via SMV, overhead allocation, IE reject gross-up, margin, final price, total). Smart defaults (wastage 3%, efficiency 85%, overhead 10%, reject 5%). Quick mode (beginner) + detailed mode (merchandiser: reverse-costing, CMT-vs-FOB comparison). Live recalculation, no calculate button. Available to every user type that needs costing.

## Honest Credit (M3–M5)
FabPay Later / FabFloat / FabMaterial: one all-in APR, plain-language Key Fact Statement (local language + FabVoice), all charges itemized, no hidden fees, no prepayment penalty (RBI 2026), humane recovery (8am–7pm). Only RBI-registered partners. FabScore honestly lowers cost.

## Government-DB Verification (M6–M9)
India: Aadhaar (DigiLocker, consent, status-not-number) + PAN + GST + Udyam/MSME + CIN/MCA, cross-linked to one entity (catches impersonation). Global: passport + selfie + country-specific registration (UK Companies House, EU VAT, US EIN, UAE Trade Licence). Country selector routes the flow. Tiers: Bronze (identity, instant) → Silver (business, 2–3d) → Gold (physical audit, EU-ready). Verification gates escrow eligibility.

## Legal Escrow (M1–M3)
FabVerify NEVER holds money. Escrow/nodal account at a scheduled bank, operated by a licensed RBI payment-aggregator partner. FabVerify controls release logic only, triggered by verified milestones. Merchant KYC (our verification) gates payouts. Build screens/logic now with simulated money; switch on real money when partner integration clears.

---

## ENTERPRISE (pointer)
Separate interface; runs fabric-sourcing→accounts; CEO money-first glance view then department switch; restructurable hierarchy; 11 departments (Merchandising, Sourcing/Buying, Planning, Merchandise Financial Planning, QA, Production/Ops, Finance/Accounts, Supply Chain/Logistics, Compliance, Sustainability, Design-Coordination — design coordination only, no design tools); CFO builds own team; onboards existing vendors who then use FabVerify. Full detail in DECISIONS P4–P9 and forthcoming `docs/MODULES/*` + enterprise module docs.

---

*This file is DESIGN-LOCKED. Build status is in `PROJECT_MEMORY.md`. When building any user-type feature, read that type's section here first.*
