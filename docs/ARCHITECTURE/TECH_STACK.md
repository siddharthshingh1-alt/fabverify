# TECH_STACK.md
### The Technology Stack

---

## FRONTEND
- **Next.js** (App Router) — React framework; pages, layouts, server components, API routes in one project.
- **React** — UI. Functional components + hooks.
- **TypeScript** — type safety; build must pass with zero TS errors (CORE T9).
- **CSS** — inline styles + theme constants in `app/theme.ts` (⚠️ some hardcoded colors remain; sweep needed for true one-file theming — X4).
- **createPortal** (react-dom) — full-screen modals mount to `document.body` with a `mounted` guard (A11).

## BACKEND / DATA
- **Supabase** (current): Postgres database, Auth (phone OTP), Storage (photos — to be adopted), Row-Level Security.
- **`app/lib/db.ts`** — the single DB abstraction gateway. All DB access here (T1).
- **`app/lib/supabase.ts`** — Supabase client (URL trailing-slash-stripped, persistSession).
- **API routes** (`app/api/*`) — server-side, use service-role for privileged/dev operations.
- **Target: AWS RDS (Postgres)** — migrate by rewriting only `db.ts` (standard Postgres, env-var config).

## AUTH & MESSAGING
- **Supabase Auth** — phone OTP; localhost dev bypass `123456` (A10).
- **Twilio** — SMS delivery (⚠️ trial; upgrade or switch to **2Factor.in** for India).
- **WhatsApp** — notifications (planned).

## DEPLOYMENT & INFRA
- **Vercel** — hosting; auto-deploys on push to `main`.
- **GitHub** — `github.com/siddharthshingh1-alt/fabverify`.
- Environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (browser-safe), `SUPABASE_SERVICE_ROLE_KEY` (server-only, never `NEXT_PUBLIC_*`).

## PLANNED INTEGRATIONS (external partners)
- **Payment Aggregator / Escrow** (RBI-licensed) — Razorpay Route / Cashfree / Castler-class. Holds escrow; FabVerify instructs release. FabVerify never holds funds.
- **NBFC lending partner** (RBI-registered) — powers FabPay Later / FabFloat / FabMaterial; honest APR + KFS.
- **Government verification APIs** — AuthBridge / Gridlines / eKYCNow-class for Aadhaar (DigiLocker), PAN, GST, Udyam/MSME, CIN/MCA; global: passport + Companies House / VAT / EIN / Trade Licence.
- **Object storage** — Supabase Storage now → S3 on AWS later.

## LIBRARIES / TOOLS (allowed in-app)
- Standard React ecosystem; keep dependencies minimal and justified.
- Do NOT install the "ponytail"/write-least-code tool (X1) — use the mindset, not the tool; safety-critical code favors reliability.

## WHY THESE CHOICES
- **Next.js + Supabase + Vercel** — fastest path to a real, deployed, DB-backed product with auth, at near-zero cost, buildable by one person with Claude Code.
- **The `db.ts` seam + standard Postgres** — buys us the freedom to leave Supabase for AWS RDS without rewriting the app.
- **Partner integrations for money/credit/verification** — legal necessity + lets us stay asset-light and lean (the anti-Zilingo model).

## VERSIONING NOTES
- This Next.js version requires async dynamic route params: `params: Promise<{id}>` + `await params` (A9).
- Supabase errors are plain objects, not `Error` instances — always use the shared `getErrorMessage()` helper.
