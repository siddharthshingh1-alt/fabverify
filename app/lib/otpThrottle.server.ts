import "server-only";

/**
 * OTP SEND THROTTLE — the decision half. SERVER-ONLY (M10 chunk 2.6c).
 *
 * ⚠️ `import "server-only"` IS ENFORCED AT BUILD TIME, not by convention. A
 * Client Component importing this file fails the build. That matters more here
 * than for most server modules: this one holds a keyed-hash secret, and the
 * throttle it computes is worthless if the browser can see, skip or re-run it.
 * Same protection passwordHash.server.ts uses; strictly stronger than the
 * convention-plus-grep guarding authProvider.server.ts.
 *
 * WHAT THIS FILE DOES AND DOES NOT DECIDE:
 *   · it decides "may this caller be sent a code right now"
 *   · it does NOT decide whether the number has an account, and must never
 *     learn — the whole enumeration argument depends on the throttle being
 *     blind to account existence. Every branch below is a function of request
 *     TIMING only.
 */

import { createHmac } from "node:crypto";
import {
  DAY_MS,
  HOUR_MS,
  OTP_GLOBAL_DAILY,
  OTP_PER_IP_DAILY,
  OTP_PER_IP_HOURLY,
  OTP_PER_PHONE_DAILY,
  OTP_PER_PHONE_HOURLY,
  OTP_REQUEST_RETENTION_HOURS,
  OTP_RESEND_SECONDS,
} from "./otpPolicy";
import {
  countOtpRequestsSince,
  getOtpRequestTimes,
  purgeOldOtpRequests,
  recordOtpRequest,
} from "./db";

// ── THE HASHING KEY ──────────────────────────────────────────────────────

/**
 * ⚠️ DERIVED FROM SESSION_TOKEN_SECRET, NOT A NEW ENVIRONMENT VARIABLE — and
 * that is a deliberate choice with its reasoning recorded, not laziness.
 *
 * A second secret is a second thing to generate, a second thing to set on
 * Vercel, and a second thing to be missing in production at 2am. Deriving with
 * DOMAIN SEPARATION gives a key that is cryptographically independent of the
 * signing key — recovering one from the other requires breaking HMAC-SHA256 —
 * with zero deployment surface. This is standard key derivation, NOT key
 * reuse: the token signer never sees this value and this file never sees the
 * signing key in a form it could sign with.
 *
 * ⚠️ CONSEQUENCE, STATED SO IT IS NOT DISCOVERED LATER: rotating
 * SESSION_TOKEN_SECRET changes every phone hash, so existing rows stop
 * matching and every counter effectively resets. Harmless — the retention
 * window is 48 hours and the failure mode is "an attacker gets one extra
 * window", not "a session is forged" — but do not rotate the secret in the
 * middle of an incident and expect the throttle to hold.
 *
 * ⚠️ FAILS CLOSED AT MODULE LOAD, no fallback, no placeholder. The doctrine is
 * [I19]'s: sessionToken.server.ts spells out at length why a signing key must
 * never copy supabaseAdmin.ts's `|| "placeholder-..."` pattern. A published
 * default here would be milder than a token forgery — an attacker could
 * precompute hashes for every Indian mobile number and read the request table
 * as if it were plaintext — but it is still exactly the class of hole that
 * pattern creates, so it is refused the same way.
 */
const HASH_KEY = (() => {
  const raw = process.env.SESSION_TOKEN_SECRET;

  if (!raw || raw.trim().length < 32) {
    throw new Error(
      "SESSION_TOKEN_SECRET is missing or too short. The OTP throttle derives " +
        "its phone-hashing key from it and has no default — see DECISIONS [I19]."
    );
  }

  // Domain separation: this label is what makes the derived key independent of
  // the one that signs session tokens. ⚠️ NEVER CHANGE THE LABEL without
  // accepting that every stored hash stops matching (see the rotation note).
  return createHmac("sha256", raw.trim())
    .update("fabverify/otp-throttle-hash/v1")
    .digest();
})();

/**
 * ⚠️ HMAC, NOT A BARE DIGEST, AND THE DIFFERENCE IS THE WHOLE PROTECTION.
 * There are fewer than four billion 10-digit Indian mobile numbers, so a plain
 * SHA-256 of one is recovered by exhaustive search in seconds on a laptop — an
 * unkeyed hash would be a reversible ENCODING wearing the costume of a
 * protection. Under a key the attacker does not hold, the same search is
 * impossible.
 */
function keyedHash(value: string): string {
  return createHmac("sha256", HASH_KEY).update(value).digest("hex");
}

/** The last-10-digit phone, hashed. Never store or log the input. */
export function hashPhone(phoneLast10: string): string {
  return keyedHash(`phone:${phoneLast10}`);
}

/**
 * The caller IP, hashed — or null when none was observed.
 *
 * ⚠️ THE IP IS CLIENT-SUPPLIED AND TRIVIALLY FORGED. `x-forwarded-for` is a
 * request header; its leftmost entry is whatever the caller wrote. This is
 * acceptable ONLY because per-IP limits are a cost circuit-breaker rather than
 * a security control (decision D5) — see the reasoning in otpPolicy.ts. Do not
 * build anything that needs a trustworthy IP on top of this.
 *
 * Returns null rather than a sentinel for a missing header, so that IP-less
 * callers do not all share one bucket and throttle each other.
 */
export function hashIp(ip: string | null): string | null {
  const trimmed = ip?.trim();
  return trimmed ? keyedHash(`ip:${trimmed}`) : null;
}

/**
 * Extract the caller IP from the request headers.
 *
 * Vercel populates `x-forwarded-for`; localhost usually populates nothing, and
 * that absence is handled (null) rather than faked.
 */
export function callerIp(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || null;
  return headers.get("x-real-ip");
}

// ── THE DECISION ─────────────────────────────────────────────────────────

export type ThrottleDecision =
  | { allowed: true }
  | {
      allowed: false;
      /** Whole seconds until the caller may try again; always at least 1. */
      retryAfterSeconds: number;
      /** Which limit bound. For LOGGING ONLY — never sent to the caller. */
      scope: "phone-cooldown" | "phone-hourly" | "phone-daily" | "ip-hourly" | "ip-daily" | "global-daily";
    };

/**
 * Seconds until a slot frees, given the timestamps of recent requests
 * (newest first), a limit, and the window length.
 *
 * Returns null when the caller is under the limit. When they are at or over
 * it, the slot frees when the `limit`-th most recent request leaves the
 * window — so that row's age, not the newest row's, sets the wait.
 */
function windowWait(times: number[], limit: number, windowMs: number, now: number): number | null {
  const inWindow = times.filter((t) => now - t < windowMs);
  if (inWindow.length < limit) return null;

  const oldestCounted = inWindow[limit - 1];
  const freesAt = oldestCounted + windowMs;
  return Math.max(1, Math.ceil((freesAt - now) / 1000));
}

/**
 * May this caller be sent a code right now?
 *
 * ⚠️ THROWS ON ANY DATABASE FAILURE, and the caller must map that to 503 with
 * no SMS sent (decision D3, fail-closed). Do not add a try/catch here that
 * returns `{allowed: true}` — that single line would undo the chunk.
 *
 * ⚠️ NOTHING IN THIS FUNCTION READS `users`, `user_credentials` OR ANY
 * ACCOUNT STATE. Its answer is a pure function of request timing, which is
 * what makes the throttle incapable of leaking account existence even when it
 * refuses. A future "registered numbers get a higher limit" tweak would
 * convert this into an enumeration oracle — do not add one.
 */
export async function checkOtpThrottle(params: {
  phoneHash: string;
  ipHash: string | null;
  now?: number;
}): Promise<ThrottleDecision> {
  const now = params.now ?? Date.now();
  const dayAgo = new Date(now - DAY_MS).toISOString();

  // ONE read serves all three phone windows — see getOtpRequestTimes.
  const phoneTimes = (await getOtpRequestTimes({ phoneHash: params.phoneHash }, dayAgo))
    .map((iso) => Date.parse(iso))
    .filter((t) => Number.isFinite(t))
    .sort((a, b) => b - a);

  // ── PER-NUMBER: the real control, checked first because it is the limit
  // an attacker actually meets and the cheapest to reject on.
  const cooldown = windowWait(phoneTimes, 1, OTP_RESEND_SECONDS * 1000, now);
  if (cooldown !== null) {
    return { allowed: false, retryAfterSeconds: cooldown, scope: "phone-cooldown" };
  }

  const phoneHourly = windowWait(phoneTimes, OTP_PER_PHONE_HOURLY, HOUR_MS, now);
  if (phoneHourly !== null) {
    return { allowed: false, retryAfterSeconds: phoneHourly, scope: "phone-hourly" };
  }

  const phoneDaily = windowWait(phoneTimes, OTP_PER_PHONE_DAILY, DAY_MS, now);
  if (phoneDaily !== null) {
    return { allowed: false, retryAfterSeconds: phoneDaily, scope: "phone-daily" };
  }

  // ── PER-IP: generous, and only when an IP was actually observed.
  if (params.ipHash) {
    const ipTimes = (await getOtpRequestTimes({ ipHash: params.ipHash }, dayAgo))
      .map((iso) => Date.parse(iso))
      .filter((t) => Number.isFinite(t))
      .sort((a, b) => b - a);

    const ipHourly = windowWait(ipTimes, OTP_PER_IP_HOURLY, HOUR_MS, now);
    if (ipHourly !== null) {
      return { allowed: false, retryAfterSeconds: ipHourly, scope: "ip-hourly" };
    }

    const ipDaily = windowWait(ipTimes, OTP_PER_IP_DAILY, DAY_MS, now);
    if (ipDaily !== null) {
      return { allowed: false, retryAfterSeconds: ipDaily, scope: "ip-daily" };
    }
  }

  // ── GLOBAL: the spend ceiling. Checked LAST because it is the only query
  // with no key to narrow it, and because it is the least likely to bind.
  const globalToday = await countOtpRequestsSince(dayAgo);
  if (globalToday >= OTP_GLOBAL_DAILY) {
    // ⚠️ LOUD ON PURPOSE. If this ever fires in production it means either an
    // attack or a launch, and both need a human to look — nobody can request a
    // code until the window rolls. See OTP_GLOBAL_DAILY.
    console.error(
      `[otp] ⚠️ GLOBAL DAILY OTP CEILING REACHED (${globalToday}/${OTP_GLOBAL_DAILY}). ` +
        "No codes will be sent until the 24h window rolls. Investigate or raise the limit."
    );
    return { allowed: false, retryAfterSeconds: 3600, scope: "global-daily" };
  }

  return { allowed: true };
}

/**
 * Record an accepted request, and opportunistically sweep expired rows.
 *
 * ⚠️ THE RECORD THROWS AND THE SWEEP DOES NOT. Losing the record means the
 * next request is under-counted, so it fails closed; losing the sweep means a
 * few stale rows survive to the next write, so it must never block a login.
 * The sweep is awaited rather than floated for the [I25] reason — a floated
 * promise can be frozen away by the platform — but its own failure is
 * swallowed inside purgeOldOtpRequests.
 */
export async function recordOtpAttempt(params: {
  phoneHash: string;
  ipHash: string | null;
  purpose: string;
  now?: number;
}): Promise<void> {
  await recordOtpRequest({
    phoneHash: params.phoneHash,
    ipHash: params.ipHash,
    purpose: params.purpose,
  });

  const cutoff = new Date(
    (params.now ?? Date.now()) - OTP_REQUEST_RETENTION_HOURS * HOUR_MS
  ).toISOString();

  await purgeOldOtpRequests(cutoff);
}
