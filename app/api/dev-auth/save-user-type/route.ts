import { updateUserType } from "@/app/lib/db";
import { authErrorResponse, getVerifiedUser, normalisePhone } from "@/app/lib/auth";
import { dbErrorResponse } from "@/app/lib/apiError";
import { NextResponse } from "next/server";

// Sets the caller's OWN account type. Runs after /onboarding/profile has
// created the users row, so the caller must resolve to a real account.
// Previously any caller could change any account's user_type just by naming
// its phone number.
export async function POST(request: Request) {
  const { phone, userType } = await request.json();

  if (!phone || !userType) {
    return NextResponse.json(
      { error: "phone and userType are required" },
      { status: 400 }
    );
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
    await updateUserType(phone, userType);
  } catch (error) {
    return dbErrorResponse(error);
  }

  return NextResponse.json({ success: true });
}
