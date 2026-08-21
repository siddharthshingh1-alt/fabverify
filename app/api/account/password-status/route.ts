import { NextResponse } from "next/server";
import { authErrorResponse, getVerifiedUser } from "@/app/lib/auth";
import { dbErrorResponse } from "@/app/lib/apiError";
import { PASSWORD_CREDENTIAL_TYPE, getUserCredential } from "@/app/lib/db";

/**
 * DOES THE CALLER HAVE A PASSWORD? Chunk 2.6b (M10) — the input to the
 * mandatory set-password gate.
 *
 * ⚠️ ABOUT THE CALLER AND NOBODY ELSE. The account is
 * `getVerifiedUser(request).user.id`; the request carries no identifier and
 * none would be honoured. So this cannot be turned into "does phone X have a
 * password?", which would be an enumeration oracle wearing a helpful face.
 * That is why this is a separate endpoint rather than a field bolted onto
 * `/api/dev-auth/lookup`, which is unauthenticated and takes a phone.
 *
 * ⚠️ IT RETURNS A BOOLEAN, NEVER THE CREDENTIAL. No hash, no epoch, no
 * timestamps, no lockout state. `hasPassword` is the entire answer. Lockout
 * state especially must not leak here — it is disclosed only to someone who
 * has proven ownership by supplying the correct password ([I24]), and this
 * endpoint's caller has proven a session, which is not the same thing.
 *
 * ── THE THIRD STATE IS THE POINT ─────────────────────────────────────────
 * `getUserCredential` THROWS on database failure (chunk 2.4's deliberate
 * contract), so this route can answer 503 rather than guessing. That matters
 * more here than it looks:
 *   · guessing `false` during an outage → every user forced to a
 *     set-password screen that cannot write. Trapped.
 *   · guessing `true`  during an outage → the requirement silently lapses.
 * Neither is acceptable, so the guard is taught to treat 503 as "unknown" and
 * NOT redirect. See AuthGuard.
 *
 * ── STATUS CODES ─────────────────────────────────────────────────────────
 *   200  { hasPassword: boolean }
 *   401  not authenticated              (authErrorResponse)
 *   405  any method other than GET      (Next.js, no code needed)
 *   503  database unreachable           (authErrorResponse / dbErrorResponse)
 *   500  genuine query fault            (dbErrorResponse)
 */
export async function GET(request: Request) {
  const caller = await getVerifiedUser(request);
  if (!caller.ok) return authErrorResponse(caller);

  try {
    const credential = await getUserCredential(caller.user.id, PASSWORD_CREDENTIAL_TYPE);
    return NextResponse.json({ hasPassword: credential !== null });
  } catch (error) {
    return dbErrorResponse(error);
  }
}
