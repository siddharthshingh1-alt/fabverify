import { supabaseAdmin } from "@/app/lib/supabaseAdmin";
import { NextResponse } from "next/server";

// Dev-mode only (see app/onboarding/profile/page.tsx) — upserts by phone
// using the service-role client so it works without a real Supabase auth
// session.
export async function POST(request: Request) {
  const { phone, name, email, city, state } = await request.json();

  if (!phone) {
    return NextResponse.json({ error: "phone is required" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("users")
    .upsert({ phone, name, email, city, state }, { onConflict: "phone" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
