# MODULE: TRACEABILITY (QR — the spine)
> Platform-wide verified chain from dye lot to buyer's hands.

## PURPOSE
Prove production actually happened, at every stage, so money releases on reality — and generate the EU Digital Product Passport.

## WHAT IT DOES
- QR nodes at every stage: dye lot → fabric dispatch → manufacturer receipt → cutting/bundles → job-worker process → QC → finished goods → dispatch → buyer receipt.
- Each scan: geo-tag + timestamp + photo + verified scanner identity.
- Verification engine: unit-adaptive math (pieces×SMV vs meters), shift-proof photos, multi-style overtime tagging, 10–15% tolerance, three-level response.
- Escrow release tied to verified scans. Auto-generates EU DPP at Gold.

## STATUS
All 🔴 (design-locked in full). Bundle-level default (12–24 pc); milestone-level (5/order) simplest start; piece-level optional premium.

## KEY RULES (V1–V5)
Platform-wide, not per-user. Unit-adaptive math. Overtime verifiable (declared + timestamp-proven), never assumed. Tolerance buffer prevents false alarms; only impossible discrepancies flag (notify buyer + FabVerify team, hold payment). Bronze→Silver→Gold adoption.

## CONNECTS TO
EVERYTHING physical: Supply Chain, Orders, Payments (release), Identity (scanner), QC, Enterprise (stock), Compliance (DPP).

## DATA
Planned qr_nodes (entity, geo, timestamp, photo, scanner_id, prev_node_id) forming the chain.
