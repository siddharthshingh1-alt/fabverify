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
 * ⚠️ WHICH PURPOSES ARE *SENDS*. Everything here costs an SMS and is counted
 * against the send limits above. `reset-verify` is deliberately NOT a member —
 * see OTP_VERIFY_* below, and [I33].
 */
export const OTP_SEND_PURPOSES: readonly string[] = ["login", "signup", "reset"];

/**
 * The purpose recorded for a reset-code VERIFY ATTEMPT (chunk 2.8b, [I33]).
 *
 * ⚠️ NOT AN OtpPurpose, AND THAT IS DELIBERATE. `OtpPurpose` answers "what is
 * this code being SENT for" and decides `shouldCreateUser`. This value never
 * reaches the provider; it exists only to keep verify rows out of the send
 * counters.
 */
export const OTP_VERIFY_PURPOSE = "reset-verify";

/**
 * ⚠️ THE LIMIT THAT STOPS A 6-DIGIT CODE BEING BRUTE-FORCED (chunk 2.8b).
 *
 * The reset SUBMIT endpoint is unauthenticated and its only gate is the code.
 * A success WRITES A PASSWORD and bumps `token_epoch` — an account takeover
 * that simultaneously evicts the real owner. Before 2.8b nothing counted
 * verify attempts at all: `otp_requests` recorded sends, and 2.7's
 * `failed_attempts` counts PASSWORD attempts on `user_credentials`.
 *
 * At 5/hour, covering the 10^6 keyspace takes ~200,000 hours. Five is also
 * generous for a human copying six digits off a lock screen.
 *
 * ⚠️ THESE ARE COUNTED SEPARATELY FROM SENDS AND MUST STAY THAT WAY. If a
 * failed guess consumed the send budget, an attacker could stop the real owner
 * from even REQUESTING a recovery code, and a user mistyping their own code
 * twice could lock themselves out of their own reset — a self-inflicted denial
 * of service on the one path that only matters when someone has already lost
 * access. That separation is [I33]'s load-bearing property.
 *
 * ⚠️ NO COOLDOWN between attempts, unlike the send. A send costs money and an
 * SMS; a verify costs nothing, and making someone wait 45 s after a typo would
 * punish the honest user far more than the attacker, who is bounded by the cap
 * either way.
 *
 * ⚠️ A 15-MINUTE ROLLING WINDOW, NOT AN HOURLY-PLUS-DAILY PAIR — AND THE
 * REASON IS RECOVERY DENIAL OF SERVICE, NOT BRUTE FORCE.
 *
 * Any per-number verify limit hands an attacker a way to burn a stranger's
 * budget: they cannot read the SMS, but they can spend the guesses, and the
 * real owner is then unable to COMPLETE a reset even though they can still
 * request a code. The limit's window is therefore the length of the outage an
 * attacker can impose at will, on the one path that only matters once someone
 * has already lost access.
 *
 * The first draft used 5/hour plus 10/day. Both numbers were wrong for this:
 * the hourly window meant a 1-hour lockout, and the DAILY cap was far worse —
 * an attacker spending 10 guesses could deny recovery for 24 HOURS.
 *
 * 15 minutes matches the cooldown [I23] already chose for password lockout, so
 * the platform imposes one recovery-outage length rather than three. And it
 * costs almost nothing defensively: 5 per 15 minutes is 480/day, so covering
 * the 10^6 keyspace still takes ~2000 days. What actually bounds the attacker
 * is the CODE'S OWN LIFETIME — a code lives on the order of an hour, giving
 * roughly 20 guesses against any live code, i.e. a 1-in-50,000 chance.
 *
 * ⚠️ SO THERE IS NO DAILY CAP HERE ON PURPOSE. Do not add one back without
 * pricing the recovery outage it creates.
 */
export const OTP_VERIFY_PER_PHONE = 5;
export const OTP_VERIFY_WINDOW_MS = 15 * 60 * 1000;

/**
 * Per-IP verify ceiling — the same cost circuit-breaker reasoning as
 * OTP_PER_IP_HOURLY, and the same caveat: the IP is client-supplied and
 * forgeable, so this stops floods, not adversaries. The per-number cap above
 * is what actually binds.
 */
export const OTP_VERIFY_PER_IP_HOURLY = 30;

/**
 * ⚠️ LOGIN ANTI-SPRAYING (chunk 2.10, decisions [I35] + [I36]).
 *
 * The purpose recorded for a FAILED password login. Not an OtpPurpose and
 * nothing to do with OTP — see the table note below.
 */
export const LOGIN_FAIL_PURPOSE = "login-fail";

/**
 * ⚠️ THIS COUNTS DISTINCT ACCOUNTS THAT FAILED FROM ONE IP. IT IS NOT A PER-IP
 * ATTEMPT LIMIT, AND THE DIFFERENCE IS THE ENTIRE POINT ([I35]).
 *
 * [I23] refused per-IP rate limiting, correctly: shared egress IPs mean a naive
 * attempt cap lets one attacker behind an office or carrier NAT lock out every
 * real user, turning a brute-force defence into a denial-of-service tool.
 *
 * This does not fight that objection, it inverts it. Spraying is ONE password
 * against MANY accounts, so it produces many distinct failing accounts from one
 * address BY DEFINITION — it cannot be performed without generating the signal.
 * A NAT'd office is many people on their OWN accounts, mostly SUCCEEDING. The
 * two separate cleanly on shape rather than on volume.
 *
 * ⚠️ NEVER DESCRIBE THIS AS "PER-IP RATE LIMITING". That is the design [I23]
 * rejected. If a future change starts counting ATTEMPTS instead of DISTINCT
 * FAILED ACCOUNTS, it has silently become that design and re-acquired the DoS
 * it was built to avoid.
 *
 * ⚠️ A SUCCESSFUL LOGIN CLEARS THAT ACCOUNT'S FAILURE ROWS FOR THAT IP, and
 * the threshold is only defensible WITH that clearing. Ten different people in
 * a 200-person office each mistyping once inside fifteen minutes is entirely
 * plausible; without clearing, ordinary Monday-morning traffic would trip this.
 * Counting only accounts that failed AND NEVER SUCCEEDED is what makes 10 safe.
 *
 * 15 minutes matches [I23]'s lockout and [I33]'s verify window, so the platform
 * imposes ONE outage length rather than three.
 */
export const LOGIN_SPRAY_DISTINCT_ACCOUNTS = 10;
export const LOGIN_SPRAY_WINDOW_MS = 15 * 60 * 1000;

/**
 * ⚠️ A LOG THRESHOLD, NOT A CIRCUIT-BREAKER — it never blocks anything ([I36]).
 *
 * 2.6c's OTP_GLOBAL_DAILY blocks because unbounded SMS is a runaway BILL. Login
 * has no such cost: just compute, already bounded per-account by [I23] and
 * per-IP by the rule above. Meanwhile a global login block would be a
 * platform-wide outage an attacker could trigger cheaply, on the primary
 * authentication path. Same risk reasoning as 2.6c, different costs, opposite
 * answer.
 *
 * ⚠️ AND IT IS ONLY A LOG LINE. NOBODY WATCHES LOGS. This is forensic evidence
 * after the fact, not a response mechanism; real alerting needs an external
 * integration behind a seam ([X5]) and is deliberately not in this chunk.
 */
export const LOGIN_FAIL_GLOBAL_ALERT_HOURLY = 200;

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
 * ⚠️ A floor only masks a difference it EXCEEDS, and this value is MEASURED
 * against production, never estimated. It has been wrong once already: the
 * original 2000 was chosen before the provider leg could be observed at all,
 * and it turned out to be INERT — the work exceeded it, so the sleep never
 * fired and it masked nothing.
 *
 * PRODUCTION MEASUREMENT, 2026-08-26 (chunk 2.6d, real Twilio sends to the
 * founder's number, LAN production build, floor temporarily lowered so the
 * work was UNMASKED):
 *   registered reset, end to end ....... 2640 · 2915 · 3621 ms   (n=3)
 *     · throttle check ................. 1795 · 2060 · 2757 ms   ← ALL the jitter
 *     · record write + provider send ... 955 · 965 · 970 ms      ← rock stable
 *   unknown-number refusal ............. 1693–3514 ms, median 2086  (n=11)
 *
 * ⚠️ MEASURE THIS WITH THE FLOOR LOWERED OR YOU WILL MEASURE THE FLOOR. A
 * reset send timed against a binding floor returns floor+overhead no matter
 * what the work cost — on 2026-08-25 a registered send read 6018 ms against a
 * 6000 ms floor and looked like a ceiling that had gone UP. It was not a
 * ceiling at all: an unknown number, doing far less work, returned 6016 ms in
 * the same conditions. Pinning to that number would have recorded a value no
 * send ever took — the inert-2000 error in a new costume.
 *
 * 5000 clears the observed maximum (3621 ms) by 38%, and clears the worst case
 * implied by combining both distributions (~4100 ms: the slowest observed
 * throttle leg plus the stable ~965 ms send leg) by about 22%.
 * ⚠️ RESIDUAL RISK, STATED: every measurement here is against a warm,
 * long-running `next start`. A Vercel COLD START is unmeasured and would be
 * slower. If this floor is ever seen to go inert in real deployment, raise it
 * — do not assume these numbers transfer to a lambda.
 *
 * ⚠️ THE JITTER IS ENTIRELY OURS. The provider leg is stable to within 15 ms
 * across sends; the throttle check swings by nearly a full second. Anything
 * that shrinks this floor further has to attack checkOtpThrottle's remaining
 * round trips, not the provider — see the single-query chunk in TASKS.md.
 */
export const OTP_RESET_FLOOR_MS = 5000;

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
