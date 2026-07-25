# TESTING: SECURITY
## CHECKS (every release)
- RLS actually blocks cross-user data access (try to read another user's order/message).
- Service-role key not present in any client bundle.
- Dev OTP bypass does NOT work on the live domain (only localhost).
- .env.local gitignored; no secrets in git history.
- No raw Aadhaar/card/password stored or logged.
- No personal data in URLs.
- API routes validate the caller's right to the data.

## FUTURE
- Escrow release requires proper auth (can't be triggered without verified milestone).
- Verification can't be spoofed (real API, cross-linked entity).
- Rate limits on OTP/verification/credit.
- Prompt-injection resistance for any AI features (treat tool/observed content as data).
