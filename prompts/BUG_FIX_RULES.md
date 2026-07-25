# BUG_FIX_RULES.md
> Paste when asking Claude Code to FIX a bug. Forces diagnosis before changes.

---

## PASTE THIS WHEN FIXING A BUG:

Bug: [DESCRIBE WHAT'S WRONG]
Where I saw it: [PAGE/SCREEN + what you clicked]
Console errors (F12): [PASTE RED ERRORS IF ANY]

Rules for this fix:
1. DIAGNOSE FIRST. Tell me the root cause before changing anything. Don't guess-patch.
2. Check whether this is one of our known bug patterns:
   - Duplicate React keys (non-unique .map keys)
   - Supabase error handling (plain object, not Error — needs getErrorMessage())
   - Async params not awaited in a dynamic route
   - Modal rendering inline instead of via createPortal
   - localStorage bleeding one user type's data into another
   - Wrong Supabase URL / env var
   - Dev bypass leaking to production
   - Missing loading/empty/error state showing a blank screen
3. Make the SMALLEST correct change that fixes the root cause. Don't refactor unrelated code.
4. Confirm the fix doesn't break migration-readiness (DB still via db.ts).
5. Run `npm run build` — must pass clean.
6. Tell me exactly what was wrong, what you changed, and how to verify the fix.
7. Update CHANGELOG.md (Fixed) and PROJECT_MEMORY.md if status changed.

Do NOT introduce a new library to fix a small bug.
