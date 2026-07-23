import { getConversationsForUser, getUserByPhone } from "@/app/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone");

  if (!phone) {
    return NextResponse.json({ error: "phone is required" }, { status: 400 });
  }

  const user = await getUserByPhone(phone);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const conversations = await getConversationsForUser(user.id);
  return NextResponse.json({ conversations });
}
