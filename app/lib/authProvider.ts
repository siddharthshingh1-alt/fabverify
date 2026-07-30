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
 * FUTURE (M10 — password login, Launch-Ready item 2)
 * `verifyPassword` and `setPassword` are deliberately NOT declared here yet.
 * The `provider_uid` meaning for `provider = 'password'` is still undecided
 * (parked in chunk 1.2): the credential will live in our own `users` table,
 * so there is no external id — either `users.id` doubles as the uid, or
 * password is a `users` column and never a row in `auth_identities`. A
 * guessed signature would be worse than none, because chunks 1.6–1.10 could
 * build against it and item 2 would then have to break it. Adding a method
 * later is a one-line change with no migration cost.
 * What IS already accounted for: `AuthenticationResult` is named after
 * AUTHENTICATION, not OTP, so a future `verifyPassword` returns the same
 * shape and nothing downstream (1.8's identity write, 1.9's resolution) has
 * to be reshaped when it arrives.
 */

import { supabase } from "./supabase";

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
  /** Looked up against `auth_identities.provider_uid` in chunk 1.9. */
  providerUid: string;
  /** Normalised to the last 10 digits. The fallback key when no identity row exists. */
  phone: string;
};

/** A live session as the browser sees it. */
export type ProviderSession = {
  accessToken: string;
  providerUid: string | null;
};

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
export async function sendOtp(phone: string): Promise<SendOtpResult> {
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

  try {
    const { error } = await supabase.auth.signInWithOtp({
      phone: toE164(last10),
      options: { channel: "sms" },
    });

    if (!error) return { ok: true, devBypass: false };

    // HEURISTIC BY NECESSITY — the same shape as isDatabaseUnavailable() in
    // apiError.ts. Supabase exposes no error code meaning "SMS provider not
    // configured for this number", so this matches on message text. It is
    // deliberately not exhaustive: anything unrecognised falls through to
    // `error`, which shows the message and lets the user retry — the safe
    // direction. Provider-specific knowledge belongs behind the seam, which
    // is precisely why this sniffing moved in here out of the login page.
    const m = error.message.toLowerCase();
    if (
      m.includes("not configured") ||
      m.includes("provider") ||
      m.includes("sms")
    ) {
      return { ok: false, reason: "provider_unavailable" };
    }

    return { ok: false, reason: "error", message: error.message };
  } catch {
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
 * The current session as the browser sees it, or null.
 *
 * Serves both existing call sites: AuthGuard needs only "is there a
 * session", apiClient needs the access token to attach as a Bearer header.
 *
 * Returns null under the dev bypass, correctly — 123456 creates no Supabase
 * session at all. That is exactly why AuthGuard skips its session check on
 * localhost, and why apiClient sends `x-dev-phone` there instead.
 */
export async function getSession(): Promise<ProviderSession | null> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return null;
    return { accessToken: token, providerUid: data.session?.user?.id ?? null };
  } catch {
    return null;
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
  try {
    await supabase.auth.signOut();
  } catch {
    // Intentionally ignored — see above.
  }
}
