# DEVOPS: ENVIRONMENT
## LOCAL
- Path: C:\Users\sidda\Desktop\fabverify
- .env.local holds secrets (gitignored). Never commit.
- npm run dev for local; localhost enables the OTP dev bypass (123456).

## ENV VARS
- NEXT_PUBLIC_SUPABASE_URL — bare project URL (the /rest/v1/ suffix bug broke auth; keep it bare).
- NEXT_PUBLIC_SUPABASE_ANON_KEY — browser-safe.
- SUPABASE_SERVICE_ROLE_KEY — SERVER ONLY, never NEXT_PUBLIC_*, never committed.

## RULES
NEXT_PUBLIC_* = browser-exposed (safe values only). No prefix = server-secret. Prefix mistakes leak secrets or break server logic.

## ENVIRONMENTS
Local (dev bypass on) · Production (Vercel, real OTP). Keep behavior differences gated by hostname, never NODE_ENV for the OTP bypass (A10).
