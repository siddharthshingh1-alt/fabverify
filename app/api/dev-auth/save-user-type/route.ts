import { updateUserType } from "@/app/lib/db";
import { getErrorMessage } from "@/app/lib/apiError";
import { NextResponse } from "next/server";

// Dev-mode only (see app/onboarding/type/page.tsx) — updates user_type by
// phone using the service-role client so it works without a real Supabase
// auth session.
export async function POST(request: Request) {
  const { phone, userType } = await request.json();

  if (!phone || !userType) {
    return NextResponse.json(
      { error: "phone and userType are required" },
      { status: 400 }
    );
  }

  try {
    await updateUserType(phone, userType);
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
