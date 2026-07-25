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
- [ ] Vendor onboarding to real DB (invite → vendor becomes platform user).
- [ ] Visual Stock Panel (photo-based, category, dye-lot separation + "do not mix" warning, Inventory-Manager role).

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
