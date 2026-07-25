# API_SPECIFICATION.md
### The API Contract
> All routes live in `app/api/*`, are server-side, and use the service-role client via helpers for privileged operations. Every route: validates input, try/catch, correct status codes, `getErrorMessage()`. Dynamic routes await params. This documents the live routes and the planned ones.

Conventions: JSON in/out. Success 200 (or 201 on create). Client errors 400/401/403/404. Server errors 500. Never return secrets or raw government IDs.

---

## LIVE ROUTES

### Orders
`GET /api/orders?userId=&role=` → orders where user is buyer or manufacturer.
`POST /api/orders` → create order (body: buyer_id, manufacturer_id, style_name, quantity, price_per_piece, delivery_date, …). Auto-creates 5 `order_milestones`. Returns created order.
`GET /api/orders/[id]` → single order + milestones (await params).
`PATCH /api/orders/[id]` → update status (accept/decline/progress) or milestone. (await params).

### Messages / Conversations
`GET /api/conversations?userId=` → conversation list (latest message per counterparty/order).
`GET /api/messages?userId=&otherId=&orderId=` → messages in a thread.
`POST /api/messages` → send (sender_id, receiver_id, order_id?, content, message_type, media_url?). Optimistic UI on client with rollback.
`POST /api/messages/read` → mark messages read (sets read_at).

### Sample Briefs
`GET /api/sample-briefs?buyerId=` (own) or open briefs for manufacturers.
`POST /api/sample-briefs` → create (buyer_id, title, category, description, quantity, budget_min/max).
`GET /api/sample-briefs/[id]` → single brief (await params).
(Manufacturer respond → sends a message + flips brief status to `responses_received`.)

### Verification
`GET /api/verification?userId=` → tier + status + application state.
`POST /api/verification` → submit application (user_id, tier, documents). Bronze auto-approves (sets tier + bronze_verified_at). Silver/Gold → `verification_applications` pending. On silver/gold approval, sync `manufacturer_profiles.verification_tier` (M9).

### Manufacturers
`GET /api/manufacturers?filters…` → discovery list (visible profiles; filters: category, city, MOQ, tier). Loading/empty handled client-side.

### Enquiries
`POST /api/enquiries` → send (sender_id, receiver_id, subject, message). Rejects if receiver phone not a registered user (404). Seeds an initial chat message bridging enquiry → chat.
`GET /api/enquiries?userId=` → sent/received.

### Dev Auth
`GET /api/dev-auth/lookup?phone=` → profile by phone (service-role). Drives post-OTP routing (dashboard / onboarding-type / onboarding-profile).

### Waitlist
`POST /api/waitlist` → add (email?, phone?). Used by prod OTP fallback.

---

## PLANNED ROUTES (build per ROADMAP)

### Storage
`POST /api/upload` → upload photo/voice to Supabase Storage; return URL. (Replaces base64 in `media_url`.)

### Escrow (simulated → partner)
`POST /api/escrow/fund` → record buyer funding (simulated; later → partner PA).
`POST /api/escrow/release` → on verified milestone, instruct release (simulated; later → partner). Never moves money through FabVerify.
`GET /api/escrow?orderId=` → escrow state per order/milestone.

### QR / Traceability
`POST /api/qr/generate` → generate node QRs for an order (milestone/bundle level).
`POST /api/qr/scan` → record a scan (entity, geo, timestamp, photo, scanner_id, prev_node). Runs verification (capacity/tolerance) → may trigger release or anomaly notification.
`GET /api/qr/chain?entityId=` → full traceability chain (→ DPP at Gold).

### FabScore
`GET /api/fabscore?userId=` → current score + history.
(Internal) score recompute on verified events → writes `fabscore_history`.

### Government Verification
`POST /api/verify/aadhaar` (DigiLocker consent), `/pan`, `/gst`, `/udyam`, `/cin`, `/global` — call provider APIs, store status not raw IDs, cross-link entity.

### Credit
`POST /api/credit/apply` → application; returns Key Fact Statement (APR, all charges, no hidden). `POST /api/credit/accept` → accept after KFS shown.

### Enterprise
`GET/POST /api/enterprise/team`, `/roles`, `/permissions`, `/vendors/invite`, `/inventory` (visual stock panel), `/departments/*`.

### Costing
`POST /api/costing/calculate` → given known inputs, return full auto-costed breakdown (consumption, fabric, trims, CMT, overhead, reject gross-up, margin, final). Pulls FAB/TRIM/FabPrice + SMV.

### Notifications
`POST /api/notify/whatsapp` → send templated WhatsApp notification.

---

## ERROR SHAPE (standard)
```json
{ "error": "human-readable message" }   // with appropriate HTTP status
```
Success returns the resource or list directly (or `{ data, … }` where pagination is needed).

## SECURITY ON ROUTES
- Service-role key is server-only; never sent to client.
- Validate the caller's right to the data (userId matches session / participant check) — don't trust client-supplied IDs blindly for reads of others' data.
- Rate-limit sensitive routes (OTP, verification, credit) when built.
- Never place personal/sensitive data in URL query strings for anything sensitive (use POST bodies).
