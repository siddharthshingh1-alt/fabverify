# DATA_PRIVACY.md
> How we handle personal and sensitive data.

## WHAT WE COLLECT
Identity (name, phone, city), business (GST/Udyam/PAN status), verification status, order/message data, photos.

## WHAT WE NEVER STORE
Raw Aadhaar numbers, card numbers, passwords in plaintext, raw government ID numbers. Verification stores STATUS (verified true/false + tier), never the underlying number.

## PRINCIPLES
- Consent-based verification (DigiLocker consent, GST lookup permission).
- Encrypt sensitive data at rest; TLS in transit.
- Data localised in India (RBI).
- Minimise: collect only what a feature needs.
- No compiling personal data across sources without purpose + consent.
- No personal data in URLs.

## USER RIGHTS (build toward)
Access, correction, deletion requests; clear privacy policy; the user controls their verification.

## PHOTOS
Move from base64-in-DB to object storage; access-controlled URLs; not public by default.
