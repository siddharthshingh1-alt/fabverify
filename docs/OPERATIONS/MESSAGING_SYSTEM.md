# OPERATIONS: MESSAGING_SYSTEM
> FabChat operations.

## CURRENT
Real conversations + messages (5s poll, read receipts, optimistic send + rollback). Voice notes, camera, contact profile sheet. Members-only guard. Per-user-type FabChat URLs.

## RULES
Members-only (ChatAuthGuard): strangers → members-only screen; incomplete onboarding → /onboarding. Enquiry seeds first message. Photos/voice → move to Storage (base64 temporary).

## PLANNED
Real-time (replace polling) at scale; QR scan tab wired to backend; notifications on new message; message search.

## OPS
Monitor delivery; abuse/spam controls; retention policy.
