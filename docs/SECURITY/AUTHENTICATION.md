# AUTHENTICATION.md
> How users prove who they are.
>
> ⚠️ **REWRITTEN 2026-08-28 BY THE M10 DOCS SWEEP (chunk 2.9).** Until then this
> file described the pre-M10 world: it listed password login under **PLANNED**,
> said "rate-limit OTP requests **when built**", and mentioned neither our own
> session token, `token_epoch` revocation, lockout, reset, nor anti-spraying —
> all of which had been live and production-proven for a week. It is the file a
> session opens to learn how authentication works, and it was the most stale
> document in the repository. Keep it current or it becomes a trap.

## CURRENT — all of this is built and production-proven

### Two ways in
- **Password (PRIMARY).** Phone + password. Hashes are argon2id in **our own
  `user_credentials` table** ([I10], [I13]) — never in Supabase Auth, never a
  `users` column. `POST /api/auth/password-login`.
- **OTP (FALLBACK).** Phone OTP via Supabase Auth + Twilio. The **send is
  server-side and throttled** since 2.6c (`POST /api/auth/otp/send`); the
  *verify* still happens in the browser for login/signup.
- **Reset.** "Forgot password?" → `/reset-password` → OTP → new password
  (`POST /api/auth/password-reset`). Verifies the code **server-side**, then
  writes the hash, **bumps `token_epoch`** and clears the lockout in ONE
  statement.

### Sessions
- **We issue and verify our own signed token** (HS256 JWS, 7-day TTL, `sub =
  users.id`) — [I19]–[I22]. This is the migration safety net: it verifies
  identically on Vercel, on AWS, and during a parallel run.
- **Resolution ladder:** our token FIRST, then Supabase ([I29]). Never peek at a
  claim to choose a verifier.
- **Revocation is `token_epoch`** ([I12]) — an integer on the credential row. A
  token carries the epoch it was minted under; anything below the current value
  is refused. A reset is a `+1`.
- ⚠️ **The epoch evicts OUR tokens ONLY. A stolen SUPABASE session survives a
  reset**, and every OTP login still mints one. **Never claim reset "ends all
  your sessions."**

### Rate limiting — built, not planned
| Control | Limit | Fails |
|---|---|---|
| OTP send, per number | 45 s cooldown · 5/hr · 10/day | **closed** (D3) |
| OTP send, per IP | 20/hr · 60/day | **closed** |
| OTP send, global | 500/day — blocks | **closed** |
| Reset-code verify, per number | 5 per 15 min ([I33]) | **closed** |
| Password attempts, per account | 10 → 15 min lockout ([I23]) | n/a |
| Password spraying, per address | 10 distinct FAILED accounts / 15 min ([I35]) | ⚠️ **OPEN** ([I36]) |

⚠️ **The anti-spray control is the one that fails OPEN, and that is deliberate.**
Fail-closed there would lock every user out of the platform on a database blip
and buy nothing, because the same outage stops `verifyPasswordCredential`
authenticating anyone. **Do not copy that exception anywhere else.**

⚠️ **It counts DISTINCT FAILED ACCOUNTS, not attempts.** [I23] refused per-IP
attempt caps because they let one attacker behind an office NAT lock out every
real user. Counting distinct failed accounts inverts that: a sprayer produces
the signal by definition, an office does not. **A successful login clears that
account's rows for that address** — without which a large office would trip it
on ordinary Monday traffic.

### Other current facts
- Localhost dev bypass: OTP `123456`, gated on `window.location.hostname` ONLY
  (A10) — never `NODE_ENV`.
- E.164 phone format (+91 + last 10 digits; validate 6–9 start).
- Prod fallback: on provider-specific errors, show WhatsApp + waitlist — not on
  all errors, and ⚠️ a *throttle* refusal must never be mistaken for one, or a
  throttled user gets a dead end instead of "wait and retry".
- Phone confirmations ON (OFF caused auto-sessions across devices).
- The reset path holds every response to a **5000 ms timing floor** (D4) so a
  registered and an unknown number are indistinguishable by clock.

## 🛑 THE GAP THAT MATTERS MOST

**Twilio is on a TRIAL account: it sends only to verified caller IDs.** A real
user on an arbitrary number **cannot receive an OTP at all** — so they cannot
sign up, log in, or reset. Every control above was proven on the founder's own
number. **None of this is reachable by a real user until Twilio is upgraded or
2Factor.in is wired in.** See PROJECT_MEMORY KNOWN ISSUES.

## STILL OPEN
- `/api/dev-auth/lookup` is unauthenticated and returns a full `users` row for
  any phone. PII disclosure and enumeration; not account takeover.
- A database outage routes an EXISTING user into onboarding (`res.ok` unchecked
  in `login`/`signup`) — must be fixed before or with any lookup lockdown.
- New-user signup through the [I27] set-password gate has never been run
  end-to-end on a genuinely new account.
- Session hardening beyond revocation: no active-session list, no remote logout,
  no new-device alert, no re-auth for sensitive actions.

## RULES
- **Never store passwords in Supabase Auth.** This rules out
  `signInWithPassword()` — the convenient thing that looks like it solves M10.
- Never auto-create a session without real verification in production.
- **Never leak whether a phone is registered.** Every failure on the login,
  reset and OTP-send paths returns ONE opaque result; a 400 must never be
  reachable by a credential mistake, only by a malformed request.
- **A throttle refusal must not reveal account existence** — every counter is
  keyed on the caller's own history, never on account state.
- ⚠️ **Never call an `auth.*` method that can establish a session on a client
  whose privileges anything else depends on** ([I34]). `verifyOtp` saves a
  session on whatever client it touches, and supabase-js prefers that session
  over the client's own key — on the shared admin client it silently downgrades
  the entire data layer to that one user.
