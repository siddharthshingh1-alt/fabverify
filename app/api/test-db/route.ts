import { supabase } from "@/app/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { error } = await supabase.from("users").select("count").limit(1);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Database connected!",
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "object" && error !== null && "message" in error
          ? String((error as { message: unknown }).message)
          : "Unknown error";

    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
