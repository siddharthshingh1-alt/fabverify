# SYSTEM_ARCHITECTURE.md
### How FabVerify Fits Together

---

## HIGH-LEVEL SHAPE
```
┌─────────────────────────────────────────────────────────┐
│  CLIENTS                                                  │
│  • FabVerify web (desktop-first)  — Next.js app          │
│  • FabChat mobile (/chat/*)       — same codebase, split │
│    later by copying the folder (A8)                      │
└───────────────┬─────────────────────────────────────────┘
                │ HTTPS
┌───────────────▼─────────────────────────────────────────┐
│  NEXT.JS APP (Vercel)                                     │
│  • Pages/routes per user type (/brand, /manufacturer, …) │
│  • Shared page components (components/pages/*)            │
│  • API routes (app/api/*) — server-side, service-role    │
│  • app/lib/db.ts  ← THE ONLY DB GATEWAY                   │
│  • app/lib/supabase.ts (client) / theme.ts / helpers     │
└───────────────┬─────────────────────────────────────────┘
                │ (only db.ts / supabase.ts talk to DB)
┌───────────────▼─────────────────────────────────────────┐
│  DATA & SERVICES                                          │
│  • Supabase Postgres (+RLS)   → later AWS RDS             │
│  • Supabase Auth (phone OTP)  → Twilio SMS               │
│  • Supabase Storage (photos)  → later S3                 │
└──────────────────────────────────────────────────────────┘
                │
┌───────────────▼─────────────────────────────────────────┐
│  EXTERNAL PARTNERS (integrations, mostly Phase A+)        │
│  • Payment Aggregator / Escrow (licensed) — holds money  │
│  • NBFC lending partner (RBI-registered) — credit         │
│  • Gov verification APIs (Aadhaar/DigiLocker, GST, Udyam,│
│    PAN, CIN) + global (passport, Companies House, VAT…)  │
│  • WhatsApp (notifications)                               │
└──────────────────────────────────────────────────────────┘
```

## KEY ARCHITECTURAL PRINCIPLES
1. **One DB gateway (`db.ts`).** The whole app depends on this seam. Migration = rewrite one file.
2. **Per-user-type routes, shared components.** Thin route wrappers check the user type, redirect if wrong, and render a shared page component with a `userType` prop (A5, A6). Prevents content-bleeding and duplication simultaneously.
3. **Screens → data → integrations.** Build UI first (fake data), connect Supabase, then wire external partners. Simulated money/OTP/QR until the real partner is ready.
4. **The platform orchestrates; partners hold risk.** FabVerify never holds money or lends; it instructs licensed partners and records verified state. This keeps us legal and lean.
5. **The verification engine is central.** QR nodes, SMV/capacity math, tolerance logic, and FabScore form one engine that many modules call — not per-module copies.

## REQUEST FLOW (typical read)
`Component → calls a db.ts function → db.ts uses supabase client (or a service-role API route for privileged ops) → returns typed data → component renders with loading/empty/error states.`

## REQUEST FLOW (privileged write, e.g. cross-user)
`Component → fetch('/api/…') → API route (server) → validates input → uses service-role client via helper → RLS bypassed safely server-side → returns status + data.`

## ESCROW FLOW (target)
`Buyer pays → funds land in partner escrow (not FabVerify) → production milestone QR-verified → FabVerify sends release instruction to partner → partner pays vendor → FabVerify records released state.` FabVerify never touches funds.

## VERIFICATION FLOW (target)
`User consents → FabVerify calls gov-DB API (Aadhaar/GST/Udyam/…) → cross-links to one entity → stores verified status (not raw IDs) → sets tier → gates escrow eligibility.`

## TRACEABILITY FLOW (target)
`Each node scan (dye lot, dispatch, receipt, bundle, process, QC, dispatch, receipt) → geo+time+photo+identity → appended to the garment's QR chain → drives milestone verification + escrow release + (at Gold) EU Digital Product Passport generation.`

## SCALING & SPLIT PLAN
- FabChat can become a separate Next.js deployment by copying `/chat` (A8) when mobile scale warrants.
- DB migrates Supabase → AWS RDS via `db.ts` (see DATABASE.md migration notes).
- Photos move base64 → Supabase Storage → S3.
- Heavy verification/QR processing can move to background jobs/queues when volume grows.

## SECURITY POSTURE (summary; detail in docs/SECURITY/*)
RLS on all tables; secrets server-only (never `NEXT_PUBLIC_*`); Aadhaar/card numbers never stored; dev bypass gated to localhost; data localised in India (RBI); least-privilege API routes.

## WHAT DOES NOT LIVE HERE
Design tools (external — Illustrator/CAD/AI). Inventory (asset-light — none held). A FabVerify-owned money account (illegal — partner holds escrow). A FabVerify lending book (partner NBFC lends).
