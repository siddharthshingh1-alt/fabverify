import { supabaseAdmin } from "@/app/lib/supabaseAdmin";
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

  const { error } = await supabaseAdmin
    .from("users")
    .update({ user_type: userType })
    .eq("phone", phone);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
