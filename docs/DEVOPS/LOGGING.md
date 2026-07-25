# DEVOPS: LOGGING
## PRINCIPLES
- Log enough to debug, never sensitive data.
- NEVER log: Aadhaar/card numbers, passwords, service-role key, full tokens, OTPs.
- Log: request IDs, error messages (getErrorMessage), status codes, non-sensitive context.

## ADMIN AUDIT
Log admin actions (verification approvals, dispute resolutions, releases) with who/when/what — for accountability.

## MONEY/VERIFICATION
Log release instructions and verification outcomes (status only) for reconciliation — never the underlying IDs.

## RETENTION
Keep operational logs long enough for debugging + reconciliation; purge/anonymize per privacy policy.
