# TESTING: QA_PROCESS
## FLOW
1. Build feature per BUILD_RULES.
2. Self-review per CODE_REVIEW_RULES checklist.
3. npm run build clean.
4. Manual test: happy/empty/error/wrong-type/mobile; console clean.
5. Deploy to Vercel; verify on live URL.
6. Update PROJECT_MEMORY + CHANGELOG; accurate commit.
7. Periodic full REVIEW (REVIEW_RULES) to catch drift between docs and reality.

## ROLES (solo + Claude Code)
Founder = product acceptance + real-world testing. Claude Code = build + self-review + build-gate. Both keep PROJECT_MEMORY honest.

## BUG HANDLING
Use BUG_FIX_RULES: diagnose root cause first, smallest correct fix, verify, log in CHANGELOG.
