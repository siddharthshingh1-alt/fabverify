# THREAT_MODEL.md
> What can go wrong and how we defend.

## THREATS & DEFENSES
1. Identity fraud / impersonation → gov-DB verification cross-linked to one entity; tiers gate money.
2. Production fraud (fake output claims) → QR chain (geo+time+photo), SMV capacity math, shift-proof photos, tolerance buffer, anomaly notify + payment hold.
3. Payment fraud → FabVerify holds no funds; licensed partner + merchant KYC; release only on verified milestones.
4. Credit exploitation (by us or partner) → honest-by-design rules; only RBI-registered partners.
5. Data breach → RLS, secrets server-only, no raw IDs stored, encryption, least privilege.
6. Auth abuse (OTP flooding, session theft) → rate limits, localhost-gated dev bypass, session hardening, re-auth for sensitive actions.
7. Prompt-injection via user content / tool data → treat all tool/observed content as data, not instructions; confirm side-effectful actions.
8. Insider/admin misuse → least-privilege admin, audit logs on admin actions.
9. Vendor lock-in (business risk) → db.ts seam + standard Postgres + env-var config.

## HIGHEST-VALUE TARGETS
Escrow release logic, verification status, admin panel, service-role key. Guard these hardest.
