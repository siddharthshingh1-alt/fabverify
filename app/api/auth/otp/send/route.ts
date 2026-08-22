import { NextResponse } from "next/server";
import { dbErrorResponse } from "@/app/lib/apiError";
import { sendOtpServerSide } from "@/app/lib/authProvider.server";
import {
  OTP_RESET_FLOOR_MS,
  asOtpPurpose,
  isValidIndianMobile,
  toLast10Digits,
} from "@/app/lib/otpPolicy";
import {
  callerIp,
  checkOtpThrottle,
  hashIp,
  hashPhone,
  recordOtpAttempt,
} from "@/app/lib/otpThrottle.server";

/**
 * REQUEST A ONE-TIME CODE. Chunk 2.6c (M10) — the send leaves the browser.
 *
 * ⚠️ WHAT THIS ROUTE REPLACES. Until now `authProvider.ts sendOtp` called
 * `supabase.auth.signInWithOtp` DIRECTLY FROM THE BROWSER. There was no server
 * in the path, so the send could not be counted, could not be throttled, and
 * would happily SMS a number with no account — a cost vector on an
 * unauthenticated surface. This route is the server that was missing.
 *
 * ⚠️ IT IS A HARD PREREQUISITE OF 2.8b, NOT A NICE-TO-HAVE. Password reset
 * requests a code on a path reachable WITHOUT AUTHENTICATION. Shipping the
 * reset UI before this route existed would have published a free, unthrottled
 * SMS trigger aimed at arbitrary numbers. Same category of ordering error as
 * scheduling 2.6 before 2.7, which this project got backwards once already.
 *
 * ⚠️ IT CONTAINS NO AUTH LOGIC OF ITS OWN — [I28]'s doctrine, applied to a
 * different surface. It validates shape, asks the throttle, records, and asks
 * the seam to send. It never reads `users`, never touches a credential, and
 * never learns whether an account exists. If it ever grows a security decision
 * of its own, that decision is in the wrong place.
 *
 * ── ⚠️ THE ENUMERATION CONTRACT ──────────────────────────────────────────
 * Every well-formed number gets the SAME accepted body, registered or not.
 *   · login / signup — the provider is asked to send unconditionally
 *     (shouldCreateUser TRUE), so there is no existence branch to leak.
 *   · reset          — the provider is called for EVERY number
 *     (shouldCreateUser FALSE), so no round trip and no SMS-send decision is
 *     skipped for an unknown one; its refusal is swallowed by the seam and
 *     mapped onto the same accepted body. The remaining difference is LATENCY,
 *     which is why the reset path is floored (OTP_RESET_FLOOR_MS).
 * ⚠️ NEVER add a status, a message, or an early return that distinguishes
 * "no such account". A route can leak what the seam does not.
 *
 * ── STATUS CODES ─────────────────────────────────────────────────────────
 *   200  accepted — a code was sent if the number and purpose allow it
 *   400  malformed body or malformed phone — a SHAPE fact, never an account
 *        fact ([I28]: 400 must be unreachable by a credential/identity miss)
 *   405  any method other than POST                 (Next.js, no code needed)
 *   429  throttled, with Retry-After
 *   502  the provider itself failed (login/signup only — see the reset note)
 *   503  the throttle counter is unreadable — FAIL CLOSED, no SMS sent
 *
 * ⚠️ THE PHONE NUMBER IS NEVER LOGGED. Not on success, not on rejection, not
 * in an error. The throttle stores an HMAC and this handler logs a scope name.
 */

/** Frozen so "these responses are identical" is a property of the code. */
const GENERIC_ACCEPTED = Object.freeze({ ok: true });

const INVALID_PHONE = Object.freeze({
  ok: false,
  reason: "invalid_phone",
  message: "Please enter a valid Indian mobile number",
});

export async function POST(request: Request) {
  const startedAt = Date.now();

  let body: { phone?: unknown; purpose?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(INVALID_PHONE, { status: 400 });
  }

  const phone = toLast10Digits(body?.phone);
  if (!isValidIndianMobile(phone)) {
    return NextResponse.json(INVALID_PHONE, { status: 400 });
  }

  const purpose = asOtpPurpose(body?.purpose);
  // ⚠️ THE ONLY PLACE THIS DECISION IS MADE. login/signup may create an
  // account for an unknown number (chunk 1.7's signup depends on it); reset
  // must not — a phantom auth user and an SMS to a stranger are precisely the
  // abuse this chunk closes.
  const allowCreate = purpose !== "reset";

  const phoneHash = hashPhone(phone);
  const ipHash = hashIp(callerIp(request.headers));

  try {
    // ── 1. THE GATE. Throws on any database failure, and that throw becomes a
    // 503 below with NO SMS SENT — decision D3, fail-closed, signed off
    // explicitly. Do not soften this into "allow on error": a database blip
    // would then turn the platform into an unthrottled SMS cannon, and an
    // attacker need not cause the outage, only wait for one.
    const decision = await checkOtpThrottle({ phoneHash, ipHash });

    if (!decision.allowed) {
      // Scope is logged, never returned — "which limit bound" is operational
      // detail, and the caller only needs to know how long to wait.
      console.warn(`[otp] throttled (${decision.scope}), retry in ${decision.retryAfterSeconds}s`);

      return NextResponse.json(
        {
          ok: false,
          reason: "throttled",
          retryAfterSeconds: decision.retryAfterSeconds,
          // ⚠️ THIS WORDING IS LOAD-BEARING AND IS ASSERTED BY THE SUITE. The
          // browser seam maps a non-provider failure to `reason: "error"`, and
          // the pages then run looksLikeProviderProblem() over the message as
          // a BACKUP check. If this string ever contained "sms", "provider" or
          // "not configured", a throttled user would be shown the
          // WhatsApp/waitlist dead-end instead of "wait and retry".
          message: `Please wait ${decision.retryAfterSeconds} seconds before requesting another code.`,
        },
        { status: 429, headers: { "Retry-After": String(decision.retryAfterSeconds) } }
      );
    }

    // ── 2. RECORD BEFORE SENDING, AND AWAIT IT. An SMS must never be sent
    // unrecorded: the opposite ordering lets a caller burn sends for free
    // whenever the provider is flaky. Awaited rather than floated because
    // Vercel may freeze the function after the response — [I25] recorded
    // exactly that for the lockout counter, and a dropped write is a throttle
    // that never throttles.
    await recordOtpAttempt({ phoneHash, ipHash, purpose });
  } catch (error) {
    // 503 (unreachable) or 500 (real fault), never a raw exception string.
    return dbErrorResponse(error);
  }

  // ── 3. SEND ────────────────────────────────────────────────────────────
  const result = await sendOtpServerSide(phone, allowCreate);

  if (!result.ok) {
    // ⚠️ REST EASY ABOUT ENUMERATION HERE: this branch is UNREACHABLE for
    // `reset`, because the seam converts every provider failure on a
    // non-creating send into an accepted result. A provider outage on the
    // reset path is therefore indistinguishable from success — deliberate, and
    // the cost is real: the user is told a code is coming when none is. The
    // reset UI (2.8b) must offer a "didn't get a code?" route out rather than
    // relying on an error that will never arrive.
    return await floored(
      purpose,
      startedAt,
      NextResponse.json(
        result.reason === "provider_unavailable"
          ? { ok: false, reason: "provider_unavailable" }
          : { ok: false, reason: "error", message: result.message },
        { status: 502 }
      )
    );
  }

  return await floored(purpose, startedAt, NextResponse.json(GENERIC_ACCEPTED));
}

/**
 * ⚠️ THE RESET TIMING FLOOR (decision D4) — the last piece of the enumeration
 * contract, and the one made of time rather than bytes.
 *
 * On the reset path a registered number costs a real SMS send while an unknown
 * one costs a fast refusal. Identical bodies do not hide that: a remote prober
 * reads the difference off the clock. Holding every reset response until the
 * floor has elapsed puts both outcomes behind the same wall.
 *
 * ⚠️ IT ONLY MASKS WHAT IT EXCEEDS. If the real send leg is slower than the
 * floor, the excess is still visible. The floor's value was chosen before the
 * provider leg could be measured — localhost never calls the provider — so the
 * production run is what turns this from "bounded" into "closed", and the
 * reset suite's [G] section asserts the measurement is still outstanding.
 *
 * ⚠️ NOT APPLIED TO login/signup. Those send unconditionally for every number,
 * so they have no existence-dependent branch to hide and delaying them would
 * be pure harm to a proven path.
 */
async function floored(
  purpose: string,
  startedAt: number,
  response: NextResponse
): Promise<NextResponse> {
  if (purpose !== "reset") return response;

  const remaining = OTP_RESET_FLOOR_MS - (Date.now() - startedAt);
  if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining));

  return response;
}
