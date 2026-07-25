# MODULE: COMMUNICATION (FabChat)
> Order-linked messaging + mobile FabChat.

## PURPOSE
Replace scattered WhatsApp with in-platform, order-linked, members-only communication — plus a mobile-first FabChat for on-the-go chat, status, and QR scanning.

## WHAT IT DOES
- Real conversations + messages (5s poll, read receipts, optimistic send + rollback).
- FabChat mobile 3-tab shell (Chats/Orders/Scan), per-user-type URLs.
- Voice notes, direct camera capture, contact profile bottom sheet.
- Members-only auth guard (ChatAuthGuard).

## STATUS
Messaging ✅ · FabChat shell ✅ · voice/camera/contact-sheet ✅ · members-only guard ✅ · photos ⚠️ base64 · QR scan tab 🟡.

## KEY RULES
Photos/voice must move to Supabase Storage (base64 temporary). Strangers see members-only screen; incomplete-onboarding → /onboarding. Enquiry seeds the first message.

## CONNECTS TO
RFQ (seeds chat) · Orders (order-linked threads) · Traceability (scan tab) · Identity (members-only).

## DATA
messages, conversations derived from messages (live).
