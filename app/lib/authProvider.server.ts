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
import type { ProviderIdentity } from "./authProvider";
import {
  PASSWORD_CREDENTIAL_TYPE,
  getUserCredential,
  upsertUserCredential,
} from "./db";
import { hashPassword, verifyPasswordHash } from "./passwordHash.server";
import { validatePassword, type PasswordContext } from "./passwordPolicy";

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
): Promise<ProviderIdentity | null> {
  const { data, error } = await supabaseAdmin.auth.getUser(accessToken);

  if (error || !data.user?.phone) return null;

  return {
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
