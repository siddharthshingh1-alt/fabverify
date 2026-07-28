import { upsertUser } from "@/app/lib/db";
import { authErrorResponse, getVerifiedCallerPhone, normalisePhone } from "@/app/lib/auth";
import { dbErrorResponse } from "@/app/lib/apiError";
import { NextResponse } from "next/server";

// Creates or updates the caller's OWN account row.
//
// This is ACCOUNT CREATION, so it verifies at the phone level rather than
// requiring an existing users row: a first-time signup has a real verified
// session but no row yet, and getVerifiedUser() would reject it. The write
// is still anchored to a phone number the caller has PROVEN they own —
// previously this route wrote to whatever phone the body claimed, which let
// anyone overwrite any account's profile.
export async function POST(request: Request) {
  const { phone, name, email, city, state } = await request.json();

  if (!phone) {
    return NextResponse.json({ error: "phone is required" }, { status: 400 });
  }

  const caller = await getVerifiedCallerPhone(request);
  if (!caller.ok) return authErrorResponse(caller);

  if (caller.phone !== normalisePhone(phone)) {
    return NextResponse.json(
      { error: "Not authorised for this phone number" },
      { status: 403 }
    );
  }

  try {
    await upsertUser({ phone, name, email, city, state });
  } catch (error) {
    // 503 when the database is unreachable, 500 for a real query error —
    // and never the raw exception text, which used to surface verbatim on
    // the onboarding screen as "TypeError: fetch failed".
    return dbErrorResponse(error);
  }

  return NextResponse.json({ success: true });
}
