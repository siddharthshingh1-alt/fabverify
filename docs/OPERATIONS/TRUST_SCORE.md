# OPERATIONS: TRUST_SCORE (FabScore)
> The portable reputation engine.

## INPUTS (planned)
On-time delivery/return rate, quality pass rate (QC), piece-count/meter reconciliation accuracy, verified-scan completeness, dispute rate, repeat-hire rate, verification tier.

## OUTPUT
A score that: ranks discovery, unlocks limits, and honestly lowers cost of credit (M5).

## RULES
Built from VERIFIED behavior only (not self-report). Honest — a better track record genuinely lowers risk and APR. Transparent to the user (they see what moves it). Writes to fabscore_history.

## STATUS
Display 🟡; algorithm 🔴 (table exists). Build in Phase B.

## OPS
Recompute on verified events; audit anomalies; prevent gaming (only verified events count).
