import { saveUserProfileData } from "@/app/lib/db";
import { getErrorMessage } from "@/app/lib/apiError";
import { NextResponse } from "next/server";

// Dev-mode only — persists the type-specific onboarding fields (crafts,
// skills, rates, etc.) that don't have a dedicated table, keyed by phone
// since dev-mode auth has no real Supabase session.
export async function POST(request: Request) {
  const { phone, profileData } = await request.json();

  if (!phone) {
    return NextResponse.json({ error: "phone is required" }, { status: 400 });
  }

  try {
    await saveUserProfileData(phone, profileData ?? {});
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
