import "server-only";

/**
 * FabVerify SESSION TOKENS — the ones WE issue and WE verify. SERVER-ONLY.
 *
 * ⚠️⚠️ THE AUTH-BYPASS FILE (M10 chunk 2.5b). A bug here does not break a
 * feature — it lets the wrong person in, while looking perfectly healthy from
 * the outside. DECISIONS [I19] [I20] [I21] [I22]; the full attack register is
 * D1–D14 in TASKS.md under chunk 2.5b. Do not change anything here without
 * reading that table.
 *
 * ⚠️ PIECE 1 OF 2 — ISSUE ONLY. `verifySessionToken` is deliberately NOT in
 * this file yet. Issue is proven in isolation first, so that when verification
 * arrives it can be tested against tokens already known to be well-formed
 * rather than against its own output (a verifier tested only on its own
 * issuer's tokens can share a bug with it and both look correct).
 *
 * WHY WE ISSUE OUR OWN AT ALL: authentication must produce a SESSION, and
 * Supabase will not sign a JWT for a credential it does not hold — while
 * holding the credential there is precisely what M10 forbids ([I10]). So a
 * password login needs a token we control. That token is also the migration
 * safety net: it is issuer-independent and verifies identically on Supabase
 * today, on AWS RDS later, and throughout the parallel run ([A12]).
 *
 * ⚠️ THIS DOES NOT REPLACE SUPABASE TOKENS. Every currently-live session is a
 * Supabase JWT. Both types must keep verifying — breaking that fallback logs
 * out every existing user at once, on a platform holding their orders. That
 * coexistence lands in Piece 2 ([I22]).
 */

import { SignJWT, jwtVerify } from "jose";

// ── CONSTANTS ────────────────────────────────────────────────────────────

/**
 * ⚠️ PINNED. HS256 and nothing else, named as a literal in one place.
 *
 * This constant is half of defence **D2/D3** (algorithm confusion). The other
 * half is Piece 2 passing an explicit `algorithms: ["HS256"]` allowlist to
 * verification. Both halves are required and neither is sufficient:
 *   · pinning only at ISSUE stops us minting a weak token, but a verifier that
 *     honours the token's own `alg` header would still accept `alg: none` or
 *     an HS/RS substitution from an attacker who never used this function.
 *   · pinning only at VERIFY is the load-bearing half — but issuing anything
 *     else would then simply produce tokens our own verifier rejects.
 * ⚠️ NEVER derive the algorithm from a token, an env var, or a parameter.
 */
const ALGORITHM = "HS256" as const;

/** Who minted it. Checked on the way back in — part of D8. */
const ISSUER = "fabverify";

/** What it may be presented to. Also D8. */
const AUDIENCE = "fabverify-api";

/**
 * 7 days ([I20]). Long by the usual standard, and defensible here for one
 * specific reason: revocation is REAL. `token_epoch` ([I12]) is embedded in
 * the token and checked on every request, so a password reset invalidates
 * every outstanding session at once. The usual argument for short TTLs is
 * "we cannot revoke once issued", and it does not apply.
 * ⚠️ There is deliberately NO refresh token in this chunk — that is a second
 * security-critical subsystem (rotation, reuse detection) and this is the one
 * chunk that must stay small.
 */
const TTL_SECONDS = 7 * 24 * 60 * 60;

/** Rejects an accidental placeholder rather than trusting length alone. */
const FORBIDDEN_SECRETS = [
  "placeholder",
  "changeme",
  "secret",
  "development",
  "test",
  "your-secret-here",
];

/**
 * ⚠️ 32 CHARACTERS MINIMUM — a floor, not a definition of strength.
 * HS256 wants at least 256 bits of key material. This checks LENGTH, which is
 * all a program can check; it cannot measure ENTROPY. A 64-character string of
 * repeated "a" passes this and is worthless. The real requirement is that the
 * value came from a CSPRNG — see the generator command in .env.local.
 */
const MIN_SECRET_LENGTH = 32;

// ── THE SECRET ───────────────────────────────────────────────────────────

/**
 * ⚠️⚠️ FAILS CLOSED AT MODULE LOAD. THIS IS DEFENCE **D12** AND IT IS THE MOST
 * IMPORTANT FIVE LINES IN THE FILE.
 *
 * ⚠️ DO NOT ADD A FALLBACK. `supabaseAdmin.ts` does
 * `process.env.X || "placeholder-service-role-key"`, and that is FINE THERE —
 * a bogus API key just makes requests fail. **Copying that pattern to a
 * SIGNING key is catastrophic**: a known, published default secret means
 * anyone who reads this repository can mint a valid token for any `users.id`
 * and authenticate as any user on the platform. That is not a degraded
 * client; it is a total authentication bypass with no exploit required.
 *
 * Throwing at import time means a misconfigured deployment fails loudly on
 * first load instead of quietly issuing forgeable tokens.
 *
 * ⚠️ The error text never contains the secret, its length, or any prefix of
 * it — an exception message can reach a log aggregator, an error tracker, or
 * in the worst case a response body.
 */
function loadSigningSecret(): Uint8Array {
  const raw = process.env.SESSION_TOKEN_SECRET;

  if (!raw || raw.trim().length === 0) {
    throw new Error(
      "SESSION_TOKEN_SECRET is not set. It signs our own session tokens and " +
        "has no default — see DECISIONS [I19]. Generate one with: " +
        `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
    );
  }

  const secret = raw.trim();

  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `SESSION_TOKEN_SECRET is too short (minimum ${MIN_SECRET_LENGTH} characters). ` +
        "Use 32 random bytes hex-encoded — see DECISIONS [I19]."
    );
  }

  if (FORBIDDEN_SECRETS.some((bad) => secret.toLowerCase().includes(bad))) {
    throw new Error(
      "SESSION_TOKEN_SECRET looks like a placeholder value. It must be a " +
        "random secret from a CSPRNG — see DECISIONS [I19]."
    );
  }

  return new TextEncoder().encode(secret);
}

// Module-load evaluation is deliberate: see loadSigningSecret above.
const SIGNING_KEY = loadSigningSecret();

// ── ISSUE ────────────────────────────────────────────────────────────────

/** `users.id` is a Postgres `gen_random_uuid()`, so this is the real shape. */
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Mint a session token for one user.
 *
 * ⚠️ THE USER BINDING IS `sub`, AND IT IS INSIDE THE SIGNED PAYLOAD — defence
 * **D5**. The token says which account it is for, and the HMAC covers that
 * claim, so changing `sub` from user A to user B invalidates the signature.
 * There is no separate "user id" travelling alongside the token that could
 * disagree with it, and no route reads an account id from a header, body or
 * query string.
 *
 * ⚠️ `sub` IS VALIDATED AS A UUID BEFORE IT IS SIGNED. Defence **D13** lives
 * mainly on the verify side, but refusing to *mint* a token whose subject is
 * not a real id shape means a bug elsewhere cannot produce a syntactically
 * valid token bound to `undefined`, `"[object Object]"` or an empty string —
 * any of which could later match something unintended in a lookup.
 *
 * ⚠️ NO PII IN THE PAYLOAD — no phone, no name, no email. A JWT payload is
 * base64url, NOT encryption: anyone holding the token reads every claim in
 * plaintext, and this token lives in `localStorage` and travels on every
 * request. `sub = users.id` is all that is needed, and it is also what makes
 * this the cheapest branch of the resolution ladder — an internal id resolves
 * an account with no lookup, unlike a provider uid or a phone number.
 *
 * ⚠️ NOTHING HERE IS LOGGED. Not the token, not the secret, not the claims.
 * A token in a log file is a usable credential for anyone who can read it.
 *
 * @param userId `users.id` — must come from a verified source, never request input.
 * @param tokenEpoch the credential's current `token_epoch` ([I12]); the token
 *   is rejected later if this falls below the stored value.
 */
export async function issueSessionToken(
  userId: string,
  tokenEpoch: number
): Promise<string> {
  if (typeof userId !== "string" || !UUID_PATTERN.test(userId)) {
    // Deliberately does NOT echo the offending value: this is called with an
    // account identifier, and the message may be logged.
    throw new Error("issueSessionToken: userId must be a users.id UUID");
  }

  if (!Number.isInteger(tokenEpoch) || tokenEpoch < 0) {
    throw new Error("issueSessionToken: tokenEpoch must be a non-negative integer");
  }

  const now = Math.floor(Date.now() / 1000);

  return new SignJWT({
    // token_epoch this was minted under — the revocation mechanism ([I12]).
    epoch: tokenEpoch,
    // Authentication method. Recorded now so a future "re-authenticate for
    // sensitive actions" check can demand a fresh factor rather than accepting
    // a week-old password session — without needing a token format change.
    amr: ["pwd"],
  })
    // ⚠️ The algorithm is set from the pinned constant, never from input.
    .setProtectedHeader({ alg: ALGORITHM, typ: "JWT" })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setSubject(userId)
    .setIssuedAt(now)
    // ⚠️ ALWAYS SET. A token without `exp` never expires; Piece 2 rejects any
    // token lacking one rather than treating absence as "eternal" (D4).
    .setExpirationTime(now + TTL_SECONDS)
    .sign(SIGNING_KEY);
}

/**
 * Exported for tests and for the verifier below, so the two cannot drift on
 * the values that must match.
 * ⚠️ THE SECRET IS NOT EXPORTED, and must never be.
 */
export const SESSION_TOKEN_CONTRACT = {
  algorithm: ALGORITHM,
  issuer: ISSUER,
  audience: AUDIENCE,
  ttlSeconds: TTL_SECONDS,
} as const;

// ── VERIFY ───────────────────────────────────────────────────────────────

/**
 * ⚠️ ONE FAILURE VALUE, NO REASON. This type IS the "fail generically" rule.
 *
 * There is deliberately no `reason: "expired" | "bad-signature" | "wrong-user"`.
 * Two arguments, either sufficient:
 *   · An attacker probing a verifier learns from every distinction. "Expired"
 *     versus "bad signature" tells them a forged signature is the wrong angle
 *     and to go find a real token instead.
 *   · A caller cannot accidentally branch on a reason that does not exist, so
 *     the guarantee survives future code written by someone who never read
 *     this comment. Same reasoning as PasswordVerification in 2.5a.
 *
 * ⚠️ `ok: false` COVERS "DATABASE UNREACHABLE" NOWHERE — because this function
 * never touches a database. It is pure computation over a string, which is
 * what lets the whole bypass matrix be tested with no DB and no network. The
 * epoch and account lookups belong to the caller (the wiring step), where an
 * outage must surface as 503 rather than as "invalid token".
 */
export type SessionTokenVerification =
  | { ok: true; userId: string; epoch: number }
  | { ok: false };

const INVALID: SessionTokenVerification = { ok: false };

/**
 * Verify a token WE issued. Returns the account it is bound to, or a generic
 * failure.
 *
 * ⚠️⚠️ THIS FUNCTION IS THE AUTH BOUNDARY. Everything below is a defence from
 * the D-register (TASKS.md chunk 2.5b) and none of it is decoration.
 *
 * ⚠️ **D2/D3 — THE ALGORITHM IS PINNED HERE, AND THIS IS THE CRITICAL LINE.**
 * `algorithms: [ALGORITHM]` is an ALLOWLIST checked against the token's header
 * before the signature is even considered. Without it, a verifier honours
 * whatever the token's own `alg` header claims — which is attacker-controlled
 * data — and two classic total bypasses open up:
 *   · `alg: "none"` — the signature segment is dropped and the token is
 *     accepted on the strength of its own say-so.
 *   · HS/RS substitution — a token claiming `RS256` verified against a key the
 *     attacker can guess or read.
 * Pinning at ISSUE time (the ALGORITHM constant above) does NOT protect this:
 * an attacker never calls our issuer. **The verify-side pin is the load-bearing
 * half.** Never widen this array, never make it configurable, never derive it
 * from the token.
 *
 * ⚠️ **D1/D6 — the signature is checked by `jwtVerify` BEFORE any claim is
 * readable.** Claims are only reachable after it returns. There is no
 * decode-then-check path in this function, and there must never be one.
 *
 * ⚠️ **D4 — `exp` is REQUIRED, not merely honoured.** A JWT with no `exp`
 * never expires, and `jwtVerify` alone would happily accept one. `requiredClaims`
 * makes its absence a rejection. `clockTolerance` is 5 seconds — enough for
 * ordinary clock skew, far too little to resurrect an expired token.
 *
 * ⚠️ **D8 — issuer and audience are both enforced**, so a token minted for a
 * different system cannot be replayed at this one.
 *
 * ⚠️ **D13 — `sub` is re-validated as a UUID string after verification.** The
 * signature guarantees the claim is *ours*, not that it is *well-formed*: a
 * bug in some future issuer could sign `sub: 42` or `sub: {}`, and an
 * unvalidated value flowing into a database lookup is how type confusion turns
 * into "matched an unintended row".
 *
 * ⚠️ **NEVER THROWS.** Every failure — malformed, tampered, expired, garbage,
 * a library error — returns the same `{ok:false}`. A thrown exception here
 * would surface as a 500 (or worse, be caught by a handler that maps unknown
 * errors to something permissive), and the message could carry token material.
 *
 * ⚠️ **WHAT THIS FUNCTION DOES NOT DO — and must not start doing:**
 *   · it does NOT check `token_epoch` against the database (D10)
 *   · it does NOT check the account still exists or still has a credential (D11)
 *   · it does NOT prevent REPLAY of a stolen valid token (D7) — bearer tokens
 *     are replayable by definition; only binding (DPoP/mTLS) changes that and
 *     we are not building it. **Do not claim replay protection anywhere.**
 * Those are the caller's responsibility at the wiring step, and keeping them
 * out is what makes this function provable with no database.
 */
export async function verifySessionToken(
  token: unknown
): Promise<SessionTokenVerification> {
  if (typeof token !== "string" || token.length === 0) return INVALID;

  try {
    const { payload } = await jwtVerify(token, SIGNING_KEY, {
      // ⚠️ D2/D3 — the allowlist. See the block comment above.
      algorithms: [ALGORITHM],
      issuer: ISSUER,
      audience: AUDIENCE,
      // D4 — absence of exp is a rejection, not "eternal".
      requiredClaims: ["sub", "exp", "iat", "epoch"],
      clockTolerance: 5,
    });

    // D13 — the signature proves provenance, not shape.
    const sub = payload.sub;
    if (typeof sub !== "string" || !UUID_PATTERN.test(sub)) return INVALID;

    const epoch = payload.epoch;
    if (typeof epoch !== "number" || !Number.isInteger(epoch) || epoch < 0) {
      return INVALID;
    }

    return { ok: true, userId: sub, epoch };
  } catch {
    // Deliberately swallowed and deliberately unlogged: the exception can
    // carry token material, and the distinction between failure modes is
    // exactly what an attacker probing this endpoint wants.
    return INVALID;
  }
}
