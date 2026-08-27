import { NextResponse } from "next/server";
import { dbErrorResponse } from "@/app/lib/apiError";
import { verifyPasswordCredential } from "@/app/lib/authProvider.server";
import { issueSessionToken } from "@/app/lib/sessionToken.server";
import { PASSWORD_CREDENTIAL_TYPE, getUserCredential } from "@/app/lib/db";
import {
  callerIp,
  checkLoginSprayThrottle,
  clearLoginFailuresFor,
  hashIp,
  hashPhone,
  logGlobalLoginFailureRate,
  recordLoginFailure,
} from "@/app/lib/otpThrottle.server";

/**
 * LOG IN WITH PHONE + PASSWORD. Chunk 2.6a (M10) — the FIRST HTTP surface on
 * the credential path, and the moment password login becomes reachable.
 *
 * ⚠️ THIS ROUTE ENDS THE [I18] DEFERRAL. Until now `verifyPasswordCredential`
 * had ZERO route importers on purpose: an endpoint answering "are these
 * credentials valid?" without issuing a session is a credential oracle with no
 * legitimate client. This route is the legitimate client — it issues a
 * session — and it is also what opens a brute-force surface. That is why
 * lockout (2.7) was a hard prerequisite and shipped first.
 *
 * ⚠️ IT CONTAINS NO AUTH LOGIC OF ITS OWN, DELIBERATELY. No hashing, no
 * comparison, no lockout arithmetic, no token verification. Every security
 * decision was made and proven upstream:
 *   · verifyPasswordCredential — argon2id + lockout + enumeration control
 *                                (chunks 2.5a/2.7, 37 + 51 assertions)
 *   · issueSessionToken        — signing, claims, TTL (2.5b, 54 assertions)
 * This handler maps three outcomes onto three status codes. If it ever grows a
 * security decision of its own, that decision is in the wrong place.
 *
 * ── ⚠️ THE ENUMERATION CONTRACT AT THE HTTP LAYER ────────────────────────
 * The seam guarantees that every prober-reachable failure is one
 * indistinguishable value. A ROUTE CAN LEAK THAT BACK OUT even when the
 * function does not — through a status code, a body shape, or a response
 * time. So:
 *   · `invalid-credentials` and `account-locked` BOTH answer 401
 *   · the generic body is byte-identical for wrong password, unknown phone,
 *     and account-with-no-password
 *   · only `account-locked` carries extra detail, and that reason is
 *     UNREACHABLE without a correct password ([I24]) — a prober cannot
 *     provoke it, so it tells them nothing they did not already know
 * ⚠️ Never add a status or message that distinguishes "no such account".
 *
 * ── STATUS CODES ─────────────────────────────────────────────────────────
 *   200  authenticated — token issued
 *   400  malformed body (missing/non-string fields) — NOT "wrong password"
 *   401  invalid credentials OR locked account
 *   405  any method other than POST                 (Next.js, no code needed)
 *   503  database unreachable                       (dbErrorResponse)
 *   500  genuine query fault                        (dbErrorResponse)
 *
 * ⚠️ NO PLAINTEXT ANYWHERE — never logged, never echoed, never in an error.
 */

/**
 * ⚠️ ONE FROZEN BODY FOR EVERY UNPROVEN FAILURE. Constructed once so "these
 * two responses are identical" is a property of the code rather than of two
 * string literals someone might later edit apart.
 */
const GENERIC_FAILURE = { error: "Invalid phone number or password." } as const;

export async function POST(request: Request) {
  let phone: unknown;
  let password: unknown;

  try {
    const body = await request.json();
    phone = body?.phone;
    password = body?.password;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // ⚠️ A 400 HERE MUST NOT BE REACHABLE BY A *CREDENTIAL* MISTAKE — only by a
  // malformed request. A wrong password is a 401 like every other failure; if
  // a bad password could produce 400, the status code itself would become the
  // oracle this route is written to avoid. So the check is purely structural:
  // are the two fields present and strings? Their CONTENT is never judged
  // here — the seam judges it, at constant cost.
  if (typeof phone !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // ── ANTI-SPRAY (chunk 2.10, [I35]/[I36]) ────────────────────────────────
  //
  // ⚠️ BEFORE THE ARGON2 VERIFY, DELIBERATELY. Each verify costs ~45 ms of
  // memory-hard work at 19 MiB; a sprayer who reached this route would
  // otherwise get that compute for free on every guess. This is the one place
  // the ordering differs from [I25], which put the LOCKOUT check AFTER the
  // verify — and the reasoning does not conflict: [I25] was avoiding a timing
  // signal that varied by ACCOUNT (a locked account answering faster than an
  // unlocked one). This check never looks at the account at all, so the only
  // thing its timing reveals is the state of the caller's OWN address, which
  // they created and already know.
  //
  // ⚠️ IT NEVER THROWS. checkLoginSprayThrottle fails OPEN and loudly ([I36]),
  // because fail-closed here would lock every user out of the platform on a
  // database blip — and buy nothing, since the same outage stops
  // verifyPasswordCredential authenticating anyone. If it fails open, login
  // degrades to exactly [I23]'s per-account lockout, which is untouched.
  const ipHash = hashIp(callerIp(request.headers));
  const phoneHash = hashPhone(phone.replace(/\D/g, "").slice(-10));

  const spray = await checkLoginSprayThrottle({ ipHash });

  if (!spray.allowed) {
    // ⚠️ THE GENERIC 401, NOT A 429, AND THAT IS THE STRONGER CHOICE.
    //
    // A 429 would be enumeration-safe — the counter reads no account state, so
    // it cannot differ between a registered and an unregistered number — but
    // it would TELL A SPRAYER THEIR TECHNIQUE WAS DETECTED, handing them the
    // signal to rotate addresses. Returning the same body as a wrong password
    // reveals nothing at all: not the account, and not the control.
    //
    // ⚠️ THE COST, STATED RATHER THAN HIDDEN: a legitimate user caught behind
    // a blocked shared address sees "invalid password" and gets no
    // explanation. Accepted because clear-on-success ([I35]) makes that case
    // very rare — an office only trips this if its people are failing and
    // never succeeding — and because the alternative helps the attacker more
    // than it helps that user. No Retry-After header, for the same reason.
    return NextResponse.json(GENERIC_FAILURE, { status: 401 });
  }

  try {
    // Lockout, argon2id verification and the enumeration equalisation all
    // happen inside this one call. Nothing about them is re-implemented here.
    const result = await verifyPasswordCredential(phone, password);

    if (!result.ok) {
      // ⚠️ RECORDED AFTER THE VERIFY AND ONLY ON FAILURE — unavoidable, since
      // the whole design counts accounts that FAILED. Same ordering [I23]'s
      // own recordFailure already uses. Awaited for [I25]'s reason: the
      // platform may freeze the function after the response, and a floated
      // write is simply lost.
      //
      // ⚠️ `account-locked` IS COUNTED TOO. It is only reachable by a caller
      // who supplied the CORRECT password ([I24]), so it is not a spray
      // signal — but excluding it would create a branch where an attacker's
      // attempt costs nothing, and the cost of counting it is that a locked-
      // out owner adds one row for their own account. One account is never a
      // spray.
      await recordLoginFailure({ phoneHash, ipHash });
      void logGlobalLoginFailureRate();

      if (result.reason === "account-locked") {
        // Reachable ONLY by a caller who supplied the correct password
        // ([I24]) — they have proven ownership, so telling them how long to
        // wait reveals nothing a prober could obtain.
        return NextResponse.json(
          {
            ...GENERIC_FAILURE,
            locked: true,
            retryAfterSeconds: result.retryAfterSeconds,
            error: "Too many failed attempts. Try again in a few minutes.",
          },
          { status: 401 }
        );
      }
      return NextResponse.json(GENERIC_FAILURE, { status: 401 });
    }

    // ── SUCCESS ────────────────────────────────────────────────────────
    //
    // ⚠️ ONE EXTRA READ, ON THE SUCCESS PATH ONLY, AND IT IS NOT AN
    // ENUMERATION PROBLEM. The seam equalises round trips across every
    // FAILURE path; this query runs only after credentials have already been
    // proven correct, and a successful login is self-evidently distinguishable
    // from a failed one. It exists so `verifyPasswordCredential` stays
    // byte-identical to the version 37 + 51 assertions were written against —
    // carrying the epoch out of it would be cheaper and would mean editing a
    // security-critical function for a convenience.
    // ⚠️ FORGET THIS ACCOUNT'S FAILURES FROM THIS ADDRESS ([I35]). Without
    // this the control punishes large offices: ten different people behind one
    // NAT each mistyping once inside fifteen minutes is ordinary traffic, and
    // only counting accounts that failed AND NEVER SUCCEEDED is what makes a
    // threshold of 10 safe. Never throws — a housekeeping failure must not
    // turn a proven-correct login into an error.
    await clearLoginFailuresFor({ phoneHash, ipHash });

    const credential = await getUserCredential(result.user.id, PASSWORD_CREDENTIAL_TYPE);

    // Defensive, not expected: verification just succeeded against this row,
    // so its absence means it was deleted in the microseconds since. Fail
    // closed rather than mint a token against an assumed epoch of 0, which
    // would be a token that survives revocation.
    if (!credential) return NextResponse.json(GENERIC_FAILURE, { status: 401 });

    const token = await issueSessionToken(result.user.id, credential.token_epoch);

    return NextResponse.json({
      token,
      // ⚠️ A DELIBERATE PROJECTION, NOT THE WHOLE ROW. `result.user` is a
      // `select("*")` on `users`; returning it wholesale is how
      // /api/dev-auth/lookup became a PII disclosure. Only what the client
      // needs to route and render an identity goes over the wire.
      user: {
        id: result.user.id,
        phone: result.user.phone,
        name: result.user.name,
        user_type: result.user.user_type,
      },
      // The caller just authenticated WITH a password, so by definition they
      // have one. Lets the login page skip a round trip to password-status.
      hasPassword: true,
    });
  } catch (error) {
    // ⚠️ 503, NEVER 401. An outage that answered "invalid credentials" would
    // tell a user with a perfectly good password that it is wrong and send
    // them to reset a credential that was never broken (Issue E). The seam
    // throws rather than returning a failure precisely so this stays possible.
    return dbErrorResponse(error);
  }
}
