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
import { getPhoneFromAccessToken, getUserByPhoneOrThrow } from "./db";

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

export type PhoneAuthResult = { ok: true; phone: string } | AuthFailure;

type UserRow = NonNullable<Awaited<ReturnType<typeof getUserByPhoneOrThrow>>>;

export type UserAuthResult = { ok: true; user: UserRow } | AuthFailure;

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

    // A rejected token is genuinely "not authenticated". Supabase does not
    // reliably distinguish a network failure here from an invalid token, so
    // this stays conservative; the database lookup below is where the
    // outage-vs-auth distinction actually matters.
    const phone = await getPhoneFromAccessToken(token);
    return phone ? { ok: true, phone } : UNAUTHENTICATED;
  }

  const devPhone = request.headers.get("x-dev-phone");
  return devPhone ? { ok: true, phone: normalisePhone(devPhone) } : UNAUTHENTICATED;
}

/**
 * The caller's existing users row. Use for anything touching existing data.
 * A caller with a valid session but no account row is "unauthenticated" —
 * they have nothing to act on yet.
 */
export async function getVerifiedUser(request: Request): Promise<UserAuthResult> {
  const caller = await getVerifiedCallerPhone(request);
  if (!caller.ok) return caller;

  try {
    const user = await getUserByPhoneOrThrow(caller.phone);
    return user ? { ok: true, user } : UNAUTHENTICATED;
  } catch {
    // The database is unreachable — NOT an authentication problem.
    return UNAVAILABLE;
  }
}
