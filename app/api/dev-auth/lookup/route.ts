import { supabaseAdmin } from "@/app/lib/supabaseAdmin";
import { NextResponse } from "next/server";

// Dev-mode only (see app/login/page.tsx) — looks up a user by phone using
// the service-role client so it works without a real Supabase auth session.
export async function POST(request: Request) {
  const { phone } = await request.json();

  if (!phone) {
    return NextResponse.json({ error: "phone is required" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("phone", phone)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ user: data });
}
