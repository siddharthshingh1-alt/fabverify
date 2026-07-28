import { getConversationsForUser } from "@/app/lib/db";
import { authErrorResponse, getVerifiedUser, normalisePhone } from "@/app/lib/auth";
import { dbErrorResponse } from "@/app/lib/apiError";
import { NextResponse } from "next/server";

// The caller's own conversation list.
//
// THE PROFILE LEAK: this route returned every conversation for whatever phone
// was named in the query string — partner names, phone numbers, account types
// and linked order numbers — to any unauthenticated caller. That was an
// AUTHORISATION hole, not an over-fetching one: getConversationsForUser
// already derives partners solely from messages the user is a party to, and
// returns only name/phone/user_type for those partners. So verifying the
// caller closes it completely; no filtering logic or db.ts change is needed.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone");

  if (!phone) {
    return NextResponse.json({ error: "phone is required" }, { status: 400 });
  }

  const caller = await getVerifiedUser(request);
  if (!caller.ok) return authErrorResponse(caller);

  if (normalisePhone(caller.user.phone) !== normalisePhone(phone)) {
    return NextResponse.json(
      { error: "Not authorised for this account" },
      { status: 403 }
    );
  }

  try {
    const conversations = await getConversationsForUser(caller.user.id);
    return NextResponse.json({ conversations });
  } catch (error) {
    return dbErrorResponse(error);
  }
}
