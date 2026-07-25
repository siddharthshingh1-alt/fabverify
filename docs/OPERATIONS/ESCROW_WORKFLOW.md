# OPERATIONS: ESCROW_WORKFLOW
> The step-by-step money flow (partner-held).

## FLOW
1. Order placed → buyer funds escrow (into licensed partner's escrow/nodal account, NOT FabVerify).
2. Funds held safely; FabVerify cannot touch them.
3. Milestone reached → QR-verified (geo+time+photo, within tolerance).
4. FabVerify sends release instruction to the partner.
5. Partner releases that milestone's funds to the maker/artisan.
6. Repeat per milestone; final receipt scan → final release → order closes.
7. Cancellation → refund via partner (permitted flow).

## RULES (legal)
FabVerify never holds funds (M1). Release only on verified milestones (M2). Merchant KYC gates payouts (M5). Permitted flows only; daily reconciliation; India-localised.

## BUILD PATH
Screens + release logic now with simulated money (M3) → connect licensed partner API when approved → same logic moves real money.

## FABFLOAT
48hr pay to maker: partner + credit fund the gap; maker paid fast, buyer pays on milestone terms.
