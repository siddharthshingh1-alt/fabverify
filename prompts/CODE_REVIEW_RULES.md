# CODE_REVIEW_RULES.md
> Paste when asking Claude Code to review a specific diff / recent changes before committing.

---

## PASTE THIS BEFORE COMMITTING:

Review the changes you just made against this checklist. For each item, confirm PASS or explain:

DATABASE
[ ] All DB access goes through db.ts (no Supabase imports elsewhere)
[ ] Real column names used (matches DATABASE.md)
[ ] Upserts specify onConflict; two-FK-to-users joins use explicit hints

API ROUTES
[ ] Input validated; try/catch; correct status codes
[ ] getErrorMessage() used (not error instanceof Error)
[ ] Dynamic route params awaited

CLIENT
[ ] loading + empty + error states all handled
[ ] Unique keys on every .map()
[ ] Full-screen modals via createPortal + mounted guard
[ ] No localStorage as source of truth for money/orders/verification

SECURITY
[ ] No secrets in client / NEXT_PUBLIC_*
[ ] No raw Aadhaar/card/password stored or logged
[ ] Dev bypass (if any) gated to localhost via hostname
[ ] .env.local still gitignored

MONEY/CREDIT (if touched)
[ ] No customer funds routed to a FabVerify account
[ ] Release only on verified milestone
[ ] Credit shows APR + KFS, no hidden charges

BUILD & MEMORY
[ ] npm run build passes with zero TS errors
[ ] PROJECT_MEMORY.md updated
[ ] CHANGELOG.md updated
[ ] Commit message is accurate (not overstated)
[ ] Migration-readiness intact

Report any FAIL and fix before committing.
