# FabVerify
### The Operating System of India's Garment Industry
*From design idea to finished garment. One platform. Zero chaos.*
**Fair by design — from artisan to enterprise.**

---

## WHAT THIS IS
FabVerify is a verified, proof-based platform where everyone in India's garment industry — from a home-based artisan to the CEO of a ₹10,000-crore brand — runs their business: verified discovery, escrow-protected orders, QR-traceable production, portable FabScore reputation, and honest credit. Enterprises run their entire operation (fabric sourcing → accounts) with a CEO glance-view.

- **Live:** fabverify.vercel.app
- **Repo:** github.com/siddharthshingh1-alt/fabverify
- **Stack:** Next.js · Supabase (→ AWS RDS) · Vercel · Twilio

---

## FOR CLAUDE CODE — START HERE
Read these first, every session (see `prompts/SESSION_START.md`):
1. **CLAUDE.md** — how to behave (the constitution).
2. **PROJECT_MEMORY.md** — what already exists (never rebuild it).
3. **DECISIONS.md** — locked decisions (never silently reverse).
4. **CURRENT_SPRINT.md** + **TASKS.md** — what we're building now.
5. **CORE.md** — the non-negotiable rules.

Then follow `docs/ARCHITECTURE/CODING_STANDARDS.md` for every change.

---

## THE DOCUMENTATION MAP
```
Root:
  CLAUDE.md · CORE.md · VISION.md · PRODUCT_PRINCIPLES.md
  DECISIONS.md · PROJECT_MEMORY.md · ROADMAP.md
  BUSINESS_MODEL.md · CHANGELOG.md · CURRENT_SPRINT.md · TASKS.md

docs/PRODUCT/      — PRD, FEATURES, USER_TYPES, USER_PERSONAS,
                     USER_FLOWS, CUSTOMER_JOURNEYS, MVP_SCOPE,
                     FUTURE_SCOPE, SUCCESS_METRICS
docs/ARCHITECTURE/ — SYSTEM_ARCHITECTURE, DATABASE, API_SPECIFICATION,
                     FOLDER_STRUCTURE, TECH_STACK, DEPENDENCIES,
                     CODING_STANDARDS
docs/MODULES/      — 16 module specs (Identity/Trust, Payments,
                     Traceability, Supply Chain, FabMerch, FabCredit, …)
docs/SECURITY/     — SECURITY, AUTH*, DATA_PRIVACY, COMPLIANCE,
                     THREAT_MODEL, BACKUP_RECOVERY
docs/OPERATIONS/   — VERIFICATION, ORDER_PROTECTION, ESCROW_WORKFLOW,
                     DISPUTE, TRUST_SCORE, NOTIFICATION, SEARCH, MESSAGING
docs/DESIGN/       — DESIGN_SYSTEM, COLORS, TYPOGRAPHY, COMPONENTS,
                     ICONOGRAPHY, RESPONSIVE, UI_GUIDELINES
docs/DEVOPS/       — DEPLOYMENT, ENVIRONMENT, CI_CD, MONITORING,
                     LOGGING, INFRASTRUCTURE
docs/TESTING/      — TESTING, TEST_PLAN, ACCEPTANCE_CRITERIA,
                     PERFORMANCE, SECURITY_TESTS, QA_PROCESS
docs/BUSINESS/     — MONETIZATION, PRICING, GO_TO_MARKET,
                     SALES_PROCESS, CUSTOMER_SUPPORT, KPIS
github/            — MILESTONES, RELEASE_PLAN, ISSUES
prompts/           — SESSION_START, BUILD_RULES, BUG_FIX_RULES,
                     REVIEW_RULES, CODE_REVIEW_RULES
```

---

## THE FOUR RULES THAT MATTER MOST
1. **All DB access through `app/lib/db.ts`** (migration-ready; one-file swap to AWS RDS).
2. **FabVerify never holds money** — a licensed partner does; we control release logic only.
3. **Verification is real** (government-DB), never self-declared.
4. **Never rebuild what exists** — check `PROJECT_MEMORY.md` first.

---

## STATUS (honest)
**Works today (real DB):** signup/login, manufacturer profiles, discovery, enquiries, orders (place/accept/track), messages/FabChat, sample briefs, verification status.
**Next (Phase A):** real escrow, photo storage, WhatsApp notifications, admin verification approval, order completion.
Full status: `PROJECT_MEMORY.md`.

---

## LOCAL DEV
`C:\Users\sidda\Desktop\fabverify` · `npm run dev` (localhost; OTP bypass `123456` on localhost only) · `npm run build` must pass clean before every push · push to `main` auto-deploys.
