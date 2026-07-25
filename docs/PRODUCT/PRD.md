# PRD.md
### Product Requirements Document
> The what-and-why of FabVerify at requirements level. Detailed per-type behavior is in `docs/PRODUCT/USER_TYPES.md`; this is the higher-level requirements spine.

---

## 1. PRODUCT SUMMARY
FabVerify is a two-surface product (FabVerify web platform + FabChat mobile) that lets every participant in India's garment industry run their business on verified trust: discover verified partners, transact under escrow, prove production with QR + geo-tagged photos, build a portable FabScore, and access honest credit. Enterprise clients run their entire operation (fabric sourcing → accounts) with a CEO glance-view.

## 2. GOALS
- Replace "trust me" with "here's proof" across the garment supply chain.
- Make the weaker party (artisan, small manufacturer, first-time founder) stronger.
- Give enterprises one place to run everything, visible to the CEO at a glance.
- Be the only Indian platform that can auto-generate EU Digital Product Passports.
- Reach profitability via enterprise SaaS + multi-stream revenue, asset-light and lean.

## 3. NON-GOALS
- Not a design tool (Illustrator/CAD/AI do design; we handle everything around it — P13).
- Not an inventory-holding marketplace (asset-light — B3).
- Not a lender ourselves (we partner with RBI-registered NBFCs — M3).
- Not a money-holder ourselves (licensed payment aggregator holds escrow — M1).

## 4. USERS
10 public types + Enterprise (with internal roles). Full definitions and needs: `USER_TYPES.md`. Personas: `USER_PERSONAS.md`.

## 5. CORE REQUIREMENTS (must-haves for the product to mean anything)
- **R1 Verification:** government-DB-backed identity + business verification, tiered Bronze/Silver/Gold; gates money.
- **R2 Discovery:** find verified partners with real trust signals (FabScore, tier, reviews, MOQ, capacity).
- **R3 Transaction:** enquiry → sample brief → sampling/approval → bulk order → escrow → tracking → reorder.
- **R4 Escrow:** money held by licensed partner; released on verified milestones.
- **R5 Traceability:** QR chain from dye lot to buyer receipt; geo + time + photo + identity per node.
- **R6 Communication:** FabChat (mobile) + in-platform chat, order-linked, members-only.
- **R7 FabScore:** portable reputation from verified behavior; lowers honest credit cost.
- **R8 Credit:** honest-by-design (APR, KFS, no hidden charges, no prepayment penalty).
- **R9 Costing:** auto-costing that gives veteran-level accuracy to a beginner.
- **R10 Enterprise:** separate interface, CEO money-first view, 11 departments, restructurable hierarchy, vendor onboarding, visual stock panel.

## 6. FUNCTIONAL REQUIREMENTS BY FLOW
- **Onboarding:** phone OTP → profile → user-type selection → type-specific dashboard. Enterprise adds position selection.
- **Verification:** country selector → India (Aadhaar/PAN/GST/Udyam/CIN) or Global (passport/registration) → tier flow → status tracked → admin approval for Silver/Gold.
- **Order lifecycle:** create → manufacturer accept → escrow milestone 1 → production (QR-verified milestones) → QC → dispatch → buyer receipt → final release → close → reorder option.
- **Hiring (FabTalent):** search by type/specialisation → view profile → hire → escrow → gig-adaptive workspace → delegated (approval-gated) access → deliver → payment release → portfolio/FabScore update.

## 7. NON-FUNCTIONAL REQUIREMENTS
- **Migration-ready:** all DB via `db.ts`, standard PostgreSQL, env-var config (target AWS RDS).
- **Security:** RLS on all tables; secrets server-only; Aadhaar/card numbers never stored; data localised in India (RBI).
- **Reliability:** every fetch handles loading/empty/error; build passes clean; no duplicate systems.
- **Performance:** search usable at 10k+ vendors; mobile-first for FabChat and factory-floor tools.
- **Accessibility:** local language + voice (FabVoice) for low-literacy/basic-phone users.

## 8. SUCCESS METRICS
See `docs/PRODUCT/SUCCESS_METRICS.md`. Headline: verified users, real GMV through escrow, on-time-verified-milestone rate, enterprise SaaS MRR, artisan direct-earning uplift, dispute rate (should be near-zero with QR).

## 9. RELEASE STRATEGY
Phased per `ROADMAP.md`: make-trustworthy → trust core → complete public types → full enterprise → moat. Build screens first, connect data, then integrations.

## 10. CONSTRAINTS & DEPENDENCIES
- Escrow depends on licensed payment-aggregator partner approval.
- Real SMS depends on Twilio upgrade or 2Factor.in.
- Government verification depends on API providers (AuthBridge/Gridlines/eKYCNow etc.) + user consent.
- Credit depends on RBI-registered NBFC partner.
- EU DPP depends on the full QR chain being live (Gold tier).
