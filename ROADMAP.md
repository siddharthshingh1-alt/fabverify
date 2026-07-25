# ROADMAP.md
### The Build Order
> The sequence in which FabVerify gets built. Rationale: make what exists trustworthy before adding more; build the trust core; then complete user types; then full enterprise; then the moat. Never chase breadth over reliability.

---

## GUIDING RULE
Build order is always: **working screens → real DB connection → real integrations → advanced.** (CORE T8) And: make current features trustworthy before building new ones. A half-real platform that moves real money badly is worse than an honest screen-only demo.

---

## ✅ DONE (this far)
- Live deployment (Vercel), Supabase connected, RLS on all tables, `db.ts` abstraction layer.
- Real auth (OTP), per-user-type routing.
- Real: manufacturer profiles, discovery, enquiries, orders (place/accept/track), messages/FabChat, sample briefs, verification status.
- Full per-user-type + cross-cutting VISION locked (see USER_TYPES.md).
- Documentation system (this doc set).

---

## PHASE A — Make what exists trustworthy
*Before ANY new features. These close the gap between "demo" and "usable by a real business."*
1. **Real escrow** (integrate licensed payment-aggregator partner) — the entire trust promise.
2. **Supabase Storage for photos** — before base64 breaks production.
3. **WhatsApp notifications** — so users return (the doorbell).
4. **Admin verification approval panel** — so Silver/Gold actually complete.
5. **Order completion flow** + delivery-address persistence — so orders can close.
6. **Password login option** — OTP OR password.
7. **Real SMS** — upgrade Twilio or switch to 2Factor.in.

## PHASE B — The trust core
8. **QR milestone scanning** (in FabChat) — geo + time + photo.
9. **Geo-tagged photo proof** in production updates.
10. **SMV capacity + shift-proof + tolerance engine** (V2–V5).
11. **FabScore algorithm** — real calculation writing to `fabscore_history`.
12. **Government-DB verification APIs** — Aadhaar/DigiLocker, GST, Udyam, PAN, CIN wired for real.

## PHASE C — Complete the public user types
13. **Fabric Mill**: catalogue (meters/GSM/width), swatch flow, lab dips, dye lots, shade bands, colour library, dead-stock, meter-based verification.
14. **Trim Supplier**: 7-category catalogue, artboard approval, MOQ reserve, care-label checker.
15. **Artisan**: fair-price display, authenticity proof, GI-tag, complexity pricing, FabGovt, FabVoice.
16. **Job Worker**: parent-linked jobs, reconciliation, dual pricing, capacity calendar, shift-proof + overtime tagging.
17. **FabTalent**: portfolio auto-build, skill-verified badges, gig-adaptive workspace, delegated access.
18. **Designer**: tech-pack upload + version control + manufacturing flow.
19. **Master**: sample-round tracking, annotation loop, golden-sample lock.
20. **Merchandiser**: living T&A calendar, approval-chasing, multi-order health, daily to-do.
21. **QC**: 4-Point + AQL calculators, digital reports, debit notes.
22. **FabPricingEngine** (auto-costing) — used across types.
23. **Universal Item Identity** — one master ID, aliases, spec-fingerprint matching.

## PHASE D — Full enterprise (the ₹10,000cr vision)
24. **CEO money-first landing view**.
25. **11 departments as real modules** (Merchandising, Sourcing, Planning, MFP, QA, Production, Finance, Supply Chain, Compliance, Sustainability, Design-Coordination).
26. **Restructurable hierarchy** + **CFO builds own team** + **real role-based permissions**.
27. **Vendor onboarding to real DB** (existing vendors become platform users).
28. **Visual Stock Panel** (photo-based inventory, dye-lot separation, Inventory-Manager role).
29. Enterprise credit lines (FabPay Later, FabFloat, FabMaterial — honest by design).

## PHASE E — The moat
30. **FabComply / FabAudit / FabDPP** (EU Digital Product Passport) / **FabChemical** — EU-export access.
31. **FabSustain / FabCarbon**.
32. **FabGuide AI** (Claude assistant) / **FabNegoBot**.
33. **FabStandard** (published benchmarks) / **FabForecast**.

## ONGOING (every phase)
- Mobile responsiveness pass on the main platform.
- Migration-readiness audits (all DB through `db.ts`).
- Security & privacy hardening.
- Keep `PROJECT_MEMORY.md`, `CHANGELOG.md`, `DECISIONS.md` updated.

---

## THE MIGRATION MILESTONE
At a chosen point (target: within months, or when scale demands), migrate Supabase → AWS RDS by rewriting only `db.ts`. Everything else must already be standard-PostgreSQL and env-var-driven so this is a one-file change.

---

## PRIORITIZATION PRINCIPLE
When unsure what to build next: pick the thing that (a) makes an existing real feature trustworthy, or (b) unblocks enterprise SaaS revenue (the profit engine), over (c) a new public-type feature. Trust and enterprise revenue come before breadth.
