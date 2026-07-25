# REVIEW_RULES.md
> Paste when asking Claude Code to REVIEW the codebase or a feature against the vision. Produces a gap report.

---

## PASTE THIS FOR A REVIEW:

Review scope: [WHOLE CODEBASE / SPECIFIC USER TYPE / SPECIFIC MODULE]

Compare what's built against:
- docs/PRODUCT/USER_TYPES.md (intended behavior)
- docs/PRODUCT/FEATURES.md (feature catalog + status)
- PROJECT_MEMORY.md (claimed status)
- CORE.md + DECISIONS.md (rules that must hold)

Produce a report with these sections:
1. WORKING CORRECTLY — what's genuinely built and DB-connected.
2. STATUS MISMATCHES — anything PROJECT_MEMORY.md claims that doesn't match reality (both directions).
3. RULE VIOLATIONS — any code that breaks CORE rules (DB not via db.ts, secrets exposed, money held by FabVerify, non-unique keys, missing states, Supabase-specific SQL, etc.).
4. BUGS FOUND — file, description, root cause, fix needed.
5. MISSING FOR THIS SCOPE — what USER_TYPES.md says should exist that doesn't.
6. MIGRATION RISKS — anything that would break the Supabase→AWS RDS move.

Do NOT fix anything yet — just report. I'll pick what to fix.
Be honest and specific (file + line where possible). Don't pad the report.
