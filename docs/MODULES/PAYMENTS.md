# MODULE: PAYMENTS (Escrow)
> Money movement — via a licensed partner, never by FabVerify.

## PURPOSE
Protect both sides: buyer's money is safe, maker gets paid on verified proof. FabVerify orchestrates; a licensed partner holds funds.

## WHAT IT DOES
- Escrow funding on order (into partner account, not FabVerify).
- Milestone-based release on verified QR proof.
- Refunds on cancellation; commission; permitted flows only; daily reconciliation.
- FabFloat (48hr pay to maker) via partner + credit.

## STATUS
All 🔴 (design-locked, legally scoped). Build screens/logic with simulated money now (M3); connect real partner later.

## KEY RULES (legal — do not violate)
- FabVerify NEVER holds money / never opens its own bank (M1). Illegal under PSSA.
- Escrow/nodal account at a scheduled bank, operated by a licensed RBI payment aggregator.
- FabVerify controls release LOGIC only, triggered by verified milestones (M2).
- Merchant KYC (our verification) gates payouts (M5).

## CONNECTS TO
Orders (milestones) · Traceability (verified scan → release) · Identity (KYC gate) · Credit (FabFloat) · FabScore.

## DATA
Planned escrow_transactions (order_id, milestone_id, amount, status, partner_ref). orders has escrow_total/escrow_released.
