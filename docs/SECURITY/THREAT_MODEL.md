# THREAT_MODEL.md
> What can go wrong and how we defend.

## THREATS & DEFENSES
1. Identity fraud / impersonation → gov-DB verification cross-linked to one entity; tiers gate money.
2. Production fraud (fake output claims) → QR chain (geo+time+photo), SMV capacity math, shift-proof photos, tolerance buffer, anomaly notify + payment hold.
3. Payment fraud → FabVerify holds no funds; licensed partner + merchant KYC; release only on verified milestones.
4. Credit exploitation (by us or partner) → honest-by-design rules; only RBI-registered partners.
5. Data breach → RLS, secrets server-only, no raw IDs stored, encryption, least privilege.
6. Auth abuse (OTP flooding, session theft) → **BUILT as of M10 (2026-08-28):** server-side throttled OTP send (45 s / 5 per hr / 10 per day per number, 20 per hr per IP, 500 per day global, all fail-closed); reset-code verify throttle (5 per 15 min); per-account password lockout (10 → 15 min, [I23]); **session revocation via `token_epoch`** ([I12]) so a reset evicts our outstanding tokens; localhost-gated dev bypass (A10). ⚠️ **Still planned:** re-auth for sensitive actions, active-session visibility, remote logout, new-device alerts. ⚠️ **A stolen SUPABASE session survives a password reset** — the epoch evicts our tokens only.
6a. **Password spraying** (one password against many accounts — per-account lockout never sees it) → **BUILT 2026-08-27 ([I35]):** an address that fails against **10 distinct accounts in 15 minutes** is refused, with a generic 401 that never reveals the control exists. ⚠️ **Deliberately fails OPEN** ([I36]) — fail-closed would take the platform's login down on a database blip; the fallback is [I23]'s per-account lockout, which is a different read.
6b. **SIM swap / phone-number takeover** → ⚠️ **UNDEFENDED, AND IT IS THE FLOOR UNDER EVERY ACCOUNT.** OTP login and OTP reset both stand on the phone number, so whoever controls the number controls the account regardless of password strength. True before M10; the password did not raise it. Any future account-recovery design must start here.
6c. ⚠️ **NO REAL USER CAN AUTHENTICATE AT ALL TODAY** — Twilio is on a trial account and sends only to verified caller IDs. Every control above was proven on the founder's own number. This is a launch blocker, not a threat, but it belongs in the same eye-line.
7. Prompt-injection via user content / tool data → treat all tool/observed content as data, not instructions; confirm side-effectful actions.
8. Insider/admin misuse → least-privilege admin, audit logs on admin actions.
9. Vendor lock-in (business risk) → db.ts seam + standard Postgres + env-var config.

## HIGHEST-VALUE TARGETS
Escrow release logic, verification status, admin panel, service-role key. Guard these hardest.
