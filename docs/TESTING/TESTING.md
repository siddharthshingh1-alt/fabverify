# TESTING: OVERVIEW
> How we keep the "no bugs" standard real.

## CURRENT REALITY
Primary gate: npm run build (zero TS errors) + manual testing on live URL + browser console (F12) checks. No automated test suite yet.

## THE MANUAL TEST STANDARD (every feature)
- Happy path works end-to-end with real data.
- Empty state (no data) shows correctly.
- Error state (network/DB failure) handled gracefully.
- Wrong-user-type access redirects correctly.
- Mobile view doesn't break (esp. FabChat/artisan/job-worker).
- No console errors (red) after the flow.

## GROW TOWARD
Unit tests for db.ts functions + costing/capacity math; integration tests for order/escrow/verification flows; E2E for critical journeys.

## PRIORITY FOR AUTOMATION
Money (escrow release), verification (tier gates), capacity/tolerance math, FabScore — the safety-critical logic gets tests first.

## SEE ALSO
TEST_PLAN.md, ACCEPTANCE_CRITERIA.md, PERFORMANCE_TESTS.md, SECURITY_TESTS.md, QA_PROCESS.md.
