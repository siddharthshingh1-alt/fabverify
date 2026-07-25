# SECURITY.md
> The security posture of FabVerify. This is a trust platform handling identity, money instructions, and government IDs — security is existential, not optional.

## PRINCIPLES
1. Least privilege everywhere (users, API routes, admin).
2. Never store what you don't need (Aadhaar → status only, never the number).
3. Secrets server-only, never in client or git.
4. Verify the caller's right to data — don't trust client-supplied IDs for others' data.
5. Defense in depth: RLS + API validation + input sanitization.

## THE NON-NEGOTIABLES
- RLS on every table (row-level access by owner/participant).
- SUPABASE_SERVICE_ROLE_KEY server-only; never NEXT_PUBLIC_*; never committed.
- Aadhaar / card numbers / passwords / raw government IDs: NEVER stored. Store verified status only.
- Dev OTP bypass gated to localhost via window.location.hostname (never NODE_ENV) — A10.
- .env.local gitignored; verify before every commit.
- Data localised in India (RBI requirement for payment data).
- No personal/sensitive data in URL query strings.

## MONEY & CREDIT SECURITY
- FabVerify never holds funds (M1) — removes a huge attack surface + legal risk.
- Escrow release instructions authenticated to the licensed partner.
- Credit data (KFS, APR) handled per RBI; recovery data access-restricted.

## ATTACK SURFACES TO GUARD
- Auth (OTP flooding → rate limit), verification APIs (consent + rate limit), escrow release (strong auth), file upload (type/size validation), admin panel (least privilege + audit log).

## SEE ALSO
AUTHENTICATION.md, AUTHORIZATION.md, DATA_PRIVACY.md, COMPLIANCE.md, THREAT_MODEL.md, BACKUP_RECOVERY.md.
