/**
 * FabVerify server-side identity verification.
 *
 * The single place API routes call to know who the caller truly is, instead
 * of trusting a phone/id from the request body. Never imports Supabase
 * directly — goes through app/lib/db.ts (CORE.md T1 / DECISIONS.md A1).
 *
 * TWO LEVELS, because they are genuinely different questions:
 *   getVerifiedCallerPhone() — "which phone number has this caller PROVEN
 *                              they own?" Works before the user has an
 *                              account row; account creation needs this.
 *   getVerifiedUser()        — "which existing users row is this caller?"
 *                              Everything operating on existing data.
 *
 * BOTH return a discriminated result rather than null, so a route can tell
 * "you are not logged in" (401) from "the database is unreachable" (503).
 * Collapsing those into one null made a Supabase outage look like an auth
 * failure and sent every diagnosis down the wrong path.
 */

import { NextResponse } from "next/server";
import {
  ensureAuthIdentity,
  getUserByPhone,
  getUserByPhoneOrThrow,
  getUserByProviderUid,
  getUserWithTokenEpoch,
} from "./db";
// Token verification comes from the AUTH seam, not the data layer. It used to
// live in db.ts as getPhoneFromAccessToken — auth logic inside the database
// abstraction, which is exactly why the Supabase seam leaked (DECISIONS X5).
// authProvider.server is the server-only half of the seam; importing it here
// is safe because this file is already server-only (it imports NextResponse).
import { getIdentityFromToken } from "./authProvider.server";

// Next.js sets this to "production" for `next build` output (Vercel preview
// and production alike) and "development" for `next dev`. Server-controlled
// and not derived from anything the caller sends — unlike the client's
// window.location.hostname check, it cannot be spoofed by calling the API
// directly.
const isProduction = process.env.NODE_ENV === "production";

// Both sides of any ownership comparison must go through this, so that
// "+919773933279" and "9773933279" are treated as the same number and
// formatting differences can never cause a false 403.
export function normalisePhone(phone: string): string {
  return phone.replace(/\D/g, "").slice(-10);
}

export type AuthFailure = {
  ok: false;
  /** unauthenticated → 401 · unavailable → 503 */
  reason: "unauthenticated" | "unavailable";
};

type UserRow = NonNullable<Awaited<ReturnType<typeof getUserByPhoneOrThrow>>>;

export type PhoneAuthResult =
  | {
      ok: true;
      phone: string;
      /**
       * The provider's own id for this session — `auth_identities.provider_uid`.
       * Added chunk 1.8. Additive: the only external consumer of this type
       * (save-profile) reads `.phone` and is unaffected.
       *
       * ⚠️ NULL ON THE DEV PATH, and that is the structural dev-bypass signal
       * server-side — the mirror of `providerUid: null` / `isDevBypass` in the
       * browser half of the seam. The x-dev-phone header carries no token, so
       * there is no provider identity to record. Anything writing
       * `auth_identities` MUST guard on this being non-null.
       */
      providerUid: string | null;
      /**
       * ⚠️ THE ALREADY-RESOLVED ACCOUNT — populated ONLY by chunk 2.5b's local
       * (password) branch, and undefined everywhere else.
       *
       * Our token carries `sub = users.id`, so verifying it already required
       * loading the row to check `token_epoch`. Carrying it forward is what
       * makes this the CHEAPEST branch of the ladder ([I21]): without it,
       * getVerifiedUser would re-resolve the same row by phone and every
       * authenticated password request would pay two round trips where one
       * did the work — the exact double-query this chunk's design forbids.
       *
       * ⚠️ NOT A CALLER-SUPPLIED SHORTCUT. It is only ever set from a
       * signature-verified `sub`, inside this file. No route can populate it.
       */
      resolvedUser?: UserRow;
    }
  | AuthFailure;

export type UserAuthResult =
  | {
      ok: true;
      user: UserRow;
      /**
       * WHICH resolution path answered — added chunk 1.9. Additive and
       * ignored by all 13 route call sites; it exists so tests and logs can
       * assert that the identity path actually ran rather than silently
       * falling back to phone every time (a fallback that always fires looks
       * identical to a working identity path from the outside).
       *
       * ⚠️ `"local"` ADDED BY CHUNK 2.5b, for exactly the reason the field
       * exists. A password token resolves to a phone, so if the local branch
       * silently broke, the phone fallback would answer and every functional
       * test would still pass — the failure would be invisible except as a
       * doubled query count. This value is how the suite asserts the local
       * branch actually ran.
       */
      via: "identity" | "phone" | "local";
    }
  | AuthFailure;

const UNAUTHENTICATED: AuthFailure = { ok: false, reason: "unauthenticated" };
const UNAVAILABLE: AuthFailure = { ok: false, reason: "unavailable" };

/**
 * Turns a failure into the right HTTP response. A 503 tells the caller the
 * request may succeed on retry; a 401 tells them it will not until they log
 * in again. Getting this wrong sends users to re-authenticate over what is
 * really a transient outage.
 */
export function authErrorResponse(failure: AuthFailure) {
  if (failure.reason === "unavailable") {
    return NextResponse.json(
      { error: "Service temporarily unavailable. Please try again." },
      { status: 503 }
    );
  }
  return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
}

/**
 * The phone number the caller has proven they control.
 *
 * Production: from a real Supabase session token, validated server-side.
 * Development: from the x-dev-phone header, because the 123456 OTP bypass
 * (DECISIONS A10) never creates a real session and so has no token to
 * verify. That is the same trust level dev-mode auth has always had, and it
 * is gated on isProduction — never on the header's presence — so it cannot
 * activate on a real deployment.
 */
export async function getVerifiedCallerPhone(request: Request): Promise<PhoneAuthResult> {
  if (isProduction) {
    const authHeader = request.headers.get("authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return UNAUTHENTICATED;

    const token = authHeader.slice("Bearer ".length).trim();
    if (!token) return UNAUTHENTICATED;

    // A rejected token is genuinely "not authenticated". The provider does not
    // reliably distinguish a network failure here from an invalid token, so
    // this stays conservative; the database lookup below is where the
    // outage-vs-auth distinction actually matters.
    //
    // The seam returns { providerUid, phone }. Chunk 1.5 deliberately used
    // only `phone`; 1.8 started RECORDING providerUid in auth_identities; 1.9
    // now also RESOLVES identity through it (see getVerifiedUser below).
    // `phone` is still returned and still load-bearing — it is the fallback
    // for every account without an identity row, which in this environment is
    // most of them.
    const identity = await getIdentityFromToken(token);
    if (!identity) return UNAUTHENTICATED;

    // ── CHUNK 2.5b: OUR OWN TOKEN ([I21]) ──────────────────────────────
    //
    // ⚠️ THIS FUNCTION HAD NO DATABASE ACCESS AT ALL BEFORE THIS BRANCH, AND
    // THAT CHANGES ITS ERROR CONTRACT. A password token carries no phone by
    // design ([I19]: no PII in the token), so the phone must be looked up —
    // and `save-profile` calls this function directly, so the new failure mode
    // reaches a real route.
    //
    // ⚠️ AN OUTAGE HERE MUST BE 503, NEVER 401 (Issue E). Returning
    // UNAUTHENTICATED on a database blip would tell a user with a perfectly
    // valid session to log in again — and with password login that means
    // re-entering a password that was never wrong. getUserWithTokenEpoch
    // throws rather than returning null precisely so this distinction is
    // possible here.
    if (identity.kind === "local") {
      try {
        const resolved = await getUserWithTokenEpoch(identity.userId);

        // No row: the account was deleted under a live token. Genuinely
        // unauthenticated, not an outage.
        if (!resolved) return UNAUTHENTICATED;

        // ⚠️ THE EPOCH CHECK — THIS IS WHERE token_epoch STOPS BEING INERT.
        // It has incremented since chunk 2.4 and revoked nothing, because
        // nothing read it. A token minted under an older epoch is refused,
        // which is what makes "changing your password ends other sessions"
        // real ([I12], and the whole basis of 2.8's reset).
        //
        // ⚠️ FAILS CLOSED ON A MISSING CREDENTIAL. `null` means the row is
        // gone — a credential deleted beneath a live session — so the token
        // it authorised must stop working. Treating null as "no epoch to
        // check, allow" would make deleting a credential a way to become
        // unrevocable.
        if (resolved.tokenEpoch === null) return UNAUTHENTICATED;
        if (resolved.tokenEpoch !== identity.epoch) return UNAUTHENTICATED;

        return {
          ok: true,
          phone: normalisePhone(resolved.user.phone),
          // The row we already loaded to check the epoch. See resolvedUser's
          // contract above — this is what keeps the local branch at ONE query.
          resolvedUser: resolved.user,
          // ⚠️ NULL, exactly like the dev path — and for the same structural
          // reason. A password session has NO provider identity ([I11]), so
          // chunk 1.8 must not fabricate an auth_identities row for it. The
          // guard that stops it doing so for dev-bypass accounts protects
          // this branch unchanged.
          providerUid: null,
        };
      } catch {
        return UNAVAILABLE;
      }
    }

    return { ok: true, phone: identity.phone, providerUid: identity.providerUid };
  }

  // Dev path: no token exists, so there is no provider identity. providerUid
  // is null, which is what stops chunk 1.8 fabricating ('supabase',
  // 'dev-user-…') rows for the 9 dev-bypass accounts.
  const devPhone = request.headers.get("x-dev-phone");
  return devPhone
    ? { ok: true, phone: normalisePhone(devPhone), providerUid: null }
    : UNAUTHENTICATED;
}

/**
 * The caller's existing users row. Use for anything touching existing data.
 * A caller with a valid session but no account row is "unauthenticated" —
 * they have nothing to act on yet.
 *
 * ── CHUNK 1.9: IDENTITY-FIRST, PHONE-FALLBACK ────────────────────────────
 * This is the actual decoupling of identity from phone number (DECISIONS I9,
 * mitigating I6) and the highest-risk change in the auth batch, because a
 * wrong answer here does not error — it logs someone into the wrong account.
 *
 * Order, and what moves to the next step:
 *   1. No providerUid (always true on the dev path) ────────→ straight to 3
 *   2. auth_identities lookup on (provider, provider_uid):
 *        hit  → RESOLVED VIA IDENTITY
 *        miss, or ANY error ─────────────────────────────────→ fall to 3
 *   3. getUserByPhoneOrThrow(phone) — unchanged, still throws on outage:
 *        hit   → RESOLVED VIA PHONE
 *        null  → 401 · throws → 503
 *
 * ⚠️ NOTHING WAS REMOVED. Phone matching is fully intact and is still the
 * primary path for 9 of 11 accounts (chunk 1.3: dev-bypass accounts have no
 * provider identity at all). This chunk ADDS a path in front of it.
 *
 * ⚠️ THE FALLBACK CATCHES A MISSING ANSWER, NOT A WRONG ONE. Every failure of
 * the identity lookup — no row, bad query, table invisible, timeout — falls
 * through harmlessly. What it CANNOT catch is auth_identities containing a
 * provider_uid mapped to the wrong user_id, because that returns confidently.
 * That is a data risk, not a code risk, which is why chunk 1.3 refuses to
 * guess a link and chunk 1.8 refuses to repoint one. auditAgainstPhone below
 * is the only detector we have for it.
 *
 * Security note: falling back loses nothing. Both paths sit behind the same
 * gate — a provider-verified OTP token (getIdentityFromToken). Phone matching
 * is applied to a phone the provider itself attests to, never one the caller
 * claimed. Identity-first is migration preparation and I6 mitigation, not the
 * security boundary.
 */
export async function getVerifiedUser(request: Request): Promise<UserAuthResult> {
  const caller = await getVerifiedCallerPhone(request);
  if (!caller.ok) return caller;

  try {
    // ── 0. OUR OWN TOKEN — THE NEW TOP OF THE LADDER (chunk 2.5b, [I21]) ──
    //
    // Cheapest branch by construction: `sub = users.id`, so the account is
    // known from the token itself with NO lookup. getVerifiedCallerPhone has
    // already loaded and epoch-checked the row, so this costs zero further
    // round trips — the whole point of carrying `resolvedUser` forward.
    //
    // ⚠️ ABOVE the identity branch, not beside it. A password session has no
    // auth_identities row ([I11]), so falling into the identity branch would
    // always miss and drop to the phone fallback, quietly doubling the query
    // count on every authenticated password request while still returning the
    // right answer. Correct-but-slow is exactly the failure that never gets
    // noticed.
    //
    // ⚠️ NO recordIdentityOnce HERE, deliberately. providerUid is null for a
    // password session, so writing one would fabricate a
    // ('supabase', <userId>) row — the self-referential noise [I11] rejects,
    // and the same trap chunk 1.8's null-guard exists to prevent.
    if (caller.resolvedUser) {
      logResolution("local", caller.resolvedUser.id);
      return { ok: true, user: caller.resolvedUser, via: "local" };
    }

    // ── 1. IDENTITY FIRST ────────────────────────────────────────────────
    // Skipped entirely when providerUid is null, which is ALWAYS the case on
    // the dev path (x-dev-phone carries no token). Localhost therefore cannot
    // exercise this branch at all — proving it requires a real production
    // token, the same constraint chunk 1.5 hit.
    if (caller.providerUid) {
      const linked = await getUserByProviderUid(caller.providerUid);
      if (linked) {
        const agreement = await auditAgainstPhone(linked, caller.phone);
        logResolution(agreement, linked.id);
        // No recordIdentityOnce here: resolving via identity proves the row
        // already exists. Calling it would be a guaranteed no-op round-trip.
        return { ok: true, user: linked, via: "identity" };
      }
    }

    // ── 2. PHONE FALLBACK (unchanged, proven, still throws on outage) ─────
    const user = await getUserByPhoneOrThrow(caller.phone);
    if (!user) return UNAUTHENTICATED;

    // CHUNK 1.8: the only place a provider identity and a users.id are both
    // known server-side, which is why the link is recorded here rather than at
    // signup — the users row does not exist yet when the OTP is verified.
    // Self-healing by design, and 1.9 is what closes the loop: this request
    // resolves by phone and writes the link, so the NEXT request resolves via
    // identity.
    //
    // Best-effort ONLY. ensureAuthIdentity never throws (see its contract in
    // db.ts) and its result is deliberately ignored — a failed link must not
    // turn into an auth failure, because this function's catch below maps
    // exceptions to 503 across all 12 routes that use it.
    await recordIdentityOnce(user.id, caller.providerUid);
    logResolution("phone", user.id);

    return { ok: true, user, via: "phone" };
  } catch {
    // The database is unreachable — NOT an authentication problem.
    return UNAVAILABLE;
  }
}

/**
 * The only detector for the one failure the phone fallback cannot catch: an
 * identity row that resolves CONFIDENTLY to the wrong account.
 *
 * Runs only when the identity path hit, so phone-only accounts still cost a
 * single query. Deliberately uses the SWALLOWING getUserByPhone, never
 * getUserByPhoneOrThrow — a throw here would be caught by getVerifiedUser's
 * catch and turn a perfectly good identity resolution into a 503, which is
 * exactly the "identity problems must never fail the request" rule this chunk
 * is built on.
 *
 * Never suppressed by the log dedupe: a disagreement must be visible every
 * single time it happens.
 */
async function auditAgainstPhone(
  resolved: UserRow,
  phone: string
): Promise<"identity" | "identity-only"> {
  const byPhone = await getUserByPhone(phone);

  if (!byPhone) {
    // Either the phone genuinely matches no account — the DECISIONS I6
    // reassignment case, where identity resolving an account phone cannot is
    // the whole point — or the lookup failed. getUserByPhone swallows its
    // errors so the two are indistinguishable here; that is acceptable
    // because this is an audit, not a decision.
    return "identity-only";
  }

  if (byPhone.id !== resolved.id) {
    // NOT routed through logResolution: a disagreement must be visible on
    // every request it occurs on, never collapsed by the once-per-process
    // dedupe.
    console.error(
      "[auth] ⚠️ IDENTITY/PHONE DISAGREEMENT — identity wins. " +
        `identity→users.id=${resolved.id} · phone→users.id=${byPhone.id}. ` +
        "Expected only after a phone reassignment (DECISIONS I6). Any other " +
        "cause means auth_identities holds a wrong link — investigate before trusting it."
    );
  }

  return "identity"; // the normal, expected case
}

/**
 * Logs each distinct (path, user) resolution ONCE per server process, so the
 * terminal shows which path answered without drowning in the 5-second FabChat
 * poll. A restart re-logs, which is what makes it usable as a test
 * instrument: start the server, log in, read one line.
 */
const loggedResolutions = new Set<string>();

function logResolution(
  via: "identity" | "phone" | "identity-only" | "local",
  userId: string
): void {
  const key = `${via}:${userId}`;
  if (loggedResolutions.has(key)) return;
  loggedResolutions.add(key);

  // Phone numbers are deliberately NOT logged; the users.id is enough to
  // confirm which account resolved and is not personal data on its own.
  const detail =
    via === "local"
      ? "via OUR OWN TOKEN (sub=users.id) — no lookup needed"
      : via === "identity"
      ? "via IDENTITY (auth_identities) — phone lookup agrees"
      : via === "identity-only"
        ? "via IDENTITY (auth_identities) — phone lookup found NO match; identity resolved an account phone could not"
        : "via PHONE FALLBACK — no identity link used for this request";

  console.log(`[auth] resolved users.id=${userId} ${detail}`);
}

/**
 * Per-process memo of identities already linked, so the upsert costs one
 * round-trip per provider identity per server process instead of one per
 * authenticated request.
 *
 * Deliberately a plain Set: bounded by the number of distinct users this
 * process serves, and a cold start simply re-ensures (a no-op if the row
 * exists). Only records a uid AFTER a non-throwing call, so a transient
 * failure is retried on the next request rather than cached as done.
 */
const linkedProviderUids = new Set<string>();

async function recordIdentityOnce(
  userId: string,
  providerUid: string | null
): Promise<void> {
  // Dev bypass (A10) has no provider identity — see PhoneAuthResult above.
  if (!providerUid) return;
  if (linkedProviderUids.has(providerUid)) return;

  await ensureAuthIdentity(userId, providerUid);
  linkedProviderUids.add(providerUid);
}
