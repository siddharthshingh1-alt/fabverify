/**
 * OTP REQUEST POLICY — the throttle numbers, in one place (M10 chunk 2.6c).
 *
 * BROWSER-SAFE BY CONSTRUCTION: no imports, no secrets, no I/O. It is imported
 * by `login/page.tsx` and `signup/page.tsx` (both "use client") for the resend
 * countdown, and by the server route for the limits. Keep it that way — the
 * hashing key and every database call live in otpThrottle.server.ts and db.ts
 * respectively, precisely so this file can cross the client boundary.
 *
 * ⚠️ THE LIMITS ARE PUBLIC INFORMATION AND THAT IS FINE. An attacker learns
 * "5 per hour" by trying it; a defence that depends on the threshold being
 * secret is not a defence. Nothing here is a credential.
 *
 * Locked with the founder 2026-08-22 (chunk 2.6c decisions D1/D6).
 */

/**
 * What the code is being requested FOR.
 *
 * ⚠️ THIS IS NOT COSMETIC — it decides whether the provider may CREATE an
 * account for an unknown number:
 *   · login / signup → shouldCreateUser TRUE. Signup depends on it: chunk
 *     1.7's production test was proven by the provider setting
 *     `phone_confirmed_at` on a brand-new auth user. Flipping it breaks every
 *     new signup.
 *   · reset          → shouldCreateUser FALSE. "Forgot password" for a number
 *     with no account must never mint a phantom auth user, and must never SMS
 *     a stranger.
 */
export type OtpPurpose = "login" | "signup" | "reset";

const OTP_PURPOSES: readonly OtpPurpose[] = ["login", "signup", "reset"];

/**
 * Validates caller-supplied purpose. Unknown values are NOT rejected by the
 * route — they fall back to "login", the most restrictive send (no account
 * creation is not the concern; an unknown purpose must never accidentally
 * select the reset path's different provider behaviour).
 */
export function asOtpPurpose(value: unknown): OtpPurpose {
  return typeof value === "string" && (OTP_PURPOSES as readonly string[]).includes(value)
    ? (value as OtpPurpose)
    : "login";
}

/**
 * ⚠️ THE CLIENT COUNTDOWN AND THE SERVER COOLDOWN ARE THE SAME NUMBER, AND
 * THAT IS LOAD-BEARING (decision D6, 2026-08-22).
 *
 * This was a local `const RESEND_SECONDS = 45` duplicated in login/page.tsx
 * and signup/page.tsx. Now that a SERVER floor exists, the two must agree: if
 * the server cooldown were HIGHER than the client countdown, the UI would
 * enable its "Resend OTP" button at 45s and the request would be refused with
 * 429 — a login screen that looks broken. If it were LOWER, the limit would
 * simply never bind.
 *
 * Hoisting it also closes the login/signup drift class the auth seam exists to
 * prevent: there is now exactly one definition of this number in the codebase.
 */
export const OTP_RESEND_SECONDS = 45;

/**
 * PER-NUMBER LIMITS — the real control.
 *
 * Deliberately tight enough to bound the cost and the nuisance of targeting
 * one number, and loose enough that an honest user who mistypes their number
 * twice and retries never meets them.
 */
export const OTP_PER_PHONE_HOURLY = 5;
export const OTP_PER_PHONE_DAILY = 10;

/**
 * PER-IP LIMITS — ⚠️ A COST CIRCUIT-BREAKER, NOT A SECURITY CONTROL, and the
 * numbers are generous on purpose (decision D5, 2026-08-22).
 *
 * Two independent reasons never to tighten these into a security mechanism:
 *   1. [I23]'s NAT problem. An office or a mobile carrier shares one egress
 *      IP across thousands of real users, so a tight per-IP limit converts a
 *      brute-force defence into a denial-of-service tool aimed at exactly the
 *      users we are trying to protect.
 *   2. ⚠️ THE IP ITSELF IS CLIENT-SUPPLIED. It is read from x-forwarded-for,
 *      whose leftmost entry any caller can set to anything. A determined
 *      attacker rotates it for free. It stops accidental floods and buggy
 *      clients; it does not stop an adversary, and nothing here should be
 *      described as if it does.
 * The per-number limits above are what actually bind an attacker, because a
 * phone number is the one thing they cannot forge — the SMS has to arrive
 * somewhere.
 */
export const OTP_PER_IP_HOURLY = 20;
export const OTP_PER_IP_DAILY = 60;

/**
 * GLOBAL DAILY CEILING — the SMS spend circuit-breaker.
 *
 * ⚠️ THIS IS A SELF-DoS IF IT EVER TRIPS: once the platform has sent this many
 * codes in 24 hours, NOBODY can request another one until the window rolls.
 * That is the deliberate trade — an unbounded SMS bill is worse — but it is
 * why the number sits far above any plausible real day (current volume is
 * roughly zero) and why tripping it logs loudly rather than silently.
 * ⚠️ RAISE THIS BEFORE A LAUNCH OR A CAMPAIGN, not after the first user
 * complains they cannot log in.
 */
export const OTP_GLOBAL_DAILY = 500;

/**
 * How long a request row is kept. Purged opportunistically on write.
 *
 * ⚠️ IT MUST EXCEED THE LONGEST WINDOW ABOVE (24h) OR THE DAILY LIMITS STOP
 * WORKING — rows would be deleted while still inside the window they are
 * counted in. 48h is that 24h plus a full day of slack.
 * ⚠️ AND IT MUST NOT GROW MUCH BEYOND IT. This table is a throttle counter,
 * not an audit log; a longer retention rebuilds the PII pile the phone hashing
 * exists to prevent.
 */
export const OTP_REQUEST_RETENTION_HOURS = 48;

/**
 * ⚠️ THE RESET-PATH TIMING FLOOR (decision D4, 2026-08-22) — the defence
 * against an existence oracle made of latency.
 *
 * On the reset path the provider is called for EVERY number, registered or
 * not, so no existence check is skipped and no round trip is saved. But the
 * provider itself still behaves differently: for a registered number it sends
 * an SMS (slow), and for an unknown one with shouldCreateUser=false it refuses
 * (fast). That difference is visible to a remote prober as response time, and
 * it would hand back exactly the account-existence answer the uniform body is
 * written to withhold.
 *
 * So a reset response never returns before this many milliseconds have
 * elapsed. Both outcomes are then bounded below by the same number.
 *
 * ⚠️ A floor only masks a difference it EXCEEDS. This value is now MEASURED
 * against production rather than estimated — the original 2000 was chosen
 * before the provider leg could be observed at all, and it was WRONG.
 *
 * PRODUCTION MEASUREMENT, 2026-08-24 (real Twilio send, founder's number, LAN
 * production build):
 *   registered reset, end to end ....... 4722 ms   ← the ceiling to clear
 *     · throttle check (3 sequential DB round trips) .. 2981 ms  (63%)
 *     · record write + provider send ................. 1741 ms  (37%)
 *   unknown-number refusal, end to end . 2011–2928 ms (n=10)
 *   raw provider refusal leg ........... 352 ms median, 1562 ms max (n=12)
 *
 * At 2000 the floor contributed ZERO on the send path — the work already
 * exceeded it, `remaining` went negative, and no sleep happened. It was inert
 * on BOTH legs (4 of 10 refusals also ran over), leaving roughly 1800–3200 ms
 * of existence-dependent signal fully exposed. 6000 clears the measured
 * ceiling with margin for the tail, and stays under Vercel's 10 s limit.
 *
 * ⚠️ 63% OF WHAT THIS FLOOR PADS AROUND IS OUR OWN LATENCY, NOT THE PROVIDER.
 * checkOtpThrottle makes three SEQUENTIAL awaited round trips to Singapore on
 * the accepted path. Making the IP read and the global count concurrent (the
 * phone read must stay first, or the cooldown early-return that makes hammering
 * cheap to reject is lost) should let this drop to ~4000. That is a scheduled
 * follow-up chunk and a HARD PREREQUISITE OF 2.8b — a 6 s reset is acceptable
 * for a founder testing it, not for real users meeting it in the reset UI.
 */
export const OTP_RESET_FLOOR_MS = 6000;

/** Seconds → milliseconds, so window arithmetic reads the same everywhere. */
export const HOUR_MS = 60 * 60 * 1000;
export const DAY_MS = 24 * HOUR_MS;

// ── PHONE SHAPE ──────────────────────────────────────────────────────────

/**
 * ⚠️ ONE DEFINITION OF "IS THIS A PHONE NUMBER WE WILL TEXT", used by the
 * server route. The browser seam (authProvider.ts sendOtp) still carries its
 * own inline copy of the identical rule, and that is deliberate for this
 * chunk: its two branches produce exact user-facing strings that existing
 * tests and screens depend on, and rewriting proven validation on the login
 * path buys nothing. The drift risk that creates is not left to trust —
 * scripts/verify-otp-send.ts asserts the seam and this module agree on the
 * boundary cases (9 digits, 11 digits, leading 5, leading 6/7/8/9).
 *
 * ⚠️ A FORMAT REJECTION IS NOT AN ACCOUNT FACT. The route answers 400 here,
 * which says something about the SHAPE OF THE INPUT and nothing about whether
 * any account exists — the same line [I28] draws for the login route, where a
 * 400 must be reachable only by a malformed body and never by a wrong
 * credential. Never move an account-dependent check into this branch.
 */
export function toLast10Digits(value: unknown): string {
  return typeof value === "string" ? value.replace(/\D/g, "").slice(-10) : "";
}

export function isValidIndianMobile(last10: string): boolean {
  return last10.length === 10 && ["6", "7", "8", "9"].includes(last10[0]);
}
