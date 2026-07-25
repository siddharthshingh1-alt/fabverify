# BUILD_RULES.md
> Paste when asking Claude Code to BUILD a new feature. Enforces the standards that keep the build bug-free and aligned.

---

## PASTE THIS WHEN BUILDING:

Build task: [DESCRIBE THE FEATURE]

Rules for this build:
1. FIRST check PROJECT_MEMORY.md — if any part exists, extend it, don't recreate it. Tell me what already exists.
2. Read the relevant docs/MODULES/[MODULE].md and docs/PRODUCT/USER_TYPES.md section for the intended behavior.
3. Read docs/ARCHITECTURE/DATABASE.md for real column names before writing any query. Never guess columns.
4. ALL database access goes through app/lib/db.ts. No Supabase imports anywhere else.
5. Every screen that fetches data handles loading, empty, AND error states.
6. Every API route: validate input, try/catch, correct status codes, use getErrorMessage().
7. Dynamic routes: params is a Promise — await it.
8. Every list .map() uses a guaranteed-unique key.
9. Full-screen modals use createPortal with a mounted guard.
10. No secrets in client code or NEXT_PUBLIC_*. No raw Aadhaar/card/password stored.
11. If it touches money: FabVerify never holds funds; escrow instructions go to the partner; releases only on verified milestones.
12. Keep it migration-ready: standard PostgreSQL, env-var config.

When done:
- Run `npm run build` — must pass zero TS errors. Fix all errors.
- Tell me exactly which files you created/changed and what to test.
- Update PROJECT_MEMORY.md (move status) and CHANGELOG.md.
- Write an accurate commit message (never overstate).

If anything conflicts with DECISIONS.md or CORE.md, STOP and tell me before proceeding.
