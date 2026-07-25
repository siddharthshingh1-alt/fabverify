# GITHUB: RELEASE_PLAN
## CADENCE
Continuous deploy (Vercel on push to main). Group meaningful changes into logical commits; keep main always deployable.

## RELEASE STEPS
1. Build feature (BUILD_RULES) on a branch.
2. Self-review (CODE_REVIEW_RULES); npm run build clean.
3. Manual test (happy/empty/error/wrong-type/mobile).
4. Merge to main → auto-deploy.
5. Verify live; update CHANGELOG + PROJECT_MEMORY.

## VERSIONING
Tag major milestones (M1–M5). Use CHANGELOG.md as the human-readable release history.

## SAFETY-CRITICAL RELEASES (money/verification)
Extra review; simulated-money testing before real-partner switch; never ship an untested escrow/credit path to real money.

## ROLLBACK
Vercel redeploy previous; git revert. Every version recoverable.
