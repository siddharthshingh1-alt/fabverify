import { saveUserProfileData, updateUserPosition } from "@/app/lib/db";
import { authErrorResponse, getVerifiedUser, normalisePhone } from "@/app/lib/auth";
import { dbErrorResponse } from "@/app/lib/apiError";
import { NextResponse } from "next/server";

// Persists the caller's OWN type-specific onboarding fields (crafts, skills,
// rates, etc.) that have no dedicated table. Runs after the users row
// exists, so the caller must resolve to a real account.
export async function POST(request: Request) {
  const { phone, profileData, position } = await request.json();

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
    await saveUserProfileData(phone, profileData ?? {});

    // Enterprise onboarding also sends the position (md_ceo, cfo, …) so the
    // role survives logout as a real column rather than localStorage only.
    if (position) {
      await updateUserPosition(phone, position);
    }
  } catch (error) {
    return dbErrorResponse(error);
  }

  return NextResponse.json({ success: true });
}
