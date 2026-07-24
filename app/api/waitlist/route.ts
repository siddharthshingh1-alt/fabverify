import { addToWaitlist } from "@/app/lib/db";
import { getErrorMessage } from "@/app/lib/apiError";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { email, phone } = await request.json();

  if (!email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  try {
    const entry = await addToWaitlist(email, phone);
    return NextResponse.json({ success: true, entry });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
