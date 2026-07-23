import { getUserByPhone, markMessagesRead } from "@/app/lib/db";
import { getErrorMessage } from "@/app/lib/apiError";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { phone, senderPhone } = await request.json();

  if (!phone || !senderPhone) {
    return NextResponse.json(
      { error: "phone and senderPhone are required" },
      { status: 400 }
    );
  }

  const user = await getUserByPhone(phone);
  const sender = await getUserByPhone(senderPhone);

  if (!user || !sender) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  try {
    await markMessagesRead(user.id, sender.id);
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
