# AUTHENTICATION.md
> How users prove who they are.

## CURRENT
- Phone OTP via Supabase Auth + Twilio.
- Localhost dev bypass: OTP `123456`, gated to localhost/127.0.0.1 via window.location.hostname ONLY (A10).
- E.164 phone format (+91 + last 10 digits; validate 6–9 start).
- Prod fallback: on provider-specific error, show WhatsApp + waitlist (not on all errors).
- Post-OTP: profile lookup by phone routes to dashboard / onboarding-type / onboarding-profile.
- Phone confirmations ON (OFF caused auto-sessions across devices).

## PLANNED
- Password login option (OTP OR password; enterprise default) — M10.
- Session hardening; re-auth for sensitive actions (escrow release, credit accept).

## RULES
- Never auto-create a session without real verification in production.
- Never leak whether a phone is registered except where the flow requires (enquiry 404 is intentional).
- Rate-limit OTP requests when built.
