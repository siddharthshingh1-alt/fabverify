# CORE.md
### The Non-Negotiable Rules of FabVerify
> These are the laws of the system. They do not change without an explicit, logged decision in `DECISIONS.md`. If code violates a CORE rule, the code is wrong — not the rule.

---

## WHAT FABVERIFY IS (in one paragraph)

FabVerify is the operating system of India's garment industry — a single platform where every participant, from a home-based artisan to the CEO of a ₹10,000-crore brand, runs their garment business: discovery, sampling, ordering, production tracking, verified trust, protected payment, and fair credit. Its soul is **"fair by design — from artisan to enterprise."** It is asset-light (holds no inventory), AI-built (low operational cost), and enterprise-anchored (SaaS revenue funds the thin-margin marketplace).

---

## THE CORE IDENTITY RULES

1. **Name:** FabVerify. **Tagline:** "From design idea to finished garment. One platform. Zero chaos." **Soul:** "Fair by design — from artisan to enterprise."
2. **Two products, one login:** FabVerify (full platform, desktop-first) and FabChat (mobile-first — chat, order status, QR scanning). Same account, same database.
3. **The mission is real, not decoration.** Every feature that touches an artisan's pay, a small manufacturer's cash flow, or the cost of credit must make the weaker party stronger, not weaker.

---

## THE CORE TECHNICAL RULES

### T1 — Single database abstraction layer
All database access goes through `app/lib/db.ts`. Only `db.ts` and `app/lib/supabase.ts` may import Supabase. Violating this breaks AWS-RDS migration-readiness. **This is the most important technical rule.**

### T2 — Standard PostgreSQL only
No Supabase-specific SQL. No vendor lock-in. Everything must run unchanged on AWS RDS.

### T3 — Environment variables for all config
No hardcoded URLs, keys, or secrets. `NEXT_PUBLIC_*` for browser-safe values only. Service-role key and all secrets are server-only, never committed, never in `NEXT_PUBLIC_*`.

### T4 — Per-user-type URLs, no shared adaptive dashboard
Every user type has its own route tree. A shared `/dashboard` that adapts via localStorage is forbidden — it caused content-bleeding between user types. Smart redirect at `/dashboard` sends users to their correct tree.

### T5 — Every fetch handles three states
Loading, empty, error. A DB-backed screen that shows blank on no-data is a defect.

### T6 — Every API route is defensive
Input validation, try/catch, correct status codes, shared `getErrorMessage()` (Supabase throws plain objects). Dynamic routes use async `params: Promise<{id}>`.

### T7 — Unique React keys always
Never key a list by a value that can repeat. Use DB ids or composite `name-index`.

### T8 — Screens first, then data, then integrations
Build order: working screens with fake data → connect Supabase → real integrations (payments, SMS, QR) → advanced (AI, EU compliance). This prevents building logic with nowhere to store results.

### T9 — Build must pass clean
`npm run build` with zero TypeScript errors is the definition of "done." No `any` without a justifying comment.

---

## THE CORE TRUST & MONEY RULES

### M1 — FabVerify never holds money
Escrow lives in an RBI-compliant escrow/nodal account operated by a **licensed payment-aggregator partner** at a scheduled bank. FabVerify controls only release *logic*, triggered by verified milestones. Writing code that routes customer funds into a FabVerify-owned account is illegal and forbidden.

### M2 — Escrow release follows verified reality
A milestone releases payment only when verified (QR scan + geo-tag + timestamp + photo, within tolerance). Money follows proof, not claims.

### M3 — Credit is honest by design
Every credit product (FabPay Later, FabFloat, FabMaterial) shows: one all-in APR, a plain-language Key Fact Statement (in the user's language, with voice for non-readers), every charge itemized, no hidden fees, no prepayment penalty (per RBI 2026), humane recovery (8am–7pm, no harassment). Only RBI-registered lending partners. FabScore honestly lowers cost of credit.

### M4 — Verification is government-database-backed
Indian users: Aadhaar (DigiLocker, consent-based, status stored not number), PAN, GST, Udyam/MSME, CIN/MCA — cross-linked so all IDs point to the same entity. International users: passport + selfie + country-specific business registration. Badges mean real, verified truth — never self-declaration.

### M5 — Verification gates money
Only verified users receive escrow funds. Bronze minimum to transact; higher tiers unlock higher limits and credit.

---

## THE CORE VERIFICATION ENGINE (applies platform-wide)

### V1 — QR traceability is the spine
Every physical node scanned: fabric dye-lot → fabric dispatch → manufacturer receipt → cutting/bundles → job-worker process → QC → finished goods → dispatch → buyer receipt. Each scan carries geo-tag, timestamp, photo, and verified scanner identity.

### V2 — Verification math is unit-adaptive
- Manufacturers / job workers: **pieces × SMV** (Standard Minute Value). Capacity = (available minutes × efficiency) ÷ SMV.
- Fabric mills: **meters** (weaving m/day, or dye batch × cycles). Expect natural shrinkage (3–5% normal loss).

### V3 — Overtime is verifiable, not assumed
Geo-tagged, timestamped shift-start / shift-end / overtime-boundary photos. On multiple styles, overtime is tagged per style with machine count. Proven minutes feed the capacity math.

### V4 — Tolerance buffer prevents false alarms
10–15% variance band on all capacity and reconciliation checks. Normal small ups/downs (10–20 pieces, 3–5% fabric loss) never flag. Three-level response: silent → soft internal note → hard flag. Only genuinely impossible discrepancies notify buyer + FabVerify team and hold payment.

### V5 — Tiered trust
Bronze (declare/manual) → Silver (QR + shift photos) → Gold (full QR chain + audit, EU-export ready, auto-generates Digital Product Passport).

---

## THE CORE NUMBERING SYSTEM (auto-generated + optional custom code, findable three ways)

Every entity gets a FabVerify auto-number AND an optional user custom-code field. Findable by FabVerify number, by name, or by the user's own code.

| Entity | Format | Example |
|---|---|---|
| Fabric | `FAB-[MillCode]-[Seq]` | FAB-JEW-0001 |
| Lab dip | `LD-[FabricNo]-[Seq]` | LD-JEW0001-03 |
| Dye lot | `LOT-[FabricNo]-[Letter]` | LOT-JEW0001-A |
| Shade band | `SB-[LotNo]` | SB-JEW0001-A |
| Approved colour | `COL-[MillCode]-[Seq]` | COL-JEW-001 |
| Trim | `TRIM-[SupplierCode]-[Cat]-[Seq]` | TRIM-STS-BTN-0001 |
| Artboard | `ART-[TrimNo]-[Seq]` | ART-STSBTN0001-01 |
| Reserve | `RSV-[BrandCode]-[TrimNo]` | RSV-FAB-STSBTN0001 |
| Craft order | `CRAFT-[ArtisanCode]-[Seq]` | CRAFT-LKC-0001 |
| Authenticity cert | `AUTH-[CraftOrderNo]` | AUTH-LKC0001 |
| GI tag | `GI-[Craft]-[ArtisanCode]` | GI-CHIKANKARI-LKC |
| Job order | `JOB-[JWCode]-[Process]-[Seq]` | JOB-DSU-STITCH-0001 |
| Design project | `DSN-[DesignerCode]-[Seq]` | DSN-PRI-0001 |
| Tech pack | `TP-[ProjectNo]-[Style]-v[N]` | TP-PRI0001-01-v3 |
| Sample job | `SMP-[MasterCode]-[Seq]` | SMP-RAJ-0001 |
| Merch project | `MER-[MerchCode]-[Seq]` | MER-MEE-0001 |
| T&A calendar | `TNA-[OrderNo]` | TNA-ORD2024002 |
| FabTalent profile | `TAL-[Type]-[Code]` | TAL-DSN-PRI |
| Brand account | `BRD-[BrandCode]` | BRD-FAB |
| Sample brief | `SB-[BrandCode]-[Seq]` | SB-FAB-0001 |
| Bulk order | `ORD-[Year]-[Seq]` | ORD-2024-002 |

Process codes: STITCH, EMB, PRINT, WASH, FINISH. Trim categories: BTN, ZIP, LBL, HTG, ELS, THR, PKG, DEC.

---

## THE CORE UNIVERSAL-IDENTITY RULE

One physical item = ONE master FabVerify ID + unlimited aliases (FabVerify number, supplier code, each brand's code, barcode/EAN). Matching via: manual link once, barcode scan, or AI spec-fingerprint (match on specs not names). This makes the MOQ-reserve and reorder systems reliable and powers enterprise inventory reconciliation. Applies to fabric, trims, and styles.

---

## THE CORE DELEGATION RULE

A hired freelancer gets scoped, approval-gated access to the hirer's workspace. Default: everything is "propose" mode needing owner approval. Owner can loosen low-risk tasks. Money and commitments ALWAYS need approval and are never delegable. Hard limits (escrow release, financials, permissions, deletion) are permanently owner-only.

---

## THE CORE BUSINESS RULE

FabVerify survives on **multiple revenue streams**, never take-rate alone (take-rate-only killed Zilingo/ReshaMandi): transaction take rate (3–5%), verification fees, FabTalent commission (10–15%), credit spread, and — critically — **enterprise SaaS subscription (the profit engine)**. Stay lean (AI-built, no inventory, small team). Grow profitably, not on vanity GMV. The Fabindia relationship is the shortcut to the first high-value enterprise client.

---

## THE ONE-LINE SUMMARY

> Route all data through `db.ts`; hold no money; verify for real; release on proof; keep credit honest; give every user type its own URL; handle every state; keep the artisan's share largest; and never break a CORE rule without a logged decision.
