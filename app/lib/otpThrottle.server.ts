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
  OTP_SEND_PURPOSES,
  OTP_VERIFY_PER_IP_HOURLY,
  OTP_VERIFY_PER_PHONE_DAILY,
  OTP_VERIFY_PER_PHONE_HOURLY,
  OTP_VERIFY_PURPOSE,
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
/**
 * Row timestamps → epoch millis, newest first, with unparseable values dropped.
 *
 * Extracted in 2.6d because the phone read and the IP read had identical
 * copies, and the two now run in different places (one sequential, one inside
 * a Promise.all) — which is exactly the shape where two copies drift apart.
 * `windowWait` depends on the DESCENDING order; it is not cosmetic.
 */
function toDescendingTimes(isoTimes: string[]): number[] {
  return isoTimes
    .map((iso) => Date.parse(iso))
    .filter((t) => Number.isFinite(t))
    .sort((a, b) => b - a);
}

export async function checkOtpThrottle(params: {
  phoneHash: string;
  ipHash: string | null;
  now?: number;
}): Promise<ThrottleDecision> {
  const now = params.now ?? Date.now();
  const dayAgo = new Date(now - DAY_MS).toISOString();

  // ONE read serves all three phone windows — see getOtpRequestTimes.
  const phoneTimes = toDescendingTimes(
    await getOtpRequestTimes({ phoneHash: params.phoneHash }, dayAgo, OTP_SEND_PURPOSES)
  );

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

  // ── THE CONCURRENT PAIR (chunk 2.6d, decision [I31]).
  //
  // ⚠️ EVERYTHING ABOVE THIS LINE IS DELIBERATELY SEQUENTIAL AND MUST STAY
  // THAT WAY. The phone read runs FIRST and alone, and each per-number check
  // returns before this point is reached, so a hammered request still costs
  // exactly ONE query. Hoisting these two reads above the phone checks would
  // make every hammered request cost three — turning a throttle into an
  // amplifier on an unauthenticated path. That is the whole of [I31].
  //
  // ⚠️ AND IT IS THE PHONE-FIRST RULE THAT BOUNDS WHAT THIS PARALLELISM COSTS.
  // The global count is the only query with no key to narrow it, and it now
  // runs even when the IP limit is about to reject — work the old sequential
  // order skipped. That is affordable ONLY because reaching here already
  // requires clearing the per-number cooldown, hourly and daily caps, so the
  // extra unkeyed counts are bounded by the per-IP hourly cap, not by how fast
  // an attacker can send.
  //
  // ⚠️ Promise.all, NEVER Promise.allSettled. Both halves throw on a database
  // failure, so this rejects, the route maps it to 503, and NO SMS IS SENT
  // (D3, fail-closed). allSettled would swallow the rejection and convert a
  // database outage into an allow — an unthrottled SMS cannon during exactly
  // the incident you least want one.
  //
  // ⚠️ THE QUERIES RUN TOGETHER; THE DECISIONS DO NOT. They are still
  // evaluated ip-hourly → ip-daily → global-daily below, so `scope` and
  // `retryAfterSeconds` are byte-identical to the sequential version. The
  // suite asserts this rather than trusting it — a reordering here would
  // silently start reporting the wrong limit to the user.
  const [ipTimes, globalToday] = await Promise.all([
    // Only when an IP was actually observed. `null` (not an empty array) so
    // "no IP to check" stays distinguishable from "an IP with no history".
    params.ipHash
      ? getOtpRequestTimes({ ipHash: params.ipHash }, dayAgo, OTP_SEND_PURPOSES).then(
          toDescendingTimes
        )
      : Promise.resolve(null),
    countOtpRequestsSince(dayAgo, OTP_SEND_PURPOSES),
  ]);

  // ── PER-IP: generous, and only when an IP was actually observed.
  if (ipTimes !== null) {
    const ipHourly = windowWait(ipTimes, OTP_PER_IP_HOURLY, HOUR_MS, now);
    if (ipHourly !== null) {
      return { allowed: false, retryAfterSeconds: ipHourly, scope: "ip-hourly" };
    }

    const ipDaily = windowWait(ipTimes, OTP_PER_IP_DAILY, DAY_MS, now);
    if (ipDaily !== null) {
      return { allowed: false, retryAfterSeconds: ipDaily, scope: "ip-daily" };
    }
  }

  // ── GLOBAL: the spend ceiling. Evaluated LAST — it is the least likely to
  // bind, and the per-IP scopes must win when both would.
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
 * MAY THIS CALLER SUBMIT ANOTHER RESET CODE GUESS? (chunk 2.8b, decision [I33])
 *
 * ⚠️ THIS IS THE ANTI-BRUTE-FORCE CONTROL ON ACCOUNT TAKEOVER, and it is the
 * whole reason 2.8b could not ship without it. The reset SUBMIT endpoint is
 * unauthenticated and its only gate is a 6-digit code; a success writes a
 * password AND bumps `token_epoch`, evicting the real owner's sessions. Before
 * this existed, nothing anywhere counted verify attempts — `otp_requests`
 * recorded sends, and 2.7's counter is for PASSWORD attempts on a different
 * table. The keyspace is 10^6; at 5/hour it takes ~200,000 hours to cover.
 *
 * ⚠️ IT READS ONLY `reset-verify` ROWS AND WRITES ONLY `reset-verify` ROWS.
 * Sends and guesses never see each other's counters. If they did, a failed
 * guess would burn the victim's send budget and an attacker could block the
 * real owner from requesting a recovery code at all.
 *
 * ⚠️ THROWS ON ANY DATABASE FAILURE — same fail-closed rule as the send (D3),
 * and it matters MORE here: a send that wrongly proceeds costs an SMS, a
 * verify that wrongly proceeds costs an account. Do not add a catch that
 * returns `{allowed: true}`.
 *
 * ⚠️ NOTHING HERE READS ACCOUNT STATE, so it cannot leak whether the number is
 * registered — a refusal is a pure function of this caller's own recent
 * attempts, identical for a real account and a number that has never existed.
 */
export async function checkOtpVerifyThrottle(params: {
  phoneHash: string;
  ipHash: string | null;
  now?: number;
}): Promise<ThrottleDecision> {
  const now = params.now ?? Date.now();
  const dayAgo = new Date(now - DAY_MS).toISOString();
  const VERIFY = [OTP_VERIFY_PURPOSE];

  // Phone first, alone, with an early return — the same shape and the same
  // reason as checkOtpThrottle ([I31]): this is the limit an attacker actually
  // meets, so hammering must cost ONE query, not three.
  const phoneTimes = toDescendingTimes(
    await getOtpRequestTimes({ phoneHash: params.phoneHash }, dayAgo, VERIFY)
  );

  const phoneHourly = windowWait(phoneTimes, OTP_VERIFY_PER_PHONE_HOURLY, HOUR_MS, now);
  if (phoneHourly !== null) {
    return { allowed: false, retryAfterSeconds: phoneHourly, scope: "phone-hourly" };
  }

  const phoneDaily = windowWait(phoneTimes, OTP_VERIFY_PER_PHONE_DAILY, DAY_MS, now);
  if (phoneDaily !== null) {
    return { allowed: false, retryAfterSeconds: phoneDaily, scope: "phone-daily" };
  }

  if (params.ipHash) {
    const ipTimes = toDescendingTimes(
      await getOtpRequestTimes({ ipHash: params.ipHash }, dayAgo, VERIFY)
    );
    const ipHourly = windowWait(ipTimes, OTP_VERIFY_PER_IP_HOURLY, HOUR_MS, now);
    if (ipHourly !== null) {
      return { allowed: false, retryAfterSeconds: ipHourly, scope: "ip-hourly" };
    }
  }

  return { allowed: true };
}

/**
 * Record a reset-code guess. Called BEFORE the code is checked.
 *
 * ⚠️ BEFORE, NOT AFTER, AND NOT ONLY ON FAILURE. Recording after the verify
 * would let an attacker who kills the connection mid-request guess for free;
 * recording only failures would mean a crash between "wrong" and "record"
 * costs the attacker nothing. Counting every attempt up front is the only
 * ordering where an abandoned request still costs its slot.
 *
 * ⚠️ Reuses recordOtpAttempt so hashing, insertion and the retention sweep have
 * exactly ONE implementation — the purpose is what separates the counters.
 */
export async function recordOtpVerifyAttempt(params: {
  phoneHash: string;
  ipHash: string | null;
  now?: number;
}): Promise<void> {
  await recordOtpAttempt({
    phoneHash: params.phoneHash,
    ipHash: params.ipHash,
    purpose: OTP_VERIFY_PURPOSE,
    now: params.now,
  });
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
 *
 * ⚠️ THE TWO RUN CONCURRENTLY (chunk 2.6d, decision [I32]), AND THE SENTENCE
 * ABOVE IS WHAT MAKES THAT SAFE — read [I32] before touching either half.
 *
 * `purgeOldOtpRequests` catches everything internally (both the PostgREST
 * error branch and a thrown exception), logs it as non-fatal, and returns
 * void. It CANNOT reject. So this Promise.all can only ever reject on the
 * RECORD — precisely the half that must fail closed, and the opposite reason
 * from why [I31]'s pair in checkOtpThrottle is safe, where BOTH halves throw.
 *
 * ⚠️ IF A FUTURE EDIT MAKES purgeOldOtpRequests THROW, THIS BECOMES A BUG.
 * A failed retention sweep would start rejecting here, which the route maps to
 * a 503 with no SMS sent — so a cosmetic cleanup of "swallowed errors" would
 * silently take out OTP login, signup AND reset. Keep the swallow, or
 * un-parallelise in the same commit.
 *
 * ⚠️ The row sets are disjoint by construction — the DELETE targets
 * `created_at < now − OTP_REQUEST_RETENTION_HOURS` and the INSERT adds a row
 * at `now` — so the sweep cannot remove the row just written. That holds only
 * while the retention window is comfortably positive; at or near zero the sets
 * overlap and the counter silently stops counting.
 *
 * ⚠️ STILL AWAITED, deliberately. Promise.all awaits both, which preserves
 * [I25]'s reason for awaiting the sweep at all: the platform may freeze the
 * function after the response, and a floated promise is simply lost.
 * Concurrency is the win here; fire-and-forget is not on the table.
 */
export async function recordOtpAttempt(params: {
  phoneHash: string;
  ipHash: string | null;
  purpose: string;
  now?: number;
}): Promise<void> {
  const cutoff = new Date(
    (params.now ?? Date.now()) - OTP_REQUEST_RETENTION_HOURS * HOUR_MS
  ).toISOString();

  await Promise.all([
    recordOtpRequest({
      phoneHash: params.phoneHash,
      ipHash: params.ipHash,
      purpose: params.purpose,
    }),
    purgeOldOtpRequests(cutoff),
  ]);
}
