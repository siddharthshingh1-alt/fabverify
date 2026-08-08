import { NextResponse } from "next/server";
import { authErrorResponse, getVerifiedUser } from "@/app/lib/auth";
import { dbErrorResponse } from "@/app/lib/apiError";
import { setPassword } from "@/app/lib/authProvider.server";

/**
 * SET OR CHANGE THE CALLER'S OWN PASSWORD. Chunk 2.4 (M10) — the first code in
 * the project that writes to `user_credentials`.
 *
 * ⚠️ NOTHING CAN AUTHENTICATE WITH THE RESULT YET, AND THAT IS DELIBERATE.
 * After this chunk a user can SET a password and no login path accepts one.
 * Credential storage ships and gets exercised before anything trusts it —
 * the only ordering in which a silent hashing or write bug is catchable
 * before real credentials exist. Password login is chunks 2.5/2.6.
 *
 * ⚠️ OTP LOGIN IS COMPLETELY UNTOUCHED by this route. Password is an
 * ADDITIONAL credential, never a replacement, and setting one does not
 * disable anything (DECISIONS M10).
 *
 * ── WHY THE BODY CARRIES NO ACCOUNT IDENTIFIER ───────────────────────────
 * The request is `{ password, currentPassword? }` — no phone, no userId, no
 * credential type. The account is `getVerifiedUser(request).user.id` and
 * nothing else. Most converted routes derive the caller from the session and
 * then 403 on a mismatch against a body value; here there is no body value to
 * mismatch, so cross-account setting is impossible BY CONSTRUCTION rather
 * than prevented by a comparison a later refactor could drop. Anything extra
 * a caller sends is ignored, not validated — there is no code path that reads
 * it.
 *
 * Consequently the 403s below are never about ownership. They mean
 * "authenticated, but you have not re-proven yourself for THIS action".
 *
 * ── STATUS CODES ─────────────────────────────────────────────────────────
 *   200  set or changed
 *   400  malformed body, or the new password fails policy
 *   401  not authenticated                       (authErrorResponse)
 *   403  changing an existing password without / with a wrong current password
 *   405  any method other than POST              (Next.js, no code needed)
 *   503  database unreachable                    (authErrorResponse / dbErrorResponse)
 *   500  genuine query fault                     (dbErrorResponse)
 *
 * ⚠️ NO PLAINTEXT ANYWHERE. This handler never logs the body, never echoes a
 * password back, and never puts one in an error. The hashing module swallows
 * library exceptions for the same reason — a stack trace must not carry the
 * input forward (CLAUDE.md §2.8).
 */
export async function POST(request: Request) {
  // Parsed inside a try because a malformed body is a 400, not a 500. Note
  // the caught error is discarded rather than echoed: JSON parse errors quote
  // the offending input, which here would be a password.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { password, currentPassword } = body as {
    password?: unknown;
    currentPassword?: unknown;
  };

  if (typeof password !== "string") {
    return NextResponse.json({ error: "Password is required." }, { status: 400 });
  }

  // THE ONLY SOURCE OF THE ACCOUNT BEING MODIFIED.
  const caller = await getVerifiedUser(request);
  if (!caller.ok) return authErrorResponse(caller);

  try {
    const result = await setPassword(
      caller.user.id,
      password,
      // Absent or non-string is passed as undefined — the seam then treats it
      // as "no re-verification supplied" and rejects if a credential exists.
      typeof currentPassword === "string" ? currentPassword : undefined,
      {
        // Context for the policy's "not guessable for THIS user" checks. Read
        // from the VERIFIED row, never from the request.
        phone: caller.user.phone,
        name: caller.user.name,
        email: caller.user.email,
      }
    );

    if (!result.ok) {
      const status = result.reason === "weak-password" ? 400 : 403;
      return NextResponse.json({ error: result.message }, { status });
    }

    // `created` distinguishes a first-time set from a change. Safe to return:
    // it tells the account owner something they could determine anyway, and
    // the route only ever answers about the caller's own account.
    return NextResponse.json({ success: true, created: result.created });
  } catch (error) {
    // Covers both the existence read and the write. A database fault here is
    // never interpreted as "no credential exists" — that would skip the
    // re-verification gate, so it must surface as 503/500 and write nothing.
    return dbErrorResponse(error);
  }
}
