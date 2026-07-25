# TESTING: TEST_PLAN
## CRITICAL FLOWS TO TEST (every release)
1. Signup/login (OTP; localhost bypass; prod fallback).
2. Manufacturer onboarding → appears in discovery.
3. Buyer: discover → enquiry → sample brief → bulk order → chat → track.
4. Manufacturer: receive enquiry/brief → accept order → milestones.
5. Verification: apply → Bronze auto / Silver-Gold pending.
6. FabChat: send text/photo/voice; read receipts; members-only guard.

## FUTURE FLOWS (as built)
Escrow fund/release (simulated then real), QR scan → milestone verify → release, capacity/overtime + tolerance, FabScore recompute, credit KFS + accept, enterprise team/permissions, visual stock panel.

## PER FLOW, CHECK
Happy path, empty, error, wrong-user-type, mobile, console-clean.
