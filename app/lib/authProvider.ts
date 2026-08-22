/**
 * FabVerify AUTH SEAM — browser-safe half.
 *
 * WHAT THIS IS
 * The provider-agnostic surface for "prove who this person is". `db.ts` is
 * the seam for DATA; this is the seam for AUTH. Today it is implemented on
 * Supabase; the AWS/Cognito cutover (DECISIONS A12) replaces the bodies in
 * this file and its .server counterpart, and nothing else.
 *
 * Required by DECISIONS X5: every external dependency gets a seam file
 * BEFORE its first call site. Auth is the cautionary tale that produced that
 * rule — six call sites are coupled to Supabase because no seam existed when
 * OTP was first wired in (login, signup, UserContext, AuthGuard, apiClient,
 * db.ts).
 *
 * ⚠️ THIS FILE IS BROWSER-SAFE AND MUST STAY THAT WAY.
 * It may only import `./supabase` (the anon client). It must NEVER import
 * `./supabaseAdmin` (service role, bypasses RLS) or anything server-only.
 * `apiClient.ts` is reachable from "use client" code and will import this
 * file in chunk 1.10; pulling the admin client in here would construct a
 * broken service-role client in the browser and break the SERVER-ONLY
 * contract documented at db.ts and supabaseAdmin.ts.
 *
 * Token verification — the one operation that genuinely needs the service
 * role — lives in `authProvider.server.ts`. That split mirrors the existing
 * `supabase.ts` / `supabaseAdmin.ts` split, for the same reason.
 *
 * ⚠️ UNUSED AS OF CHUNK 1.4. Nothing imports this file yet. Call sites move
 * over in chunks 1.5 (token verification), 1.6 (login), 1.7 (signup) and
 * 1.10 (AuthGuard, UserContext, apiClient). Committing an unused seam is
 * deliberate: it makes every later chunk a pure swap instead of a swap plus
 * a design decision.
 *
 * M10 — PASSWORD LOGIN (Launch-Ready item 2). Status, updated chunk 2.4:
 *
 * ⚠️ PASSWORD OPERATIONS LIVE IN `authProvider.server.ts`, NOT HERE, AND MUST
 * STAY THERE. Hashing is server-only (argon2id, 19 MiB per call, enforced at
 * build time by `import "server-only"`), and a hash computed in the browser is
 * worthless — the hash simply becomes the password. Nothing password-related
 * may be added to this browser-safe half.
 *
 * · `setPassword(userId, plain, currentPassword?)` — BUILT in chunk 2.4. Sets
 *   or replaces the caller's own credential in `user_credentials`, gated on a
 *   server-side existence check (change requires the current password;
 *   first-time set does not).
 * · `verifyPassword` — still NOT declared. It authenticates, which means it
 *   must also mint a SESSION, and Supabase will not sign a JWT for a
 *   credential it does not hold. That is chunk 2.5 (our own token issue and
 *   verify), and declaring the signature before the token design exists would
 *   be the guess this block originally warned against.
 *
 * The open question this block used to carry is CLOSED: DECISIONS I10 puts the
 * credential in its own `user_credentials` table (never a `users` column), and
 * I11 settles that password authentication writes NO `auth_identities` row —
 * the credential is ours, so there is no external provider and no external id.
 *
 * What remains accounted for: `AuthenticationResult` is named after
 * AUTHENTICATION, not OTP, so chunk 2.5's `verifyPassword` returns the same
 * shape and nothing downstream (1.8's identity write, 1.9's resolution) has
 * to be reshaped when it arrives.
 */

import { supabase } from "./supabase";
import type { OtpPurpose } from "./otpPolicy";

/** DECISIONS A10: the fixed dev code. Accepted on localhost ONLY. */
export const DEV_OTP_BYPASS = "123456";

/**
 * DECISIONS A10: the dev bypass is gated on HOSTNAME, never `NODE_ENV`.
 * A production build served from localhost is still a developer; a dev build
 * reachable on a real host must NOT accept 123456. Matches the checks
 * currently duplicated in AuthGuard.tsx and login/signup — the seam gives
 * them one definition.
 *
 * Returns false when there is no `window` (server render), which is correct:
 * the bypass is a browser-side developer convenience and the server must
 * never infer it.
 */
export function isDevBypassHost(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  );
}

// Canonical phone key: strip non-digits, keep the last 10.
//
// ⚠️ BYTE-IDENTICAL to normalisePhone() in app/lib/auth.ts:34, which is the
// key every ownership check already compares on. It is duplicated rather
// than imported because auth.ts is server-only (it imports NextResponse) and
// this file must stay browser-safe. If the two ever diverge, identity
// matching diverges — keep them in sync. Extracting one shared browser-safe
// helper is a worthwhile later cleanup; it would mean editing auth.ts, which
// chunk 1.4 deliberately does not touch.
//
// This matters more than it looks: `users.phone` is stored bare 10-digit
// while Supabase stores `91`+10, so an un-normalised comparison matches
// nothing (proven in chunk 1.3's backfill).
const toLast10 = (phone: string): string => phone.replace(/\D/g, "").slice(-10);

// Supabase/Twilio require clean E.164. India-only today, matching the
// existing login/signup behaviour — not a new assumption introduced here.
const toE164 = (last10: string): string => "+91" + last10;

// ── result types ────────────────────────────────────────────────────────

/**
 * Why a discriminated result instead of a boolean or a thrown error: the
 * login UI must distinguish "the SMS provider isn't set up for this number"
 * — which routes the user to the WhatsApp/waitlist fallback — from a
 * transient error, which should let them retry. Collapsing those sends real
 * users on unverified Twilio numbers to a dead end, or worse, tells someone
 * to retry a path that can never work.
 */
export type SendOtpResult =
  | { ok: true; devBypass: boolean }
  | { ok: false; reason: "invalid_phone"; message: string }
  /** Provider not configured for this number → WhatsApp/waitlist fallback. */
  | { ok: false; reason: "provider_unavailable" }
  | { ok: false; reason: "error"; message: string }
  | { ok: false; reason: "unknown" };

/**
 * The result of a user PROVING their identity — by OTP today, by password
 * once M10 lands. Deliberately not named after OTP.
 */
export type AuthenticationResult =
  | {
      ok: true;
      /** The phone the provider attests to, normalised to the last 10 digits. */
      phone: string;
      /**
       * The provider's OWN id for this identity — `auth_identities.provider_uid`.
       *
       * ⚠️ NULL ON THE DEV BYPASS, and that is the point. A 123456 login
       * creates no Supabase auth user, so there IS no provider identity.
       * Chunk 1.8 must write an identity row only when this is non-null;
       * writing the synthetic dev id would fabricate
       * ('supabase', 'dev-user-9999999991') rows and pollute the table that
       * chunk 1.3's backfill was careful to keep honest.
       */
      providerUid: string | null;
      /** True when this was the A10 dev bypass, not a real provider auth. */
      isDevBypass: boolean;
      /**
       * The value login/signup mirror into `fabverify_auth.userId`.
       *
       * ⚠️ NOT AN IDENTITY KEY. Never use it to resolve or compare accounts —
       * on the dev bypass it is a synthesised string, not a real id. Audited
       * 2026-07-30: `fabverify_auth` is read at 22 call sites and every one
       * reads only `.phone`; `userId` is WRITE-ONLY today. Preserved purely
       * so chunks 1.6/1.7 stay behaviour-identical swaps.
       */
      storageUserId: string;
    }
  | { ok: false; reason: "invalid_code"; message: string }
  | { ok: false; reason: "error"; message: string };

/** A provider identity resolved from a token. Consumed by chunks 1.5 / 1.9. */
export type ProviderIdentity = {
  /** Discriminant. Chunk 2.5b — see VerifiedIdentity below. */
  kind: "provider";
  /** Looked up against `auth_identities.provider_uid` in chunk 1.9. */
  providerUid: string;
  /** Normalised to the last 10 digits. The fallback key when no identity row exists. */
  phone: string;
};

/**
 * An identity resolved from a token WE issued (chunk 2.5b, DECISIONS [I21]).
 *
 * ⚠️ IT HAS NEITHER A providerUid NOR A PHONE, AND THAT IS WHY THE TYPE HAD TO
 * WIDEN. A password credential writes no `auth_identities` row ([I11]) so
 * there is no provider id, and the token deliberately carries no PII ([I19])
 * so there is no phone. `ProviderIdentity` requires BOTH, so it simply cannot
 * represent a password session — this is not a stylistic split.
 *
 * `userId` IS the account: `sub = users.id`, so this branch of the resolution
 * ladder needs no lookup at all to know who is calling. That makes it the
 * cheapest branch, ahead of both `auth_identities` and phone.
 */
export type LocalIdentity = {
  kind: "local";
  /** `users.id`, taken from the verified `sub` claim. */
  userId: string;
  /** The `token_epoch` this token was minted under ([I12]). Checked against the credential row. */
  epoch: number;
};

/**
 * ⚠️ THE TRUST ROOT'S RETURN TYPE. A DISCRIMINATED UNION, NOT AN OPTIONAL
 * FIELD ([I21]).
 *
 * Modelling this as `{ providerUid?: string; phone?: string; userId?: string }`
 * would compile and would be a bug generator: every consumer would have to
 * remember which combination is legal, and "provider token with a missing
 * phone" would be representable. `kind` makes the illegal states unrepresentable
 * and forces every consumer to handle both branches — the compiler becomes the
 * thing that finds the call sites, instead of a grep.
 */
export type VerifiedIdentity = ProviderIdentity | LocalIdentity;

/** A live session as the browser sees it. */
export type ProviderSession = {
  accessToken: string;
  providerUid: string | null;
};

/**
 * The result of ASKING about the session — three outcomes, not two.
 *
 * ⚠️ "none" AND "error" MUST STAY DISTINCT. This is the client-side twin of
 * Issue E, where collapsing "not logged in" and "couldn't tell" into one null
 * made a database outage look like an auth failure and sent users off to
 * re-authenticate over a transient fault.
 *
 * The same trap exists here, and both consumers would have fallen into it if
 * getSession() had kept returning a bare `ProviderSession | null`:
 *
 *   · AuthGuard bounces to /login on "none". On "error" it must do NOTHING —
 *     a network failure is not proof of a dead session, and bouncing would log
 *     people out over a flaky connection. That behaviour existed as a .catch()
 *     on the raw client and would have been silently lost in the swap.
 *   · apiClient attaches a Bearer token on "session". On "error" a caller that
 *     silently sent no header would get a 401, which readSaveError turns into
 *     "log in again" — telling a signed-in user to re-authenticate because of
 *     a momentary glitch.
 *
 * Added chunk 1.10. Mirrors the discriminated shape of SendOtpResult above.
 */
export type SessionResult =
  | { status: "session"; session: ProviderSession }
  /** Definitively signed out — safe to bounce to /login. */
  | { status: "none" }
  /** Could not determine. NOT proof of being signed out — never bounce on this. */
  | { status: "error" };

// ── operations ──────────────────────────────────────────────────────────

/**
 * Send a one-time code to a phone number.
 *
 * Validation lives here, not at the call site, so login and signup cannot
 * drift apart on what counts as a valid Indian mobile number.
 *
 * On the dev bypass NO message is sent and this resolves ok — the caller
 * still advances to the code screen, where `verifyOtp` accepts 123456.
 */
export async function sendOtp(
  phone: string,
  purpose: OtpPurpose = "login"
): Promise<SendOtpResult> {
  const last10 = toLast10(phone);

  if (last10.length !== 10) {
    return {
      ok: false,
      reason: "invalid_phone",
      message: "Please enter a valid 10-digit mobile number",
    };
  }
  if (!["6", "7", "8", "9"].includes(last10[0])) {
    return {
      ok: false,
      reason: "invalid_phone",
      message: "Please enter a valid Indian mobile number",
    };
  }

  if (isDevBypassHost()) return { ok: true, devBypass: true };

  // ⚠️ CHUNK 2.6c: THE SEND NO LONGER TALKS TO THE PROVIDER FROM HERE.
  //
  // This used to call `supabase.auth.signInWithOtp` directly. In the browser
  // there is no server in the path, so the send could not be counted, could
  // not be throttled, and would SMS a number with no account — an unmetered
  // cost vector on an unauthenticated surface. It now posts to our own route,
  // which throttles, records, and asks the seam's server half to send.
  //
  // ⚠️ THE RETURN TYPE IS DELIBERATELY UNCHANGED. Every failure the route can
  // produce is mapped back onto the EXISTING SendOtpResult union, so
  // login/page.tsx and signup/page.tsx need no new branches and the
  // WhatsApp/waitlist fallback keeps working exactly as it did. A throttle
  // rejection arrives as `reason: "error"` carrying a human message, NOT as a
  // new variant — adding one would force every caller to grow a case, and the
  // pages are proven code on the login path.
  //
  // ⚠️ THE PROVIDER-ERROR HEURISTIC MOVED, IT DID NOT DISAPPEAR. The same
  // three-substring test now runs server-side in sendOtpServerSide and comes
  // back as the structured `provider_unavailable` below. providerFallback.ts
  // remains the backup, still unreachable by construction, still deliberate.
  //
  // ⚠️ NOTE WHAT DOES *NOT* GO OVER THIS WIRE: no session, no token, no
  // identity. An unauthenticated caller asking for a code is exactly what this
  // is, and the route is written for that.
  try {
    const res = await fetch("/api/auth/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: last10, purpose }),
    });

    // A body may be absent or unparseable on an infrastructure error; that is
    // not a reason to throw away the status we already have.
    type SendPayload = { reason?: string; message?: string; error?: string };
    let payload: SendPayload | null = null;
    try {
      payload = (await res.json()) as SendPayload;
    } catch {
      payload = null;
    }

    if (res.ok) return { ok: true, devBypass: false };

    if (payload?.reason === "provider_unavailable") {
      return { ok: false, reason: "provider_unavailable" };
    }

    // `message` is what our route sends (invalid phone, throttled, provider
    // error); `error` is what dbErrorResponse sends on a 503/500. Both are
    // already user-safe strings — dbErrorResponse specifically refuses to put
    // raw exception text in a 5xx body, which is the bug that once rendered
    // "TypeError: fetch failed" on the onboarding screen.
    const message = payload?.message ?? payload?.error;
    if (typeof message === "string" && message.length > 0) {
      return { ok: false, reason: "error", message };
    }

    return { ok: false, reason: "unknown" };
  } catch {
    // The request never completed — offline, DNS, aborted. Distinct from a
    // provider problem, and the pages show a generic retry message.
    return { ok: false, reason: "unknown" };
  }
}

/**
 * Verify a one-time code and, on success, report the identity the provider
 * attests to.
 *
 * The A10 dev bypass is handled here rather than at the call site so that
 * login and signup cannot implement it differently — and so that the "no
 * provider identity exists" fact is expressed structurally (`providerUid:
 * null`) rather than as a string prefix each caller has to remember to
 * check.
 */
export async function verifyOtp(
  phone: string,
  code: string
): Promise<AuthenticationResult> {
  const last10 = toLast10(phone);

  if (isDevBypassHost()) {
    if (code !== DEV_OTP_BYPASS) {
      return {
        ok: false,
        reason: "invalid_code",
        message: `Development mode: enter ${DEV_OTP_BYPASS} to continue`,
      };
    }
    return {
      ok: true,
      phone: last10,
      providerUid: null,
      isDevBypass: true,
      // Preserves the existing format exactly (all digits of the raw input,
      // not the last 10) so chunk 1.6 is a behaviour-identical swap. See the
      // storageUserId warning above — this value is write-only.
      storageUserId: "dev-user-" + phone.replace(/\D/g, ""),
    };
  }

  try {
    const { data, error } = await supabase.auth.verifyOtp({
      phone: toE164(last10),
      token: code,
      type: "sms",
    });

    if (error || !data.user) {
      return {
        ok: false,
        reason: "invalid_code",
        message: "Invalid OTP. Please try again.",
      };
    }

    return {
      ok: true,
      // Prefer the phone the PROVIDER attests to over the one typed in.
      phone: data.user.phone ? toLast10(data.user.phone) : last10,
      providerUid: data.user.id,
      isDevBypass: false,
      storageUserId: data.user.id,
    };
  } catch {
    return {
      ok: false,
      reason: "error",
      message: "Something went wrong. Please try again.",
    };
  }
}

/**
 * The current session as the browser sees it.
 *
 * Serves both call sites: AuthGuard needs only "is there a session",
 * apiClient needs the access token to attach as a Bearer header.
 *
 * ⚠️ RETURNS A DISCRIMINATED SessionResult, NOT `ProviderSession | null`.
 * The signature was widened in chunk 1.10 — see SessionResult above for why
 * "signed out" and "could not tell" must never collapse into one value. This
 * is NOT a rename; a caller treating a falsy result as "signed out" would
 * reintroduce the exact bug the type exists to prevent.
 *
 * Reports `none` under the dev bypass, correctly — 123456 creates no Supabase
 * session at all. That is exactly why AuthGuard skips its session check on
 * localhost, and why apiClient sends `x-dev-phone` there instead.
 */
/**
 * ⚠️ WHERE OUR OWN SESSION TOKEN LIVES (chunk 2.5b, [I19]).
 *
 * localStorage, by decision — not a cookie. A cookie would need CSRF handling
 * this app has none of, and the token is already sent as an explicit
 * `Authorization` header by apiClient rather than travelling ambiently on
 * every request. The XSS exposure that localStorage carries is real and
 * accepted: an attacker who can run script in this origin can read the
 * Supabase token out of storage today by exactly the same means, so this
 * changes nothing about the threat model.
 *
 * ⚠️ NOT A `NEXT_PUBLIC_` VALUE AND NOT A SECRET WE MINT CLIENT-SIDE. The
 * browser only ever RECEIVES this from the login route; the signing key is
 * server-only and throws at module load if absent (A4).
 */
const LOCAL_TOKEN_KEY = "fabverify_session_token";

/** Store the token the password-login route issued. Browser only. */
export function storeLocalSessionToken(token: string): void {
  try {
    localStorage.setItem(LOCAL_TOKEN_KEY, token);
  } catch {
    // Storage can be unavailable (private mode, quota). The caller must treat
    // a failure here as a failed login rather than proceeding half-signed-in.
    throw new Error("Could not start a session on this device.");
  }
}

/** Forget our token. Safe to call when there is none. */
export function clearLocalSessionToken(): void {
  try {
    localStorage.removeItem(LOCAL_TOKEN_KEY);
  } catch {
    // Best effort — signOut's local teardown must never throw.
  }
}

function readLocalSessionToken(): string | null {
  try {
    return localStorage.getItem(LOCAL_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionResult> {
  try {
    // ── OURS FIRST (chunk 2.5b) ──────────────────────────────────────────
    //
    // ⚠️ CHECKED BEFORE SUPABASE, mirroring the server's verifier order. A
    // password login creates NO Supabase session, so if this were checked
    // second, `supabase.auth.getSession()` would return nothing, this function
    // would answer "none", and apiClient would send NO Authorization header at
    // all — every request 401ing while the user looks perfectly logged in.
    //
    // ⚠️ `providerUid: null` — a password session has no provider identity
    // ([I11]), the same signal the dev path uses. Nothing may write
    // auth_identities from it.
    //
    // Expiry is NOT checked here: this is the browser, and a client-side
    // clock is not a security input. The server rejects an expired token (D4),
    // which is the only judgement that counts. Answering "session" for a
    // stale token costs one 401, which apiClient already handles.
    const localToken = readLocalSessionToken();
    if (localToken) {
      return {
        status: "session",
        session: { accessToken: localToken, providerUid: null },
      };
    }

    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return { status: "none" };
    return {
      status: "session",
      session: {
        accessToken: token,
        providerUid: data.session?.user?.id ?? null,
      },
    };
  } catch {
    // Deliberately NOT "none". The caller decides what an unanswerable
    // question means for it; guessing "signed out" here is what logs people
    // out over a flaky connection.
    return { status: "error" };
  }
}

/**
 * End the provider session, revoking the refresh token server-side.
 *
 * Swallows its own failure by design: the caller's LOCAL teardown (clearing
 * the React identity and the localStorage mirrors) must still run, or a
 * failed network call would leave a half-signed-out state. That ordering is
 * load-bearing and documented at UserContext's signOut — this seam preserves
 * it rather than changing it.
 *
 * It must be called while storage is still intact, since supabase-js needs
 * its own token entry to find the refresh token it is revoking.
 */
export async function signOut(): Promise<void> {
  // ⚠️ OURS IS CLEARED FIRST AND UNCONDITIONALLY (chunk 2.5b). It is a
  // SIGNED, STATELESS token — there is no server-side record to revoke, so
  // forgetting it locally is the entire logout for a password session. If
  // this ran after the Supabase call and that call hung or threw, the token
  // would survive and the "signed out" user would still be authenticated on
  // the next request.
  clearLocalSessionToken();

  try {
    await supabase.auth.signOut();
  } catch {
    // Intentionally ignored — see above.
  }
}
