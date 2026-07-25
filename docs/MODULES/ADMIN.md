# MODULE: ADMIN
> Internal tools for the FabVerify team.

## PURPOSE
Let the FabVerify team run trust operations: approve verifications, review anomalies, handle disputes, manage the platform.

## WHAT IT DOES
- Verification approval panel (Silver/Gold pending → approve/reject → set tier + sync manufacturer_profiles).
- Anomaly review queue (QR/capacity flags → spot-check).
- Dispute handling; user/vendor management; waitlist review.
- Spot-check scheduling (random verification deterrent).

## STATUS
All 🔴. This is a Phase-A priority — Silver/Gold applications currently sit pending forever with no UI.

## KEY RULES
Least-privilege admin access. Every admin action logged. On verification approve: set tier, *_verified_at, sync manufacturer_profiles.verification_tier (M9). Anomaly notifications go to buyer + FabVerify team (V5).

## CONNECTS TO
Identity/Trust (approvals) · Traceability (anomalies) · Payments (dispute holds) · Notifications.

## DATA
verification_applications (live); planned anomaly/dispute/admin-audit tables.
