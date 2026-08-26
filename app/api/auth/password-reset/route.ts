import { NextResponse } from "next/server";
import { dbErrorResponse } from "@/app/lib/apiError";
import { resetPasswordByOtp } from "@/app/lib/authProvider.server";
import { issueSessionToken } from "@/app/lib/sessionToken.server";
import {
  callerIp,
  checkOtpVerifyThrottle,
  hashIp,
  hashPhone,
  recordOtpVerifyAttempt,
} from "@/app/lib/otpThrottle.server";

/**
 * POST /api/auth/password-reset — chunk 2.8b.
 *
 * ⚠️ THE MOST EXPOSED WRITE ON THE PLATFORM. It is UNAUTHENTICATED by
 * definition — "forgot password" cannot require a session — and on success it
 * WRITES A CREDENTIAL and BUMPS `token_epoch`, which evicts every existing
 * session of ours for that account. A bug here is not an information leak; it
 * is a persistent account takeover that simultaneously locks the real owner
 * out. Read [I28], [I33] and [I34] before changing anything in this file.
 *
 * ⚠️ A THIN ADAPTER, PER [I28]. Every security decision belongs to code that
 * was proven before this route existed:
 *   · the OTP gate, resolution, policy and the write → resetPasswordByOtp (2.8a)
 *   · the brute-force limit on code guessing        → checkOtpVerifyThrottle (2.8b, [I33])
 *   · the provider call's client isolation          → otpVerifyClient (2.8b, [I34])
 *   · token issuance                                → issueSessionToken (2.5b)
 * Nothing here re-implements any of it. If this file starts making auth
 * decisions of its own, the seam has been bypassed.
 */

/**
 * ⚠️ ONE OPAQUE FAILURE, MIRRORING THE SEAM'S `invalid-request`. A wrong code,
 * an expired code, a code for a number with no account, and a malformed phone
 * are all THIS — same status, same body. Anything finer rebuilds the
 * account-existence oracle the uniform response exists to close.
 */
const GENERIC_FAILURE = Object.freeze({ error: "That code is not valid. Request a new one." });

export async function POST(request: Request) {
  let phone: unknown;
  let code: unknown;
  let password: unknown;

  try {
    const body = await request.json();
    phone = body?.phone;
    code = body?.code;
    password = body?.password;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // ⚠️ STRUCTURAL ONLY — a 400 must never be reachable by a WRONG CODE, or the
  // status line becomes the oracle. Same rule as password-login: are the three
  // fields present and strings? Their content is judged by the seam, not here.
  if (typeof phone !== "string" || typeof code !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const normalised = phone.replace(/\D/g, "").slice(-10);
  const phoneHash = hashPhone(normalised);
  const ipHash = hashIp(callerIp(request.headers));

  try {
    // ── 1. THE BRUTE-FORCE GATE, BEFORE THE CODE IS EVEN LOOKED AT ────────
    //
    // ⚠️ THIS IS WHAT MAKES THE ROUTE SAFE TO EXPOSE ([I33]). The code is six
    // digits; without a limit on guesses this endpoint is an account-takeover
    // oracle. The throttle throws on any database failure and that throw
    // becomes a 503 below with NO GUESS EVALUATED — fail-closed, D3. Never
    // soften it into "allow on error": a verify that wrongly proceeds costs an
    // account, where a send that wrongly proceeds costs an SMS.
    const decision = await checkOtpVerifyThrottle({ phoneHash, ipHash });

    if (!decision.allowed) {
      // ⚠️ A 429 HERE CANNOT LEAK ACCOUNT EXISTENCE, and that is a property of
      // the counter rather than of this response: checkOtpVerifyThrottle reads
      // only the CALLER'S OWN recent attempts and touches no `users` or
      // `user_credentials` row, so a registered and an unregistered number
      // produce byte-identical output. The suite asserts that directly rather
      // than trusting this comment.
      //
      // Telling the caller how long to wait is therefore safe AND necessary: a
      // locked-out real owner who is shown only "invalid code" will keep
      // retrying a code that is perfectly good, on the one path that matters
      // when they have already lost access.
      return NextResponse.json(
        {
          ...GENERIC_FAILURE,
          throttled: true,
          retryAfterSeconds: decision.retryAfterSeconds,
          error: "Too many attempts. Request a new code and try again shortly.",
        },
        { status: 429, headers: { "Retry-After": String(decision.retryAfterSeconds) } }
      );
    }

    // ── 2. RECORD THE ATTEMPT *BEFORE* EVALUATING IT ──────────────────────
    //
    // ⚠️ THE ORDERING IS THE CONTROL. Recording after the verify would let an
    // attacker who kills the connection mid-request guess for free; recording
    // only on failure would make a crash between "wrong" and "record" cost
    // nothing. Counting up front is the only ordering where an abandoned
    // request still spends its slot. Awaited for [I25]'s reason — a floated
    // promise can be frozen away by the platform.
    await recordOtpVerifyAttempt({ phoneHash, ipHash });
  } catch (error) {
    // 503 unreachable / 500 real fault, never raw exception text. No guess was
    // evaluated and nothing was written.
    return dbErrorResponse(error);
  }

  try {
    // ── 3. THE SEAM DOES EVERYTHING ELSE ──────────────────────────────────
    // Verifies the OTP server-side on the ISOLATED client ([I34]), resolves the
    // account, validates the password policy, then writes the hash + bumps the
    // epoch + clears the lockout in ONE statement.
    const result = await resetPasswordByOtp(normalised, code, password);

    if (!result.ok) {
      if (result.reason === "weak-password") {
        // ⚠️ REACHABLE ONLY AFTER A VALID OTP, and that ordering is the point.
        // This message reveals the password policy, so it must sit behind
        // proof of ownership — the seam already enforces that by validating
        // only after the gate. Surfacing it is safe here and nowhere else.
        return NextResponse.json({ error: result.message, weakPassword: true }, { status: 400 });
      }
      return NextResponse.json(GENERIC_FAILURE, { status: 401 });
    }

    // ── 4. SUCCESS — MINT AT THE *NEW* EPOCH ──────────────────────────────
    //
    // ⚠️ `result.tokenEpoch` IS THE POST-BUMP VALUE, and using it is what makes
    // the reset usable. The bump has just invalidated every outstanding token
    // for this account; minting at the old epoch would issue a token that is
    // dead on arrival, and re-reading the row to "check" would be a race. The
    // seam hands the value out precisely so this route need not guess.
    const token = await issueSessionToken(result.user.id, result.tokenEpoch);

    return NextResponse.json({
      token,
      // A deliberate projection, not the row. `result.user` is a `select("*")`
      // on `users`; returning it wholesale is how /api/dev-auth/lookup became
      // a PII disclosure.
      user: {
        id: result.user.id,
        phone: result.user.phone,
        name: result.user.name,
        user_type: result.user.user_type,
      },
      // The caller just set a password, so the [I27] gate must not bounce them
      // straight back to /onboarding/password.
      hasPassword: true,
    });
  } catch (error) {
    return dbErrorResponse(error);
  }
}
