import "server-only";

/**
 * FabVerify PASSWORD HASHING — argon2id. SERVER-ONLY.
 *
 * ⚠️⚠️ THE HIGHEST-RISK FILE IN CHUNK 2.2 (M10). Read this header before
 * changing anything in it.
 *
 * WHY THIS FILE IS DANGEROUS IN A WAY OTHERS ARE NOT: every other part of the
 * auth work fails LOUDLY — a wiring bug 401s, a bad query 503s, and you find
 * out immediately. This one fails SILENTLY and RETROACTIVELY. Weak parameters,
 * the wrong argon2 variant, a static salt, or a comparison that returns true
 * on error all produce a system that works perfectly for every user while
 * being crackable. And the damage is already written to the database by the
 * time anyone notices: every hash produced under a bad design stays bad until
 * that user re-authenticates. There is no "fix it in the next deploy" here.
 *
 * The defence used throughout: NEVER TRUST THAT CONFIGURATION TOOK EFFECT.
 * The parameters below are read back OUT of the encoded string the library
 * produced (see needsRehash, and scripts/verify-password-hash.ts), because
 * "we passed the right options" and "the right options were applied" are
 * different claims and only the second one matters.
 *
 * ⚠️ SERVER-ONLY, ENFORCED AT BUILD TIME. The `import "server-only"` above is
 * not decoration: if any Client Component imports this file, directly or
 * transitively, THE BUILD FAILS. That is strictly stronger than the
 * convention-plus-grep used by authProvider.server.ts, because a grep is a
 * check you can forget to run. A hash computed in the browser is worthless —
 * the hash simply becomes the password — so this boundary is the whole point.
 *
 * ⚠️ NO PLAINTEXT, ANYWHERE. Nothing here logs, stores, returns or
 * error-messages a plaintext password or a hash. Library errors are swallowed
 * rather than re-thrown, specifically so a stack trace cannot carry the input
 * forward (CLAUDE.md §2.8).
 *   HONEST LIMIT, stated rather than glossed: JavaScript strings are immutable
 *   and garbage-collected, so a password CANNOT be reliably zeroed from memory
 *   in Node. Any claim that it is "wiped" would be false. What IS true and
 *   enforced: it is never persisted, never logged, never returned, never in an
 *   error, and the only reference goes out of scope when the call returns.
 *
 * ⚠️ UNUSED AS OF CHUNK 2.2 — nothing imports this file. Chunk 2.3 declares
 * verifyPassword/setPassword on the auth seam; chunk 2.4 is the first code
 * that writes a hash to the database. Committing it unused and independently
 * tested is deliberate: it means the hashing can be proven in isolation before
 * anything depends on it, which is the only order in which a silent failure is
 * catchable.
 *
 * WHY hash-wasm AND NOT A NATIVE BINDING (@node-rs/argon2, node-argon2):
 * pure WebAssembly, no platform-specific binary, so it runs identically on
 * localhost, on Vercel and on whatever AWS target A12 lands on. We have never
 * deployed, so a native binding could not be validated against the real
 * runtime — and a dependency that might not survive the platform move is the
 * wrong shape for a project whose entire strategy is surviving one. The cost
 * is speed (WASM is slower than native); at login volume that is invisible.
 * ⚠️ THE TRADE-OFF THIS CREATES: hash-wasm does NOT generate the salt — we do,
 * below. That is a real silent-failure surface (a static salt is invisible and
 * catastrophic) and is why the test suite proves salting explicitly rather
 * than assuming it.
 */

import { randomBytes } from "node:crypto";
import { argon2id, argon2Verify } from "hash-wasm";

/**
 * OWASP Password Storage Cheat Sheet — argon2id baseline configuration.
 *
 * OWASP lists these as equivalent-strength pairs:
 *   m=47104 (46 MiB) t=1 · m=19456 (19 MiB) t=2 · m=12288 t=3 ·
 *   m=9216 t=4 · m=7168 t=5   (all p=1)
 * We take m=19456, t=2, p=1. Trading memory DOWN for iterations UP is weaker
 * against parallel hardware at equal wall-clock, so the high-memory end of the
 * table is the right end to sit on; 19 MiB is the widely-deployed baseline and
 * costs ~50-100ms per hash, which is fast enough for a login and expensive
 * enough to make bulk offline cracking unattractive.
 *
 * ⚠️ THESE NUMBERS RATCHET UPWARD OVER TIME. Re-check them against the current
 * OWASP cheat sheet periodically. Raising them is safe and does NOT need a
 * flag day — that is precisely what needsRehash() below exists for: a stored
 * hash made under older parameters keeps verifying, and gets upgraded the next
 * time that user successfully authenticates.
 *
 * saltLength 16 and hashLength 32 are the RFC 9106 recommendations.
 */
export const ARGON2ID_PARAMS = {
  memorySize: 19456, // KiB (19 MiB)
  iterations: 2,
  parallelism: 1,
  hashLength: 32, // bytes
  saltLength: 16, // bytes
} as const;

/**
 * Matches the argon2 PHC encoded string and captures variant + parameters:
 *   $argon2id$v=19$m=19456,t=2,p=1$<base64 salt>$<base64 hash>
 * Deliberately captures the VARIANT too, so a non-argon2id hash can be
 * rejected rather than quietly accepted (see verifyPasswordHash).
 */
const ENCODED_RE = /^\$argon2(id|i|d)\$v=(\d+)\$m=(\d+),t=(\d+),p=(\d+)\$/;

/**
 * Hashes a plaintext password with argon2id.
 *
 * Returns the PHC ENCODED string — `$argon2id$v=19$m=...,t=...,p=...$salt$hash`
 * — which carries the variant, the version, the parameters AND the salt inside
 * it. That is why `user_credentials` has no separate salt or params column:
 * two sources of truth for how a hash was made is how a rehash silently
 * verifies against the wrong cost.
 *
 * ⚠️ THE SALT IS GENERATED HERE, PER PASSWORD, FROM A CSPRNG.
 * `randomBytes` is Node's cryptographic RNG. It must NEVER be replaced with
 * `Math.random()`, a constant, a timestamp, or anything derived from the user
 * (phone, id, email). A per-password random salt is what makes two identical
 * passwords hash to different strings, which is what defeats rainbow tables
 * and stops a breach revealing which accounts share a password. A static salt
 * would pass every functional test and destroy that property invisibly.
 */
export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(ARGON2ID_PARAMS.saltLength);

  return argon2id({
    password: plain,
    salt,
    memorySize: ARGON2ID_PARAMS.memorySize,
    iterations: ARGON2ID_PARAMS.iterations,
    parallelism: ARGON2ID_PARAMS.parallelism,
    hashLength: ARGON2ID_PARAMS.hashLength,
    // 'encoded' (not 'hex'): we need the self-describing PHC string, not a
    // bare digest. A bare digest would be unverifiable without separately
    // storing the salt and parameters.
    outputType: "encoded",
  });
}

/**
 * Verifies a plaintext password against a stored encoded hash.
 *
 * ⚠️ NEVER THROWS, AND NEVER RETURNS TRUE ON ERROR. Every failure path —
 * malformed input, a truncated or tampered string, a library error — returns
 * `false`. This is the single most dangerous function in the file: a `catch`
 * block that returned `true`, or a truthiness slip, is a total authentication
 * bypass that no functional test would notice, because every legitimate login
 * would still work.
 *
 * ⚠️ COMPARISON IS THE LIBRARY'S OWN `argon2Verify`, NEVER A MANUAL `===` ON
 * HASHES. A hand-rolled string comparison short-circuits on the first
 * differing byte and leaks the hash through timing. There is deliberately no
 * comparison operator anywhere in this function.
 *
 * ⚠️ ONLY argon2id IS ACCEPTED — an argon2i or argon2d string is rejected even
 * though the library could verify it. Nothing in this system ever writes those
 * variants, so encountering one means the row was tampered with or written by
 * something that should not have written it; accepting it would be a silent
 * downgrade to a weaker variant. If a legitimate future migration needs
 * another variant, widen this deliberately, with a decision logged.
 */
export async function verifyPasswordHash(
  plain: string,
  stored: string
): Promise<boolean> {
  // Guard before the library sees anything: null/undefined/non-string/empty
  // must be a clean `false`, not a thrown TypeError that a caller might
  // mistake for a server fault (and answer 503 to, per Issue E).
  if (typeof plain !== "string" || typeof stored !== "string") return false;
  if (plain.length === 0 || stored.length === 0) return false;

  const match = ENCODED_RE.exec(stored);
  if (!match || match[1] !== "id") return false;

  try {
    return await argon2Verify({ password: plain, hash: stored });
  } catch {
    // Swallowed deliberately, and WITHOUT logging the error: a library
    // exception can carry its inputs, and this function's inputs are a
    // password and a hash. An unparseable or corrupt stored value is simply
    // "does not verify".
    return false;
  }
}

/**
 * True when a stored hash was made under parameters weaker than the current
 * ARGON2ID_PARAMS — i.e. it should be re-hashed the next time this user
 * successfully authenticates.
 *
 * This is what makes raising the cost factors a non-event instead of a flag
 * day: old hashes keep verifying, and upgrade themselves on next login.
 * Without it, the parameters chosen today are the parameters forever, which is
 * the retroactive half of this chunk's risk.
 *
 * ⚠️ Returns TRUE for anything unparseable or non-argon2id, deliberately —
 * "I cannot confirm this hash is current" must mean "replace it", never
 * "assume it is fine".
 *
 * ⚠️ Compares only DOWNWARD-relevant fields (memory, iterations, parallelism).
 * A hash made with STRONGER parameters than the current setting also returns
 * true, which is intentional: it means someone lowered the constants, and the
 * mismatch should surface rather than be silently tolerated.
 */
export function needsRehash(stored: string): boolean {
  if (typeof stored !== "string") return true;

  const match = ENCODED_RE.exec(stored);
  if (!match) return true;

  const [, variant, , memory, iterations, parallelism] = match;

  if (variant !== "id") return true;

  return (
    Number(memory) !== ARGON2ID_PARAMS.memorySize ||
    Number(iterations) !== ARGON2ID_PARAMS.iterations ||
    Number(parallelism) !== ARGON2ID_PARAMS.parallelism
  );
}
