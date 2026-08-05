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
    }
  | AuthFailure;

type UserRow = NonNullable<Awaited<ReturnType<typeof getUserByPhoneOrThrow>>>;

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
       */
      via: "identity" | "phone";
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
    return identity
      ? { ok: true, phone: identity.phone, providerUid: identity.providerUid }
      : UNAUTHENTICATED;
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

function logResolution(via: "identity" | "phone" | "identity-only", userId: string): void {
  const key = `${via}:${userId}`;
  if (loggedResolutions.has(key)) return;
  loggedResolutions.add(key);

  // Phone numbers are deliberately NOT logged; the users.id is enough to
  // confirm which account resolved and is not personal data on its own.
  const detail =
    via === "identity"
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
