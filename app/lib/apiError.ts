// SERVER-ONLY: imports NextResponse, so this file must only be imported
// from Route Handlers under app/api/ — never from a "use client" file. The
// client-side counterpart is readSaveError() in app/lib/apiClient.ts.

import { NextResponse } from "next/server";

// Supabase throws plain PostgrestError objects ({message, details, hint,
// code}), not Error instances, so `error instanceof Error` misses them and
// falls through to a useless "Unknown error". Handle both shapes.
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "Unknown error";
}

// A connectivity failure reaches us in two different shapes: undici throws
// a TypeError("fetch failed"), while postgrest-js catches that internally
// and hands back a plain {message} object carrying the same text. Both must
// be recognised, which is why this leans on getErrorMessage rather than an
// `instanceof` check.
//
// HEURISTIC BY NECESSITY: Supabase exposes no error code meaning "could not
// reach the server", so this matches on message text. It is deliberately
// not exhaustive — anything unrecognised falls through to a 500, which is
// exactly what every route did before this existed, so a miss degrades to
// the previous behaviour rather than to something worse. Known gap: a hung
// TCP connection or a Supabase-side 5xx presents differently and may still
// be reported as 500.
const CONNECTIVITY_PATTERN =
  /fetch failed|ENOTFOUND|ECONNREFUSED|ECONNRESET|ETIMEDOUT|EAI_AGAIN|socket hang up/i;

export function isDatabaseUnavailable(error: unknown): boolean {
  if (CONNECTIVITY_PATTERN.test(getErrorMessage(error))) return true;

  // undici nests the real cause (getaddrinfo ENOTFOUND …) one level down.
  const cause = (error as { cause?: unknown })?.cause;
  return cause ? CONNECTIVITY_PATTERN.test(getErrorMessage(cause)) : false;
}

/**
 * The single response for "a db.ts call threw".
 *
 * 503 when the database was unreachable — the request may well succeed on
 * retry, and the client maps that to "check your connection and try again".
 * 500 for a genuine query or application error, where retrying will not
 * help. Collapsing the two into one 500 told users not to bother retrying a
 * transient outage, and sent diagnosis down the wrong path.
 *
 * The 503 branch deliberately does NOT include the raw message: internal
 * exception text ("TypeError: fetch failed") is meaningless to a user and
 * leaks implementation detail. That string reaching an onboarding screen is
 * the bug this helper exists to prevent.
 */
export function dbErrorResponse(error: unknown) {
  if (isDatabaseUnavailable(error)) {
    return NextResponse.json(
      { error: "Service temporarily unavailable. Please try again." },
      { status: 503 }
    );
  }

  return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
}
