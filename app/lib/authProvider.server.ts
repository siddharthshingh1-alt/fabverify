/**
 * FabVerify AUTH SEAM — SERVER-ONLY half.
 *
 * ⚠️ SERVER-ONLY. This file imports the service-role client, which bypasses
 * Row Level Security entirely. Import it ONLY from Route Handlers under
 * app/api/ or from other server-only modules (app/lib/auth.ts). NEVER from a
 * "use client" file or anything reachable from one.
 *
 * WHY THIS IS A SEPARATE FILE from `authProvider.ts`:
 * token verification is the one auth operation that genuinely needs the
 * service role. Everything else — sendOtp, verifyOtp, getSession, signOut —
 * runs on the browser anon client and lives in `authProvider.ts`, which
 * `apiClient.ts` (reachable from "use client") will import in chunk 1.10. If
 * both halves shared one file, that import would drag `supabaseAdmin` into
 * the browser module graph: `SUPABASE_SERVICE_ROLE_KEY` is not a
 * `NEXT_PUBLIC_` var so the real key would NOT be inlined — but
 * supabaseAdmin.ts would silently fall back to its placeholder and construct
 * a broken admin client client-side, breaking the SERVER-ONLY contract for
 * no benefit. The split mirrors the existing `supabase.ts` /
 * `supabaseAdmin.ts` division, for the same reason.
 *
 * ⚠️ UNUSED AS OF CHUNK 1.4. Nothing imports this file yet. Chunk 1.5 moves
 * `app/lib/auth.ts` off `db.ts getPhoneFromAccessToken` and onto
 * `getIdentityFromToken` below, which is also when `db.ts` stops referencing
 * `supabaseAdmin.auth` — auth leaving the data layer, where it never
 * belonged.
 */

import { supabaseAdmin } from "./supabaseAdmin";
import type { ProviderIdentity, VerifiedIdentity } from "./authProvider";
import { verifySessionToken } from "./sessionToken.server";
import { randomBytes } from "node:crypto";
import {
  PASSWORD_CREDENTIAL_TYPE,
  clearFailedPasswordAttempts,
  getUserByPhoneOrThrow,
  getUserCredential,
  recordFailedPasswordAttempt,
  upsertUserCredential,
} from "./db";
import { hashPassword, verifyPasswordHash } from "./passwordHash.server";
import {
  PASSWORD_LOCKOUT_MS,
  PASSWORD_LOCKOUT_THRESHOLD,
  validatePassword,
  type PasswordContext,
} from "./passwordPolicy";

// `import type` is erased at compile time, so this does NOT pull the
// browser-safe module (or its anon client) into the server bundle at runtime.

/**
 * THE TRUST ROOT. Validates a real, provider-issued access token and returns
 * the identity the provider itself attests to — never a phone or id the
 * caller merely claims in a request body.
 *
 * Returns null when the token is missing, invalid, expired, or carries no
 * phone number.
 *
 * ⚠️ RETURNS BOTH `providerUid` AND `phone`, which is the whole reason this
 * function exists rather than reusing `db.ts getPhoneFromAccessToken`. That
 * function returns ONLY the phone and DISCARDS `data.user.id` — and
 * `data.user.id` is exactly the `auth_identities.provider_uid` that chunk 1.9
 * needs to resolve identity without depending on the phone number. Chunk 1.9
 * could not be built on the old signature.
 *
 * Both values are needed, not one or the other:
 *   · `providerUid` → the durable link, via `auth_identities` (DECISIONS I9)
 *   · `phone`       → the FALLBACK for accounts with no identity row yet
 *
 * That fallback is not an edge case here. Chunk 1.3's backfill linked 1 of 10
 * accounts; the other 9 were created through the A10 dev bypass and have no
 * Supabase auth user at all. In this environment phone resolution is the
 * PRIMARY path, which is what chunk 1.9 has to get right.
 *
 * Resolving this identity to a `users` row is deliberately a separate step
 * (`getUserByPhoneOrThrow`), so a database failure can never be mistaken for
 * a bad token — the Issue E distinction between 503 and 401.
 */
export async function getIdentityFromToken(
  accessToken: string
): Promise<VerifiedIdentity | null> {
  // ── OURS FIRST (chunk 2.5b, [I22]) ────────────────────────────────────
  //
  // ⚠️ *ATTEMPT* OUR VERIFIER — NEVER PEEK AT THE TOKEN TO DECIDE WHICH ONE
  // TO USE. Reading `iss` from the unparsed payload to "route" the token is
  // the classic anti-pattern (D9): it hands an attacker the steering wheel,
  // because the claim they control decides which verifier judges them. So we
  // simply try ours; if it fails for ANY reason we try Supabase. A Supabase
  // token failing our HMAC check is cheap, expected, and silent.
  //
  // Ours goes first because it is a local HMAC check — microseconds, no
  // network — while the Supabase call is a round trip. Order is a performance
  // choice here, not a security one: cross-acceptance is impossible by
  // construction (different secrets, and iss/aud are pinned both ways).
  const local = await verifySessionToken(accessToken);
  if (local.ok) {
    return { kind: "local", userId: local.userId, epoch: local.epoch };
  }

  // ── SUPABASE FALLBACK — MUST SURVIVE INTACT ([I22]) ───────────────────
  //
  // ⚠️ EVERY CURRENTLY-LIVE SESSION IS A SUPABASE JWT. Breaking this branch
  // logs out every existing user at once, on a platform holding their orders.
  // It is the single highest-consequence regression available in this chunk,
  // which is why the branch below is byte-for-byte what it was before 2.5b
  // and why the suite asserts it independently.
  const { data, error } = await supabaseAdmin.auth.getUser(accessToken);

  if (error || !data.user?.phone) return null;

  return {
    kind: "provider",
    providerUid: data.user.id,
    // Same canonical key as everywhere else: strip non-digits, keep last 10.
    // Supabase stores `91`+10 while `users.phone` is bare 10-digit, so this
    // normalisation is load-bearing, not cosmetic (proven in chunk 1.3).
    phone: data.user.phone.replace(/\D/g, "").slice(-10),
  };
}

// ── PASSWORD CREDENTIALS (M10, chunk 2.4) ────────────────────────────────
//
// ⚠️ THESE ARE *OUR* CREDENTIALS, NOT THE PROVIDER'S. Nothing below touches
// Supabase Auth, and that is the point of M10: `supabase.auth.updateUser({
// password })` is the convenient thing that looks like it solves this, and it
// would re-couple us to the provider we are leaving (DECISIONS I10, A12).
//
// They live on the seam rather than in the route because the RE-VERIFICATION
// GATE MUST TRAVEL WITH THE OPERATION. A gate implemented in a route is a gate
// the next route can forget; a gate inside setPassword cannot be bypassed by
// adding a second caller. The reset flow will need to satisfy it by a
// different proof (OTP) — that variant gets added deliberately, with its own
// review, and is NOT pre-declared here. An unreachable "skip verification"
// branch written today is a bypass waiting for someone to reach it.

/**
 * `ok` carries `created` so callers can distinguish a first-time set from a
 * change. Failures are discriminated so the route maps them to distinct
 * statuses (403 vs 400) rather than one catch-all.
 *
 * ⚠️ DATABASE FAILURES ARE NOT MODELLED HERE — they THROW, and the route turns
 * them into 503/500 via dbErrorResponse. Folding "the database was
 * unreachable" into this union as another `ok: false` is precisely the Issue E
 * mistake, and here it would be worse than a wrong status code: the existence
 * check below decides whether re-verification is required, so a swallowed
 * outage becomes an authorisation bypass.
 */
export type SetPasswordResult =
  | { ok: true; created: boolean }
  | {
      ok: false;
      reason: "reverification-required" | "reverification-failed" | "weak-password";
      message: string;
    };

/**
 * Set or replace the password credential for ONE user.
 *
 * ⚠️ `userId` MUST come from a verified session and never from request input.
 * This function cannot check that for itself — it trusts its caller — so the
 * route derives it from `getVerifiedUser()` and the request body carries no
 * account identifier at all. That is what makes cross-account setting
 * impossible by construction rather than by a comparison someone could later
 * refactor away.
 *
 * ── THE ANTI-HIJACK GATE ─────────────────────────────────────────────────
 *   credential EXISTS  → `currentPassword` is REQUIRED and must verify
 *   credential ABSENT  → a valid session alone is sufficient
 *
 * ⚠️ WHICH BRANCH RUNS IS DECIDED BY A SERVER-SIDE DATABASE READ, NEVER BY THE
 * CALLER. There is no "first time" flag in the request, and none is honoured
 * if sent. `credential_type` is a module constant (see db.ts), so a caller
 * cannot steer the lookup at an unused type to force a miss. The read throws
 * on database failure, so an outage can never be mistaken for "no credential".
 * Those three properties are the whole bypass argument.
 *
 * ⚠️ THE EXISTENCE READ HAPPENS EXACTLY ONCE and its result is passed forward
 * to both the gate and the epoch decision. Reading twice would let the two
 * disagree under a race.
 *
 * ⚠️ ORDER IS DELIBERATE: re-verify BEFORE validating or hashing the new
 * password. An unauthorised caller must not learn the password policy, and
 * must not be able to spend 19 MiB of argon2 work per request.
 *
 * ACCEPTED RISK, RECORDED NOT OVERLOOKED (decision 2026-08-08): allowing a
 * first-time set on the session alone means a hijacked session can mint a
 * DURABLE credential — escalating temporary access into access that outlives
 * the session and does not depend on the phone. Accepted because the recovery
 * path exists: the real owner proves their phone by OTP, resets, and the
 * `token_epoch` bump evicts every attacker session while overwriting the
 * attacker's password. Tightening this to require proof of recent
 * authentication is a small, additive change if that trade is ever revisited.
 */
export async function setPassword(
  userId: string,
  newPassword: unknown,
  currentPassword?: string,
  context: PasswordContext = {}
): Promise<SetPasswordResult> {
  // ── 1. THE ONE EXISTENCE READ. Throws on any database fault. ───────────
  const existing = await getUserCredential(userId, PASSWORD_CREDENTIAL_TYPE);

  // ── 2. THE GATE — only when a credential actually exists ───────────────
  if (existing) {
    if (typeof currentPassword !== "string" || currentPassword.length === 0) {
      return {
        ok: false,
        reason: "reverification-required",
        message: "Enter your current password to change it.",
      };
    }

    // Constant-time comparison via the library's own verify — never a manual
    // string comparison on hashes.
    const proven = await verifyPasswordHash(currentPassword, existing.password_hash);
    if (!proven) {
      return {
        ok: false,
        reason: "reverification-failed",
        message: "Current password is incorrect.",
      };
    }
  }

  // ── 3. POLICY — after the gate, so unauthorised callers learn nothing ──
  const validation = validatePassword(newPassword, context);
  if (!validation.ok) {
    return { ok: false, reason: "weak-password", message: validation.message };
  }

  // ── 4. HASH the NORMALISED form, never the raw input ───────────────────
  // Hashing the un-normalised string would defeat the NFKC fix and could lock
  // a user out of a password they typed correctly on another keyboard.
  const passwordHash = await hashPassword(validation.normalised);

  // ── 5. WRITE. Epoch +1 on a change (DECISIONS I12 revocation), default on
  // a first-time set — there is nothing to revoke.
  //   ⚠️ INERT TODAY: nothing issues or verifies our own tokens yet, and live
  //   sessions are Supabase JWTs that do not carry this epoch. It revokes
  //   NOTHING until chunk 2.5. Written now because the column exists and the
  //   semantics belong with the write — but recorded as inert, not believed to
  //   be protecting anything.
  await upsertUserCredential({
    userId,
    passwordHash,
    credentialType: PASSWORD_CREDENTIAL_TYPE,
    tokenEpoch: existing ? existing.token_epoch + 1 : undefined,
  });

  return { ok: true, created: !existing };
}

// ── PASSWORD VERIFICATION (chunk 2.5a) ───────────────────────────────────
//
// ⚠️ ANSWERS A QUESTION. DOES NOT GRANT ANYTHING. This returns "do these
// credentials match, and whose are they" — no token, no session, no cookie.
// Turning that fact into a session is chunk 2.5, kept separate ON PURPOSE:
// a bug here is a wrong ANSWER that nothing acts on, while a bug in token
// verification is an auth bypass. Splitting them means 2.5's fresh session is
// spent entirely on signature verification, algorithm pinning and the
// Supabase fallback, with the credential half already proven.
//
// ⚠️ NOT REACHABLE OVER HTTP, AND THAT IS LOAD-BEARING, NOT AN OVERSIGHT.
// No route calls this. An endpoint returning "these credentials are valid:
// yes/no" without issuing a session is a credential-checking ORACLE — all of
// login's attack surface with none of its utility — and rate limiting is
// deliberately deferred to chunk 2.7. Because nothing HTTP-reachable calls
// this, there is no brute-force surface today, which is precisely what makes
// deferring lockout safe.
// ⚠️ THE WINDOW OPENS AT CHUNK 2.6 (login UI). Lockout (2.7) must land WITH
// or BEFORE 2.6, never after — TASKS.md currently lists it after, and that
// ordering is a trap.

/**
 * ⚠️ ONE FAILURE REASON FOR ANYONE WHO CANNOT PROVE OWNERSHIP — THIS TYPE
 * *IS* THE ENUMERATION CONTROL.
 *
 * There is deliberately no `no-such-account`, no `no-password-set`, no
 * `wrong-password`. A caller cannot accidentally distinguish them because the
 * type gives it nothing to distinguish, so the guarantee survives future
 * callers written by someone who has not read this comment. Making that
 * structural is worth more than a comment asking people to be careful.
 *
 * ── ⚠️ THE ONE EXCEPTION, AND EXACTLY WHY IT IS SAFE (chunk 2.7, [I23]) ──
 *
 * `account-locked` is a SECOND failure reason, which amends [I17]'s original
 * "one indistinguishable result" — deliberately, not by drift. It is
 * returned ONLY to a caller who supplied the CORRECT password, i.e. who has
 * already proven they own the account. Someone holding valid credentials
 * learns nothing from "this account exists and is locked": they knew it
 * existed, because they can authenticate to it.
 *
 * A prober — by definition someone WITHOUT the password — can never reach
 * this branch, so what they observe is byte-identical to chunk 2.5a. That is
 * enforced structurally below: the locked result is constructed inside the
 * `matched` branch and nowhere else, so it is unreachable without a
 * successful argon2id verify rather than merely unreached today.
 *
 * ⚠️ THE COST, ACCEPTED WITH EYES OPEN: an attacker who happens to guess
 * correctly DURING a cooldown is told so, instead of being handed a generic
 * failure that might have made them discard a working password. The trade is
 * that a real user who mistyped ten times learns to wait rather than being
 * told their correct password is wrong — which is the failure that generates
 * support load and password resets.
 *
 * ⚠️ NEVER add a third reason. Any reason reachable WITHOUT a correct
 * password re-opens the enumeration oracle 2.5a exists to close.
 *
 * ⚠️ DATABASE FAILURES ARE NOT MODELLED HERE — they THROW. Returning
 * "invalid credentials" during an outage would tell a user with a perfectly
 * good password that it is wrong, and send them to reset a credential that
 * was never broken. That is Issue E on the login path.
 */
export type PasswordVerification =
  | { ok: true; user: NonNullable<Awaited<ReturnType<typeof getUserByPhoneOrThrow>>> }
  | { ok: false; reason: "invalid-credentials" }
  | { ok: false; reason: "account-locked"; retryAfterSeconds: number };

/**
 * ⚠️ ONE FROZEN VALUE, RETURNED BY REFERENCE ON EVERY UNPROVEN FAILURE. Not a
 * fresh object literal per path — identical construction is what makes "these
 * two outcomes are indistinguishable" checkable by the test suite rather than
 * by eye.
 */
const INVALID: PasswordVerification = Object.freeze({
  ok: false,
  reason: "invalid-credentials",
});

/**
 * A UUID no row can hold, used to spend an identical credential query on the
 * "no such account" path. See the round-trip note in verifyPasswordCredential.
 */
const NO_SUCH_USER = "00000000-0000-0000-0000-000000000000";

/**
 * The optimistic-concurrency token used when there is no credential row to
 * guard. Any value that cannot equal a real timestamptz works; it exists so
 * the failure write is issued with the SAME shape on the miss path as on the
 * real one, rather than being skipped.
 */
const NEVER_UPDATED = "1970-01-01T00:00:00.000Z";

/**
 * How many times a lost counter write is retried. Three is enough for the
 * realistic burst and small enough that contention cannot turn into a stall.
 */
const FAILED_WRITE_MAX_ROUNDS = 3;

/**
 * A real argon2id hash of a random value, verified against when there is no
 * stored credential so that the failing path costs the same as the succeeding
 * one.
 *
 * ⚠️ GENERATED AT MODULE LOAD FROM THE CURRENT PARAMETERS — never a hardcoded
 * string. A literal decoy silently diverges the day someone raises the cost
 * factors, and the timing leak reopens through the back door with every test
 * still passing. Deriving it means it tracks the parameters automatically.
 *
 * Started eagerly (not awaited) so the ~60 ms cost is paid during process
 * warm-up rather than by the first caller, which would itself be an anomaly.
 * The no-op catch only prevents an unhandled rejection; the real await below
 * still throws, which fails closed — no login is better than a timing leak.
 */
const decoyHash: Promise<string> = hashPassword(randomBytes(32).toString("hex"));
decoyHash.catch(() => {});

/**
 * Verify a submitted password against the stored credential for a phone.
 *
 * ⚠️ THE PHONE COMES FROM THE CALLER, AND THAT IS UNAVOIDABLE HERE — the
 * deliberate opposite of the set-password route, where the body carries no
 * account identifier at all. Login happens BEFORE a session exists, so there
 * is no verified identity to derive from; the phone is the input. The
 * protection is therefore different in kind: it is not "ignore what they
 * sent", it is "resolve exactly what they sent, on the canonical key, and
 * grant nothing".
 *
 * ── EVERY PATH DOES IDENTICAL WORK ───────────────────────────────────────
 * one users query · one credentials query · one argon2id verify — whether the
 * account exists, has no password, has the wrong password, or succeeds.
 *
 * ⚠️ THE SECOND QUERY ON THE MISS PATH IS NOT WASTE. Skipping it when no user
 * is found would make "no such account" one network round-trip cheaper than
 * every other outcome — and against Supabase Singapore a round trip is tens
 * of milliseconds, comfortably larger than the argon2 cost this function is
 * careful to equalise. Equalising the hash while leaking the round trip would
 * be timing-safety theatre.
 *
 * ⚠️ THE VERIFY IS UNCONDITIONAL AND ITS RESULT IS COMPUTED BEFORE ANY
 * BRANCH. `if (!credential) return` before hashing would restore the leak
 * this whole function exists to close, so there is deliberately no early
 * return between the lookup and the comparison.
 *
 * Failure messaging is the caller's job, but the type above ensures every
 * failure is the same value — see PasswordVerification.
 */
export async function verifyPasswordCredential(
  phone: string,
  plain: unknown
): Promise<PasswordVerification> {
  // Canonical key — bare last-10, byte-identical to normalisePhone() in
  // auth.ts. users.phone is stored bare 10-digit while callers may send
  // +91-prefixed or spaced input; an un-normalised comparison matches nothing
  // (proven in chunk 1.3's backfill) and would fail every login closed.
  const normalised = typeof phone === "string" ? phone.replace(/\D/g, "").slice(-10) : "";

  // Throws on database failure — never collapses an outage into "wrong
  // password" (Issue E).
  const user = normalised.length === 10 ? await getUserByPhoneOrThrow(normalised) : null;

  // Always one credential query, hitting a guaranteed-miss id when there is
  // no user, so the round-trip count cannot vary by outcome.
  const credential = await getUserCredential(
    user ? user.id : NO_SUCH_USER,
    PASSWORD_CREDENTIAL_TYPE
  );

  // Always one argon2id verify, against the decoy when there is nothing real
  // to check. Computed unconditionally, before any branch.
  const candidate = credential?.password_hash ?? (await decoyHash);
  const matched =
    typeof plain === "string" ? await verifyPasswordHash(plain, candidate) : false;

  // ── LOCKOUT (chunk 2.7) ────────────────────────────────────────────────
  //
  // ⚠️ READ FROM THE ROW WE ALREADY HAVE — NOT A SECOND QUERY. `locked_until`
  // came back with the credential above, so the lockout check adds no round
  // trip and therefore cannot be timed.
  //
  // ⚠️ AND IT IS EVALUATED **AFTER** THE VERIFY, NEVER BEFORE. The obvious
  // implementation short-circuits here — `if (isLocked) return INVALID` above
  // the hash — and it is precisely wrong: skipping the ~45 ms argon2id makes a
  // LOCKED account answer measurably FASTER than a wrong password, which is an
  // oracle for "this account exists". Worse, it is an oracle the attacker
  // MANUFACTURES ON DEMAND: hammer any phone ten times, then time it. A number
  // with an account gets fast; a number without one never changes. That would
  // be a better enumeration channel than the one this function was written to
  // close. So the verify above runs on locked accounts too, and its result is
  // deliberately discarded.
  const now = Date.now();
  const lockedUntilMs = credential?.locked_until ? Date.parse(credential.locked_until) : 0;
  const isLocked = lockedUntilMs > now;

  // "Authentic" = the credentials are right. Deliberately distinct from
  // "allowed in", which the lockout can still refuse.
  const authentic = Boolean(user && credential && matched);

  // ── EXACTLY ONE WRITE ROUND TRIP, ON EVERY PATH ────────────────────────
  //
  // ⚠️ IF ONLY REAL ACCOUNTS WERE WRITTEN TO, THE ROUND-TRIP COUNT WOULD LEAK
  // EXISTENCE — and equalising the two reads and the hash while leaking the
  // write would be timing-safety theatre. So a write is issued unconditionally
  // against the same sentinel id the credential read uses; whether it matches
  // a row is decided by the WHERE clause in db.ts, not by a branch here. No
  // branch means no path that can diverge.
  //
  // ⚠️ AWAITED, NEVER FIRE-AND-FORGET. Computing the response and letting the
  // write finish in the background would be one round trip cheaper and would
  // read beautifully — and Vercel may freeze the function after the response,
  // so the write would sometimes simply vanish. A counter that silently drops
  // writes is a lockout that never locks. `waitUntil` would fix it and is
  // platform-specific, which the migration rule (CORE T2) rules out.
  const nowIso = new Date(now).toISOString();

  if (authentic && !isLocked) {
    await clearFailedPasswordAttempts({
      userId: user!.id,
      expectedUpdatedAt: credential!.updated_at,
      now: nowIso,
    });
  } else {
    await recordFailure({
      userId: user ? user.id : NO_SUCH_USER,
      credential,
      // ⚠️ PASSED IN, NOT RE-DERIVED. Without it the locked path spends a
      // FOURTH round trip re-reading a row it already knows is locked, while
      // the unknown-phone path spends three — reopening the existence oracle
      // in the retry logic after the main path was so careful to close it.
      // Caught by test D1, which counts round trips per path.
      wasLocked: isLocked,
      now,
      nowIso,
    });
  }

  // ── THE OUTCOME ────────────────────────────────────────────────────────
  //
  // ⚠️ THE LOCKED BRANCH IS NESTED INSIDE `authentic` ON PURPOSE. It is not
  // reachable without a successful argon2id verify, which is what makes "only
  // a proven owner is ever told about the lock" a property of the control flow
  // rather than a promise in a comment. DO NOT HOIST IT.
  if (isLocked) {
    if (authentic) {
      return {
        ok: false,
        reason: "account-locked",
        retryAfterSeconds: Math.max(1, Math.ceil((lockedUntilMs - now) / 1000)),
      };
    }
    return INVALID;
  }

  if (!authentic) return INVALID;

  return { ok: true, user: user! };
}

/**
 * Apply one failed attempt to the credential row, if there is one to apply it
 * to. Returns nothing, deliberately: the caller's response must not depend on
 * what happened here, or the counter state becomes observable.
 *
 * ⚠️ THE RETRY IS NOT DEFENSIVE PADDING — IT IS THE WHOLE POINT. PostgREST
 * cannot express `failed_attempts = failed_attempts + 1`, so this is
 * read-modify-write. Without the optimistic guard and this loop, ten guesses
 * arriving together all read the same counter and all write the same value,
 * and the counter advances by ONE. Every sequential test still passes. That is
 * a lockout that fails open under exactly the load an attacker generates,
 * which is the only load that matters.
 *
 * ⚠️ BOUNDED AT 3 ROUNDS, and it gives up SILENTLY rather than throwing.
 * Losing a race is not a database fault, and turning contention into a 503
 * would hand an attacker a way to break login by generating load.
 *
 * ⚠️ RESIDUAL, RECORDED RATHER THAN GLOSSED: a retry costs extra round trips,
 * and only a real unlocked account can retry — so under attacker-induced
 * concurrency the round-trip count can differ from the miss path. It is a far
 * weaker channel than the one it replaces (it needs deliberate parallel
 * requests against one number, and the signal is a fraction of WAN jitter),
 * and the uncontended path — where a prober actually operates — stays exactly
 * equal. Closing it properly needs an atomic increment, which arrives free at
 * the RDS cutover as a single statement.
 */
async function recordFailure(params: {
  userId: string;
  credential: Awaited<ReturnType<typeof getUserCredential>>;
  wasLocked: boolean;
  now: number;
  nowIso: string;
}) {
  let row = params.credential;
  let expectedUpdatedAt = row?.updated_at ?? NEVER_UPDATED;

  for (let round = 0; round < FAILED_WRITE_MAX_ROUNDS; round++) {
    // ⚠️ A COOLDOWN THAT HAS RUN OUT RESETS THE COUNTER TO ZERO — it does not
    // resume from 10. This is the direct consequence of choosing a FIXED
    // duration over an escalating one: if the count survived expiry, the very
    // next mistake would re-lock instantly and the user would be reduced to
    // one attempt every 15 minutes for ever.
    const expired = row?.locked_until ? Date.parse(row.locked_until) <= params.now : false;
    const baseline = expired ? 0 : row?.failed_attempts ?? 0;
    const failedAttempts = baseline + 1;

    const { matched } = await recordFailedPasswordAttempt({
      userId: params.userId,
      expectedUpdatedAt,
      failedAttempts,
      // The lock is set ON the threshold failure, so the 10th attempt is the
      // last one processed normally and the 11th is the first one refused.
      lockedUntil:
        failedAttempts >= PASSWORD_LOCKOUT_THRESHOLD
          ? new Date(params.now + PASSWORD_LOCKOUT_MS).toISOString()
          : null,
      now: params.nowIso,
    });

    if (matched) return;

    // Zero rows means one of: no such account · no password set · already
    // locked · lost the race. Only the last is worth retrying, and only a real
    // credential row can have lost anything.
    //
    // ⚠️ THE `wasLocked` CHECK IS A TIMING CONTROL, NOT AN OPTIMISATION. A
    // locked row is EXPECTED to match zero rows — that is the guard clause
    // working. Re-reading to discover what we already knew would cost the
    // locked path an extra round trip that the miss path never pays, which is
    // the existence oracle in a new hiding place.
    if (!row || params.wasLocked) return;

    const fresh = await getUserCredential(params.userId, PASSWORD_CREDENTIAL_TYPE);
    if (!fresh) return;
    // An unchanged `updated_at` means we did NOT lose a race — the row was
    // skipped because it is locked. Nothing to retry.
    if (fresh.updated_at === expectedUpdatedAt) return;

    row = fresh;
    expectedUpdatedAt = fresh.updated_at;
  }
}
